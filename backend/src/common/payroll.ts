import type { Db } from './promotion.js';

/** Quy định tính công / chi phí HDV (đơn giá/ngày, phụ cấp đoàn, thưởng). */
export const PAYROLL = { DON_GIA_NGAY: 800_000, PHU_CAP_DOAN: 300_000, THUONG_XUAT_SAC: 500_000, THUONG_TOT: 200_000 };

const DAY = 24 * 60 * 60 * 1000;
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Số ngày công của chuyến (tính cả ngày đầu và ngày cuối). */
export const soNgayChuyen = (start: Date, end: Date) => Math.max(Math.round((dayStart(end) - dayStart(start)) / DAY) + 1, 1);

/** Chi phí nhân công HDV của 1 chuyến: Σ(số ngày × đơn giá) + phụ cấp đoàn cho mỗi HDV đã nhận (Đã xác nhận / Hoàn thành). */
export async function guideCostForDeparture(db: Db, lichId: number) {
  const lich = await db.lichKhoiHanh.findUnique({
    where: { LichID: lichId },
    include: { DieuPhoiTour: { include: { HuongDanVien: { include: { NhanVien: { select: { HoTen: true } } } } } } },
  });
  if (!lich) return { total: 0, items: [] as { HDVID: number; HoTen: string; TrangThai: string; soNgay: number; tienCong: number; phuCap: number; tong: number; tinhVaoChiPhi: boolean }[], choXacNhan: 0 };
  const soNgay = soNgayChuyen(lich.NgayKhoiHanh, lich.NgayKetThuc);
  const items = lich.DieuPhoiTour.filter((d) => d.TrangThai !== 'Tu choi').map((d) => {
    const tinhVaoChiPhi = ['Da xac nhan', 'Hoan thanh'].includes(d.TrangThai);
    const tienCong = soNgay * PAYROLL.DON_GIA_NGAY;
    const phuCap = PAYROLL.PHU_CAP_DOAN;
    return { HDVID: d.HDVID, HoTen: d.HuongDanVien.NhanVien.HoTen, TrangThai: d.TrangThai, soNgay, tienCong, phuCap, tong: tienCong + phuCap, tinhVaoChiPhi };
  });
  return {
    total: items.filter((i) => i.tinhVaoChiPhi).reduce((s, i) => s + i.tong, 0),
    items,
    choXacNhan: items.filter((i) => !i.tinhVaoChiPhi).length,
  };
}
