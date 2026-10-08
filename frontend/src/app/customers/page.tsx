'use client';
import { useState } from 'react';
import { useApi } from '@/lib/api';
import { ApiNotice, EmptyRow } from '@/lib/ui';

type Customer = {
  KhachHangID: number; HoTen: string; CCCD: string | null; SoDienThoai: string; Email: string;
  GioiTinh: string | null; _count: { DonDatTour: number };
};

/** Hạng thành viên tạm tính theo số đơn (CSDL chưa có cột hạng). */
const rank = (n: number) => (n >= 10 ? 'Kim cương' : n >= 5 ? 'Vàng' : n >= 2 ? 'Bạc' : 'Thường');

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const { data, error, loading } = useApi<Customer[]>(`/customers?search=${encodeURIComponent(search)}`);
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Khách hàng</h1>
          <p className="page-desc">Hồ sơ khách du lịch, giấy tờ tùy thân và lịch sử đặt tour</p>
        </div>
      </div>
      <ApiNotice error={error} />
      <div className="card">
        <div className="toolbar">
          <input className="input" id="customer-search" placeholder="Tên, SĐT hoặc CCCD..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="count">{data?.length ?? 0} khách hàng</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mã KH</th><th>Họ tên</th><th>CCCD / Hộ chiếu</th><th>Liên hệ</th><th>Hạng</th><th>Số tour đã đặt</th></tr></thead>
            <tbody>
              {data?.length ? data.map((c) => (
                <tr key={c.KhachHangID}>
                  <td className="code">KH{String(c.KhachHangID).padStart(4, '0')}</td>
                  <td className="strong">{c.HoTen}</td>
                  <td>{c.CCCD ?? '—'}</td>
                  <td><div>{c.SoDienThoai}</div><div className="sub">{c.Email}</div></td>
                  <td><span className="badge badge-info">{rank(c._count.DonDatTour)}</span></td>
                  <td>{c._count.DonDatTour}</td>
                </tr>
              )) : <EmptyRow cols={6} loading={loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
