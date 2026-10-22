'use client';
import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, vnd } from '@/lib/ui';
import { Search } from 'lucide-react';

type Booking = {
  DonHangID: number; MaDon: string; SoLuongNguoiLon: number; SoLuongTreEm: number;
  TongTien: string; TienCoc: string; TienConLai: string; TrangThaiDon: string;
  KhachHang: { HoTen: string; SoDienThoai: string; Email: string };
  LichKhoiHanh: { MaLich: string; Tour: { TenTour: string } };
};

const FILTERS = [
  ['', 'Tất cả'],
  ['Cho thanh toan', 'Chờ xác nhận'],
  ['Da dat coc', 'Đã đặt cọc'],
  ['Da thanh toan', 'Đã thanh toán'],
  ['Da huy', 'Đã hủy'],
] as const;

export default function BookingsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, loading, reload } = useApi<Booking[]>(`/bookings?trangThai=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);

  const pay = async (b: Booking) => {
    const input = prompt(`Số tiền thu thêm cho đơn ${b.MaDon} (còn lại ${vnd(b.TienConLai)}):`);
    if (!input) return;
    await api(`/bookings/${b.DonHangID}/payments`, { method: 'POST', body: JSON.stringify({ SoTien: Number(input), HinhThucTT: 'Chuyen khoan' }) });
    void reload();
  };

  const cancel = async (b: Booking) => {
    if (!confirm(`Xác nhận hủy đơn đặt tour ${b.MaDon}?`)) return;
    await api(`/bookings/${b.DonHangID}/cancel`, { method: 'POST' });
    void reload();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Booking & Đặt Cọc</h1>
          <p className="page-desc">Quản lý giao dịch đặt tour, tiến độ thu cọc và tình trạng thanh toán</p>
        </div>
      </div>

      <ApiNotice error={error} />

      <div className="card">
        {/* TOOLBAR */}
        <div className="toolbar">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FILTERS.map(([v, l]) => (
              <button
                key={v}
                className={`btn btn-sm ${status === v ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatus(v)}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', marginLeft: 'auto', width: '280px' }}>
            <Search size={14} strokeWidth={1.5} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--zinc-400)' }} />
            <input
              className="input"
              id="booking-search"
              placeholder="Mã booking, tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>
        </div>

        {/* HIGH-DENSITY DATA TABLE */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>MÃ BOOKING</th>
                <th>KHÁCH HÀNG</th>
                <th>CHUYẾN ĐI</th>
                <th>SỐ VÉ</th>
                <th>TỔNG TIỀN</th>
                <th>ĐÃ THU</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? data.map((b) => (
                <tr key={b.DonHangID}>
                  <td><span className="code">{b.MaDon}</span></td>
                  <td>
                    <div className="strong">{b.KhachHang.HoTen}</div>
                    <div className="sub">{b.KhachHang.SoDienThoai} · {b.KhachHang.Email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--zinc-900)' }}>{b.LichKhoiHanh.Tour.TenTour}</div>
                    <div className="sub" style={{ fontFamily: 'monospace' }}>{b.LichKhoiHanh.MaLich}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12.5px', color: 'var(--zinc-700)' }}>
                      {b.SoLuongNguoiLon} NL{b.SoLuongTreEm > 0 ? `, ${b.SoLuongTreEm} TE` : ''}
                    </span>
                  </td>
                  <td><span className="strong">{vnd(b.TongTien)}</span></td>
                  <td>
                    <span style={{ color: 'var(--emerald-600)', fontWeight: 600 }}>{vnd(b.TienCoc)}</span>
                  </td>
                  <td><Status value={b.TrangThaiDon} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {b.TrangThaiDon !== 'Da huy' && b.TrangThaiDon !== 'Da thanh toan' && (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => pay(b)}>Thu tiền</button>
                        <button className="btn btn-danger-outline btn-sm" onClick={() => cancel(b)}>Hủy đơn</button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : <EmptyRow cols={8} loading={loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
