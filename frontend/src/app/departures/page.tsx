'use client';
import { useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, date } from '@/lib/ui';

type Departure = {
  LichID: number; MaLich: string; NgayKhoiHanh: string; NgayKetThuc: string;
  SoChoToiDa: number; SoChoDaDat: number; TrangThai: string;
  Tour: { MaTour: string; TenTour: string };
  DieuPhoiTour: { HuongDanVien: { NhanVien: { HoTen: string } } }[];
};

export default function DeparturesPage() {
  const { data, error, loading } = useApi<Departure[]>('/departures');
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Lịch khởi hành</h1>
          <p className="page-desc">Theo dõi từng chuyến đi, số chỗ và hướng dẫn viên phụ trách</p>
        </div>
      </div>
      <ApiNotice error={error} />
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mã chuyến</th><th>Tour</th><th>Ngày đi - Ngày về</th><th>HDV phụ trách</th><th>Số chỗ</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {data?.length ? data.map((d) => {
                const full = d.SoChoDaDat >= d.SoChoToiDa;
                return (
                  <tr key={d.LichID}>
                    <td className="code">{d.MaLich}</td>
                    <td><div className="strong">{d.Tour.TenTour}</div><div className="sub">{d.Tour.MaTour}</div></td>
                    <td>{date(d.NgayKhoiHanh)} → {date(d.NgayKetThuc)}</td>
                    <td>{d.DieuPhoiTour.map((x) => x.HuongDanVien.NhanVien.HoTen).join(', ') || <span className="sub">Chưa phân công</span>}</td>
                    <td>
                      <div className="sub">{d.SoChoDaDat} / {d.SoChoToiDa}</div>
                      <div className="progress"><span style={{ width: `${(d.SoChoDaDat / d.SoChoToiDa) * 100}%` }} /></div>
                    </td>
                    <td>{full && d.TrangThai === 'Cho khoi hanh' ? <span className="badge badge-warning">Đủ chỗ</span> : <Status value={d.TrangThai} />}</td>
                  </tr>
                );
              }) : <EmptyRow cols={6} loading={loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
