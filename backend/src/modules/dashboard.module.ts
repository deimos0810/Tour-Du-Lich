import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module.js';

// PHÃ‚N Há»† 1: Dashboard tá»•ng quan
@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [tongTour, tourMoBan, bookingThang, doanhThu, lichSapToi, donMoi] = await Promise.all([
      this.prisma.tour.count(),
      this.prisma.tour.count({ where: { TrangThaiDuyet: 'Dang mo ban' } }),
      this.prisma.donDatTour.count({ where: { NgayDat: { gte: monthStart } } }),
      this.prisma.thanhToan.aggregate({ where: { NgayThanhToan: { gte: monthStart }, TrangThai: 'Thanh cong' }, _sum: { SoTien: true } }),
      this.prisma.lichKhoiHanh.count({ where: { NgayKhoiHanh: { gte: now }, TrangThai: 'Cho khoi hanh' } }),
      this.prisma.donDatTour.findMany({
        take: 5,
        where: { TrangThaiDon: { in: ['Cho thanh toan', 'Da dat coc'] } },
        orderBy: { NgayDat: 'desc' },
        include: { KhachHang: { select: { HoTen: true, SoDienThoai: true } }, LichKhoiHanh: { select: { Tour: { select: { TenTour: true } } } } },
      }),
    ]);

    return {
      kpi: { tongTour, tourMoBan, bookingThang, doanhThuThang: Number(doanhThu._sum.SoTien ?? 0), lichSapToi },
      donMoi,
    };
  }

  /** Doanh thu & sá»‘ booking theo 6 thÃ¡ng gáº§n nháº¥t. */
  async revenue6Months() {
    return this.prisma.$queryRaw<{ thang: string; doanhthu: number; sobooking: number }[]>`
      SELECT to_char(m, 'MM/YYYY') AS thang,
             COALESCE((SELECT SUM(sotien) FROM thanhtoan
                       WHERE trangthai = 'Thanh cong' AND date_trunc('month', ngaythanhtoan) = m), 0)::float AS doanhthu,
             (SELECT COUNT(*) FROM dondattour WHERE date_trunc('month', ngaydat) = m)::int AS sobooking
      FROM generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') AS m
      ORDER BY m`;
  }

  /** Tá»· trá»ng sá»‘ tour theo danh má»¥c. */
  async byCategory() {
    const rows = await this.prisma.danhMucTour.findMany({ include: { _count: { select: { Tour: true } } } });
    return rows.map((r) => ({ danhMuc: r.TenDanhMuc, soTour: r._count.Tour }));
  }
}

@Controller('dashboard')
export class DashboardController {
  constructor(private s: DashboardService) {}
  @Get('summary') summary() { return this.s.summary(); }
  @Get('revenue') revenue() { return this.s.revenue6Months(); }
  @Get('categories') categories() { return this.s.byCategory(); }
}

@Module({ controllers: [DashboardController], providers: [DashboardService] })
export class DashboardModule {}
