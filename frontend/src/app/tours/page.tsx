'use client';
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, vnd } from '@/lib/ui';

type Tour = {
  TourID: number; MaTour: string; TenTour: string; DiemDen: string; ThoiGian: string;
  GiaNguoiLon: string; GiaTreEm: string; HinhAnhURL: string | null; TrangThaiDuyet: string;
  DanhMuc: { TenDanhMuc: string };
};
type Category = { DanhMucID: number; TenDanhMuc: string };

export default function ToursPage() {
  const [search, setSearch] = useState('');
  const [danhMucId, setDanhMucId] = useState('');
  const [trangThai, setTrangThai] = useState('');

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (danhMucId) p.set('danhMucId', danhMucId);
    if (trangThai) p.set('trangThai', trangThai);
    return `/tours?${p}`;
  }, [search, danhMucId, trangThai]);

  const tours = useApi<Tour[]>(query);
  const cats = useApi<Category[]>('/tours/categories');

  const remove = async (t: Tour) => {
    if (!confirm(`Xóa tour "${t.TenTour}"?`)) return;
    try { await api(`/tours/${t.TourID}`, { method: 'DELETE' }); void tours.reload(); }
    catch { alert('Không thể xóa: tour đã có lịch khởi hành hoặc booking.'); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản lý tour</h1>
          <p className="page-desc">Danh mục chương trình tour, bảng giá và lịch trình</p>
        </div>
        <button className="btn btn-primary" id="btn-add-tour"><Icon name="plus" size={14} /> Tạo tour</button>
      </div>
      <ApiNotice error={tours.error} />

      <div className="card">
        <div className="toolbar">
          <input className="input" id="tour-search" placeholder="Tìm theo tên hoặc mã tour..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="select" id="tour-category" value={danhMucId} onChange={(e) => setDanhMucId(e.target.value)}>
            <option value="">Tất cả danh mục</option>
            {cats.data?.map((c) => <option key={c.DanhMucID} value={c.DanhMucID}>{c.TenDanhMuc}</option>)}
          </select>
          <select className="select" id="tour-status" value={trangThai} onChange={(e) => setTrangThai(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="Dang mo ban">Đang mở bán</option>
            <option value="Dong ban">Tạm dừng</option>
            <option value="Cho duyet">Chờ duyệt</option>
            <option value="Nhap">Nháp</option>
          </select>
          <span className="count">{tours.data?.length ?? 0} tour</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Tour</th><th>Danh mục</th><th>Điểm đến</th><th>Thời gian</th><th>Giá NL / TE</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {tours.data?.length ? tours.data.map((t) => (
                <tr key={t.TourID}>
                  <td>
                    <div className="cell-flex">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {t.HinhAnhURL ? <img className="thumb" src={t.HinhAnhURL} alt="" /> : <div className="thumb" />}
                      <div><div className="strong">{t.TenTour}</div><div className="code">{t.MaTour}</div></div>
                    </div>
                  </td>
                  <td>{t.DanhMuc.TenDanhMuc}</td>
                  <td>{t.DiemDen}</td>
                  <td>{t.ThoiGian}</td>
                  <td><div className="strong">{vnd(t.GiaNguoiLon)}</div><div className="sub">{vnd(t.GiaTreEm)}</div></td>
                  <td><Status value={t.TrangThaiDuyet} /></td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" title="Xem chi tiết"><Icon name="eye" size={15} /></button>
                      <button className="icon-btn" title="Sửa"><Icon name="edit" size={15} /></button>
                      <button className="icon-btn" title="Xóa" onClick={() => remove(t)}><Icon name="trash" size={15} /></button>
                    </div>
                  </td>
                </tr>
              )) : <EmptyRow cols={7} loading={tours.loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
