import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseIntPipe, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { NotificationsService } from './notifications.module.js';
import { applyPercent, endOfDay, promoState } from '../common/promotion.js';

type Req_ = { user?: { sub?: number; employeeId?: number | null } };

const fmt = (d: Date) => d.toLocaleString('vi-VN');

/* =============================================================================
 * 1A. KHUYẾN MÃI TOUR (đề cương mục 6): Admin / Điều hành tạo & gán khuyến mãi giảm x% cho tour
 *     trong một khoảng thời gian. Hết thời gian -> khuyến mãi tự mất hiệu lực (xem common/promotion.ts).
 * ===========================================================================*/
@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService, private notify: NotificationsService) {}

  async list() {
    const rows = await this.prisma.chuongTrinhKhuyenMai.findMany({
      include: {
        NhanVienTao: { select: { HoTen: true } },
        ApDung: { include: { Tour: { select: { TourID: true, MaTour: true, TenTour: true, GiaNguoiLon: true } } } },
        _count: { select: { DonDatTour: true } },
      },
      orderBy: { CTKMID: 'desc' },
    });
    const now = new Date();
    return rows.map((km) => ({ ...km, TrangThaiHienThi: promoState(km, now) }));
  }

  private async employeeId(req: Req_) {
    if (req.user?.employeeId) return req.user.employeeId;
    const nv = req.user?.sub ? await this.prisma.nhanVien.findUnique({ where: { TaiKhoanID: req.user.sub } }) : null;
    if (!nv) throw new BadRequestException('Tài khoản đăng nhập chưa có hồ sơ nhân viên nên không thể tạo khuyến mãi');
    return nv.NhanVienID;
  }

  private parse(b: Record<string, unknown>, cur?: { NgayBatDau: Date; NgayKetThuc: Date }) {
    const data: { TenChuongTrinh?: string; MoTa?: string | null; PhanTramGiam?: number; NgayBatDau?: Date; NgayKetThuc?: Date; TrangThai?: number } = {};
    if (b.TenChuongTrinh !== undefined) {
      data.TenChuongTrinh = String(b.TenChuongTrinh).trim();
      if (data.TenChuongTrinh.length < 3 || data.TenChuongTrinh.length > 200) throw new BadRequestException('Tên chương trình khuyến mãi phải từ 3–200 ký tự');
    }
    if (b.MoTa !== undefined) data.MoTa = b.MoTa ? String(b.MoTa).trim() : null;
    if (b.PhanTramGiam !== undefined) {
      const pct = Number(b.PhanTramGiam);
      if (Number.isNaN(pct) || pct <= 0 || pct > 100) throw new BadRequestException('Phần trăm giảm phải trong khoảng (0, 100]');
      data.PhanTramGiam = pct;
    }
    if (b.NgayBatDau !== undefined) data.NgayBatDau = new Date(String(b.NgayBatDau));
    if (b.NgayKetThuc !== undefined) data.NgayKetThuc = new Date(String(b.NgayKetThuc));
    if (b.TrangThai !== undefined) data.TrangThai = Number(b.TrangThai) ? 1 : 0;
    const start = data.NgayBatDau ?? cur?.NgayBatDau;
    const end = data.NgayKetThuc ?? cur?.NgayKetThuc;
    if (start && Number.isNaN(start.getTime())) throw new BadRequestException('Thời gian bắt đầu không hợp lệ');
    if (end && Number.isNaN(end.getTime())) throw new BadRequestException('Thời gian kết thúc không hợp lệ');
    if (start && end && end <= start) throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    return { data, start, end };
  }

  /** Một tour không được có 2 khuyến mãi (đang bật) trùng thời gian -> tránh nhầm lẫn "giảm chồng giảm". */
  private async assertNoOverlap(tourIds: number[], start: Date, end: Date, excludeId?: number) {
    if (!tourIds.length) return;
    const clash = await this.prisma.chuongTrinhKhuyenMai.findMany({
      where: { TrangThai: 1, ...(excludeId && { CTKMID: { not: excludeId } }), NgayBatDau: { lt: end }, NgayKetThuc: { gt: start }, ApDung: { some: { TourID: { in: tourIds } } } },
      include: { ApDung: { where: { TourID: { in: tourIds } }, include: { Tour: { select: { TenTour: true } } } } },
    });
    if (clash.length) {
      const c = clash[0];
      throw new BadRequestException(`Tour "${c.ApDung[0].Tour.TenTour}" đã thuộc khuyến mãi "${c.TenChuongTrinh}" (${fmt(c.NgayBatDau)} → ${fmt(c.NgayKetThuc)}) trùng thời gian. Hãy đổi thời gian hoặc tạm dừng chương trình kia.`);
    }
  }

  private async cleanTourIds(raw: unknown) {
    const ids = Array.from(new Set((Array.isArray(raw) ? raw : []).map(Number).filter((n) => Number.isInteger(n) && n > 0)));
    if (!ids.length) throw new BadRequestException('Vui lòng chọn ít nhất 1 tour áp dụng khuyến mãi');
    const tours = await this.prisma.tour.findMany({ where: { TourID: { in: ids } }, select: { TourID: true, TenTour: true, TrangThaiDuyet: true } });
    if (tours.length !== ids.length) throw new BadRequestException('Có tour không tồn tại');
    const bad = tours.find((t) => ['Nhap', 'Huy'].includes(t.TrangThaiDuyet));
    if (bad) throw new BadRequestException(`Tour "${bad.TenTour}" đang ở trạng thái Nháp/Hủy, không thể gán khuyến mãi`);
    return ids;
  }

  async create(b: Record<string, unknown>, req: Req_) {
    for (const k of ['TenChuongTrinh', 'PhanTramGiam', 'NgayBatDau', 'NgayKetThuc']) if (b[k] === undefined || b[k] === '') throw new BadRequestException(`Thiếu trường bắt buộc: ${k}`);
    const { data, start, end } = this.parse(b);
    if (end! <= new Date()) throw new BadRequestException('Thời gian kết thúc phải ở tương lai');
    const tourIds = await this.cleanTourIds(b.tourIds);
    await this.assertNoOverlap(tourIds, start!, end!);
    const nvId = await this.employeeId(req);
    const km = await this.prisma.chuongTrinhKhuyenMai.create({
      data: {
        TenChuongTrinh: data.TenChuongTrinh!, MoTa: data.MoTa ?? null, PhanTramGiam: data.PhanTramGiam!, NgayBatDau: start!, NgayKetThuc: end!,
        TrangThai: data.TrangThai ?? 1, NhanVienTaoID: nvId, ApDung: { create: tourIds.map((TourID) => ({ TourID })) },
      },
    });
    // Luồng email thực tế: khi Admin tạo khuyến mãi mới (mặc định guiThongBao = true) -> tự động gửi email báo cho toàn bộ người đăng ký nhận tin
    if (b.guiThongBao !== false && km.TrangThai === 1) {
      void this.notify.broadcastPromotion(km.CTKMID).catch(() => undefined);
    }
    return km;
  }

  async update(id: number, b: Record<string, unknown>) {
    const cur = await this.prisma.chuongTrinhKhuyenMai.findUnique({ where: { CTKMID: id }, include: { ApDung: true } });
    if (!cur) throw new NotFoundException('Không tìm thấy khuyến mãi');
    const { data, start, end } = this.parse(b, cur);
    const tourIds = b.tourIds !== undefined ? await this.cleanTourIds(b.tourIds) : cur.ApDung.map((a) => a.TourID);
    if ((data.TrangThai ?? cur.TrangThai) === 1) await this.assertNoOverlap(tourIds, start!, end!, id);
    const updated = await this.prisma.$transaction(async (tx) => {
      if (b.tourIds !== undefined) {
        await tx.apDungChuongTrinhKM.deleteMany({ where: { CTKMID: id } });
        await tx.apDungChuongTrinhKM.createMany({ data: tourIds.map((TourID) => ({ CTKMID: id, TourID })) });
      }
      return tx.chuongTrinhKhuyenMai.update({ where: { CTKMID: id }, data: { ...data, NgayCapNhat: new Date() } });
    });
    if (b.guiThongBao === true && updated.TrangThai === 1) {
      void this.notify.broadcastPromotion(id, 'PROMO_NEW', true).catch(() => undefined);
    }
    return updated;
  }

  async toggle(id: number) {
    const km = await this.prisma.chuongTrinhKhuyenMai.findUnique({ where: { CTKMID: id }, include: { ApDung: true } });
    if (!km) throw new NotFoundException('Không tìm thấy khuyến mãi');
    if (!km.TrangThai) await this.assertNoOverlap(km.ApDung.map((a) => a.TourID), km.NgayBatDau, km.NgayKetThuc, id);
    return this.prisma.chuongTrinhKhuyenMai.update({ where: { CTKMID: id }, data: { TrangThai: km.TrangThai ? 0 : 1, NgayCapNhat: new Date() } });
  }

  async remove(id: number) {
    const used = await this.prisma.donDatTour.count({ where: { CTKMID: id } });
    if (used > 0) throw new BadRequestException(`Khuyến mãi đã áp dụng cho ${used} đơn hàng — chỉ có thể tạm dừng, không thể xóa (giữ lịch sử doanh thu)`);
    return this.prisma.chuongTrinhKhuyenMai.delete({ where: { CTKMID: id } });
  }

  /** Công khai: danh sách khuyến mãi đang diễn ra (banner trang chủ). Hết hạn là tự biến mất khỏi danh sách. */
  async publicActive() {
    const now = new Date();
    const rows = await this.prisma.chuongTrinhKhuyenMai.findMany({
      where: { TrangThai: 1, NgayBatDau: { lte: now }, NgayKetThuc: { gte: now } },
      include: { ApDung: { include: { Tour: { select: { TourID: true, TenTour: true, GiaNguoiLon: true, HinhAnhURL: true } } } } },
      orderBy: { NgayKetThuc: 'asc' },
    });
    return rows.map((km) => ({
      CTKMID: km.CTKMID, TenChuongTrinh: km.TenChuongTrinh, MoTa: km.MoTa, PhanTramGiam: Number(km.PhanTramGiam), NgayKetThuc: km.NgayKetThuc,
      Tours: km.ApDung.map((a) => ({ ...a.Tour, GiaNguoiLonKM: applyPercent(Number(a.Tour.GiaNguoiLon), Number(km.PhanTramGiam)) })),
    }));
  }
}

@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Dieu hanh')
export class PromotionsController {
  constructor(private s: PromotionsService) {}
  @Get() list() { return this.s.list(); }
  @Post() create(@Body() b: Record<string, unknown>, @Req() req: Req_) { return this.s.create(b, req); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.s.update(id, b); }
  @Patch(':id/toggle') toggle(@Param('id', ParseIntPipe) id: number) { return this.s.toggle(id); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.s.remove(id); }
}

/* =============================================================================
 * 1B. MÃ GIẢM GIÁ (VOUCHER): khách nhập mã khi đặt tour (trước đây đặt nhầm tên "Khuyến mãi")
 * ===========================================================================*/
@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService, private notify: NotificationsService) {}

  async list() {
    const rows = await this.prisma.voucher.findMany({
      include: { ApDungVoucher: { include: { Tour: { select: { TourID: true, TenTour: true, MaTour: true } } } } },
      orderBy: { VoucherID: 'desc' },
    });
    const used = await this.prisma.donDatTour.groupBy({ by: ['VoucherID'], where: { VoucherID: { not: null }, TrangThaiDon: { not: 'Da huy' } }, _count: { _all: true } });
    const usedMap = new Map(used.map((u) => [u.VoucherID, u._count._all]));
    const now = new Date();
    return rows.map((v) => {
      const soDaDung = usedMap.get(v.VoucherID) ?? 0;
      const state = v.TrangThai !== 1 ? 'Tam dung' : now < v.NgayBatDau ? 'Sap dien ra' : now > endOfDay(v.NgayKetThuc) ? 'Het han' : v.SoLuongToiDa !== null && soDaDung >= v.SoLuongToiDa ? 'Het luot' : 'Dang dien ra';
      return { ...v, soDaDung, TrangThaiHienThi: state };
    });
  }

  async publicActive() {
    const all = await this.list();
    return all.filter((v) => v.TrangThaiHienThi === 'Dang dien ra');
  }

  private parse(b: Record<string, unknown>, isCreate: boolean) {
    const data: Record<string, unknown> = {};
    if (b.MaVoucher !== undefined) data.MaVoucher = String(b.MaVoucher).trim().toUpperCase().replace(/\s+/g, '');
    if (b.TenChuongTrinh !== undefined) data.TenChuongTrinh = String(b.TenChuongTrinh).trim();
    for (const k of ['PhanTramGiam', 'GiamToiDa', 'GiaTriDonToiThieu']) if (b[k] !== undefined && b[k] !== '') data[k] = Number(b[k]);
    for (const k of ['NgayBatDau', 'NgayKetThuc']) if (b[k]) data[k] = new Date(String(b[k]));
    if (b.SoLuongToiDa !== undefined) data.SoLuongToiDa = b.SoLuongToiDa === null || b.SoLuongToiDa === '' ? null : Number(b.SoLuongToiDa);
    if (b.TrangThai !== undefined) data.TrangThai = Number(b.TrangThai) ? 1 : 0;

    if (isCreate) {
      for (const k of ['MaVoucher', 'TenChuongTrinh', 'PhanTramGiam', 'GiamToiDa', 'NgayBatDau', 'NgayKetThuc']) {
        if (data[k] === undefined || data[k] === '') throw new BadRequestException(`Thiếu trường bắt buộc: ${k}`);
      }
    }
    if (data.MaVoucher !== undefined && !/^[A-Z0-9_-]{3,50}$/.test(data.MaVoucher as string)) throw new BadRequestException('Mã voucher chỉ gồm chữ in hoa, số, "-" hoặc "_" (3–50 ký tự)');
    const pct = data.PhanTramGiam as number | undefined;
    if (pct !== undefined && (Number.isNaN(pct) || pct <= 0 || pct > 100)) throw new BadRequestException('Phần trăm giảm phải trong khoảng (0, 100]');
    const max = data.GiamToiDa as number | undefined;
    if (max !== undefined && (Number.isNaN(max) || max <= 0)) throw new BadRequestException('Mức giảm tối đa phải lớn hơn 0');
    const min = data.GiaTriDonToiThieu as number | undefined;
    if (min !== undefined && (Number.isNaN(min) || min < 0)) throw new BadRequestException('Giá trị đơn tối thiểu không hợp lệ');
    const qty = data.SoLuongToiDa as number | null | undefined;
    if (qty !== undefined && qty !== null && (!Number.isInteger(qty) || qty <= 0)) throw new BadRequestException('Số lượt dùng tối đa phải là số nguyên dương (để trống = không giới hạn)');
    return data;
  }

  private checkDates(start: Date, end: Date) {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new BadRequestException('Ngày không hợp lệ');
    if (end < start) throw new BadRequestException('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
  }

  async create(body: Record<string, unknown>) {
    const data = this.parse(body, true);
    this.checkDates(data.NgayBatDau as Date, data.NgayKetThuc as Date);
    if (await this.prisma.voucher.findUnique({ where: { MaVoucher: data.MaVoucher as string } })) throw new BadRequestException(`Mã ${data.MaVoucher} đã tồn tại`);
    const tourIds = Array.isArray(body.tourIds) ? (body.tourIds as unknown[]).map(Number).filter(Boolean) : [];
    const created = await this.prisma.voucher.create({
      data: { ...(data as any), ApDungVoucher: tourIds.length ? { create: tourIds.map((TourID) => ({ TourID })) } : undefined },
    });
    if (body.guiThongBao !== false && created.TrangThai === 1) {
      void this.notify.broadcastVoucher(created.VoucherID).catch(() => undefined);
    }
    return created;
  }

  async update(id: number, body: Record<string, unknown>) {
    const cur = await this.prisma.voucher.findUnique({ where: { VoucherID: id } });
    if (!cur) throw new NotFoundException('Không tìm thấy mã giảm giá');
    const data = this.parse(body, false);
    this.checkDates((data.NgayBatDau as Date) ?? cur.NgayBatDau, (data.NgayKetThuc as Date) ?? cur.NgayKetThuc);
    if (data.MaVoucher && data.MaVoucher !== cur.MaVoucher) {
      const used = await this.prisma.donDatTour.count({ where: { VoucherID: id } });
      if (used > 0) throw new BadRequestException('Mã đã được sử dụng trong đơn hàng, không thể đổi mã');
      if (await this.prisma.voucher.findUnique({ where: { MaVoucher: data.MaVoucher as string } })) throw new BadRequestException(`Mã ${data.MaVoucher} đã tồn tại`);
    }
    return this.prisma.$transaction(async (tx) => {
      if (Array.isArray(body.tourIds)) {
        const ids = (body.tourIds as unknown[]).map(Number).filter(Boolean);
        await tx.apDungVoucher.deleteMany({ where: { VoucherID: id } });
        if (ids.length) await tx.apDungVoucher.createMany({ data: ids.map((TourID) => ({ TourID, VoucherID: id })) });
      }
      return tx.voucher.update({ where: { VoucherID: id }, data: data as any });
    });
  }

  async toggle(id: number) {
    const v = await this.prisma.voucher.findUnique({ where: { VoucherID: id } });
    if (!v) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return this.prisma.voucher.update({ where: { VoucherID: id }, data: { TrangThai: v.TrangThai ? 0 : 1 } });
  }

  async remove(id: number) {
    const used = await this.prisma.donDatTour.count({ where: { VoucherID: id } });
    if (used > 0) throw new BadRequestException(`Mã đã được dùng trong ${used} đơn hàng — chỉ có thể tạm dừng, không thể xóa`);
    return this.prisma.voucher.delete({ where: { VoucherID: id } });
  }
}

@Controller('vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Dieu hanh')
export class VouchersController {
  constructor(private s: VouchersService) {}
  @Get() list() { return this.s.list(); }
  @Post() create(@Body() b: Record<string, unknown>) { return this.s.create(b); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() b: Record<string, unknown>) { return this.s.update(id, b); }
  @Patch(':id/toggle') toggle(@Param('id', ParseIntPipe) id: number) { return this.s.toggle(id); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.s.remove(id); }
}

@Controller('portal')
export class PublicPromotionsController {
  constructor(private s: PromotionsService, private vs: VouchersService) {}
  @Get('promotions') active() { return this.s.publicActive(); }
  @Get('vouchers') activeVouchers() { return this.vs.publicActive(); }
}

@Module({
  controllers: [PromotionsController, PublicPromotionsController, VouchersController],
  providers: [PromotionsService, VouchersService],
  exports: [PromotionsService, VouchersService],
})
export class PromotionsModule {}
