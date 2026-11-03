import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';

const n = (v: unknown) => Number(v ?? 0);
const LOAI_NCC = ['Khach san', 'Nha hang', 'Xe van chuyen', 'Cong ty bay', 'Khu du lich', 'Khac'];
/** Phiếu còn hiệu lực chi phí (không tính phiếu đã hủy / NCC từ chối). */
export const PHIEU_HIEU_LUC_NOT = ['Da huy', 'NCC tu choi'];
/** Luồng trạng thái phiếu đặt dịch vụ: Mới tạo → Đã gửi NCC → NCC xác nhận/từ chối. */
const TRANSITIONS: Record<string, string[]> = {
  'Moi tao': ['Da gui NCC', 'Da huy'],
  'Da gui NCC': ['NCC xac nhan', 'NCC tu choi', 'Da huy'],
  'NCC xac nhan': ['Da huy'],
  'NCC tu choi': ['Moi tao', 'Da huy'],
  'Da huy': [],
};

type Req_ = { user?: { sub?: number; employeeId?: number | null } };

/* =============================================================================
 * QUẢN LÝ NHÀ CUNG CẤP DỊCH VỤ ĐI KÈM (đề cương mục 6)
 *  - Hồ sơ NCC (loại, liên hệ, MST, đánh giá, trạng thái hợp tác) + bảng giá dịch vụ
 *  - Phiếu đặt dịch vụ cho từng chuyến: luồng trạng thái, cọc/thanh toán, công nợ, hạn thanh toán
 *  - Khóa sổ: chuyến đã quyết toán (Đã phê duyệt) không được thêm/sửa chi phí
 * ===========================================================================*/
@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  /** Chặn thay đổi chi phí khi quyết toán của chuyến đã được phê duyệt (khóa sổ kế toán). */
  async assertNotSettled(lichId: number) {
    const qt = await this.prisma.baoCaoQuyetToan.findUnique({ where: { LichID: lichId }, select: { TrangThaiDuyet: true } });
    if (qt?.TrangThaiDuyet === 'Da phe duyet') throw new BadRequestException('Chuyến này đã được phê duyệt quyết toán (khóa sổ) — không thể thay đổi chi phí');
  }

  /* ---------------------------------------------------------------- NCC */
  private parseSupplier(b: Record<string, unknown>, isCreate: boolean) {
    const d: Record<string, unknown> = {};
    const s = (k: string) => (b[k] === undefined ? undefined : b[k] === null || b[k] === '' ? null : String(b[k]).trim());
    if (b.TenNCC !== undefined || isCreate) {
      const v = s('TenNCC');
      if (!v || v.length < 2 || v.length > 200) throw new BadRequestException('Tên nhà cung cấp phải từ 2–200 ký tự');
      d.TenNCC = v;
    }
    if (b.LoaiNCC !== undefined || isCreate) {
      if (!LOAI_NCC.includes(String(b.LoaiNCC))) throw new BadRequestException('Loại NCC không hợp lệ');
      d.LoaiNCC = b.LoaiNCC;
    }
    if (b.SoDienThoai !== undefined || isCreate) {
      const v = s('SoDienThoai');
      if (!v || !/^0\d{9,10}$/.test(v)) throw new BadRequestException('Số điện thoại NCC phải gồm 10–11 số, bắt đầu bằng 0');
      d.SoDienThoai = v;
    }
    if (b.Email !== undefined) {
      const v = s('Email');
      if (v && !/^\S+@\S+\.\S+$/.test(v)) throw new BadRequestException('Email NCC không hợp lệ');
      d.Email = v;
    }
    if (b.MaSoThue !== undefined) {
      const v = s('MaSoThue');
      if (v && !/^\d{10}(-\d{3})?$/.test(v)) throw new BadRequestException('Mã số thuế phải gồm 10 số (hoặc 10 số-3 số chi nhánh)');
      d.MaSoThue = v;
    }
    if (b.NguoiLienHe !== undefined) d.NguoiLienHe = s('NguoiLienHe');
    if (b.DiaChi !== undefined) d.DiaChi = s('DiaChi');
    if (b.DanhGia !== undefined) {
      const v = b.DanhGia === '' || b.DanhGia === null ? null : Number(b.DanhGia);
      if (v !== null && (Number.isNaN(v) || v < 0 || v > 5)) throw new BadRequestException('Đánh giá phải từ 0 đến 5');
      d.DanhGia = v;
    }
    return d;
  }

  private async assertNoDuplicate(d: Record<string, unknown>, excludeId?: number) {
    const or: Record<string, unknown>[] = [];
    if (d.TenNCC) or.push({ TenNCC: { equals: d.TenNCC as string, mode: 'insensitive' } });
    if (d.SoDienThoai) or.push({ SoDienThoai: d.SoDienThoai });
    if (d.MaSoThue) or.push({ MaSoThue: d.MaSoThue });
    if (!or.length) return;
    const dup = await this.prisma.nhaCungCap.findFirst({ where: { OR: or as any, ...(excludeId && { NhaCungCapID: { not: excludeId } }) } });
    if (dup) throw new BadRequestException(`Trùng với nhà cung cấp đã có: "${dup.TenNCC}" (trùng tên / số điện thoại / mã số thuế)`);
  }

  async createSupplier(b: Record<string, unknown>) {
    const d = this.parseSupplier(b, true);
    await this.assertNoDuplicate(d);
    return this.prisma.nhaCungCap.create({ data: d as any });
  }

  async updateSupplier(id: number, b: Record<string, unknown>) {
    if (!(await this.prisma.nhaCungCap.findUnique({ where: { NhaCungCapID: id } }))) throw new NotFoundException('Không tìm thấy nhà cung cấp');
    const d = this.parseSupplier(b, false);
    await this.assertNoDuplicate(d, id);
    return this.prisma.nhaCungCap.update({ where: { NhaCungCapID: id }, data: d as any });
  }

  /** Ngừng / mở lại hợp tác. Không được ngừng khi còn phiếu đang hiệu lực của chuyến chưa hoàn thành. */
  async toggleSupplier(id: number) {
    const s = await this.prisma.nhaCungCap.findUnique({ where: { NhaCungCapID: id } });
    if (!s) throw new NotFoundException('Không tìm thấy nhà cung cấp');
    if (s.TrangThai === 1) {
      const open = await this.prisma.phieuDatDichVu.count({
        where: { NhaCungCapID: id, TrangThai: { in: ['Moi tao', 'Da gui NCC', 'NCC xac nhan'] }, LichKhoiHanh: { TrangThai: { in: ['Cho khoi hanh', 'Dang di'] } } },
      });
      if (open > 0) throw new BadRequestException(`Còn ${open} phiếu đặt dịch vụ đang hiệu lực cho chuyến chưa hoàn thành — hãy hủy/hoàn tất trước khi ngừng hợp tác`);
    }
    return this.prisma.nhaCungCap.update({ where: { NhaCungCapID: id }, data: { TrangThai: s.TrangThai === 1 ? 0 : 1 } });
  }

  async removeSupplier(id: number) {
    const used = await this.prisma.phieuDatDichVu.count({ where: { NhaCungCapID: id } });
    if (used > 0) throw new BadRequestException(`NCC đã có ${used} phiếu đặt dịch vụ — không thể xóa, chỉ có thể ngừng hợp tác (giữ lịch sử chi phí)`);
    return this.prisma.nhaCungCap.delete({ where: { NhaCungCapID: id } });
  }

  /** Danh sách NCC kèm thống kê chi phí / công nợ. */
  async listSuppliers(q: { loai?: string; search?: string; trangThai?: string }) {
    const rows = await this.prisma.nhaCungCap.findMany({
      where: {
        ...(q.loai && { LoaiNCC: q.loai }),
        ...(q.trangThai !== undefined && q.trangThai !== '' && { TrangThai: Number(q.trangThai) }),
        ...(q.search && { OR: [{ TenNCC: { contains: q.search, mode: 'insensitive' } }, { SoDienThoai: { contains: q.search } }, { MaSoThue: { contains: q.search } }] }),
      },
      include: { DichVu: { orderBy: { DichVuNCCID: 'asc' } } },
      orderBy: [{ TrangThai: 'desc' }, { NhaCungCapID: 'desc' }],
    });
    const agg = await this.prisma.phieuDatDichVu.groupBy({
      by: ['NhaCungCapID'], where: { TrangThai: { notIn: PHIEU_HIEU_LUC_NOT } },
      _sum: { TongTienDichVu: true, TienDaCoc: true }, _count: { _all: true },
    });
    const map = new Map(agg.map((a) => [a.NhaCungCapID, a]));
    return rows.map((s) => {
      const a = map.get(s.NhaCungCapID);
      const tong = n(a?._sum.TongTienDichVu), da = n(a?._sum.TienDaCoc);
      return { ...s, thongKe: { soPhieu: a?._count._all ?? 0, tongChiPhi: tong, daThanhToan: da, congNo: Math.max(tong - da, 0) } };
    });
  }

  async supplierDetail(id: number) {
    const s = await this.prisma.nhaCungCap.findUnique({
      where: { NhaCungCapID: id },
      include: { DichVu: true, PhieuDatDichVu: { orderBy: { PhieuDatID: 'desc' }, include: { LichKhoiHanh: { include: { Tour: { select: { TenTour: true } } } } }, take: 50 } },
    });
    if (!s) throw new NotFoundException('Không tìm thấy nhà cung cấp');
    return s;
  }

  /* ---------------------------------------------------------------- Dịch vụ của NCC (bảng giá) */
  private parseService(b: Record<string, unknown>, isCreate: boolean) {
    const d: Record<string, unknown> = {};
    if (b.TenDichVu !== undefined || isCreate) {
      const v = String(b.TenDichVu ?? '').trim();
      if (!v) throw new BadRequestException('Thiếu tên dịch vụ');
      d.TenDichVu = v;
    }
    if (b.DonViTinh !== undefined || isCreate) {
      const v = String(b.DonViTinh ?? '').trim();
      if (!v) throw new BadRequestException('Thiếu đơn vị tính');
      d.DonViTinh = v;
    }
    if (b.DonGia !== undefined || isCreate) {
      const g = Number(b.DonGia);
      if (Number.isNaN(g) || g <= 0) throw new BadRequestException('Đơn giá phải lớn hơn 0');
      d.DonGia = g;
    }
    if (b.LoaiDichVu !== undefined) d.LoaiDichVu = b.LoaiDichVu ? String(b.LoaiDichVu).trim() : null;
    if (b.MoTa !== undefined) d.MoTa = b.MoTa ? String(b.MoTa).trim() : null;
    return d;
  }

  async addService(nccId: number, b: Record<string, unknown>) {
    if (!(await this.prisma.nhaCungCap.findUnique({ where: { NhaCungCapID: nccId } }))) throw new NotFoundException('Không tìm thấy nhà cung cấp');
    const d = this.parseService(b, true);
    const dup = await this.prisma.dichVuNhaCungCap.findFirst({ where: { NhaCungCapID: nccId, TenDichVu: { equals: d.TenDichVu as string, mode: 'insensitive' } } });
    if (dup) throw new BadRequestException(`Dịch vụ "${dup.TenDichVu}" đã có trong bảng giá của NCC này`);
    return this.prisma.dichVuNhaCungCap.create({ data: { ...(d as any), NhaCungCapID: nccId } });
  }

  async updateService(nccId: number, dvId: number, b: Record<string, unknown>) {
    const dv = await this.prisma.dichVuNhaCungCap.findFirst({ where: { DichVuNCCID: dvId, NhaCungCapID: nccId } });
    if (!dv) throw new NotFoundException('Không tìm thấy dịch vụ');
    const d = this.parseService(b, false);
    if (b.TrangThai !== undefined) d.TrangThai = Number(b.TrangThai) ? 1 : 0;
    // Đổi đơn giá chỉ áp dụng cho phiếu tạo sau — phiếu cũ đã lưu đơn giá tại thời điểm đặt.
    return this.prisma.dichVuNhaCungCap.update({ where: { DichVuNCCID: dvId }, data: d as any });
  }

  async removeService(nccId: number, dvId: number) {
    const dv = await this.prisma.dichVuNhaCungCap.findFirst({ where: { DichVuNCCID: dvId, NhaCungCapID: nccId } });
    if (!dv) throw new NotFoundException('Không tìm thấy dịch vụ');
    const used = await this.prisma.chiTietDatDichVu.count({ where: { DichVuNCCID: dvId } });
    if (used > 0) {
      await this.prisma.dichVuNhaCungCap.update({ where: { DichVuNCCID: dvId }, data: { TrangThai: 0 } });
      return { deactivated: true, message: 'Dịch vụ đã được dùng trong phiếu đặt nên chỉ được ngừng áp dụng, không xóa' };
    }
    await this.prisma.dichVuNhaCungCap.delete({ where: { DichVuNCCID: dvId } });
    return { deleted: true, message: 'Đã xóa dịch vụ' };
  }

  /* ---------------------------------------------------------------- Phiếu đặt dịch vụ */
  listOrders(q: { lichId?: string; nccId?: string; trangThai?: string }) {
    return this.prisma.phieuDatDichVu.findMany({
      where: { ...(q.lichId && { LichID: Number(q.lichId) }), ...(q.nccId && { NhaCungCapID: Number(q.nccId) }), ...(q.trangThai && { TrangThai: q.trangThai }) },
      include: { NhaCungCap: true, NhanVien: { select: { HoTen: true } }, LichKhoiHanh: { include: { Tour: { select: { TenTour: true, MaTour: true } } } }, ChiTiet: { include: { DichVu: true } } },
      orderBy: { PhieuDatID: 'desc' },
    });
  }

  private async employeeId(req: Req_, fallback?: unknown) {
    if (req.user?.employeeId) return req.user.employeeId;
    if (fallback && !Number.isNaN(Number(fallback))) return Number(fallback);
    const nv = req.user?.sub ? await this.prisma.nhanVien.findUnique({ where: { TaiKhoanID: req.user.sub } }) : null;
    if (!nv) throw new BadRequestException('Tài khoản chưa có hồ sơ nhân viên');
    return nv.NhanVienID;
  }

  async createOrder(
    b: { LichID: number; NhaCungCapID: number; NhanVienID?: number; TienDaCoc?: number; GhiChu?: string; HanThanhToan?: string; SoHoaDonNCC?: string; items: { DichVuNCCID: number; SoLuong: number; NgaySuDung?: string }[] },
    req: Req_,
  ) {
    if (!b.LichID || !b.NhaCungCapID) throw new BadRequestException('Thiếu chuyến đi hoặc nhà cung cấp');
    if (!Array.isArray(b.items) || b.items.length === 0) throw new BadRequestException('Phiếu đặt phải có ít nhất 1 dịch vụ');
    const nvId = await this.employeeId(req, b.NhanVienID);
    const lich = await this.prisma.lichKhoiHanh.findUnique({ where: { LichID: Number(b.LichID) } });
    if (!lich) throw new BadRequestException('Chuyến đi không tồn tại');
    if (!['Cho khoi hanh', 'Dang di'].includes(lich.TrangThai)) throw new BadRequestException('Chỉ lập phiếu đặt dịch vụ cho chuyến đang chờ khởi hành / đang diễn ra');
    await this.assertNotSettled(lich.LichID);

    const ncc = await this.prisma.nhaCungCap.findUnique({ where: { NhaCungCapID: Number(b.NhaCungCapID) } });
    if (!ncc) throw new BadRequestException('Nhà cung cấp không tồn tại');
    if (ncc.TrangThai !== 1) throw new BadRequestException('Nhà cung cấp đã ngừng hợp tác — không thể lập phiếu mới');

    const services = await this.prisma.dichVuNhaCungCap.findMany({ where: { NhaCungCapID: ncc.NhaCungCapID, DichVuNCCID: { in: b.items.map((i) => Number(i.DichVuNCCID)) } } });
    const from = new Date(lich.NgayKhoiHanh.getFullYear(), lich.NgayKhoiHanh.getMonth(), lich.NgayKhoiHanh.getDate());
    const to = new Date(lich.NgayKetThuc.getFullYear(), lich.NgayKetThuc.getMonth(), lich.NgayKetThuc.getDate(), 23, 59, 59);
    const merged = new Map<string, { dv: (typeof services)[number]; sl: number; ngay: Date }>();
    for (const i of b.items) {
      const dv = services.find((s) => s.DichVuNCCID === Number(i.DichVuNCCID));
      if (!dv) throw new BadRequestException('Có dịch vụ không thuộc nhà cung cấp đã chọn');
      if (dv.TrangThai !== 1) throw new BadRequestException(`Dịch vụ "${dv.TenDichVu}" đã ngừng áp dụng`);
      const sl = Number(i.SoLuong);
      if (!Number.isInteger(sl) || sl <= 0 || sl > 10000) throw new BadRequestException(`Số lượng dịch vụ "${dv.TenDichVu}" không hợp lệ`);
      const ngay = new Date(i.NgaySuDung || lich.NgayKhoiHanh);
      if (Number.isNaN(ngay.getTime()) || ngay < from || ngay > to) throw new BadRequestException(`Ngày sử dụng dịch vụ "${dv.TenDichVu}" phải nằm trong thời gian chuyến đi (${from.toLocaleDateString('vi-VN')} – ${to.toLocaleDateString('vi-VN')})`);
      const key = `${dv.DichVuNCCID}|${ngay.toISOString().slice(0, 10)}`;
      const cur = merged.get(key);
      if (cur) cur.sl += sl; else merged.set(key, { dv, sl, ngay });
    }
    const rows = [...merged.values()].map(({ dv, sl, ngay }) => ({ DichVuNCCID: dv.DichVuNCCID, SoLuong: sl, DonGia: n(dv.DonGia), ThanhTien: sl * n(dv.DonGia), NgaySuDung: ngay }));
    const tong = rows.reduce((s, r) => s + r.ThanhTien, 0);
    const coc = n(b.TienDaCoc);
    if (coc < 0 || coc > tong) throw new BadRequestException('Tiền cọc phải trong khoảng 0 – tổng tiền dịch vụ');
    const han = b.HanThanhToan ? new Date(b.HanThanhToan) : null;
    if (han && Number.isNaN(han.getTime())) throw new BadRequestException('Hạn thanh toán không hợp lệ');

    const count = await this.prisma.phieuDatDichVu.count();
    return this.prisma.phieuDatDichVu.create({
      data: {
        LichID: lich.LichID, NhanVienID: nvId, NhaCungCapID: ncc.NhaCungCapID,
        MaPhieu: `PDV-${String(count + 1).padStart(4, '0')}-${Date.now().toString().slice(-4)}`,
        TongTienDichVu: tong, TienDaCoc: coc, GhiChu: b.GhiChu || null, HanThanhToan: han, SoHoaDonNCC: b.SoHoaDonNCC?.trim() || null,
        ChiTiet: { create: rows },
      },
      include: { ChiTiet: true },
    });
  }

  private async getOrder(id: number) {
    const p = await this.prisma.phieuDatDichVu.findUnique({ where: { PhieuDatID: id } });
    if (!p) throw new NotFoundException('Không tìm thấy phiếu đặt dịch vụ');
    return p;
  }

  async updateOrder(id: number, b: { HanThanhToan?: string | null; SoHoaDonNCC?: string | null; GhiChu?: string | null }) {
    const p = await this.getOrder(id);
    if (p.TrangThai === 'Da huy') throw new BadRequestException('Phiếu đã hủy, không thể chỉnh sửa');
    await this.assertNotSettled(p.LichID);
    const han = b.HanThanhToan === undefined ? undefined : b.HanThanhToan ? new Date(b.HanThanhToan) : null;
    if (han && Number.isNaN(han.getTime())) throw new BadRequestException('Hạn thanh toán không hợp lệ');
    return this.prisma.phieuDatDichVu.update({
      where: { PhieuDatID: id },
      data: { ...(han !== undefined && { HanThanhToan: han }), ...(b.SoHoaDonNCC !== undefined && { SoHoaDonNCC: b.SoHoaDonNCC?.trim() || null }), ...(b.GhiChu !== undefined && { GhiChu: b.GhiChu || null }) },
    });
  }

  async updateOrderStatus(id: number, trangThai: string) {
    const p = await this.getOrder(id);
    if (!(trangThai in TRANSITIONS)) throw new BadRequestException('Trạng thái không hợp lệ');
    if (!TRANSITIONS[p.TrangThai]?.includes(trangThai)) throw new BadRequestException(`Không thể chuyển phiếu từ "${p.TrangThai}" sang "${trangThai}"`);
    await this.assertNotSettled(p.LichID);
    if (trangThai === 'Da huy' && n(p.TienDaCoc) > 0) throw new BadRequestException('Phiếu đã trả tiền/cọc cho NCC — cần thỏa thuận hoàn cọc với NCC và ghi chú trước khi hủy');
    return this.prisma.phieuDatDichVu.update({ where: { PhieuDatID: id }, data: { TrangThai: trangThai } });
  }

  /** Kế toán ghi nhận thanh toán thêm cho NCC (giảm công nợ phải trả). */
  async payOrder(id: number, soTien: number) {
    const p = await this.getOrder(id);
    const amount = Number(soTien);
    if (Number.isNaN(amount) || amount <= 0) throw new BadRequestException('Số tiền thanh toán phải lớn hơn 0');
    if (!['Da gui NCC', 'NCC xac nhan'].includes(p.TrangThai)) throw new BadRequestException('Chỉ thanh toán cho phiếu đã gửi NCC / NCC đã xác nhận');
    await this.assertNotSettled(p.LichID);
    const conNo = n(p.TongTienDichVu) - n(p.TienDaCoc);
    if (amount > conNo) throw new BadRequestException(`Số tiền vượt công nợ còn lại (${conNo.toLocaleString('vi-VN')} đ)`);
    return this.prisma.phieuDatDichVu.update({ where: { PhieuDatID: id }, data: { TienDaCoc: { increment: amount } } });
  }

  /** Công nợ phải trả NCC, sắp theo hạn thanh toán; đánh dấu quá hạn. */
  async debts() {
    const rows = await this.prisma.phieuDatDichVu.findMany({
      where: { TrangThai: { in: ['Da gui NCC', 'NCC xac nhan'] } },
      include: { NhaCungCap: { select: { NhaCungCapID: true, TenNCC: true, SoDienThoai: true } }, LichKhoiHanh: { select: { MaLich: true, Tour: { select: { TenTour: true } } } } },
      orderBy: [{ HanThanhToan: 'asc' }, { PhieuDatID: 'asc' }],
    });
    const today = new Date(new Date().toDateString());
    const list = rows
      .map((p) => ({ ...p, conNo: n(p.TongTienDichVu) - n(p.TienDaCoc), quaHan: !!p.HanThanhToan && p.HanThanhToan < today }))
      .filter((p) => p.conNo > 0);
    return { tongCongNo: list.reduce((s, p) => s + p.conNo, 0), quaHan: list.filter((p) => p.quaHan).reduce((s, p) => s + p.conNo, 0), data: list };
  }
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Dieu hanh', 'Ke toan')
export class SuppliersController {
  constructor(private s: SuppliersService) {}

  @Get('suppliers') list(@Query() q: Record<string, string>) { return this.s.listSuppliers(q); }
  @Get('suppliers/debts') debts() { return this.s.debts(); }
  @Get('suppliers/:id') detail(@Param('id', ParseIntPipe) id: number) { return this.s.supplierDetail(id); }
  @Post('suppliers/create') create(@Body() b: Record<string, unknown>) { return this.s.createSupplier(b); }
  @Post('suppliers') create2(@Body() b: Record<string, unknown>) { return this.s.createSupplier(b); }
  @Patch('suppliers/:id') update(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.s.updateSupplier(id, b); }
  @Patch('suppliers/:id/toggle') toggle(@Param('id', ParseIntPipe) id: number) { return this.s.toggleSupplier(id); }
  @Delete('suppliers/:id') remove(@Param('id', ParseIntPipe) id: number) { return this.s.removeSupplier(id); }

  @Post('suppliers/:id/services') addService(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.s.addService(id, b); }
  @Patch('suppliers/:id/services/:dvId') updateService(@Param('id', ParseIntPipe) id: number, @Param('dvId', ParseIntPipe) dvId: number, @Body() b: Record<string, unknown>) { return this.s.updateService(id, dvId, b); }
  @Delete('suppliers/:id/services/:dvId') removeService(@Param('id', ParseIntPipe) id: number, @Param('dvId', ParseIntPipe) dvId: number) { return this.s.removeService(id, dvId); }

  @Get('service-orders/list') orders(@Query() q: Record<string, string>) { return this.s.listOrders(q); }
  @Post('service-orders') createOrder(@Body() b: any, @Req() req: Req_) { return this.s.createOrder(b, req); }
  @Patch('service-orders/:id') updateOrder(@Param('id', ParseIntPipe) id: number, @Body() b: any) { return this.s.updateOrder(id, b); }
  @Patch('service-orders/:id/status') status(@Param('id', ParseIntPipe) id: number, @Body('TrangThai') t: string) { return this.s.updateOrderStatus(id, t); }
  @Patch('service-orders/:id/pay') @Roles('Ke toan') pay(@Param('id', ParseIntPipe) id: number, @Body('SoTien') amount: number) { return this.s.payOrder(id, amount); }
}

@Module({ controllers: [SuppliersController], providers: [SuppliersService], exports: [SuppliersService] })
export class SuppliersModule {}
