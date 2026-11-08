import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable, Module,
  NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PrismaService } from '../prisma/prisma.module.js';
import { hashPassword, validatePasswordStrength } from '../common/password.js';

const DAY = 24 * 60 * 60 * 1000;
const n = (v: unknown) => Number(v ?? 0);

// Quản lý Khuyến mãi & Voucher đã được tách sang modules/promotions.module.ts

/* =============================================================================
 * 2. QUẢN TRỊ NGƯỜI DÙNG & PHÂN QUYỀN (đề cương mục 6 – 0.5đ)
 * ===========================================================================*/
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async list(q: { search?: string; role?: string }) {
    const rows = await this.prisma.taiKhoan.findMany({
      where: {
        ...(q.search && {
          OR: [
            { Email: { contains: q.search, mode: 'insensitive' } },
            { SoDienThoai: { contains: q.search } },
            { NhanVien: { HoTen: { contains: q.search, mode: 'insensitive' } } },
            { KhachHang: { HoTen: { contains: q.search, mode: 'insensitive' } } },
          ],
        }),
        ...(q.role && { PhanQuyen: { some: { VaiTro: { TenVaiTro: q.role } } } }),
      },
      include: {
        PhanQuyen: { include: { VaiTro: true } },
        NhanVien: { include: { HuongDanVien: true } },
        KhachHang: true,
      },
      orderBy: { TaiKhoanID: 'asc' },
    });
    // Không bao giờ trả mật khẩu băm ra client
    return rows.map(({ MatKhauHash: _pw, rememberToken: _rt, ...rest }) => ({
      ...rest,
      HoTen: rest.NhanVien?.HoTen ?? rest.KhachHang?.HoTen ?? rest.Email,
      VaiTro: rest.PhanQuyen.map((p) => p.VaiTro.TenVaiTro),
    }));
  }

  roles() {
    return this.prisma.vaiTro.findMany({ include: { _count: { select: { PhanQuyen: true } } }, orderBy: { VaiTroID: 'asc' } });
  }

  async createStaff(b: {
    email: string; password: string; hoTen: string; phone: string; chucVu?: string; vaiTro: string;
    soTheHDV?: string; ngonNgu?: string; kinhNghiem?: string;
  }) {
    if (!b.email || !b.hoTen || !b.phone || !b.vaiTro) throw new BadRequestException('Vui lòng nhập đủ Email, Họ tên, SĐT, Vai trò');
    if (!/^\S+@\S+\.\S+$/.test(b.email)) throw new BadRequestException('Email không hợp lệ');
    if (!/^0\d{9,10}$/.test(b.phone)) throw new BadRequestException('Số điện thoại phải gồm 10–11 số, bắt đầu bằng 0');
    const pwErr = validatePasswordStrength(b.password);
    if (pwErr) throw new BadRequestException(pwErr);
    if (b.vaiTro === 'Khach hang') throw new BadRequestException('Tài khoản khách hàng được tạo qua trang đăng ký');
    const role = await this.prisma.vaiTro.findUnique({ where: { TenVaiTro: b.vaiTro } });
    if (!role) throw new BadRequestException('Vai trò không tồn tại');
    if (await this.prisma.taiKhoan.findUnique({ where: { Email: b.email } })) throw new BadRequestException('Email đã được sử dụng');
    if (await this.prisma.taiKhoan.findUnique({ where: { SoDienThoai: b.phone } })) throw new BadRequestException('Số điện thoại đã được sử dụng');
    if (b.vaiTro === 'HDV' && (!b.soTheHDV || !b.ngonNgu)) throw new BadRequestException('HDV cần nhập Số thẻ HDV và Ngôn ngữ');

    const chucVuMap: Record<string, string> = { Admin: 'Quản trị hệ thống', 'Dieu hanh': 'Nhân viên điều hành', 'Ke toan': 'Kế toán', HDV: 'Hướng dẫn viên' };
    return this.prisma.$transaction(async (tx) => {
      const tk = await tx.taiKhoan.create({ data: { Email: b.email, MatKhauHash: hashPassword(b.password), SoDienThoai: b.phone, TrangThai: 1 } });
      await tx.phanQuyen.create({ data: { TaiKhoanID: tk.TaiKhoanID, VaiTroID: role.VaiTroID } });
      const nv = await tx.nhanVien.create({
        data: { TaiKhoanID: tk.TaiKhoanID, HoTen: b.hoTen, SoDienThoai: b.phone, Email: b.email, ChucVu: b.chucVu || chucVuMap[b.vaiTro] || b.vaiTro, NgayVaoLam: new Date() },
      });
      if (b.vaiTro === 'HDV') {
        await tx.huongDanVien.create({ data: { NhanVienID: nv.NhanVienID, SoTheHDV: b.soTheHDV!, NgonNgu: b.ngonNgu!, KinhNghiem: b.kinhNghiem || null } });
      }
      return { TaiKhoanID: tk.TaiKhoanID, Email: tk.Email, message: 'Tạo tài khoản nhân viên thành công' };
    });
  }

  async toggleStatus(id: number, actorId?: number) {
    if (actorId && Number(actorId) === id) throw new BadRequestException('Không thể tự khóa tài khoản đang đăng nhập');
    const tk = await this.prisma.taiKhoan.findUnique({ where: { TaiKhoanID: id }, include: { PhanQuyen: { include: { VaiTro: true } } } });
    if (!tk) throw new NotFoundException('Không tìm thấy tài khoản');
    if (tk.TrangThai === 1 && tk.PhanQuyen.some((p) => p.VaiTro.TenVaiTro === 'Admin')) {
      const activeAdmins = await this.prisma.taiKhoan.count({ where: { TrangThai: 1, PhanQuyen: { some: { VaiTro: { TenVaiTro: 'Admin' } } } } });
      if (activeAdmins <= 1) throw new BadRequestException('Hệ thống phải còn ít nhất 1 Admin hoạt động');
    }
    const updated = await this.prisma.taiKhoan.update({ where: { TaiKhoanID: id }, data: { TrangThai: tk.TrangThai ? 0 : 1 } });
    return { TaiKhoanID: id, TrangThai: updated.TrangThai };
  }

  async setRoles(id: number, roles: string[], actorId?: number) {
    if (!Array.isArray(roles) || roles.length === 0) throw new BadRequestException('Phải chọn ít nhất 1 vai trò');
    const tk = await this.prisma.taiKhoan.findUnique({ where: { TaiKhoanID: id }, include: { NhanVien: { include: { HuongDanVien: true } }, KhachHang: true } });
    if (!tk) throw new NotFoundException('Không tìm thấy tài khoản');
    if (roles.includes('Khach hang') && !tk.KhachHang) throw new BadRequestException('Tài khoản nhân viên không thể gán vai trò Khách hàng');
    if (roles.some((r) => r !== 'Khach hang') && !tk.NhanVien) throw new BadRequestException('Tài khoản khách hàng không thể gán vai trò nội bộ');
    if (roles.includes('HDV') && !tk.NhanVien?.HuongDanVien) throw new BadRequestException('Nhân viên chưa có hồ sơ HDV (số thẻ hành nghề)');
    if (actorId && Number(actorId) === id && !roles.includes('Admin')) throw new BadRequestException('Không thể tự gỡ quyền Admin của chính mình');
    const vt = await this.prisma.vaiTro.findMany({ where: { TenVaiTro: { in: roles } } });
    if (vt.length !== roles.length) throw new BadRequestException('Có vai trò không hợp lệ');
    // Thứ tự gán quyết định vai trò chính (primaryRole) khi đăng nhập
    await this.prisma.$transaction(async (tx) => {
      await tx.phanQuyen.deleteMany({ where: { TaiKhoanID: id } });
      for (let i = 0; i < roles.length; i++) {
        const v = vt.find((x) => x.TenVaiTro === roles[i])!;
        await tx.phanQuyen.create({ data: { TaiKhoanID: id, VaiTroID: v.VaiTroID, NgayGan: new Date(Date.now() + i) } });
      }
    });
    return { TaiKhoanID: id, VaiTro: roles };
  }

  async resetPassword(id: number, newPassword: string) {
    const pwErr = validatePasswordStrength(newPassword);
    if (pwErr) throw new BadRequestException(pwErr);
    await this.prisma.taiKhoan.update({ where: { TaiKhoanID: id }, data: { MatKhauHash: hashPassword(newPassword) } });
    return { message: 'Đã đặt lại mật khẩu' };
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class UsersController {
  constructor(private s: UsersService) {}
  @Get() list(@Query() q: Record<string, string>) { return this.s.list(q); }
  @Get('roles') roles() { return this.s.roles(); }
  @Post() create(@Body() b: any) { return this.s.createStaff(b); }
  @Patch(':id/toggle-status') toggle(@Param('id', ParseIntPipe) id: number, @Body('actorId') a?: number) { return this.s.toggleStatus(id, a); }
  @Patch(':id/roles') roles2(@Param('id', ParseIntPipe) id: number, @Body() b: { roles: string[]; actorId?: number }) { return this.s.setRoles(id, b.roles, b.actorId); }
  @Patch(':id/reset-password') reset(@Param('id', ParseIntPipe) id: number, @Body('newPassword') p: string) { return this.s.resetPassword(id, p); }
}

// Báo cáo thống kê quản trị chi tiết đã được chuyển sang modules/reports.module.ts

/* =============================================================================
 * 4. ĐIỀU PHỐI HDV, LỊCH KHỞI HÀNH, TÍNH CÔNG, LỊCH LÀM VIỆC HDV (web + mobile)
 * ===========================================================================*/
export const PAYROLL = { DON_GIA_NGAY: 800_000, PHU_CAP_DOAN: 300_000, THUONG_XUAT_SAC: 500_000, THUONG_TOT: 200_000 };

@Injectable()
export class GuideOpsService {
  constructor(private prisma: PrismaService) {}

  /* ---------- Lịch khởi hành ---------- */
  async createDeparture(b: { TourID: number; NgayKhoiHanh: string; NgayKetThuc: string; SoChoToiDa: number; GiaTourKhuyenMai?: number | string | null; MaLich?: string }) {
    const tour = await this.prisma.tour.findUnique({ where: { TourID: Number(b.TourID) } });
    if (!tour) throw new BadRequestException('Tour không tồn tại');
    if (['Nhap', 'Huy'].includes(tour.TrangThaiDuyet)) throw new BadRequestException('Tour đang ở trạng thái Nháp/Hủy, chưa thể mở lịch khởi hành');
    const start = new Date(b.NgayKhoiHanh);
    const end = new Date(b.NgayKetThuc);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new BadRequestException('Ngày không hợp lệ');
    if (start <= new Date()) throw new BadRequestException('Ngày khởi hành phải sau thời điểm hiện tại');
    if (end <= start) throw new BadRequestException('Ngày kết thúc phải sau ngày khởi hành');
    const seats = Number(b.SoChoToiDa);
    if (!Number.isInteger(seats) || seats <= 0 || seats > 100) throw new BadRequestException('Số chỗ tối đa phải là số nguyên 1–100');
    const promo = b.GiaTourKhuyenMai === undefined || b.GiaTourKhuyenMai === null || b.GiaTourKhuyenMai === '' ? null : Number(b.GiaTourKhuyenMai);
    if (promo !== null && (Number.isNaN(promo) || promo <= 0 || promo >= Number(tour.GiaNguoiLon))) {
      throw new BadRequestException('Giá khuyến mãi phải > 0 và nhỏ hơn giá người lớn gốc');
    }
    const d = start;
    const maLich = (b.MaLich?.trim() || `${tour.MaTour}-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getFullYear()).slice(-2)}`).toUpperCase();
    if (await this.prisma.lichKhoiHanh.findUnique({ where: { MaLich: maLich } })) throw new BadRequestException(`Mã lịch ${maLich} đã tồn tại`);
    return this.prisma.lichKhoiHanh.create({
      data: { TourID: tour.TourID, MaLich: maLich, NgayKhoiHanh: start, NgayKetThuc: end, SoChoToiDa: seats, GiaTourKhuyenMai: promo },
    });
  }

  async updateDepartureStatus(id: number, trangThai: string) {
    const valid = ['Cho khoi hanh', 'Dang di', 'Hoan thanh', 'Huy'];
    if (!valid.includes(trangThai)) throw new BadRequestException('Trạng thái không hợp lệ');
    const lich = await this.prisma.lichKhoiHanh.findUnique({ where: { LichID: id } });
    if (!lich) throw new NotFoundException('Không tìm thấy lịch');
    if (trangThai === 'Huy') {
      const active = await this.prisma.donDatTour.count({ where: { LichID: id, TrangThaiDon: { not: 'Da huy' } } });
      if (active > 0) throw new BadRequestException(`Còn ${active} đơn đặt chỗ hợp lệ — cần xử lý/hoàn tiền trước khi hủy lịch`);
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lichKhoiHanh.update({ where: { LichID: id }, data: { TrangThai: trangThai } });
      if (trangThai === 'Hoan thanh') {
        await tx.dieuPhoiTour.updateMany({ where: { LichID: id, TrangThai: 'Da xac nhan' }, data: { TrangThai: 'Hoan thanh' } });
        await tx.donDatTour.updateMany({ where: { LichID: id, TrangThaiDon: { in: ['Da thanh toan', 'Da xac nhan', 'Dang thuc hien'] } }, data: { TrangThaiDon: 'Hoan thanh' } });
      }
      if (trangThai === 'Dang di') {
        await tx.donDatTour.updateMany({ where: { LichID: id, TrangThaiDon: { in: ['Da thanh toan', 'Da xac nhan'] } }, data: { TrangThaiDon: 'Dang thuc hien' } });
      }
      return updated;
    });
  }

  /** Danh sách HDV kèm cờ "trùng lịch" để chọn khi phân công */
  async availableGuides(lichId: number) {
    const lich = await this.prisma.lichKhoiHanh.findUnique({ where: { LichID: lichId } });
    if (!lich) throw new NotFoundException('Không tìm thấy lịch');
    const guides = await this.prisma.huongDanVien.findMany({
      include: {
        NhanVien: { select: { HoTen: true, SoDienThoai: true } },
        DieuPhoiTour: {
          where: { TrangThai: { not: 'Tu choi' }, LichKhoiHanh: { NgayKhoiHanh: { lte: lich.NgayKetThuc }, NgayKetThuc: { gte: lich.NgayKhoiHanh } } },
          include: { LichKhoiHanh: { select: { LichID: true, MaLich: true } } },
        },
      },
    });
    return guides.map(({ DieuPhoiTour, ...g }) => {
      const assignedHere = DieuPhoiTour.some((d) => d.LichKhoiHanh.LichID === lichId);
      const conflicts = DieuPhoiTour.filter((d) => d.LichKhoiHanh.LichID !== lichId).map((d) => d.LichKhoiHanh.MaLich);
      return { ...g, assignedHere, conflicts, available: !assignedHere && conflicts.length === 0 && ['San sang', 'Dang di tour'].includes(g.TrangThai) };
    });
  }

  async assignGuide(lichId: number, b: { HDVID: number; NhanVienID: number; GhiChu?: string }) {
    if (!b.HDVID || !b.NhanVienID) throw new BadRequestException('Thiếu HDV hoặc nhân viên phân công');
    const list = await this.availableGuides(lichId);
    const g = list.find((x) => x.HDVID === Number(b.HDVID));
    if (!g) throw new BadRequestException('HDV không tồn tại');
    if (g.assignedHere) throw new BadRequestException('HDV đã được phân công cho chuyến này');
    if (g.conflicts.length) throw new BadRequestException(`HDV bị trùng lịch với chuyến: ${g.conflicts.join(', ')}`);
    if (['Nghi phep', 'Nghi viec'].includes(g.TrangThai)) throw new BadRequestException('HDV đang nghỉ phép/nghỉ việc');
    return this.prisma.dieuPhoiTour.create({ data: { LichID: lichId, HDVID: Number(b.HDVID), NhanVienID: Number(b.NhanVienID), GhiChu: b.GhiChu || null } });
  }

  async unassign(dieuPhoiId: number) {
    const dp = await this.prisma.dieuPhoiTour.findUnique({ where: { DieuPhoiID: dieuPhoiId } });
    if (!dp) throw new NotFoundException('Không tìm thấy phân công');
    if (dp.TrangThai === 'Hoan thanh') throw new BadRequestException('Phân công đã hoàn thành, không thể gỡ');
    return this.prisma.dieuPhoiTour.delete({ where: { DieuPhoiID: dieuPhoiId } });
  }

  /** HDV xác nhận / từ chối lịch được phân công */
  async respondAssignment(dieuPhoiId: number, trangThai: string, taiKhoanId?: number) {
    if (!['Da xac nhan', 'Tu choi'].includes(trangThai)) throw new BadRequestException('Trạng thái không hợp lệ');
    const dp = await this.prisma.dieuPhoiTour.findUnique({ where: { DieuPhoiID: dieuPhoiId }, include: { HuongDanVien: { include: { NhanVien: true } } } });
    if (!dp) throw new NotFoundException('Không tìm thấy phân công');
    if (taiKhoanId && dp.HuongDanVien.NhanVien.TaiKhoanID !== Number(taiKhoanId)) throw new ForbiddenException('Bạn không phải HDV của phân công này');
    return this.prisma.dieuPhoiTour.update({ where: { DieuPhoiID: dieuPhoiId }, data: { TrangThai: trangThai } });
  }

  /* ---------- Tính công HDV ---------- */
  async payroll(month?: string, donGia?: string) {
    const [y, m] = (month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0, 23, 59, 59);
    const rate = Number(donGia) > 0 ? Number(donGia) : PAYROLL.DON_GIA_NGAY;

    const guides = await this.prisma.huongDanVien.findMany({
      include: {
        NhanVien: { select: { HoTen: true, SoDienThoai: true } },
        DieuPhoiTour: {
          where: { TrangThai: { in: ['Da xac nhan', 'Hoan thanh', 'Cho xac nhan'] }, LichKhoiHanh: { NgayKhoiHanh: { lte: to }, NgayKetThuc: { gte: from } } },
          include: { LichKhoiHanh: { include: { Tour: { select: { TourID: true, TenTour: true } } } } },
        },
      },
    });

    const result = [];
    for (const g of guides) {
      const tours = [];
      for (const dp of g.DieuPhoiTour) {
        const l = dp.LichKhoiHanh;
        const s = new Date(Math.max(l.NgayKhoiHanh.getTime(), from.getTime()));
        const e = new Date(Math.min(l.NgayKetThuc.getTime(), to.getTime()));
        const soNgay = Math.max(Math.round((new Date(e.toDateString()).getTime() - new Date(s.toDateString()).getTime()) / DAY) + 1, 0);
        const daChot = dp.TrangThai === 'Hoan thanh';
        tours.push({
          DieuPhoiID: dp.DieuPhoiID, MaLich: l.MaLich, TenTour: l.Tour.TenTour, NgayKhoiHanh: l.NgayKhoiHanh, NgayKetThuc: l.NgayKetThuc,
          TrangThai: dp.TrangThai, soNgay, tienCong: soNgay * rate, phuCap: PAYROLL.PHU_CAP_DOAN, daChot,
        });
      }
      const tong = tours.reduce((s, t) => s + t.tienCong + t.phuCap, 0);
      result.push({
        HDVID: g.HDVID, HoTen: g.NhanVien.HoTen, SoTheHDV: g.SoTheHDV, SoDienThoai: g.NhanVien.SoDienThoai, TrangThai: g.TrangThai,
        soTour: tours.length, soNgay: tours.reduce((s, t) => s + t.soNgay, 0),
        tienCong: tours.reduce((s, t) => s + t.tienCong, 0), phuCap: tours.reduce((s, t) => s + t.phuCap, 0),
        tongThuNhap: tong, tours,
      });
    }
    return { thang: `${String(m).padStart(2, '0')}/${y}`, donGiaNgay: rate, quyDinh: PAYROLL, data: result.sort((a, b) => b.tongThuNhap - a.tongThuNhap) };
  }

  /* ---------- Lịch làm việc HDV (web + mobile) ---------- */
  async mySchedule(taiKhoanId: number, targetHdvId?: number) {
    let hdvRecord: any = null;
    let isSupervisor = false;

    const nv = await this.prisma.nhanVien.findUnique({
      where: { TaiKhoanID: taiKhoanId },
      include: { HuongDanVien: true },
    });

    if (targetHdvId) {
      hdvRecord = await this.prisma.huongDanVien.findUnique({
        where: { HDVID: targetHdvId },
        include: { NhanVien: true },
      });
      isSupervisor = true;
    } else if (nv?.HuongDanVien) {
      hdvRecord = { ...nv.HuongDanVien, NhanVien: nv };
    } else {
      isSupervisor = true;
      hdvRecord =
        (await this.prisma.huongDanVien.findFirst({
          where: { TrangThai: 'San sang' },
          include: { NhanVien: true },
        })) ||
        (await this.prisma.huongDanVien.findFirst({
          include: { NhanVien: true },
        }));
    }

    if (!hdvRecord) {
      throw new NotFoundException('Hệ thống chưa có hồ sơ hướng dẫn viên nào.');
    }

    const allGuides = await this.prisma.huongDanVien.findMany({
      include: { NhanVien: { select: { HoTen: true, Email: true, SoDienThoai: true } } },
      orderBy: { HDVID: 'asc' },
    });

    const list = await this.prisma.dieuPhoiTour.findMany({
      where: { HDVID: hdvRecord.HDVID, TrangThai: { not: 'Tu choi' } },
      include: {
        LichKhoiHanh: {
          include: {
            Tour: {
              select: {
                TourID: true,
                MaTour: true,
                TenTour: true,
                DiemKhoiHanh: true,
                DiemDen: true,
                ThoiGian: true,
                LichTrinh: true,
                PhuongTien: true,
                HinhAnhURL: true,
                DichVuDiKem: true,
              },
            },
            DonDatTour: {
              where: { TrangThaiDon: { not: 'Da huy' } },
              select: {
                MaDon: true,
                TrangThaiDon: true,
                KhachHang: { select: { HoTen: true, SoDienThoai: true } },
                ChiTietHanhKhach: true,
              },
            },
            PhieuDatDichVu: {
              where: { TrangThai: { notIn: ['Da huy', 'NCC tu choi'] } },
              include: { NhaCungCap: true, ChiTiet: { include: { DichVu: true } } },
            },
          },
        },
      },
      orderBy: { LichKhoiHanh: { NgayKhoiHanh: 'asc' } },
    });

    return {
      isSupervisor,
      allGuides: allGuides.map((g) => ({
        HDVID: g.HDVID,
        HoTen: g.NhanVien.HoTen,
        SoTheHDV: g.SoTheHDV,
        NgonNgu: g.NgonNgu,
        TrangThai: g.TrangThai,
        SoDienThoai: g.NhanVien.SoDienThoai,
      })),
      hdv: {
        HDVID: hdvRecord.HDVID,
        HoTen: hdvRecord.NhanVien?.HoTen || hdvRecord.HoTen,
        SoTheHDV: hdvRecord.SoTheHDV,
        NgonNgu: hdvRecord.NgonNgu,
      },
      lich: list.map((dp) => {
        const pax = dp.LichKhoiHanh.DonDatTour.flatMap((d) => d.ChiTietHanhKhach);
        return {
          ...dp,
          tongKhach: pax.length,
          daDiemDanh: pax.filter((p) => p.TrangThaiDiemDanh === 1).length,
        };
      }),
    };
  }

  /** Điểm danh hàng loạt cho đoàn (chỉ cho phép điểm danh, không được phép hủy điểm danh) */
  async batchCheckin(lichId: number, status: number) {
    if (status !== 1) {
      throw new BadRequestException('Hành khách đã điểm danh không được phép chỉnh lại thành chưa điểm danh!');
    }
    const dons = await this.prisma.donDatTour.findMany({
      where: { LichID: lichId, TrangThaiDon: { not: 'Da huy' } },
      select: { DonHangID: true },
    });
    const donIds = dons.map((d) => d.DonHangID);
    if (!donIds.length) return { message: 'Không có booking nào', count: 0 };

    const res = await this.prisma.chiTietHanhKhach.updateMany({
      where: { DonHangID: { in: donIds }, TrangThaiDiemDanh: { not: 1 } },
      data: { TrangThaiDiemDanh: 1 },
    });
    return {
      message: `Đã điểm danh tất cả hành khách trong đoàn (${res.count} khách mới)`,
      count: res.count,
      status: 1,
    };
  }

  /** HDV quét QR: nhận MaQRVe của từng khách, hoặc URL/mã đơn để điểm danh cả đơn */
  async checkinByQr(code: string, lichId?: number) {
    const raw = String(code || '').trim();
    if (!raw) throw new BadRequestException('Mã QR rỗng');
    const pax = await this.prisma.chiTietHanhKhach.findUnique({ where: { MaQRVe: raw }, include: { DonDatTour: true } });
    let targets: { ChiTietID: number; HoTen: string; DonHangID: number }[] = [];
    let don;
    if (pax) {
      targets = [pax];
      don = pax.DonDatTour;
    } else {
      let clean = decodeURIComponent(raw.split('/portal/ticket/')[1]?.split(/[?#]/)[0] ?? raw);
      if (clean.startsWith('VT-')) clean = clean.substring(3);
      don = await this.prisma.donDatTour.findFirst({
        where: { OR: [{ MaDon: clean }, { MaDon: raw }] },
        include: { ChiTietHanhKhach: true },
      });
      if (!don) throw new NotFoundException('Mã QR không hợp lệ — không tìm thấy vé');
      targets = (don as any).ChiTietHanhKhach;
    }
    if (lichId && don.LichID !== Number(lichId)) throw new BadRequestException('Vé này không thuộc chuyến bạn đang dẫn');
    if (don.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn đặt tour đã bị hủy — vé không còn hiệu lực');
    if (!['Da thanh toan', 'Da xac nhan', 'Dang thuc hien', 'Hoan thanh', 'Da dat coc'].includes(don.TrangThaiDon)) {
      throw new BadRequestException('Đơn chưa thanh toán — chưa thể soát vé');
    }
    await this.prisma.chiTietHanhKhach.updateMany({ where: { ChiTietID: { in: targets.map((t) => t.ChiTietID) } }, data: { TrangThaiDiemDanh: 1 } });
    return { message: `Đã điểm danh ${targets.length} khách (đơn ${don.MaDon})`, maDon: don.MaDon, hanhKhach: targets.map((t) => t.HoTen) };
  }

  async togglePaxCheckin(paxId: number) {
    const pax = await this.prisma.chiTietHanhKhach.findUnique({
      where: { ChiTietID: paxId },
      include: { DonDatTour: true },
    });
    if (!pax) throw new NotFoundException('Không tìm thấy hành khách');
    if (pax.TrangThaiDiemDanh === 1) {
      throw new BadRequestException('Hành khách này đã được điểm danh lên đoàn, không được phép chỉnh lại thành chưa điểm danh!');
    }
    if (pax.DonDatTour && !['Da thanh toan', 'Da xac nhan', 'Dang thuc hien', 'Hoan thanh', 'Da dat coc'].includes(pax.DonDatTour.TrangThaiDon)) {
      throw new BadRequestException('Đơn đặt tour chưa hoàn tất thanh toán nên chưa thể điểm danh!');
    }
    return this.prisma.chiTietHanhKhach.update({
      where: { ChiTietID: paxId },
      data: { TrangThaiDiemDanh: 1 },
    });
  }
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Dieu hanh')
export class GuideOpsController {
  constructor(private s: GuideOpsService) {}
  @Post('departures/create') createDeparture(@Body() b: any) { return this.s.createDeparture(b); }
  @Patch('departures/:id/status') depStatus(@Param('id', ParseIntPipe) id: number, @Body('TrangThai') t: string) { return this.s.updateDepartureStatus(id, t); }
  @Get('departures/:id/available-guides') avail(@Param('id', ParseIntPipe) id: number) { return this.s.availableGuides(id); }
  @Post('departures/:id/assign-guide') assign(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.s.assignGuide(id, b); }
  @Delete('assignments/:id') unassign(@Param('id', ParseIntPipe) id: number) { return this.s.unassign(id); }
  @Patch('assignments/:id/respond') @Roles('HDV', 'Dieu hanh') respond(@Param('id', ParseIntPipe) id: number, @Body() b: { TrangThai: string; taiKhoanId?: number }) { return this.s.respondAssignment(id, b.TrangThai, b.taiKhoanId); }
  @Get('guide-payroll') @Roles('Dieu hanh', 'Ke toan', 'HDV') payroll(@Query('month') m?: string, @Query('donGia') d?: string) { return this.s.payroll(m, d); }
  @Get('guide/my-schedule')
  @Roles('HDV', 'Dieu hanh', 'Admin')
  schedule(@Req() req: any, @Query('taiKhoanId') id?: string, @Query('hdvId') hdvId?: string) {
    const tkId = id ? Number(id) : req.user?.sub;
    return this.s.mySchedule(Number(tkId), hdvId ? Number(hdvId) : undefined);
  }
  @Patch('guide/batch-checkin/:lichId')
  @Roles('HDV', 'Dieu hanh', 'Admin')
  batchCheckin(@Param('lichId', ParseIntPipe) id: number, @Body('status') status?: number) {
    return this.s.batchCheckin(id, status !== undefined ? Number(status) : 1);
  }
  @Post('guide/checkin-qr') @Roles('HDV', 'Dieu hanh', 'Admin') checkin(@Body() b: { code: string; lichId?: number }) { return this.s.checkinByQr(b.code, b.lichId); }
  @Patch('guide/checkin-toggle/:paxId') @Roles('HDV', 'Dieu hanh', 'Admin') togglePax(@Param('paxId', ParseIntPipe) id: number) { return this.s.togglePaxCheckin(id); }
}

// Quản lý Nhà cung cấp & Phiếu đặt dịch vụ đã được tách sang modules/suppliers.module.ts

/* =============================================================================
 * 6. KHÁCH HÀNG: hủy tour (chính sách hoàn tiền), đánh giá sau tour, thông báo nhắc lịch
 * ===========================================================================*/
@Injectable()
export class CustomerOpsService {
  constructor(private prisma: PrismaService) {}

  /** Chính sách hoàn tiền theo số ngày trước khởi hành */
  static refundRate(daysBefore: number) {
    if (daysBefore >= 15) return 1;
    if (daysBefore >= 7) return 0.7;
    if (daysBefore >= 3) return 0.5;
    return 0;
  }

  async cancelPreview(donHangId: number, customerId?: number | null) {
    const don = await this.prisma.donDatTour.findUnique({
      where: { DonHangID: donHangId },
      include: { LichKhoiHanh: true, ThanhToan: true, DanhGia: true, ChiTietHanhKhach: true },
    });
    if (!don) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (customerId && don.KhachHangID !== Number(customerId)) {
      throw new ForbiddenException('Đơn hàng không thuộc tài khoản của bạn');
    }
    if (don.TrangThaiDon === 'Da huy') {
      throw new BadRequestException('Đơn đặt tour này đã được hủy trước đó');
    }
    if (
      don.TrangThaiDon === 'Hoan thanh' ||
      don.LichKhoiHanh?.TrangThai === 'Hoan thanh' ||
      (don.DanhGia && don.DanhGia.length > 0) ||
      (don.ChiTietHanhKhach && don.ChiTietHanhKhach.some((p) => p.TrangThaiDiemDanh === 1))
    ) {
      throw new BadRequestException('Đơn đặt tour đã hoàn thành chuyến đi hoặc đã điểm danh lên đoàn nên không thể hủy!');
    }
    if (!['Cho thanh toan', 'Da dat coc', 'Da thanh toan', 'Da xac nhan'].includes(don.TrangThaiDon)) {
      throw new BadRequestException('Đơn ở trạng thái hiện tại không thể hủy');
    }

    const diffMs = don.LichKhoiHanh.NgayKhoiHanh.getTime() - Date.now();
    const daysUntil = Math.max(0, Math.ceil(diffMs / DAY));
    const isUnpaid = don.TrangThaiDon === 'Cho thanh toan';

    if (!isUnpaid && diffMs < 0) {
      throw new BadRequestException('Tour đã khởi hành nên không thể hủy đơn');
    }

    const tongTienDon = Math.max(0, n(don.TongTien) - n(don.GiamGia));

    if (isUnpaid) {
      return {
        don,
        days: daysUntil,
        daysUntil,
        rate: 1,
        refundPercent: 100,
        penaltyPercent: 0,
        daThu: 0,
        tienGoc: 0,
        tongTienDon,
        hoanTien: 0,
        tienHoan: 0,
        phiHuy: 0,
        tienPhat: 0,
        isUnpaid: true,
        policyNote: 'Đơn đang ở trạng thái Chờ thanh toán (chưa thu tiền) — Quý khách được hủy giữ chỗ miễn phí 100% (Phí hủy: 0 đ).',
      };
    }

    const paidFromTx = (don.ThanhToan || [])
      .filter((t) => t.TrangThai === 'Thanh cong')
      .reduce((sum, t) => sum + n(t.SoTien), 0);
    const daThu = Math.max(n(don.TienCoc), paidFromTx) || tongTienDon;
    const rate = CustomerOpsService.refundRate(daysUntil);
    const refundPercent = Math.round(rate * 100);
    const penaltyPercent = 100 - refundPercent;
    const hoanTien = Math.round(daThu * rate);
    const phiHuy = Math.max(0, daThu - hoanTien);

    let policyNote = '';
    if (daysUntil >= 15) {
      policyNote = 'Hủy trước ngày khởi hành từ 15 ngày trở lên: Miễn phí hủy (0%), hoàn lại 100% số tiền đã thanh toán.';
    } else if (daysUntil >= 7) {
      policyNote = 'Hủy trước ngày khởi hành từ 7 đến 14 ngày: Phí hủy 30%, hoàn lại 70% số tiền đã thanh toán.';
    } else if (daysUntil >= 3) {
      policyNote = 'Hủy trước ngày khởi hành từ 3 đến 6 ngày: Phí hủy 50%, hoàn lại 50% số tiền đã thanh toán.';
    } else {
      policyNote = 'Hủy sát ngày khởi hành (dưới 3 ngày): Phí hủy 100%, không hoàn tiền do đã chốt vé máy bay và dịch vụ lữ hành.';
    }

    return {
      don,
      days: daysUntil,
      daysUntil,
      rate,
      refundPercent,
      penaltyPercent,
      daThu,
      tienGoc: daThu,
      tongTienDon,
      hoanTien,
      tienHoan: hoanTien,
      phiHuy,
      tienPhat: phiHuy,
      isUnpaid: false,
      policyNote,
    };
  }

  async cancel(donHangId: number, customerId?: number | null, lyDo?: string) {
    const p = await this.cancelPreview(donHangId, customerId);
    const reasonText = (lyDo || '').trim() || 'Khách hàng thay đổi kế hoạch cá nhân';
    return this.prisma.$transaction(async (tx) => {
      const fresh = await tx.donDatTour.findUniqueOrThrow({ where: { DonHangID: donHangId } });
      if (fresh.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn đã được hủy trước đó');
      const now = new Date();
      const timeStr = `${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${now.toLocaleDateString('vi-VN')}`;
      const refundNote = p.daThu > 0
        ? ` (Đã đóng: ${p.daThu.toLocaleString('vi-VN')}đ, Hoàn lại: ${p.hoanTien.toLocaleString('vi-VN')}đ - ${p.refundPercent}%)`
        : ' (Hủy đơn chờ thanh toán - Miễn phí)';
      await tx.donDatTour.update({
        where: { DonHangID: donHangId },
        data: {
          TrangThaiDon: 'Da huy',
          GhiChu: `${fresh.GhiChu ? fresh.GhiChu + '\n' : ''}[KHÁCH HÀNG HỦY] ${timeStr} - Lý do: ${reasonText}${refundNote}`,
        },
      });
      const lich = await tx.lichKhoiHanh.findUnique({ where: { LichID: fresh.LichID } });
      if (lich) {
        const nextBooked = Math.max(0, lich.SoChoDaDat - (fresh.SoLuongNguoiLon + fresh.SoLuongTreEm));
        await tx.lichKhoiHanh.update({
          where: { LichID: fresh.LichID },
          data: { SoChoDaDat: nextBooked },
        });
      }
      if (p.hoanTien > 0) {
        await tx.thanhToan.create({
          data: {
            DonHangID: donHangId,
            SoTien: p.hoanTien,
            HinhThucTT: fresh.PhuongThucTT || 'Chuyen khoan',
            TrangThai: 'Da hoan tien',
            MaGiaoDich: `RF-${fresh.MaDon}-${Date.now().toString().slice(-5)}`,
            GhiChu: `Hoàn ${p.refundPercent}% do hủy trước ${p.daysUntil} ngày`,
          },
        });
      }
      return {
        message: 'Đã hủy đơn đặt tour thành công',
        hoanTien: p.hoanTien,
        phiHuy: p.phiHuy,
        tyLeHoan: p.rate,
        refundPercent: p.refundPercent,
      };
    });
  }

  async review(b: { customerId?: number | null; donHangId: number; soSao: number; binhLuan?: string }) {
    const sao = Number(b.soSao);
    if (!Number.isInteger(sao) || sao < 1 || sao > 5) throw new BadRequestException('Số sao phải từ 1 đến 5');
    const don = await this.prisma.donDatTour.findUnique({ where: { DonHangID: Number(b.donHangId) }, include: { LichKhoiHanh: true } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn hàng');

    const customerId = b.customerId ? Number(b.customerId) : null;
    if (customerId && don.KhachHangID !== customerId) {
      throw new ForbiddenException('Đơn hàng không thuộc tài khoản của bạn');
    }

    if (don.TrangThaiDon === 'Da huy' || don.TrangThaiDon === 'Cho thanh toan') {
      throw new BadRequestException('Chỉ được đánh giá các tour đã thanh toán hoặc đã hoàn thành');
    }

    if (await this.prisma.danhGia.findUnique({ where: { KhachHangID_DonHangID: { KhachHangID: don.KhachHangID, DonHangID: don.DonHangID } } })) {
      throw new BadRequestException('Bạn đã đánh giá đơn tour này rồi');
    }

    return this.prisma.$transaction(async (tx) => {
      const dg = await tx.danhGia.create({
        data: {
          KhachHangID: don.KhachHangID,
          DonHangID: don.DonHangID,
          TourID: don.LichKhoiHanh.TourID,
          SoSao: sao,
          BinhLuan: b.binhLuan?.trim() || null,
          TrangThaiDuyet: 'Da hien thi',
        },
      });
      if (don.TrangThaiDon !== 'Hoan thanh') {
        await tx.donDatTour.update({
          where: { DonHangID: don.DonHangID },
          data: { TrangThaiDon: 'Hoan thanh' },
        });
      }
      return dg;
    });
  }

  /** Thông báo trong ứng dụng: nhắc khởi hành, nhắc thanh toán, mời đánh giá */
  async notifications(customerId: number) {
    if (!customerId) return [];
    const orders = await this.prisma.donDatTour.findMany({
      where: { KhachHangID: customerId, TrangThaiDon: { not: 'Da huy' } },
      include: { LichKhoiHanh: { include: { Tour: { select: { TenTour: true, DiemKhoiHanh: true } } } }, DanhGia: true },
    });
    const now = Date.now();
    const list: { loai: string; tieuDe: string; noiDung: string; maDon: string; donHangId: number; thoiGian: Date }[] = [];
    for (const o of orders) {
      const l = o.LichKhoiHanh;
      const days = Math.ceil((l.NgayKhoiHanh.getTime() - now) / DAY);
      if (days >= 0 && days <= 7 && o.TrangThaiDon !== 'Cho thanh toan') {
        list.push({ loai: 'NHAC_LICH', tieuDe: days === 0 ? 'Hôm nay khởi hành!' : `Còn ${days} ngày nữa khởi hành`, noiDung: `${l.Tour.TenTour} — tập trung tại ${l.Tour.DiemKhoiHanh} lúc ${l.NgayKhoiHanh.toLocaleString('vi-VN')}. Nhớ mang CCCD và vé QR.`, maDon: o.MaDon, donHangId: o.DonHangID, thoiGian: l.NgayKhoiHanh });
      }
      if (o.TrangThaiDon === 'Cho thanh toan' && l.NgayKhoiHanh.getTime() > now) {
        list.push({ loai: 'THANH_TOAN', tieuDe: 'Đơn chưa thanh toán', noiDung: `Đơn ${o.MaDon} (${l.Tour.TenTour}) đang chờ thanh toán để giữ chỗ.`, maDon: o.MaDon, donHangId: o.DonHangID, thoiGian: o.NgayDat });
      }
      if (l.NgayKetThuc.getTime() <= now && o.DanhGia.length === 0 && o.TrangThaiDon !== 'Cho thanh toan') {
        list.push({ loai: 'DANH_GIA', tieuDe: 'Chia sẻ cảm nhận chuyến đi', noiDung: `Bạn đã hoàn thành ${l.Tour.TenTour}. Hãy đánh giá để giúp VietTour phục vụ tốt hơn!`, maDon: o.MaDon, donHangId: o.DonHangID, thoiGian: l.NgayKetThuc });
      }
    }
    return list.sort((a, b) => b.thoiGian.getTime() - a.thoiGian.getTime());
  }
}

@Controller('portal')
export class CustomerOpsController {
  constructor(
    private s: CustomerOpsService,
    private jwt: JwtService,
  ) {}

  private extractCustomer(req: any, explicitId?: any): number | null {
    if (explicitId && !isNaN(Number(explicitId)) && Number(explicitId) > 0) {
      return Number(explicitId);
    }
    const auth = req?.headers?.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7).trim();
        const payload: any = this.jwt.decode(token);
        if (payload?.customerId) return Number(payload.customerId);
      } catch {}
    }
    return null;
  }

  @Get('bookings/:id/cancel-preview')
  preview(@Param('id', ParseIntPipe) id: number, @Query('customerId') c: string, @Req() req: any) {
    const cid = this.extractCustomer(req, c);
    return this.s.cancelPreview(id, cid).then(({ don: _d, ...rest }) => rest);
  }

  @Post('bookings/:id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() b: { customerId?: number; lyDo?: string; lyDoHuy?: string }, @Req() req: any) {
    const cid = this.extractCustomer(req, b?.customerId);
    return this.s.cancel(id, cid, b?.lyDoHuy || b?.lyDo);
  }

  @Post('reviews')
  review(@Body() b: any, @Req() req: any) {
    const cid = this.extractCustomer(req, b?.customerId);
    return this.s.review({ ...b, customerId: cid });
  }

  @Get('notifications')
  notifications(@Query('customerId') c: string, @Req() req: any) {
    const cid = this.extractCustomer(req, c);
    return this.s.notifications(cid || 0);
  }
}

@Module({
  controllers: [UsersController, GuideOpsController, CustomerOpsController],
  providers: [UsersService, GuideOpsService, CustomerOpsService],
  exports: [GuideOpsService],
})
export class ManagementModule {}
