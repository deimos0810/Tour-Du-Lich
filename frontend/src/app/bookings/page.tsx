'use client';
import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, vnd } from '@/lib/ui';

type Booking = {
  DonHangID: number; MaDon: string; SoLuongNguoiLon: number; SoLuongTreEm: number;
  TongTien: string; TienCoc: string; TienConLai: string; TrangThaiDon: string;
  KhachHang: { HoTen: string; SoDienThoai: string; Email: string };
  LichKhoiHanh: { MaLich: string; Tour: { TenTour: string } };
};

const FILTERS = [
  ['', 'Tất cả'], ['Cho thanh toan', 'Chờ xác nhận'], ['Da dat coc', 'Đã cọc'],
  ['Da thanh toan', 'Đã thanh toán 100%'], ['Da huy', 'Đã hủy'],
] as const;

export default function BookingsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { data, error, loading, reload } = useApi<Booking[]>(`/bookings?trangThai=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`);

  const pay = async (b: Booking) => {
    const input = prompt(`Số tiền thu thêm cho ${b.MaDon} (còn lại ${vnd(b.TienConLai)}):`);
    if (!input) return;
    await api(`/bookings/${b.DonHangID}/payments`, { method: 'POST', body: JSON.stringify({ SoTien: Number(input), HinhThucTT: 'Chuyen khoan' }) });
    void reload();
  };
  const cancel = async (b: Booking) => {
    if (!confirm(`Hủy booking ${b.MaDon}?`)) return;
    await api(`/bookings/${b.DonHangID}/cancel`, { method: 'POST' });
    void reload();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Booking & đặt cọc</h1>
          <p className="page-desc">Duyệt đơn đặt tour, ghi nhận tiền cọc và thanh toán</p>
        </div>
      </div>
      <ApiNotice error={error} />
      <div className="card">
        <div className="toolbar">
          {FILTERS.map(([v, l]) => (
            <button key={v} className={`btn btn-sm ${status === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setStatus(v)}>{l}</button>
          ))}
          <input className="input" id="booking-search" placeholder="Mã booking, tên, SĐT..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginLeft: 'auto' }} />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mã booking</th><th>Khách hàng</th><th>Chuyến đi</th><th>Số vé</th><th>Tổng tiền</th><th>Đã thu</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {data?.length ? data.map((b) => (
                <tr key={b.DonHangID}>
                  <td className="code">{b.MaDon}</td>
                  <td><div className="strong">{b.KhachHang.HoTen}</div><div className="sub">{b.KhachHang.SoDienThoai} · {b.KhachHang.Email}</div></td>
                  <td><div>{b.LichKhoiHanh.Tour.TenTour}</div><div className="code">{b.LichKhoiHanh.MaLich}</div></td>
                  <td>{b.SoLuongNguoiLon} NL, {b.SoLuongTreEm} TE</td>
                  <td className="strong">{vnd(b.TongTien)}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{vnd(b.TienCoc)}</td>
                  <td><Status value={b.TrangThaiDon} /></td>
                  <td>
                    {b.TrangThaiDon !== 'Da huy' && b.TrangThaiDon !== 'Da thanh toan' && (
                      <div className="actions">
                        <button className="btn btn-outline btn-sm" onClick={() => pay(b)}>Thu tiền</button>
                        <button className="btn btn-outline btn-sm" onClick={() => cancel(b)}>Hủy</button>
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
