'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ApiNotice, EmptyRow, Status, date, vnd } from '@/lib/ui';

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
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Đang xác thực phiên làm việc...</div>;
  }

  const kpis = [
    { label: 'Tổng số tour', value: k?.tongTour },
    { label: 'Tour đang mở bán', value: k?.tourMoBan },
    { label: 'Booking tháng này', value: k?.bookingThang },
    { label: 'Doanh thu tháng này', value: k ? vnd(k.doanhThuThang) : undefined },
    { label: 'Lịch khởi hành sắp tới', value: k?.lichSapToi },
  ];

  const maxRev = Math.max(1, ...(revenue.data?.map((r) => r.doanhthu) ?? [1]));
  const totalTour = Math.max(1, cats.data?.reduce((s, c) => s + c.soTour, 0) ?? 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard tổng quan</h1>
          <p className="page-desc">Tình hình kinh doanh và vận hành tour trong tháng — Chức danh: <strong>{user.primaryRole}</strong></p>
        </div>
      </div>
      <ApiNotice error={summary.error} />

      {/* 5 Ô KPI DẠNG CLEAN DATA METRIC CARDS */}
      <section className="kpi-grid">
        {kpis.map((x) => (
          <div className="card kpi" key={x.label} style={{ padding: '20px', borderRadius: '10px' }}>
            <div className="kpi-label" style={{ color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>{x.label}</div>
            <div className="kpi-value" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>{x.value ?? '—'}</div>
          </div>
        ))}
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-head"><h2 className="card-title">Doanh thu 6 tháng gần nhất</h2></div>
          <div className="card-body">
            <div className="bars">
              {(revenue.data ?? []).map((r) => (
                <div className="bar-col" key={r.thang} title={`${r.sobooking} booking`}>
                  <span className="bar-value">{(r.doanhthu / 1e6).toFixed(0)}tr</span>
                  <div className="bar" style={{ height: `${(r.doanhthu / maxRev) * 85}%`, background: '#0D6EFD', borderRadius: '4px 4px 0 0' }} />
                  <span className="bar-label">{r.thang}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2 className="card-title">Tỷ trọng theo danh mục</h2></div>
          <div className="card-body">
            {(cats.data ?? []).map((c) => (
              <div className="share-row" key={c.danhMuc}>
                <div className="top"><span>{c.danhMuc}</span><strong>{Math.round((c.soTour / totalTour) * 100)}%</strong></div>
                <div className="progress"><span style={{ width: `${(c.soTour / totalTour) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Booking mới cần xử lý</h2>
          <Link href="/bookings" className="btn btn-outline btn-sm">Xem tất cả</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Mã booking</th>
                <th>Khách hàng</th>
                <th>Tour du lịch</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {summary.data?.donMoi.length ? summary.data.donMoi.map((b) => (
                <tr key={b.DonHangID}>
                  <td className="code">{b.MaDon}</td>
                  <td><div className="strong">{b.KhachHang.HoTen}</div><div className="sub">{b.KhachHang.SoDienThoai}</div></td>
                  <td>{b.LichKhoiHanh.Tour.TenTour}</td>
                  <td className="strong">{vnd(b.TongTien)}</td>
                  <td><Status value={b.TrangThaiDon} /></td>
                  <td className="sub">{date(b.NgayDat)}</td>
                </tr>
              )) : <EmptyRow cols={6} loading={summary.loading} />}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
