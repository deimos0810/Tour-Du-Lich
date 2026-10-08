'use client';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, date, vnd } from '@/lib/ui';

type Settlement = {
  QuyetToanID: number; TongThu: string; TongChi: string; LoiNhuan: string; NgayLap: string; TrangThaiDuyet: string;
  LichKhoiHanh: { MaLich: string; Tour: { TenTour: string } };
  NhanVienLap: { HoTen: string };
};

export default function SettlementsPage() {
  const { data, error, loading, reload } = useApi<Settlement[]>('/settlements');

  const approve = async (s: Settlement) => {
    if (!confirm(`Phê duyệt quyết toán chuyến ${s.LichKhoiHanh.MaLich}?`)) return;
    await api(`/settlements/${s.QuyetToanID}/approve`, { method: 'PATCH', body: JSON.stringify({ TrangThaiDuyet: 'Da phe duyet' }) });
    void reload();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quyết toán tour</h1>
          <p className="page-desc">Tổng thu từ booking, chi phí nhà cung cấp và lợi nhuận từng chuyến</p>
        </div>
      </div>
      <ApiNotice error={error} />
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Chuyến đi</th><th>Tổng thu</th><th>Tổng chi NCC</th><th>Lợi nhuận</th><th>Người lập</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {data?.length ? data.map((s) => (
                <tr key={s.QuyetToanID}>
                  <td><div className="strong">{s.LichKhoiHanh.Tour.TenTour}</div><div className="code">{s.LichKhoiHanh.MaLich}</div></td>
                  <td className="strong">{vnd(s.TongThu)}</td>
                  <td style={{ color: 'var(--danger)' }}>{vnd(s.TongChi)}</td>
                  <td style={{ color: Number(s.LoiNhuan) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{vnd(s.LoiNhuan)}</td>
                  <td><div>{s.NhanVienLap.HoTen}</div><div className="sub">{date(s.NgayLap)}</div></td>
                  <td><Status value={s.TrangThaiDuyet} /></td>
                  <td>{s.TrangThaiDuyet === 'Da trinh duyet' && <button className="btn btn-primary btn-sm" onClick={() => approve(s)}>Phê duyệt</button>}</td>
                </tr>
              )) : <EmptyRow cols={7} loading={loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
