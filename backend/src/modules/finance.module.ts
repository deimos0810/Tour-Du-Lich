import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { guideCostForDeparture } from '../common/payroll.js';
import type { Db } from '../common/promotion.js';

const n = (v: unknown) => Number(v ?? 0);
const CHI_PHI_LOAI = ['Ve tham quan', 'Bao hiem', 'An uong phat sinh', 'Di chuyen phat sinh', 'Marketing', 'Hoa hong', 'Khac'];
const PHIEU_LOAI_TRU = ['Da huy', 'NCC tu choi'];
type Req_ = { user?: { sub?: number; employeeId?: number | null } };

/* =============================================================================
 * QUẢN LÝ CHI PHÍ – DOANH THU & QUYẾT TOÁN TOUR (chuẩn kế toán lữ hành)
 *
 *  DOANH THU GHI NHẬN   = Σ đơn không hủy (Tổng tiền − Giảm giá[KM tour + voucher]) + phí hủy giữ lại (đã thu − đã hoàn)
 *  THỰC THU             = Σ giao dịch thành công − Σ hoàn tiền
 *  CÔNG NỢ PHẢI THU     = Doanh thu ghi nhận − Thực thu (khách còn thiếu)
 *  CHI PHÍ              = NCC (phiếu hiệu lực) + Nhân công HDV (đã xác nhận) + Chi phí phát sinh
 *  CÔNG NỢ PHẢI TRẢ NCC = Σ (Tổng phiếu − đã trả/cọc)
 *  LỢI NHUẬN            = Doanh thu ghi nhận − Chi phí          |  Biên lợi nhuận = Lợi nhuận / Doanh thu
 *
 *  Quy trình: Nhap → Da trinh duyet (Kế toán, chuyến phải Hoàn thành) → Da phe duyet (Admin, khóa sổ)
 *             hoặc Yeu cau chinh sua (trả lại kèm lý do) → Kế toán lập lại.
 * ===========================================================================*/
@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  private mapSupplierOrder(p: any) {
    return {
      ...p,
      PhieuID: p.PhieuDatID,
      TienDatCoc: p.TienDaCoc,
      SoHoaDon: p.SoHoaDonNCC,
      NgayLap: p.NgayDat,
      NhaCungCap: p.NhaCungCap
        ? {
            ...p.NhaCungCap,
            TenNhaCungCap: p.NhaCungCap.TenNCC,
            LoaiDichVu: p.NhaCungCap.LoaiNCC,
          }
        : undefined,
      ChiTiet: (p.ChiTiet || []).map((ct: any) => ({
        ...ct,
        ChiTietID: ct.ChiTietPhieuID,
        DichVuID: ct.DichVuNCCID,
        DichVu: ct.DichVu
          ? {
              ...ct.DichVu,
              LoaiDichVu: ct.DichVu.LoaiDichVu || p.NhaCungCap?.LoaiNCC || 'Dịch vụ',
              GiaThamKhao: ct.DichVu.DonGia,
            }
          : undefined,
      })),
    };
  }

  /** Tính toàn bộ số liệu tài chính của 1 chuyến từ dữ liệu gốc (không phụ thuộc số đã lưu). */
  async compute(lichId: number, db: Db = this.prisma) {
    const lich = await db.lichKhoiHanh.findUnique({
      where: { LichID: lichId },
      include: {
        Tour: { select: { TourID: true, MaTour: true, TenTour: true } },
        DonDatTour: { include: { KhachHang: { select: { HoTen: true } }, ThanhToan: { select: { SoTien: true, TrangThai: true } } }, orderBy: { NgayDat: 'asc' } },
        PhieuDatDichVu: { include: { NhaCungCap: true, ChiTiet: { include: { DichVu: true } } }, orderBy: { PhieuDatID: 'asc' } },
        ChiPhiPhatSinh: { include: { NhanVien: { select: { HoTen: true } } }, orderBy: { ChiPhiID: 'asc' } },
      },
    });
    if (!lich) throw new BadRequestException('Không tìm thấy lịch khởi hành này');

    // ---- Doanh thu
    let doanhThu = 0, thucThu = 0, congNoPhaiThu = 0, tongGiamKM = 0, tongGiamVoucher = 0, tongGiaGoc = 0, phiHuyGiuLai = 0, soKhach = 0, soDonHuy = 0, soDonChuaThanhToanDu = 0;
    const donHang = lich.DonDatTour.map((d) => {
      const huy = d.TrangThaiDon === 'Da huy';
      const dathu = Math.max(d.ThanhToan.filter((t) => t.TrangThai === 'Thanh cong').reduce((s, t) => s + n(t.SoTien), 0), n(d.TienCoc));
      const hoan = d.ThanhToan.filter((t) => t.TrangThai === 'Da hoan tien').reduce((s, t) => s + n(t.SoTien), 0);
      const net = dathu - hoan;
      const giamKM = n(d.GiamGiaKhuyenMai);
      const giamVC = n(d.GiamGia) - giamKM;
      const phaiThu = n(d.TongTien) - n(d.GiamGia);
      let ghiNhan: number, conNo = 0;
      if (huy) { ghiNhan = Math.max(net, 0); phiHuyGiuLai += ghiNhan; soDonHuy++; }
      else {
        ghiNhan = phaiThu; conNo = Math.max(phaiThu - net, 0);
        tongGiaGoc += n(d.TongTien); tongGiamKM += giamKM; tongGiamVoucher += giamVC; soKhach += d.SoLuongNguoiLon + d.SoLuongTreEm;
        if (conNo > 0) soDonChuaThanhToanDu++;
      }
      doanhThu += ghiNhan; thucThu += net; congNoPhaiThu += conNo;
      return {
        DonHangID: d.DonHangID, MaDon: d.MaDon, KhachHang: d.KhachHang?.HoTen ?? '', TrangThaiDon: d.TrangThaiDon, soKhach: d.SoLuongNguoiLon + d.SoLuongTreEm,
        tongTien: n(d.TongTien), giamKM, giamVoucher: giamVC, phaiThu, daThu: net, doanhThuGhiNhan: ghiNhan, congNo: conNo,
      };
    });

    // ---- Chi phí
    const phieu = lich.PhieuDatDichVu.filter((p) => !PHIEU_LOAI_TRU.includes(p.TrangThai));
    const chiPhiNCC = phieu.reduce((s, p) => s + n(p.TongTienDichVu), 0);
    const congNoPhaiTra = phieu.reduce((s, p) => s + Math.max(n(p.TongTienDichVu) - n(p.TienDaCoc), 0), 0);
    const hdv = await guideCostForDeparture(db, lichId);
    const chiPhiKhac = lich.ChiPhiPhatSinh.reduce((s, c) => s + n(c.SoTien), 0);
    const tongChi = chiPhiNCC + hdv.total + chiPhiKhac;
    const loiNhuan = doanhThu - tongChi;

    const warnings: string[] = [];
    if (lich.TrangThai !== 'Hoan thanh') warnings.push(`Chuyến đang ở trạng thái "${lich.TrangThai}" — chỉ trình duyệt quyết toán khi chuyến đã Hoàn thành`);
    if (congNoPhaiThu > 0) warnings.push(`Còn ${soDonChuaThanhToanDu} đơn chưa thu đủ tiền (công nợ phải thu ${congNoPhaiThu.toLocaleString('vi-VN')} đ)`);
    const chuaXacNhan = phieu.filter((p) => ['Moi tao', 'Da gui NCC'].includes(p.TrangThai)).length;
    if (chuaXacNhan > 0) warnings.push(`${chuaXacNhan} phiếu đặt dịch vụ NCC chưa được NCC xác nhận`);
    if (congNoPhaiTra > 0) warnings.push(`Còn công nợ phải trả NCC ${congNoPhaiTra.toLocaleString('vi-VN')} đ`);
    if (hdv.choXacNhan > 0) warnings.push(`${hdv.choXacNhan} HDV được phân công nhưng chưa xác nhận (chưa tính vào chi phí)`);
    if (hdv.items.length === 0) warnings.push('Chuyến chưa có HDV được phân công — kiểm tra chi phí nhân công');
    if (doanhThu > 0 && loiNhuan < 0) warnings.push('Chuyến đang LỖ — cần giải trình khi trình duyệt');

    return {
      lichId: lich.LichID, maLich: lich.MaLich, tenTour: lich.Tour.TenTour, maTour: lich.Tour.MaTour, trangThaiLich: lich.TrangThai,
      ngayKhoiHanh: lich.NgayKhoiHanh, ngayKetThuc: lich.NgayKetThuc, soDon: donHang.length - soDonHuy, soDonHuy, soKhach, soPhieuChi: phieu.length,
      doanhThu: { giaGoc: tongGiaGoc, giamKhuyenMai: tongGiamKM, giamVoucher: tongGiamVoucher, phiHuyGiuLai, ghiNhan: doanhThu, thucThu, congNoPhaiThu },
      chiPhi: { ncc: chiPhiNCC, hdv: hdv.total, khac: chiPhiKhac, tong: tongChi, congNoPhaiTra },
      loiNhuan, bienLoiNhuan: doanhThu > 0 ? Math.round((loiNhuan / doanhThu) * 1000) / 10 : 0,
      // tương thích giao diện cũ
      tongThu: doanhThu, tongChi, tySuat: doanhThu > 0 ? Math.round((loiNhuan / doanhThu) * 1000) / 10 : 0,
      chiTietChiPhi: phieu.map((p) => this.mapSupplierOrder(p)),
      chiTiet: { donHang, phieuNCC: lich.PhieuDatDichVu.map((p) => this.mapSupplierOrder(p)), hdv: hdv.items, chiPhiKhac: lich.ChiPhiPhatSinh },
      canhBao: warnings,
    };
  }

  private async employeeId(req: Req_, explicit?: unknown) {
    const id = req.user?.employeeId ?? (explicit ? Number(explicit) : null);
    if (id) return id;
    const nv = req.user?.sub ? await this.prisma.nhanVien.findUnique({ where: { TaiKhoanID: req.user.sub } }) : null;
    if (!nv) throw new BadRequestException('Tài khoản đăng nhập chưa có hồ sơ nhân viên');
    return nv.NhanVienID;
  }

  private snapshot(c: Awaited<ReturnType<FinanceService['compute']>>) {
    return {
      TongThu: Math.max(c.doanhThu.ghiNhan, 0), ThucThu: Math.max(c.doanhThu.thucThu, 0), CongNoPhaiThu: c.doanhThu.congNoPhaiThu,
      ChiPhiNCC: c.chiPhi.ncc, ChiPhiHDV: c.chiPhi.hdv, ChiPhiKhac: c.chiPhi.khac, TongChi: c.chiPhi.tong, CongNoPhaiTra: c.chiPhi.congNoPhaiTra,
    };
  }

  /* ---------------------------------------------------------------- Quyết toán */
  async list() {
    const rows = await this.prisma.baoCaoQuyetToan.findMany({
      include: {
        LichKhoiHanh: {
          include: {
            Tour: { select: { TenTour: true, MaTour: true, ThoiGian: true } },
            PhieuDatDichVu: {
              where: { TrangThai: { notIn: PHIEU_LOAI_TRU } },
              include: {
                NhaCungCap: true,
                ChiTiet: { include: { DichVu: true } },
              },
              orderBy: { PhieuDatID: 'asc' },
            },
            ChiPhiPhatSinh: {
              include: { NhanVien: { select: { HoTen: true } } },
              orderBy: { ChiPhiID: 'asc' },
            },
            DieuPhoiTour: {
              include: {
                HuongDanVien: {
                  include: { NhanVien: { select: { HoTen: true, SoDienThoai: true } } },
                },
              },
            },
          },
        },
        NhanVienLap: { select: { HoTen: true } },
        NhanVienDuyet: { select: { HoTen: true } },
      },
      orderBy: { NgayLap: 'desc' },
    });

    return rows.map((r) => {
      const tongThu = n(r.TongThu);
      const loiNhuan = n(r.LoiNhuan ?? tongThu - n(r.TongChi));
      const tySuat = tongThu > 0 ? Math.round((loiNhuan / tongThu) * 1000) / 10 : 0;
      const mappedOrders = (r.LichKhoiHanh?.PhieuDatDichVu || []).map((p) => this.mapSupplierOrder(p));
      return {
        ...r,
        TySuatLoiNhuan: tySuat,
        LichKhoiHanh: r.LichKhoiHanh
          ? {
              ...r.LichKhoiHanh,
              PhieuDatDichVu: mappedOrders,
            }
          : r.LichKhoiHanh,
      };
    });
  }

  async detail(id: number) {
    const s = await this.prisma.baoCaoQuyetToan.findUnique({ where: { QuyetToanID: id }, include: { NhanVienLap: { select: { HoTen: true } }, NhanVienDuyet: { select: { HoTen: true } } } });
    if (!s) throw new NotFoundException('Không tìm thấy báo cáo quyết toán');
    const live = await this.compute(s.LichID);
    const locked = s.TrangThaiDuyet === 'Da phe duyet';
    const lech = Math.abs(n(s.TongChi) - live.chiPhi.tong) > 1 || Math.abs(n(s.TongThu) - live.doanhThu.ghiNhan) > 1;
    return { settlement: s, live, locked, lechSoVoiHienTai: !locked && lech };
  }

  /** Lập / lập lại quyết toán. `trinhDuyet=false` chỉ lưu nháp; `true` trình Admin phê duyệt (chuyến phải Hoàn thành). */
  async save(b: { LichID: number; trinhDuyet?: boolean; GhiChu?: string }, req: Req_) {
    const lichId = Number(b.LichID);
    if (!lichId) throw new BadRequestException('Thiếu LichID');
    const nvId = await this.employeeId(req);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.baoCaoQuyetToan.findUnique({ where: { LichID: lichId } });
      if (existing?.TrangThaiDuyet === 'Da phe duyet') throw new BadRequestException('Quyết toán chuyến này đã được phê duyệt và khóa sổ — không thể lập lại');
      const c = await this.compute(lichId, tx);
      const trinh = b.trinhDuyet !== false;
      const data = { ...this.snapshot(c), NhanVienLapID: nvId, TrangThaiDuyet: trinh ? 'Da trinh duyet' : 'Nhap', GhiChu: b.GhiChu?.trim() || null, NgayLap: new Date(), NhanVienDuyetID: null, NgayDuyet: null, LyDoTraLai: null };
      return tx.baoCaoQuyetToan.upsert({ where: { LichID: lichId }, create: { LichID: lichId, ...data }, update: data });
    });
  }

  /** Admin phê duyệt (khóa sổ) hoặc trả lại. */
  async decide(id: number, b: { TrangThaiDuyet?: string; LyDo?: string }, req: Req_) {
    const nvId = await this.employeeId(req);
    const target = b.TrangThaiDuyet === 'Yeu cau chinh sua' ? 'Yeu cau chinh sua' : 'Da phe duyet';
    return this.prisma.$transaction(async (tx) => {
      const s = await tx.baoCaoQuyetToan.findUnique({ where: { QuyetToanID: id } });
      if (!s) throw new NotFoundException('Không tìm thấy báo cáo quyết toán');
      if (s.TrangThaiDuyet !== 'Da trinh duyet') throw new BadRequestException('Chỉ phê duyệt / trả lại báo cáo đang ở trạng thái "Chờ duyệt"');
      if (target === 'Yeu cau chinh sua') {
        if (!b.LyDo?.trim()) throw new BadRequestException('Vui lòng nhập lý do trả lại');
        return tx.baoCaoQuyetToan.update({ where: { QuyetToanID: id }, data: { TrangThaiDuyet: target, LyDoTraLai: b.LyDo.trim(), NhanVienDuyetID: nvId, NgayDuyet: new Date() } });
      }
      // Chốt số liệu tại thời điểm phê duyệt để sổ sách phản ánh đúng dữ liệu mới nhất
      const c = await this.compute(s.LichID, tx);
      return tx.baoCaoQuyetToan.update({ where: { QuyetToanID: id }, data: { ...this.snapshot(c), TrangThaiDuyet: target, NhanVienDuyetID: nvId, NgayDuyet: new Date(), LyDoTraLai: null } });
    });
  }

  /* ---------------------------------------------------------------- Chi phí phát sinh */
  private async assertOpen(lichId: number) {
    const qt = await this.prisma.baoCaoQuyetToan.findUnique({ where: { LichID: lichId }, select: { TrangThaiDuyet: true } });
    if (qt?.TrangThaiDuyet === 'Da phe duyet') throw new BadRequestException('Chuyến này đã khóa sổ quyết toán — không thể thay đổi chi phí');
  }

  expenses(lichId?: number) {
    return this.prisma.chiPhiPhatSinh.findMany({
      where: lichId ? { LichID: lichId } : undefined,
      include: { NhanVien: { select: { HoTen: true } }, LichKhoiHanh: { select: { MaLich: true, Tour: { select: { TenTour: true } } } } },
      orderBy: { ChiPhiID: 'desc' }, take: 500,
    });
  }

  async addExpense(b: { LichID: number; LoaiChiPhi: string; NoiDung: string; SoTien: number; NgayChi?: string; SoChungTu?: string; GhiChu?: string }, req: Req_) {
    const lich = await this.prisma.lichKhoiHanh.findUnique({ where: { LichID: Number(b.LichID) } });
    if (!lich) throw new BadRequestException('Chuyến đi không tồn tại');
    if (lich.TrangThai === 'Huy') throw new BadRequestException('Chuyến đã hủy');
    await this.assertOpen(lich.LichID);
    if (!CHI_PHI_LOAI.includes(b.LoaiChiPhi)) throw new BadRequestException('Loại chi phí không hợp lệ');
    if (!b.NoiDung?.trim()) throw new BadRequestException('Vui lòng nhập nội dung chi phí');
    const amount = Number(b.SoTien);
    if (Number.isNaN(amount) || amount <= 0) throw new BadRequestException('Số tiền phải lớn hơn 0');
    const ngay = b.NgayChi ? new Date(b.NgayChi) : new Date();
    if (Number.isNaN(ngay.getTime())) throw new BadRequestException('Ngày chi không hợp lệ');
    const nvId = await this.employeeId(req);
    return this.prisma.chiPhiPhatSinh.create({ data: { LichID: lich.LichID, NhanVienID: nvId, LoaiChiPhi: b.LoaiChiPhi, NoiDung: b.NoiDung.trim(), SoTien: amount, NgayChi: ngay, SoChungTu: b.SoChungTu?.trim() || null, GhiChu: b.GhiChu?.trim() || null } });
  }

  async removeExpense(id: number) {
    const c = await this.prisma.chiPhiPhatSinh.findUnique({ where: { ChiPhiID: id } });
    if (!c) throw new NotFoundException('Không tìm thấy khoản chi');
    await this.assertOpen(c.LichID);
    await this.prisma.chiPhiPhatSinh.delete({ where: { ChiPhiID: id } });
    return { deleted: true };
  }

  expenseTypes() { return CHI_PHI_LOAI; }
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'Ke toan', 'Dieu hanh')
export class FinanceController {
  constructor(private s: FinanceService) {}

  @Get('settlements') list() { return this.s.list(); }
  @Get('settlements/preview/:lichId') preview(@Param('lichId', ParseIntPipe) id: number) { return this.s.compute(id); }
  @Get('settlements/:id') detail(@Param('id', ParseIntPipe) id: number) { return this.s.detail(id); }
  @Post('settlements') save(@Body() b: { LichID: number; trinhDuyet?: boolean; GhiChu?: string }, @Req() req: Req_) { return this.s.save(b, req); }
  @Patch('settlements/:id/approve') @Roles('Admin', 'Ke toan') decide(@Param('id', ParseIntPipe) id: number, @Body() b: { TrangThaiDuyet?: string; LyDo?: string }, @Req() req: Req_) { return this.s.decide(id, b, req); }

  @Get('finance/expense-types') @Roles('Ke toan', 'Dieu hanh') types() { return this.s.expenseTypes(); }
  @Get('finance/expenses') @Roles('Ke toan', 'Dieu hanh') expenses(@Query('lichId') l?: string) { return this.s.expenses(l ? Number(l) : undefined); }
  @Post('finance/expenses') @Roles('Ke toan', 'Dieu hanh') add(@Body() b: any, @Req() req: Req_) { return this.s.addExpense(b, req); }
  @Delete('finance/expenses/:id') @Roles('Ke toan', 'Dieu hanh') remove(@Param('id', ParseIntPipe) id: number) { return this.s.removeExpense(id); }
}

@Module({ controllers: [FinanceController], providers: [FinanceService], exports: [FinanceService] })
export class FinanceModule {}
