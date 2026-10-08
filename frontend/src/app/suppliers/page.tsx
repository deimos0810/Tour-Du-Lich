'use client';
import { useState } from 'react';
import { useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, vnd } from '@/lib/ui';

type Supplier = {
  NhaCungCapID: number; TenNCC: string; LoaiNCC: string; NguoiLienHe: string | null;
  SoDienThoai: string; Email: string | null; DiaChi: string | null; DanhGia: string | null;
  DichVu: { DichVuNCCID: number; TenDichVu: string; DonGia: string; DonViTinh: string }[];
};

const LOAI: Record<string, string> = {
  'Khach san': 'Khách sạn', 'Nha hang': 'Nhà hàng', 'Xe van chuyen': 'Xe vận chuyển',
  'Cong ty bay': 'Hàng không', 'Khu du lich': 'Khu du lịch', 'Khac': 'Khác',
};

export default function SuppliersPage() {
  const [loai, setLoai] = useState('');
  const { data, error, loading } = useApi<Supplier[]>(`/suppliers${loai ? `?loai=${encodeURIComponent(loai)}` : ''}`);
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Nhà cung cấp & dịch vụ</h1>
          <p className="page-desc">Đối tác khách sạn, nhà hàng, vận chuyển, hàng không và bảng giá dịch vụ</p>
        </div>
      </div>
      <ApiNotice error={error} />
      <div className="card">
        <div className="toolbar">
          <select className="select" id="supplier-type" value={loai} onChange={(e) => setLoai(e.target.value)}>
            <option value="">Tất cả loại</option>
            {Object.entries(LOAI).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="count">{data?.length ?? 0} đối tác</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Nhà cung cấp</th><th>Loại</th><th>Người liên hệ</th><th>Dịch vụ & đơn giá</th><th>Đánh giá</th></tr></thead>
            <tbody>
              {data?.length ? data.map((s) => (
                <tr key={s.NhaCungCapID}>
                  <td><div className="strong">{s.TenNCC}</div><div className="sub">{s.DiaChi ?? ''}</div></td>
                  <td><span className="badge badge-muted">{LOAI[s.LoaiNCC] ?? s.LoaiNCC}</span></td>
                  <td><div>{s.NguoiLienHe ?? '—'}</div><div className="sub">{s.SoDienThoai}</div></td>
                  <td>{s.DichVu.length ? s.DichVu.map((d) => <div key={d.DichVuNCCID} className="sub">{d.TenDichVu}: {vnd(d.DonGia)}/{d.DonViTinh}</div>) : <span className="sub">—</span>}</td>
                  <td>{s.DanhGia ? `${Number(s.DanhGia).toFixed(1)} / 5` : '—'}</td>
                </tr>
              )) : <EmptyRow cols={5} loading={loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
