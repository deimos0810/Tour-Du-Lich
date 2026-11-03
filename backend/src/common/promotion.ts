import { BadRequestException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';

/** Prisma client hoặc transaction client — dùng chung cho các helper tính giá. */
export type Db = PrismaClient | Prisma.TransactionClient;

const DAY_MS = 24 * 60 * 60 * 1000;

/* =============================================================================
 * KHUYẾN MÃI TOUR (ChuongTrinhKhuyenMai): giảm x% cho tour trong khoảng thời gian.
 * Hết hạn xử lý theo thời gian THỰC khi truy vấn (không phụ thuộc cron):
 *   hiệu lực  <=>  TrangThai = 1  AND  NgayBatDau <= now <= NgayKetThuc
 * Hết hạn: API ngừng trả về khuyến mãi -> giao diện tự quay về giá gốc, ẩn nhãn "-x%".
 * Đơn đã đặt trước khi hết hạn GIỮ NGUYÊN giá (đã lưu vào DonDatTour.GiamGiaKhuyenMai).
 * ===========================================================================*/
export type PromoState = 'Tam dung' | 'Sap dien ra' | 'Dang dien ra' | 'Het han';

export function promoState(km: { TrangThai: number; NgayBatDau: Date; NgayKetThuc: Date }, now = new Date()): PromoState {
  if (km.TrangThai !== 1) return 'Tam dung';
  if (now < km.NgayBatDau) return 'Sap dien ra';
  if (now > km.NgayKetThuc) return 'Het han';
  return 'Dang dien ra';
}

export type ActivePromo = { CTKMID: number; TenChuongTrinh: string; PhanTramGiam: number; NgayKetThuc: Date };

/** Lấy khuyến mãi đang hiệu lực cho danh sách tour. Nhiều CTKM cùng lúc: chọn mức giảm cao nhất (không cộng dồn). */
export async function activePromoByTour(db: Db, tourIds: number[], now = new Date()): Promise<Map<number, ActivePromo>> {
  const map = new Map<number, ActivePromo>();
  if (!tourIds.length) return map;
  const rows = await db.chuongTrinhKhuyenMai.findMany({
    where: { TrangThai: 1, NgayBatDau: { lte: now }, NgayKetThuc: { gte: now }, ApDung: { some: { TourID: { in: tourIds } } } },
    include: { ApDung: { select: { TourID: true } } },
  });
  for (const km of rows) {
    const pct = Number(km.PhanTramGiam);
    for (const { TourID } of km.ApDung) {
      if (!tourIds.includes(TourID)) continue;
      const cur = map.get(TourID);
      if (!cur || pct > cur.PhanTramGiam) {
        map.set(TourID, { CTKMID: km.CTKMID, TenChuongTrinh: km.TenChuongTrinh, PhanTramGiam: pct, NgayKetThuc: km.NgayKetThuc });
      }
    }
  }
  return map;
}

export const applyPercent = (price: number, pct: number) => Math.round((price * (100 - pct)) / 100);

/** Gắn thông tin khuyến mãi + giá sau khuyến mãi vào danh sách tour (trả về cho website/mobile). */
export async function decorateToursWithPromo<T extends { TourID: number; GiaNguoiLon: unknown; GiaTreEm: unknown }>(db: Db, tours: T[]) {
  const map = await activePromoByTour(db, tours.map((t) => t.TourID));
  return tours.map((t) => {
    const p = map.get(t.TourID);
    if (!p) return { ...t, KhuyenMai: null as null | (ActivePromo & { GiaNguoiLonKM: number; GiaTreEmKM: number; ConLaiGio: number }) };
    return {
      ...t,
      KhuyenMai: {
        ...p,
        GiaNguoiLonKM: applyPercent(Number(t.GiaNguoiLon), p.PhanTramGiam),
        GiaTreEmKM: applyPercent(Number(t.GiaTreEm), p.PhanTramGiam),
        ConLaiGio: Math.max(Math.ceil((p.NgayKetThuc.getTime() - Date.now()) / (60 * 60 * 1000)), 0),
      },
    };
  });
}

/* =============================================================================
 * MÃ GIẢM GIÁ (Voucher): khách nhập mã khi đặt tour.
 * Ngày kết thúc là kiểu DATE -> hiệu lực đến HẾT ngày đó (23:59:59.999).
 * ===========================================================================*/
export const endOfDay = (d: Date) => new Date(d.getTime() + DAY_MS - 1);

export type VoucherResult = {
  voucherId: number; maVoucher: string; tenChuongTrinh: string; phanTramGiam: number; giamGia: number; tongTienSauGiam: number;
};

/**
 * Kiểm tra voucher + tính tiền giảm. `amount` là số tiền SAU khuyến mãi tour (voucher tính trên giá đã giảm).
 * Ném BadRequestException với thông báo rõ nguyên nhân (hết hạn, chưa đủ giá trị đơn, hết lượt, sai tour...).
 */
export async function evaluateVoucher(db: Db, code: string, amount: number, tourId?: number | null, now = new Date()): Promise<VoucherResult> {
  const ma = String(code || '').trim().toUpperCase();
  if (!ma) throw new BadRequestException('Vui lòng nhập mã giảm giá');
  const v = await db.voucher.findUnique({ where: { MaVoucher: ma }, include: { ApDungVoucher: { select: { TourID: true } } } });
  if (!v || v.TrangThai !== 1) throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã tạm dừng áp dụng!');
  if (now < v.NgayBatDau) throw new BadRequestException('Mã giảm giá chưa đến thời gian áp dụng!');
  if (now > endOfDay(v.NgayKetThuc)) throw new BadRequestException('Mã giảm giá đã hết hạn sử dụng!');
  if (v.ApDungVoucher.length > 0 && tourId && !v.ApDungVoucher.some((a) => a.TourID === tourId)) {
    throw new BadRequestException('Mã giảm giá này không áp dụng cho tour đang chọn!');
  }
  if (amount < Number(v.GiaTriDonToiThieu)) {
    throw new BadRequestException(`Đơn hàng cần đạt tối thiểu ${Number(v.GiaTriDonToiThieu).toLocaleString('vi-VN')} đ để dùng mã này!`);
  }
  if (v.SoLuongToiDa !== null) {
    const used = await db.donDatTour.count({ where: { VoucherID: v.VoucherID, TrangThaiDon: { not: 'Da huy' } } });
    if (used >= v.SoLuongToiDa) throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng!');
  }
  const giamGia = Math.min(Math.round((amount * Number(v.PhanTramGiam)) / 100), Number(v.GiamToiDa));
  return {
    voucherId: v.VoucherID, maVoucher: v.MaVoucher, tenChuongTrinh: v.TenChuongTrinh,
    phanTramGiam: Number(v.PhanTramGiam), giamGia, tongTienSauGiam: Math.max(amount - giamGia, 0),
  };
}
