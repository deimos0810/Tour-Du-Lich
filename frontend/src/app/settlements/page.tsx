'use client';
import { api, downloadFile, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, date, vnd } from '@/lib/ui';
import { FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';

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

  const exportFile = async (s: Settlement, kind: 'pdf' | 'excel') => {
    try {
      await downloadFile(`/export/settlement/${kind}/${s.QuyetToanID}`, `quyet-toan-${s.LichKhoiHanh.MaLich}.${kind === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể xuất file');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quyết Toán Tour</h1>
          <p className="page-desc">Tổng thu từ booking, chi phí nhà cung cấp và lợi nhuận ròng từng chuyến</p>
        </div>
      </div>

      <ApiNotice error={error} />

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>CHUYẾN ĐI</th>
                <th>TỔNG THU</th>
                <th>TỔNG CHI NCC</th>
                <th>LỢI NHUẬN RÒNG</th>
                <th>NGƯỜI LẬP</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>XUẤT BÁO CÁO</th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? data.map((s) => {
                const profit = Number(s.LoiNhuan);
                return (
                  <tr key={s.QuyetToanID}>
                    <td>
                      <div className="strong">{s.LichKhoiHanh.Tour.TenTour}</div>
                      <div className="code" style={{ marginTop: '2px', display: 'inline-block' }}>{s.LichKhoiHanh.MaLich}</div>
                    </td>
                    <td><span className="strong">{vnd(s.TongThu)}</span></td>
                    <td><span style={{ color: 'var(--rose-600)', fontWeight: 500 }}>{vnd(s.TongChi)}</span></td>
                    <td>
                      <span style={{ color: profit >= 0 ? 'var(--emerald-600)' : 'var(--rose-600)', fontWeight: 700 }}>
                        {vnd(s.LoiNhuan)}
                      </span>
                    </td>
                    <td>
                      <div>{s.NhanVienLap.HoTen}</div>
                      <div className="sub">{date(s.NgayLap)}</div>
                    </td>
                    <td><Status value={s.TrangThaiDuyet} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => exportFile(s, 'pdf')}
                          title="Tải bản PDF quyết toán"
                        >
                          <FileText size={13} strokeWidth={1.5} />
                          <span>PDF</span>
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => exportFile(s, 'excel')}
                          title="Tải bảng tính Excel"
                        >
                          <FileSpreadsheet size={13} strokeWidth={1.5} />
                          <span>Excel</span>
                        </button>
                        {s.TrangThaiDuyet === 'Da trinh duyet' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => approve(s)}
                          >
                            <CheckCircle2 size={13} strokeWidth={1.5} />
                            <span>Phê duyệt</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : <EmptyRow cols={7} loading={loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
