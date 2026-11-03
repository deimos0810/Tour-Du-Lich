import { Controller, Get, Injectable, Module, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { PAYROLL, soNgayChuyen } from '../common/payroll.js';

const DAY = 24 * 60 * 60 * 1000;
const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : null) : Math.round(((cur - prev) / prev) * 1000) / 10);
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* =============================================================================
 * BÁO CÁO THỐNG KÊ (đề cương mục 6): số lượng khách theo tour, doanh thu, tour được đặt nhiều nhất, mùa cao điểm.
 *
 * Chuẩn một báo cáo thống kê quản trị:
 *  - Kỳ báo cáo tùy chọn (từ ngày – đến ngày) + so sánh với kỳ liền trước (% tăng/giảm)
 *  - Nêu rõ cơ sở số liệu (định nghĩa chỉ tiêu) và thời điểm lập
 *  - KPI tổng hợp → bảng chi tiết → xếp hạng → phân tích mùa vụ → hiệu quả khuyến mãi → kênh thanh toán
 *  - Có thể xuất Excel
 * ===========================================================================*/
@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /** Chuẩn hóa kỳ báo cáo. Mặc định: cả năm hiện tại. Giới hạn tối đa 5 năm. */
  parsePeriod(q: { from?: string; to?: string; year?: string }) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    let from: Date, to: Date;
    if (q.from && q.to && re.test(q.from) && re.test(q.to)) {
      from = new Date(`${q.from}T00:00:00+07:00`);
      to = new Date(`${q.to}T00:00:00+07:00`);
    } else {
      const y = Number(q.year) || new Date().getFullYear();
      from = new Date(`${y}-01-01T00:00:00+07:00`);
      to = new Date(`${y}-12-31T00:00:00+07:00`);
    }
    if (to < from) [from, to] = [to, from];
    if (to.getTime() - from.getTime() > 5 * 366 * DAY) from = new Date(to.getTime() - 5 * 366 * DAY);
    const toEnd = new Date(to.getTime() + DAY); // loại trừ (exclusive)
    const len = toEnd.getTime() - from.getTime();
    return { from, to, toEnd, prevFrom: new Date(from.getTime() - len), prevToEnd: from, days: Math.round(len / DAY) };
  }

  private async kpi(from: Date, toEnd: Date) {
    const [o] = await this.prisma.$queryRaw<{ tongdon: number; sodon: number; sokhach: number; doanhthugoc: number; giamgia: number; giamkm: number; doanhthuthuan: number; sodonhuy: number }[]>`
      SELECT COUNT(*)::int AS tongdon,
             (COUNT(*) FILTER (WHERE trangthaidon <> 'Da huy'))::int AS sodon,
             COALESCE(SUM(soluongnguoilon + soluongtreem) FILTER (WHERE trangthaidon <> 'Da huy'), 0)::int AS sokhach,
             COALESCE(SUM(tongtien) FILTER (WHERE trangthaidon <> 'Da huy'), 0)::float AS doanhthugoc,
             COALESCE(SUM(giamgia) FILTER (WHERE trangthaidon <> 'Da huy'), 0)::float AS giamgia,
             COALESCE(SUM(giamgiakhuyenmai) FILTER (WHERE trangthaidon <> 'Da huy'), 0)::float AS giamkm,
             COALESCE(SUM(tongtien - giamgia) FILTER (WHERE trangthaidon <> 'Da huy'), 0)::float AS doanhthuthuan,
             (COUNT(*) FILTER (WHERE trangthaidon = 'Da huy'))::int AS sodonhuy
      FROM dondattour WHERE ngaydat >= ${from}::timestamp AND ngaydat < ${toEnd}::timestamp`;
    const [c] = await this.prisma.$queryRaw<{ thucthu: number; hoantien: number }[]>`
      SELECT COALESCE(SUM(sotien) FILTER (WHERE trangthai = 'Thanh cong'), 0)::float AS thucthu,
             COALESCE(SUM(sotien) FILTER (WHERE trangthai = 'Da hoan tien'), 0)::float AS hoantien
      FROM thanhtoan WHERE ngaythanhtoan >= ${from}::timestamp AND ngaythanhtoan < ${toEnd}::timestamp`;
    const [oc] = await this.prisma.$queryRaw<{ chotoida: number; chodadat: number; sochuyen: number }[]>`
      SELECT COALESCE(SUM(sochotoida), 0)::int AS chotoida, COALESCE(SUM(sochodadat), 0)::int AS chodadat, COUNT(*)::int AS sochuyen
      FROM lichkhoihanh WHERE ngaykhoihanh >= ${from}::timestamp AND ngaykhoihanh < ${toEnd}::timestamp AND trangthai <> 'Huy'`;
    const [qt] = await this.prisma.$queryRaw<{ sochuyen: number; tongthu: number; tongchi: number }[]>`
      SELECT COUNT(*)::int AS sochuyen, COALESCE(SUM(q.tongthu), 0)::float AS tongthu, COALESCE(SUM(q.tongchi), 0)::float AS tongchi
      FROM baocaoquyettoan q JOIN lichkhoihanh l ON l.lichid = q.lichid
      WHERE q.trangthaiduyet = 'Da phe duyet' AND l.ngaykhoihanh >= ${from}::timestamp AND l.ngaykhoihanh < ${toEnd}::timestamp`;
    return {
      soDon: o.sodon, soKhach: o.sokhach, doanhThuGoc: o.doanhthugoc, tongGiamGia: o.giamgia, giamKhuyenMai: o.giamkm, giamVoucher: o.giamgia - o.giamkm,
      doanhThu: o.doanhthuthuan, donHuy: o.sodonhuy, tyLeHuy: o.tongdon ? Math.round((o.sodonhuy / o.tongdon) * 1000) / 10 : 0,
      giaTriTrungBinhDon: o.sodon ? Math.round(o.doanhthuthuan / o.sodon) : 0,
      thucThu: c.thucthu - c.hoantien, hoanTien: c.hoantien,
      soChuyenKhoiHanh: oc.sochuyen, tyLeLapDay: oc.chotoida ? Math.round((oc.chodadat / oc.chotoida) * 1000) / 10 : 0,
      quyetToan: { soChuyen: qt.sochuyen, tongThu: qt.tongthu, tongChi: qt.tongchi, loiNhuan: qt.tongthu - qt.tongchi, bienLoiNhuan: qt.tongthu ? Math.round(((qt.tongthu - qt.tongchi) / qt.tongthu) * 1000) / 10 : 0 },
    };
  }

  async overview(q: { from?: string; to?: string; year?: string }) {
    const { from, to, toEnd, prevFrom, prevToEnd, days } = this.parsePeriod(q);

    const [cur, prev] = await Promise.all([this.kpi(from, toEnd), this.kpi(prevFrom, prevToEnd)]);
    const growth = {
      soDon: pct(cur.soDon, prev.soDon), soKhach: pct(cur.soKhach, prev.soKhach), doanhThu: pct(cur.doanhThu, prev.doanhThu),
      thucThu: pct(cur.thucThu, prev.thucThu), tyLeHuy: Math.round((cur.tyLeHuy - prev.tyLeHuy) * 10) / 10, tyLeLapDay: Math.round((cur.tyLeLapDay - prev.tyLeLapDay) * 10) / 10,
    };

    // ---- 1. Số lượng khách theo tour (tính theo ngày ĐẶT trong kỳ)
    const customersByTour = await this.prisma.$queryRaw<{ tourid: number; matour: string; tentour: string; tendanhmuc: string; sochuyen: number; sodon: number; sokhach: number; nguoilon: number; treem: number; doanhthu: number; chodadat: number; chotoida: number; diemtb: number | null; sodanhgia: number }[]>`
      SELECT t.tourid, t.matour, t.tentour, dm.tendanhmuc,
             COUNT(DISTINCT l.lichid)::int AS sochuyen,
             COUNT(d.donhangid)::int AS sodon,
             COALESCE(SUM(d.soluongnguoilon + d.soluongtreem), 0)::int AS sokhach,
             COALESCE(SUM(d.soluongnguoilon), 0)::int AS nguoilon,
             COALESCE(SUM(d.soluongtreem), 0)::int AS treem,
             COALESCE(SUM(d.tongtien - d.giamgia), 0)::float AS doanhthu,
             0::int AS chodadat, 0::int AS chotoida,
             (SELECT ROUND(AVG(g.sosao)::numeric, 1)::float FROM danhgia g WHERE g.tourid = t.tourid) AS diemtb,
             (SELECT COUNT(*)::int FROM danhgia g WHERE g.tourid = t.tourid) AS sodanhgia
      FROM tour t
      JOIN danhmuctour dm ON dm.danhmucid = t.danhmucid
      LEFT JOIN lichkhoihanh l ON l.tourid = t.tourid
      LEFT JOIN dondattour d ON d.lichid = l.lichid AND d.trangthaidon <> 'Da huy' AND d.ngaydat >= ${from}::timestamp AND d.ngaydat < ${toEnd}::timestamp
      GROUP BY t.tourid, t.matour, t.tentour, dm.tendanhmuc
      ORDER BY sokhach DESC, doanhthu DESC`;
    const fill = await this.prisma.$queryRaw<{ tourid: number; chodadat: number; chotoida: number }[]>`
      SELECT tourid, COALESCE(SUM(sochodadat), 0)::int AS chodadat, COALESCE(SUM(sochotoida), 0)::int AS chotoida
      FROM lichkhoihanh WHERE ngaykhoihanh >= ${from}::timestamp AND ngaykhoihanh < ${toEnd}::timestamp AND trangthai <> 'Huy' GROUP BY tourid`;
    const fillMap = new Map(fill.map((f) => [f.tourid, f]));
    const byTour = customersByTour.map((r) => {
      const f = fillMap.get(r.tourid);
      return { ...r, chodadat: f?.chodadat ?? 0, chotoida: f?.chotoida ?? 0, tyLeLapDay: f?.chotoida ? Math.round((f.chodadat / f.chotoida) * 1000) / 10 : null };
    });

    // ---- 2. Tour được đặt nhiều nhất (Top 10 theo số đơn, đồng hạng xét doanh thu)
    const topTours = byTour.filter((t) => t.sodon > 0).sort((a, b) => b.sodon - a.sodon || b.doanhthu - a.doanhthu).slice(0, 10)
      .map((t, i) => ({ hang: i + 1, ...t, tyTrongTongKhach: cur.soKhach ? Math.round((t.sokhach / cur.soKhach) * 1000) / 10 : 0 }));

    // ---- 3. Mùa cao điểm: theo THÁNG KHỞI HÀNH (thời điểm khách thực sự đi), kèm chi phí & lợi nhuận ước tính
    const months: string[] = [];
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d < toEnd; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    const mFrom = new Date(from.getFullYear(), from.getMonth(), 1);
    const mTo = new Date(to.getFullYear(), to.getMonth() + 1, 1);
    const [seasonRows, nccRows, otherRows, guideLich] = await Promise.all([
      this.prisma.$queryRaw<{ ym: string; sokhach: number; sodon: number; doanhthu: number; sochuyen: number; chodadat: number; chotoida: number }[]>`
        SELECT to_char(l.ngaykhoihanh, 'YYYY-MM') AS ym,
               COALESCE(SUM(agg.sokhach), 0)::int AS sokhach,
               COALESCE(SUM(agg.sodon), 0)::int AS sodon,
               COALESCE(SUM(agg.doanhthu), 0)::float AS doanhthu,
               COUNT(l.lichid)::int AS sochuyen,
               COALESCE(SUM(l.sochodadat), 0)::int AS chodadat,
               COALESCE(SUM(l.sochotoida), 0)::int AS chotoida
        FROM lichkhoihanh l
        LEFT JOIN (
          SELECT lichid,
                 SUM(soluongnguoilon + soluongtreem)::int AS sokhach,
                 COUNT(donhangid)::int AS sodon,
                 SUM(tongtien - giamgia)::float AS doanhthu
          FROM dondattour
          WHERE trangthaidon <> 'Da huy'
          GROUP BY lichid
        ) agg ON agg.lichid = l.lichid
        WHERE l.trangthai <> 'Huy' AND l.ngaykhoihanh >= ${mFrom}::timestamp AND l.ngaykhoihanh < ${mTo}::timestamp
        GROUP BY 1`,
      this.prisma.$queryRaw<{ ym: string; chiphi: number }[]>`
        SELECT to_char(l.ngaykhoihanh, 'YYYY-MM') AS ym, COALESCE(SUM(p.tongtiendichvu), 0)::float AS chiphi
        FROM phieudatdichvu p JOIN lichkhoihanh l ON l.lichid = p.lichid
        WHERE p.trangthai NOT IN ('Da huy', 'NCC tu choi') AND l.ngaykhoihanh >= ${mFrom}::timestamp AND l.ngaykhoihanh < ${mTo}::timestamp GROUP BY 1`,
      this.prisma.$queryRaw<{ ym: string; chiphi: number }[]>`
        SELECT to_char(l.ngaykhoihanh, 'YYYY-MM') AS ym, COALESCE(SUM(c.sotien), 0)::float AS chiphi
        FROM chiphiphatsinh c JOIN lichkhoihanh l ON l.lichid = c.lichid
        WHERE l.ngaykhoihanh >= ${mFrom}::timestamp AND l.ngaykhoihanh < ${mTo}::timestamp GROUP BY 1`,
      this.prisma.lichKhoiHanh.findMany({
        where: { NgayKhoiHanh: { gte: mFrom, lt: mTo }, TrangThai: { not: 'Huy' }, DieuPhoiTour: { some: { TrangThai: { in: ['Da xac nhan', 'Hoan thanh'] } } } },
        select: { NgayKhoiHanh: true, NgayKetThuc: true, DieuPhoiTour: { where: { TrangThai: { in: ['Da xac nhan', 'Hoan thanh'] } }, select: { DieuPhoiID: true } } },
      }),
    ]);
    const hdvByMonth = new Map<string, number>();
    for (const l of guideLich) {
      const k = `${l.NgayKhoiHanh.getFullYear()}-${String(l.NgayKhoiHanh.getMonth() + 1).padStart(2, '0')}`;
      hdvByMonth.set(k, (hdvByMonth.get(k) ?? 0) + l.DieuPhoiTour.length * (soNgayChuyen(l.NgayKhoiHanh, l.NgayKetThuc) * PAYROLL.DON_GIA_NGAY + PAYROLL.PHU_CAP_DOAN));
    }
    const monthly0 = months.map((ym) => {
      const s = seasonRows.find((r) => r.ym === ym);
      const chiphi = (nccRows.find((r) => r.ym === ym)?.chiphi ?? 0) + (otherRows.find((r) => r.ym === ym)?.chiphi ?? 0) + (hdvByMonth.get(ym) ?? 0);
      const doanhthu = s?.doanhthu ?? 0;
      return {
        thang: ym, nhan: `${ym.slice(5)}/${ym.slice(0, 4)}`, sokhach: s?.sokhach ?? 0, sodon: s?.sodon ?? 0, sochuyen: s?.sochuyen ?? 0, doanhthu, chiphi, loinhuan: doanhthu - chiphi,
        tyLeLapDay: s?.chotoida ? Math.round((s.chodadat / s.chotoida) * 1000) / 10 : 0,
      };
    });
    const avg = monthly0.length ? monthly0.reduce((a, m) => a + m.sokhach, 0) / monthly0.length : 0;
    const ranked = [...monthly0].filter((m) => m.sokhach > 0).sort((a, b) => b.sokhach - a.sokhach);
    const monthly = monthly0.map((m) => {
      const mua = m.sokhach > 0 && avg > 0 && m.sokhach >= avg * 1.2 ? 'Cao diem' : avg > 0 && m.sokhach <= avg * 0.6 ? 'Thap diem' : 'Binh thuong';
      return { ...m, mua, hangKhach: ranked.findIndex((r) => r.thang === m.thang) + 1 || null, soVoiTrungBinh: avg > 0 ? Math.round((m.sokhach / avg) * 100) : 0 };
    });
    const quarterMap = new Map<string, { nhan: string; sokhach: number; doanhthu: number; chiphi: number }>();
    for (const m of monthly0) {
      const [y, mo] = m.thang.split('-').map(Number);
      const key = `${y}-Q${Math.ceil(mo / 3)}`;
      const cur2 = quarterMap.get(key) ?? { nhan: `Quý ${Math.ceil(mo / 3)}/${y}`, sokhach: 0, doanhthu: 0, chiphi: 0 };
      cur2.sokhach += m.sokhach; cur2.doanhthu += m.doanhthu; cur2.chiphi += m.chiphi;
      quarterMap.set(key, cur2);
    }
    const quarters = [...quarterMap.entries()].map(([quy, v]) => ({ quy, ...v, loinhuan: v.doanhthu - v.chiphi }));

    // ---- 4. Doanh thu theo danh mục / điểm đến
    const byCategory = await this.prisma.$queryRaw<{ ten: string; sodon: number; sokhach: number; doanhthu: number }[]>`
      SELECT dm.tendanhmuc AS ten, COUNT(d.donhangid)::int AS sodon, COALESCE(SUM(d.soluongnguoilon + d.soluongtreem), 0)::int AS sokhach, COALESCE(SUM(d.tongtien - d.giamgia), 0)::float AS doanhthu
      FROM dondattour d JOIN lichkhoihanh l ON l.lichid = d.lichid JOIN tour t ON t.tourid = l.tourid JOIN danhmuctour dm ON dm.danhmucid = t.danhmucid
      WHERE d.trangthaidon <> 'Da huy' AND d.ngaydat >= ${from}::timestamp AND d.ngaydat < ${toEnd}::timestamp GROUP BY dm.tendanhmuc ORDER BY doanhthu DESC`;
    const byDestination = await this.prisma.$queryRaw<{ ten: string; sodon: number; sokhach: number; doanhthu: number }[]>`
      SELECT t.diemden AS ten, COUNT(d.donhangid)::int AS sodon, COALESCE(SUM(d.soluongnguoilon + d.soluongtreem), 0)::int AS sokhach, COALESCE(SUM(d.tongtien - d.giamgia), 0)::float AS doanhthu
      FROM dondattour d JOIN lichkhoihanh l ON l.lichid = d.lichid JOIN tour t ON t.tourid = l.tourid
      WHERE d.trangthaidon <> 'Da huy' AND d.ngaydat >= ${from}::timestamp AND d.ngaydat < ${toEnd}::timestamp GROUP BY t.diemden ORDER BY doanhthu DESC LIMIT 10`;

    // ---- 5. Kênh thanh toán
    const byPayment = await this.prisma.$queryRaw<{ hinhthuc: string; sogiaodich: number; sotien: number }[]>`
      SELECT hinhthuctt AS hinhthuc, COUNT(*)::int AS sogiaodich, COALESCE(SUM(sotien), 0)::float AS sotien
      FROM thanhtoan WHERE trangthai = 'Thanh cong' AND ngaythanhtoan >= ${from}::timestamp AND ngaythanhtoan < ${toEnd}::timestamp GROUP BY hinhthuctt ORDER BY sotien DESC`;

    // ---- 6. Hiệu quả khuyến mãi & voucher
    const promoStats = await this.prisma.$queryRaw<{ ten: string; sodon: number; tiengiam: number; doanhthu: number }[]>`
      SELECT k.tenchuongtrinh AS ten, COUNT(d.donhangid)::int AS sodon, COALESCE(SUM(d.giamgiakhuyenmai), 0)::float AS tiengiam, COALESCE(SUM(d.tongtien - d.giamgia), 0)::float AS doanhthu
      FROM dondattour d JOIN chuongtrinhkhuyenmai k ON k.ctkmid = d.ctkmid
      WHERE d.trangthaidon <> 'Da huy' AND d.ngaydat >= ${from}::timestamp AND d.ngaydat < ${toEnd}::timestamp GROUP BY k.tenchuongtrinh ORDER BY sodon DESC`;
    const voucherStats = await this.prisma.$queryRaw<{ ma: string; sodon: number; tiengiam: number; doanhthu: number }[]>`
      SELECT v.mavoucher AS ma, COUNT(d.donhangid)::int AS sodon, COALESCE(SUM(d.giamgia - d.giamgiakhuyenmai), 0)::float AS tiengiam, COALESCE(SUM(d.tongtien - d.giamgia), 0)::float AS doanhthu
      FROM dondattour d JOIN voucher v ON v.voucherid = d.voucherid
      WHERE d.trangthaidon <> 'Da huy' AND d.ngaydat >= ${from}::timestamp AND d.ngaydat < ${toEnd}::timestamp GROUP BY v.mavoucher ORDER BY sodon DESC`;

    const years = await this.prisma.$queryRaw<{ nam: number }[]>`SELECT DISTINCT EXTRACT(YEAR FROM ngaykhoihanh)::int AS nam FROM lichkhoihanh ORDER BY nam DESC`;

    return {
      meta: {
        kyBaoCao: { tuNgay: ymd(from), denNgay: ymd(to), soNgay: days },
        kyTruoc: { tuNgay: ymd(prevFrom), denNgay: ymd(new Date(prevToEnd.getTime() - DAY)) },
        thoiDiemLap: new Date().toISOString(),
        diNghia: [
          'Số đơn / khách / doanh thu: tính các đơn KHÔNG hủy, theo ngày ĐẶT trong kỳ. Doanh thu = Tổng tiền − Giảm giá (khuyến mãi tour + voucher).',
          'Thực thu: tổng giao dịch thanh toán thành công trừ hoàn tiền, theo ngày thanh toán.',
          'Tỷ lệ hủy = số đơn hủy / tổng số đơn đặt trong kỳ. Tỷ lệ lấp đầy = số chỗ đã đặt / số chỗ tối đa của các chuyến KHỞI HÀNH trong kỳ.',
          'Mùa cao điểm: theo THÁNG KHỞI HÀNH. Cao điểm ≥ 120% số khách trung bình tháng; Thấp điểm ≤ 60%; còn lại Bình thường.',
          'Chi phí theo tháng = phiếu NCC hiệu lực + nhân công HDV (đã xác nhận) + chi phí phát sinh của các chuyến khởi hành trong tháng. Lợi nhuận quyết toán chỉ tính chuyến đã được phê duyệt.',
        ],
      },
      kpi: cur, kpiKyTruoc: prev, tangTruong: growth,
      khachTheoTour: byTour, topTours, mua: { trungBinhKhachThang: Math.round(avg * 10) / 10, thang: monthly, thangCaoDiem: monthly.filter((m) => m.mua === 'Cao diem').map((m) => m.nhan), quy: quarters },
      theoDanhMuc: byCategory, theoDiemDen: byDestination, theoThanhToan: byPayment, khuyenMai: promoStats, voucher: voucherStats,
      years: years.map((y) => y.nam),
      // Tương thích ngược với các trường frontend ReportsPage hiện tại
      totals: {
        sodon: cur.soDon,
        sokhach: cur.soKhach,
        doanhthu: cur.doanhThu,
        dahuy: cur.donHuy,
      },
      customersByTour: byTour.map((t) => ({
        tourid: t.tourid,
        matour: t.matour,
        tentour: t.tentour,
        sokhach: t.sokhach,
        sodon: t.sodon,
      })),
      monthly: monthly.map((m) => ({
        thang: m.thang,
        sokhach: m.sokhach,
        sodon: m.sodon,
        doanhthu: m.doanhthu,
        chiphi: m.chiphi,
        caoDiem: m.mua === 'Cao diem',
      })),
      peakMonths: monthly.filter((m) => m.mua === 'Cao diem').map((m) => m.thang),
      quarters: quarters.map((q) => ({
        quy: q.quy,
        sokhach: q.sokhach,
        doanhthu: q.doanhthu,
      })),
    };
  }
}

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Dieu hanh', 'Ke toan')
export class ReportsController {
  constructor(private s: ReportsService) {}
  @Get('overview') overview(@Query() q: { from?: string; to?: string; year?: string }) { return this.s.overview(q); }
}

@Module({ controllers: [ReportsController], providers: [ReportsService], exports: [ReportsService] })
export class ReportsModule {}
