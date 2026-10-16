import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable, Module,
  NotFoundException, Param, ParseIntPipe, Patch, Post, Query,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';
import { hashPassword, validatePasswordStrength } from '../common/password.js';

const DAY = 24 * 60 * 60 * 1000;
const n = (v: unknown) => Number(v ?? 0);

/* =============================================================================
 * 1. QUẢN LÝ KHUYẾN MÃI / MÃ GIẢM GIÁ (đề cương mục 6 – 0.25đ)
 * ===========================================================================*/
@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.khuyenMai.findMany({
      include: {
        _count: { select: { DonDatTour: true } },
        ApDungKhuyenMai: { include: { Tour: { select: { TourID: true, TenTour: true, MaTour: true } } } },
      },
      orderBy: { KhuyenMaiID: 'desc' },
    });
  }

  private parse(body: Record<string, unknown>, isCreate: boolean) {
    const data: Record<string, unknown> = {};
    if (body.MaKhuyenMai !== undefined) data.MaKhuyenMai = String(body.MaKhuyenMai).trim().toUpperCase().replace(/\s+/g, '');
    if (body.TenChuongTrinh !== undefined) data.TenChuongTrinh = String(body.TenChuongTrinh).trim();
    for (const k of ['PhanTramGiam', 'GiamToiDa', 'GiaTriDonToiThieu']) if (body[k] !== undefined && body[k] !== '') data[k] = Number(body[k]);
    for (const k of ['NgayBatDau', 'NgayKetThucKM']) if (body[k]) data[k] = new Date(String(body[k]));
    if (body.TrangThai !== undefined) data.TrangThai = Number(body.TrangThai) ? 1 : 0;

    if (isCreate) {
      for (const k of ['MaKhuyenMai', 'TenChuongTrinh', 'PhanTramGiam', 'GiamToiDa', 'NgayBatDau', 'NgayKetThucKM']) {
        if (data[k] === undefined || data[k] === '') throw new BadRequestException(`Thiếu trường bắt buộc: ${k}`);
      }
    }
    if (data.MaKhuyenMai !== undefined && !/^[A-Z0-9_-]{3,50}$/.test(data.MaKhuyenMai as string)) {
      throw new BadRequestException('Mã khuyến mãi chỉ gồm chữ in hoa, số, "-" hoặc "_" (3–50 ký tự)');
    }
    const pct = data.PhanTramGiam as number | undefined;
    if (pct !== undefined && (Number.isNaN(pct) || pct <= 0 || pct > 100)) throw new BadRequestException('Phần trăm giảm phải trong khoảng (0, 100]');
    const max = data.GiamToiDa as number | undefined;
    if (max !== undefined && (Number.isNaN(max) || max <= 0)) throw new BadRequestException('Mức giảm tối đa phải lớn hơn 0');
    const min = data.GiaTriDonToiThieu as number | undefined;
    if (min !== undefined && (Number.isNaN(min) || min < 0)) throw new BadRequestException('Giá trị đơn tối thiểu không hợp lệ');
    return data;
  }

  private checkDates(start: Date, end: Date) {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new BadRequestException('Ngày không hợp lệ');
    if (end < start) throw new BadRequestException('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
  }

  async create(body: Record<string, unknown>) {
    const data = this.parse(body, true);
    this.checkDates(data.NgayBatDau as Date, data.NgayKetThucKM as Date);
    if (await this.prisma.khuyenMai.findUnique({ where: { MaKhuyenMai: data.MaKhuyenMai as string } })) {
      throw new BadRequestException(`Mã ${data.MaKhuyenMai} đã tồn tại`);
    }
    const tourIds = Array.isArray(body.tourIds) ? (body.tourIds as unknown[]).map(Number).filter(Boolean) : [];
    return this.prisma.khuyenMai.create({
      data: {
        ...(data as any),
        ApDungKhuyenMai: tourIds.length ? { create: tourIds.map((TourID) => ({ TourID })) } : undefined,
      },
    });
  }

  async update(id: number, body: Record<string, unknown>) {
    const cur = await this.prisma.khuyenMai.findUnique({ where: { KhuyenMaiID: id } });
    if (!cur) throw new NotFoundException('Không tìm thấy khuyến mãi');
    const data = this.parse(body, false);
    this.checkDates((data.NgayBatDau as Date) ?? cur.NgayBatDau, (data.NgayKetThucKM as Date) ?? cur.NgayKetThucKM);
    if (data.MaKhuyenMai && data.MaKhuyenMai !== cur.MaKhuyenMai) {
      const used = await this.prisma.donDatTour.count({ where: { KhuyenMaiID: id } });
      if (used > 0) throw new BadRequestException('Mã đã được sử dụng trong đơn hàng, không thể đổi mã');
    }
    return this.prisma.$transaction(async (tx) => {
      if (Array.isArray(body.tourIds)) {
        const ids = (body.tourIds as unknown[]).map(Number).filter(Boolean);
        await tx.apDungKhuyenMai.deleteMany({ where: { KhuyenMaiID: id } });
        if (ids.length) await tx.apDungKhuyenMai.createMany({ data: ids.map((TourID) => ({ TourID, KhuyenMaiID: id })) });
      }
      return tx.khuyenMai.update({ where: { KhuyenMaiID: id }, data: data as any });
    });
  }

  async toggle(id: number) {
    const km = await this.prisma.khuyenMai.findUnique({ where: { KhuyenMaiID: id } });
    if (!km) throw new NotFoundException('Không tìm thấy khuyến mãi');
    return this.prisma.khuyenMai.update({ where: { KhuyenMaiID: id }, data: { TrangThai: km.TrangThai ? 0 : 1 } });
  }

  async remove(id: number) {
    const used = await this.prisma.donDatTour.count({ where: { KhuyenMaiID: id } });
    if (used > 0) throw new BadRequestException(`Mã đã được dùng trong ${used} đơn hàng — chỉ có thể tạm dừng, không thể xóa`);
    return this.prisma.khuyenMai.delete({ where: { KhuyenMaiID: id } });
  }
}

@Controller('promotions')
export class PromotionsController {
  constructor(private s: PromotionsService) {}
  @Get() list() { return this.s.list(); }
  @Post() create(@Body() b: Record<string, unknown>) { return this.s.create(b); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.s.update(id, b); }
  @Patch(':id/toggle') toggle(@Param('id', ParseIntPipe) id: number) { return this.s.toggle(id); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.s.remove(id); }
}

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
export class UsersController {
  constructor(private s: UsersService) {}
  @Get() list(@Query() q: Record<string, string>) { return this.s.list(q); }
  @Get('roles') roles() { return this.s.roles(); }
  @Post() create(@Body() b: any) { return this.s.createStaff(b); }
  @Patch(':id/toggle-status') toggle(@Param('id', ParseIntPipe) id: number, @Body('actorId') a?: number) { return this.s.toggleStatus(id, a); }
  @Patch(':id/roles') roles2(@Param('id', ParseIntPipe) id: number, @Body() b: { roles: string[]; actorId?: number }) { return this.s.setRoles(id, b.roles, b.actorId); }
  @Patch(':id/reset-password') reset(@Param('id', ParseIntPipe) id: number, @Body('newPassword') p: string) { return this.s.resetPassword(id, p); }
}

/* =============================================================================
 * 3. BÁO CÁO THỐNG KÊ (đề cương: khách theo tour, doanh thu, tour đặt nhiều nhất, mùa cao điểm)
 * ===========================================================================*/
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async overview(yearRaw?: string) {
    const year = Number(yearRaw) || new Date().getFullYear();

    const [customersByTour, topTours, months, costByMonth, years, totals] = await Promise.all([
      this.prisma.$queryRaw<{ tourid: number; matour: string; tentour: string; sokhach: number; sodon: number }[]>`
        SELECT t.tourid, t.matour, t.tentour,
               COALESCE(SUM(d.soluongnguoilon + d.soluongtreem), 0)::int AS sokhach,
               COUNT(d.donhangid)::int AS sodon
        FROM tour t
        LEFT JOIN lichkhoihanh l ON l.tourid = t.tourid
        LEFT JOIN dondattour d ON d.lichid = l.lichid AND d.trangthaidon <> 'Da huy'
                               AND EXTRACT(YEAR FROM d.ngaydat) = ${year}
        GROUP BY t.tourid, t.matour, t.tentour
        ORDER BY sokhach DESC`,
      this.prisma.$queryRaw<{ tourid: number; tentour: string; diemden: string; sodon: number; sokhach: number; doanhthu: number; diemtb: number | null }[]>`
        SELECT t.tourid, t.tentour, t.diemden,
               COUNT(d.donhangid)::int AS sodon,
               COALESCE(SUM(d.soluongnguoilon + d.soluongtreem), 0)::int AS sokhach,
               COALESCE(SUM(d.tongtien - d.giamgia), 0)::float AS doanhthu,
               (SELECT ROUND(AVG(g.sosao)::numeric, 1)::float FROM danhgia g WHERE g.tourid = t.tourid) AS diemtb
        FROM tour t
        JOIN lichkhoihanh l ON l.tourid = t.tourid
        JOIN dondattour d ON d.lichid = l.lichid AND d.trangthaidon <> 'Da huy'
        WHERE EXTRACT(YEAR FROM d.ngaydat) = ${year}
        GROUP BY t.tourid, t.tentour, t.diemden
        ORDER BY sodon DESC, doanhthu DESC
        LIMIT 5`,
      // Mùa cao điểm: tính theo THÁNG KHỞI HÀNH (khách thực sự đi), không theo ngày đặt
      this.prisma.$queryRaw<{ thang: number; sokhach: number; sodon: number; doanhthu: number }[]>`
        SELECT m AS thang,
               COALESCE(SUM(d.soluongnguoilon + d.soluongtreem), 0)::int AS sokhach,
               COUNT(d.donhangid)::int AS sodon,
               COALESCE(SUM(d.tongtien - d.giamgia), 0)::float AS doanhthu
        FROM generate_series(1, 12) AS m
        LEFT JOIN lichkhoihanh l ON EXTRACT(MONTH FROM l.ngaykhoihanh) = m AND EXTRACT(YEAR FROM l.ngaykhoihanh) = ${year}
        LEFT JOIN dondattour d ON d.lichid = l.lichid AND d.trangthaidon <> 'Da huy'
        GROUP BY m ORDER BY m`,
      this.prisma.$queryRaw<{ thang: number; chiphi: number }[]>`
        SELECT m AS thang, COALESCE(SUM(p.tongtiendichvu), 0)::float AS chiphi
        FROM generate_series(1, 12) AS m
        LEFT JOIN phieudatdichvu p ON EXTRACT(MONTH FROM p.ngaydat) = m AND EXTRACT(YEAR FROM p.ngaydat) = ${year}
                                   AND p.trangthai NOT IN ('Da huy', 'NCC tu choi')
        GROUP BY m ORDER BY m`,
      this.prisma.$queryRaw<{ nam: number }[]>`
        SELECT DISTINCT EXTRACT(YEAR FROM ngaykhoihanh)::int AS nam FROM lichkhoihanh ORDER BY nam DESC`,
      this.prisma.$queryRaw<{ sodon: number; sokhach: number; doanhthu: number; dahuy: number }[]>`
        SELECT COUNT(*) FILTER (WHERE trangthaidon <> 'Da huy')::int AS sodon,
               COALESCE(SUM(soluongnguoilon + soluongtreem) FILTER (WHERE trangthaidon <> 'Da huy'), 0)::int AS sokhach,
               COALESCE(SUM(tongtien - giamgia) FILTER (WHERE trangthaidon <> 'Da huy'), 0)::float AS doanhthu,
               COUNT(*) FILTER (WHERE trangthaidon = 'Da huy')::int AS dahuy
        FROM dondattour WHERE EXTRACT(YEAR FROM ngaydat) = ${year}`,
    ]);

    const monthly = months.map((m) => ({ ...m, chiphi: costByMonth.find((c) => c.thang === m.thang)?.chiphi ?? 0 }));
    const avg = monthly.reduce((s, m) => s + m.sokhach, 0) / 12;
    const peakMonths = [...monthly].filter((m) => m.sokhach > 0).sort((a, b) => b.sokhach - a.sokhach).slice(0, 3).map((m) => m.thang);
    const quarters = [1, 2, 3, 4].map((q) => {
      const ms = monthly.filter((m) => Math.ceil(m.thang / 3) === q);
      return { quy: q, sokhach: ms.reduce((s, m) => s + m.sokhach, 0), doanhthu: ms.reduce((s, m) => s + m.doanhthu, 0) };
    });

    return {
      year,
      years: years.map((y) => y.nam),
      totals: totals[0],
      customersByTour,
      topTours,
      monthly: monthly.map((m) => ({ ...m, caoDiem: peakMonths.includes(m.thang) || (avg > 0 && m.sokhach >= avg * 1.5) })),
      peakMonths,
      quarters,
    };
  }
}

@Controller('reports')
export class ReportsController {
  constructor(private s: ReportsService) {}
  @Get('overview') overview(@Query('year') y?: string) { return this.s.overview(y); }
}

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
        const rating = await this.prisma.danhGia.aggregate({ where: { DonDatTour: { LichID: l.LichID } }, _avg: { SoSao: true }, _count: true });
        const diem = rating._avg.SoSao ? Number(rating._avg.SoSao) : null;
        const thuong = diem === null ? 0 : diem >= 4.5 ? PAYROLL.THUONG_XUAT_SAC : diem >= 4 ? PAYROLL.THUONG_TOT : 0;
        const daChot = dp.TrangThai === 'Hoan thanh';
        tours.push({
          DieuPhoiID: dp.DieuPhoiID, MaLich: l.MaLich, TenTour: l.Tour.TenTour, NgayKhoiHanh: l.NgayKhoiHanh, NgayKetThuc: l.NgayKetThuc,
          TrangThai: dp.TrangThai, soNgay, tienCong: soNgay * rate, phuCap: PAYROLL.PHU_CAP_DOAN, diemDanhGia: diem, soDanhGia: rating._count, thuong, daChot,
        });
      }
      const tong = tours.reduce((s, t) => s + t.tienCong + t.phuCap + t.thuong, 0);
      result.push({
        HDVID: g.HDVID, HoTen: g.NhanVien.HoTen, SoTheHDV: g.SoTheHDV, SoDienThoai: g.NhanVien.SoDienThoai, TrangThai: g.TrangThai,
        soTour: tours.length, soNgay: tours.reduce((s, t) => s + t.soNgay, 0),
        tienCong: tours.reduce((s, t) => s + t.tienCong, 0), phuCap: tours.reduce((s, t) => s + t.phuCap, 0), thuong: tours.reduce((s, t) => s + t.thuong, 0),
        tongThuNhap: tong, tours,
      });
    }
    return { thang: `${String(m).padStart(2, '0')}/${y}`, donGiaNgay: rate, quyDinh: PAYROLL, data: result.sort((a, b) => b.tongThuNhap - a.tongThuNhap) };
  }

  /* ---------- Lịch làm việc HDV (web + mobile) ---------- */
  async mySchedule(taiKhoanId: number) {
    const nv = await this.prisma.nhanVien.findUnique({ where: { TaiKhoanID: taiKhoanId }, include: { HuongDanVien: true } });
    if (!nv?.HuongDanVien) throw new NotFoundException('Tài khoản không phải hướng dẫn viên');
    const list = await this.prisma.dieuPhoiTour.findMany({
      where: { HDVID: nv.HuongDanVien.HDVID, TrangThai: { not: 'Tu choi' } },
      include: {
        LichKhoiHanh: {
          include: {
            Tour: { select: { TourID: true, MaTour: true, TenTour: true, DiemKhoiHanh: true, DiemDen: true, ThoiGian: true, LichTrinh: true, PhuongTien: true, HinhAnhURL: true, DichVuDiKem: true } },
            DonDatTour: {
              where: { TrangThaiDon: { not: 'Da huy' } },
              select: { MaDon: true, TrangThaiDon: true, KhachHang: { select: { HoTen: true, SoDienThoai: true } }, ChiTietHanhKhach: true },
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
      hdv: { HDVID: nv.HuongDanVien.HDVID, HoTen: nv.HoTen, SoTheHDV: nv.HuongDanVien.SoTheHDV, NgonNgu: nv.HuongDanVien.NgonNgu },
      lich: list.map((dp) => {
        const pax = dp.LichKhoiHanh.DonDatTour.flatMap((d) => d.ChiTietHanhKhach);
        return { ...dp, tongKhach: pax.length, daDiemDanh: pax.filter((p) => p.TrangThaiDiemDanh === 1).length };
      }),
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
      const maDon = decodeURIComponent(raw.split('/portal/ticket/')[1]?.split(/[?#]/)[0] ?? raw);
      don = await this.prisma.donDatTour.findUnique({ where: { MaDon: maDon }, include: { ChiTietHanhKhach: true } });
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
}

@Controller()
export class GuideOpsController {
  constructor(private s: GuideOpsService) {}
  @Post('departures/create') createDeparture(@Body() b: any) { return this.s.createDeparture(b); }
  @Patch('departures/:id/status') depStatus(@Param('id', ParseIntPipe) id: number, @Body('TrangThai') t: string) { return this.s.updateDepartureStatus(id, t); }
  @Get('departures/:id/available-guides') avail(@Param('id', ParseIntPipe) id: number) { return this.s.availableGuides(id); }
  @Post('departures/:id/assign-guide') assign(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.s.assignGuide(id, b); }
  @Delete('assignments/:id') unassign(@Param('id', ParseIntPipe) id: number) { return this.s.unassign(id); }
  @Patch('assignments/:id/respond') respond(@Param('id', ParseIntPipe) id: number, @Body() b: { TrangThai: string; taiKhoanId?: number }) { return this.s.respondAssignment(id, b.TrangThai, b.taiKhoanId); }
  @Get('guide-payroll') payroll(@Query('month') m?: string, @Query('donGia') d?: string) { return this.s.payroll(m, d); }
  @Get('guide/my-schedule') schedule(@Query('taiKhoanId') id: string) { return this.s.mySchedule(Number(id)); }
  @Post('guide/checkin-qr') checkin(@Body() b: { code: string; lichId?: number }) { return this.s.checkinByQr(b.code, b.lichId); }
}

/* =============================================================================
 * 5. NHÀ CUNG CẤP: thêm dịch vụ, lập phiếu đặt dịch vụ (chi phí tour)
 * ===========================================================================*/
@Injectable()
export class SupplierOpsService {
  constructor(private prisma: PrismaService) {}

  async createSupplier(b: any) {
    const valid = ['Khach san', 'Nha hang', 'Xe van chuyen', 'Cong ty bay', 'Khu du lich', 'Khac'];
    if (!b.TenNCC?.trim() || !b.SoDienThoai?.trim()) throw new BadRequestException('Thiếu tên hoặc SĐT nhà cung cấp');
    if (!valid.includes(b.LoaiNCC)) throw new BadRequestException('Loại NCC không hợp lệ');
    const danhGia = b.DanhGia === '' || b.DanhGia === undefined || b.DanhGia === null ? null : Number(b.DanhGia);
    if (danhGia !== null && (danhGia < 0 || danhGia > 5)) throw new BadRequestException('Đánh giá phải từ 0 đến 5');
    return this.prisma.nhaCungCap.create({
      data: { TenNCC: b.TenNCC.trim(), LoaiNCC: b.LoaiNCC, NguoiLienHe: b.NguoiLienHe || null, SoDienThoai: b.SoDienThoai.trim(), Email: b.Email || null, DiaChi: b.DiaChi || null, DanhGia: danhGia },
    });
  }

  async addService(nccId: number, b: any) {
    if (!b.TenDichVu?.trim() || !b.DonViTinh?.trim()) throw new BadRequestException('Thiếu tên dịch vụ hoặc đơn vị tính');
    const gia = Number(b.DonGia);
    if (Number.isNaN(gia) || gia < 0) throw new BadRequestException('Đơn giá không hợp lệ');
    return this.prisma.dichVuNhaCungCap.create({ data: { NhaCungCapID: nccId, TenDichVu: b.TenDichVu.trim(), LoaiDichVu: b.LoaiDichVu || null, DonGia: gia, DonViTinh: b.DonViTinh.trim(), MoTa: b.MoTa || null } });
  }

  listOrders(lichId?: number) {
    return this.prisma.phieuDatDichVu.findMany({
      where: lichId ? { LichID: lichId } : undefined,
      include: { NhaCungCap: true, NhanVien: { select: { HoTen: true } }, LichKhoiHanh: { include: { Tour: { select: { TenTour: true } } } }, ChiTiet: { include: { DichVu: true } } },
      orderBy: { PhieuDatID: 'desc' },
    });
  }

  async createOrder(b: { LichID: number; NhanVienID: number; NhaCungCapID: number; TienDaCoc?: number; GhiChu?: string; items: { DichVuNCCID: number; SoLuong: number; NgaySuDung: string }[] }) {
    if (!b.LichID || !b.NhanVienID || !b.NhaCungCapID) throw new BadRequestException('Thiếu chuyến đi, nhân viên hoặc nhà cung cấp');
    if (!Array.isArray(b.items) || b.items.length === 0) throw new BadRequestException('Phiếu đặt phải có ít nhất 1 dịch vụ');
    const lich = await this.prisma.lichKhoiHanh.findUnique({ where: { LichID: Number(b.LichID) } });
    if (!lich) throw new BadRequestException('Chuyến đi không tồn tại');
    const services = await this.prisma.dichVuNhaCungCap.findMany({ where: { NhaCungCapID: Number(b.NhaCungCapID), DichVuNCCID: { in: b.items.map((i) => Number(i.DichVuNCCID)) } } });
    const rows = b.items.map((i) => {
      const dv = services.find((s) => s.DichVuNCCID === Number(i.DichVuNCCID));
      if (!dv) throw new BadRequestException('Có dịch vụ không thuộc nhà cung cấp đã chọn');
      const sl = Number(i.SoLuong);
      if (!Number.isInteger(sl) || sl <= 0) throw new BadRequestException(`Số lượng dịch vụ "${dv.TenDichVu}" không hợp lệ`);
      const ngay = new Date(i.NgaySuDung || lich.NgayKhoiHanh);
      return { DichVuNCCID: dv.DichVuNCCID, SoLuong: sl, DonGia: Number(dv.DonGia), ThanhTien: sl * Number(dv.DonGia), NgaySuDung: ngay };
    });
    const tong = rows.reduce((s, r) => s + r.ThanhTien, 0);
    const coc = Number(b.TienDaCoc || 0);
    if (coc < 0 || coc > tong) throw new BadRequestException('Tiền cọc phải trong khoảng 0 – tổng tiền dịch vụ');
    const count = await this.prisma.phieuDatDichVu.count();
    return this.prisma.phieuDatDichVu.create({
      data: {
        LichID: Number(b.LichID), NhanVienID: Number(b.NhanVienID), NhaCungCapID: Number(b.NhaCungCapID),
        MaPhieu: `PDV-${String(count + 1).padStart(4, '0')}-${Date.now().toString().slice(-4)}`,
        TongTienDichVu: tong, TienDaCoc: coc, GhiChu: b.GhiChu || null,
        ChiTiet: { create: rows },
      },
      include: { ChiTiet: true },
    });
  }

  updateOrderStatus(id: number, trangThai: string) {
    if (!['Moi tao', 'Da gui NCC', 'NCC xac nhan', 'NCC tu choi', 'Da huy'].includes(trangThai)) throw new BadRequestException('Trạng thái không hợp lệ');
    return this.prisma.phieuDatDichVu.update({ where: { PhieuDatID: id }, data: { TrangThai: trangThai } });
  }
}

@Controller()
export class SupplierOpsController {
  constructor(private s: SupplierOpsService) {}
  @Post('suppliers/create') create(@Body() b: any) { return this.s.createSupplier(b); }
  @Post('suppliers/:id/services') addService(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.s.addService(id, b); }
  @Get('service-orders/list') list(@Query('lichId') l?: string) { return this.s.listOrders(l ? Number(l) : undefined); }
  @Post('service-orders') create2(@Body() b: any) { return this.s.createOrder(b); }
  @Patch('service-orders/:id/status') status(@Param('id', ParseIntPipe) id: number, @Body('TrangThai') t: string) { return this.s.updateOrderStatus(id, t); }
}

/* =============================================================================
 * 6. KHÁCH HÀNG: hủy tour (chính sách hoàn tiền), đánh giá sau tour, thông báo nhắc lịch
 * ===========================================================================*/
@Injectable()
export class CustomerOpsService {
  constructor(private prisma: PrismaService) {}

  /** Chính sách hoàn tiền theo số ngày trước khởi hành */
  static refundRate(daysBefore: number) {
    if (daysBefore >= 15) return 1;
    if (daysBefore >= 7) return 0.5;
    if (daysBefore >= 3) return 0.3;
    return 0;
  }

  async cancelPreview(donHangId: number, customerId: number) {
    const don = await this.prisma.donDatTour.findUnique({ where: { DonHangID: donHangId }, include: { LichKhoiHanh: true } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (don.KhachHangID !== Number(customerId)) throw new ForbiddenException('Đơn hàng không thuộc tài khoản của bạn');
    if (!['Cho thanh toan', 'Da dat coc', 'Da thanh toan', 'Da xac nhan'].includes(don.TrangThaiDon)) {
      throw new BadRequestException('Đơn ở trạng thái hiện tại không thể hủy');
    }
    const days = Math.floor((don.LichKhoiHanh.NgayKhoiHanh.getTime() - Date.now()) / DAY);
    if (days < 0) throw new BadRequestException('Tour đã khởi hành, không thể hủy');
    const rate = CustomerOpsService.refundRate(days);
    const daThu = n(don.TienCoc);
    return { don, days, rate, daThu, hoanTien: Math.round(daThu * rate), phiHuy: daThu - Math.round(daThu * rate) };
  }

  async cancel(donHangId: number, customerId: number, lyDo?: string) {
    const p = await this.cancelPreview(donHangId, customerId);
    return this.prisma.$transaction(async (tx) => {
      const fresh = await tx.donDatTour.findUniqueOrThrow({ where: { DonHangID: donHangId } });
      if (fresh.TrangThaiDon === 'Da huy') throw new BadRequestException('Đơn đã được hủy trước đó');
      await tx.donDatTour.update({
        where: { DonHangID: donHangId },
        data: { TrangThaiDon: 'Da huy', GhiChu: `${fresh.GhiChu ? fresh.GhiChu + ' | ' : ''}Khách hủy ${new Date().toLocaleDateString('vi-VN')}: ${lyDo || 'Không nêu lý do'}` },
      });
      await tx.lichKhoiHanh.update({ where: { LichID: fresh.LichID }, data: { SoChoDaDat: { decrement: fresh.SoLuongNguoiLon + fresh.SoLuongTreEm } } });
      if (p.hoanTien > 0) {
        await tx.thanhToan.create({
          data: {
            DonHangID: donHangId, SoTien: p.hoanTien, HinhThucTT: fresh.PhuongThucTT || 'Chuyen khoan', TrangThai: 'Da hoan tien',
            MaGiaoDich: `RF-${fresh.MaDon}-${Date.now().toString().slice(-5)}`, GhiChu: `Hoàn ${p.rate * 100}% do hủy trước ${p.days} ngày`,
          },
        });
      }
      return { message: 'Đã hủy đơn đặt tour', hoanTien: p.hoanTien, phiHuy: p.phiHuy, tyLeHoan: p.rate };
    });
  }

  async review(b: { customerId: number; donHangId: number; soSao: number; binhLuan?: string }) {
    const sao = Number(b.soSao);
    if (!Number.isInteger(sao) || sao < 1 || sao > 5) throw new BadRequestException('Số sao phải từ 1 đến 5');
    const don = await this.prisma.donDatTour.findUnique({ where: { DonHangID: Number(b.donHangId) }, include: { LichKhoiHanh: true } });
    if (!don) throw new NotFoundException('Không tìm thấy đơn');
    if (don.KhachHangID !== Number(b.customerId)) throw new ForbiddenException('Đơn hàng không thuộc tài khoản của bạn');
    const ended = don.TrangThaiDon === 'Hoan thanh' || don.LichKhoiHanh.NgayKetThuc <= new Date();
    if (!ended || don.TrangThaiDon === 'Da huy' || don.TrangThaiDon === 'Cho thanh toan') {
      throw new BadRequestException('Chỉ được đánh giá sau khi đã tham gia và kết thúc tour');
    }
    if (await this.prisma.danhGia.findUnique({ where: { KhachHangID_DonHangID: { KhachHangID: don.KhachHangID, DonHangID: don.DonHangID } } })) {
      throw new BadRequestException('Bạn đã đánh giá đơn tour này rồi');
    }
    return this.prisma.danhGia.create({
      data: { KhachHangID: don.KhachHangID, DonHangID: don.DonHangID, TourID: don.LichKhoiHanh.TourID, SoSao: sao, BinhLuan: b.binhLuan?.trim() || null, TrangThaiDuyet: 'Da hien thi' },
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
  constructor(private s: CustomerOpsService) {}
  @Get('bookings/:id/cancel-preview') preview(@Param('id', ParseIntPipe) id: number, @Query('customerId') c: string) {
    return this.s.cancelPreview(id, Number(c)).then(({ don: _d, ...rest }) => rest);
  }
  @Post('bookings/:id/cancel') cancel(@Param('id', ParseIntPipe) id: number, @Body() b: { customerId: number; lyDo?: string }) { return this.s.cancel(id, b.customerId, b.lyDo); }
  @Post('reviews') review(@Body() b: any) { return this.s.review(b); }
  @Get('notifications') notifications(@Query('customerId') c: string) { return this.s.notifications(Number(c)); }
}

@Module({
  controllers: [PromotionsController, UsersController, ReportsController, GuideOpsController, SupplierOpsController, CustomerOpsController],
  providers: [PromotionsService, UsersService, ReportsService, GuideOpsService, SupplierOpsService, CustomerOpsService],
  exports: [GuideOpsService],
})
export class ManagementModule {}
