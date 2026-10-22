'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ApiNotice, EmptyRow, Status, date, vnd } from '@/lib/ui';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

type Summary = {
  kpi: { tongTour: number; tourMoBan: number; bookingThang: number; doanhThuThang: number; lichSapToi: number };
  donMoi: { DonHangID: number; MaDon: string; NgayDat: string; TongTien: string; TrangThaiDon: string; KhachHang: { HoTen: string; SoDienThoai: string }; LichKhoiHanh: { Tour: { TenTour: string } } }[];
};
type Revenue = { thang: string; doanhthu: number; sobooking: number }[];
type Category = { danhMuc: string; soTour: number }[];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.primaryRole === 'Khach hang') {
        router.push('/portal');
      }
    }
  }, [user, isLoading, router]);

  const summary = useApi<Summary>(user && user.primaryRole !== 'Khach hang' ? '/dashboard/summary' : null);
  const revenue = useApi<Revenue>(user && user.primaryRole !== 'Khach hang' ? '/dashboard/revenue' : null);
  const cats = useApi<Category>(user && user.primaryRole !== 'Khach hang' ? '/dashboard/categories' : null);
  const k = summary.data?.kpi;

  if (isLoading || !user || user.primaryRole === 'Khach hang') {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--zinc-500)' }}>Đang xác thực phiên làm việc...</div>;
  }

  const kpis = [
    { label: 'TỔNG SỐ TOUR', value: k?.tongTour ?? '—', trend: '+12%', sub: 'So với tháng trước' },
    { label: 'TOUR ĐANG MỞ BÁN', value: k?.tourMoBan ?? '—', trend: 'Hoạt động', sub: 'Lịch nhận booking' },
    { label: 'BOOKING THÁNG NÀY', value: k?.bookingThang ?? '—', trend: '+14.2%', sub: 'Tỷ lệ chốt đơn cao' },
    { label: 'DOANH THU THÁNG', value: k ? vnd(k.doanhThuThang) : '—', trend: '+8.6%', sub: 'Doanh thu thuần' },
    { label: 'LỊCH KHỞI HÀNH GẦN', value: k?.lichSapToi ?? '—', trend: 'Đã phân công', sub: 'Trong 14 ngày tới' },
  ];

  const maxRev = Math.max(1, ...(revenue.data?.map((r) => r.doanhthu) ?? [1]));
  const totalTour = Math.max(1, cats.data?.reduce((s, c) => s + c.soTour, 0) ?? 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard Tổng Quan</h1>
          <p className="page-desc">Chỉ số vận hành & phân tích kinh doanh thời gian thực — Vai trò: <strong>{user.primaryRole}</strong></p>
        </div>
        <Link href="/reports" className="btn btn-outline btn-sm">
          <span>Xem báo cáo chi tiết & Top tour</span>
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>

      <ApiNotice error={summary.error} />

      {/* 5 Ô KPI COMPACT INFORMATION-DENSE CARDS */}
      <section className="kpi-grid">
        {kpis.map((x) => (
          <div className="kpi-card" key={x.label}>
            <div className="kpi-label">{x.label}</div>
            <div className="kpi-value">{x.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span className="badge badge-success" style={{ padding: '1px 6px', fontSize: '10.5px' }}>
                <ArrowUpRight size={11} strokeWidth={2} />
                {x.trend}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--zinc-500)' }}>{x.sub}</span>
            </div>
          </div>
        ))}
      </section>

      {/* BIỂU ĐỒ DOANH THU & TỶ TRỌNG */}
      <section className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Doanh thu 6 tháng gần nhất</h2>
            <span style={{ fontSize: '11px', color: 'var(--zinc-500)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>VNĐ (Triệu)</span>
          </div>
          <div className="card-body">
            <div className="bars">
              {(revenue.data ?? []).map((r) => (
                <div className="bar-col" key={r.thang} title={`${r.sobooking} booking`}>
                  <span className="bar-value">{(r.doanhthu / 1e6).toFixed(0)} tr</span>
                  <div className="bar" style={{ height: `${(r.doanhthu / maxRev) * 85}%` }} />
                  <span className="bar-label">{r.thang}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Tỷ trọng danh mục tour</h2>
          </div>
          <div className="card-body">
            {(cats.data ?? []).map((c) => {
              const pct = Math.round((c.soTour / totalTour) * 100);
              return (
                <div className="share-row" key={c.danhMuc}>
                  <div className="top">
                    <span style={{ fontWeight: 500 }}>{c.danhMuc}</span>
                    <strong style={{ color: 'var(--zinc-900)' }}>{pct}%</strong>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BẢNG BOOKING MỚI */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">Booking mới cần xử lý</h2>
            <p style={{ fontSize: '11.5px', color: 'var(--zinc-500)', margin: '2px 0 0' }}>Các đơn đặt tour trực tuyến gần nhất</p>
          </div>
          <Link href="/bookings" className="btn btn-outline btn-sm">
            <span>Quản lý tất cả</span>
            <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>MÃ BOOKING</th>
                <th>KHÁCH HÀNG</th>
                <th>TOUR DU LỊCH</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY ĐẶT</th>
              </tr>
            </thead>
            <tbody>
              {summary.data?.donMoi.length ? summary.data.donMoi.map((b) => (
                <tr key={b.DonHangID}>
                  <td><span className="code">{b.MaDon}</span></td>
                  <td>
                    <div className="strong">{b.KhachHang.HoTen}</div>
                    <div className="sub">{b.KhachHang.SoDienThoai}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--zinc-900)' }}>{b.LichKhoiHanh.Tour.TenTour}</div>
                  </td>
                  <td><span className="strong">{vnd(b.TongTien)}</span></td>
                  <td><Status value={b.TrangThaiDon} /></td>
                  <td><span className="sub">{date(b.NgayDat)}</span></td>
                </tr>
              )) : <EmptyRow cols={6} loading={summary.loading} />}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
