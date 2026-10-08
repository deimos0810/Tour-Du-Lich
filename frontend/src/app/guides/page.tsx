'use client';
import { useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status } from '@/lib/ui';

type Guide = {
  HDVID: number; SoTheHDV: string; NgonNgu: string; KinhNghiem: string | null; TrangThai: string;
  NhanVien: { HoTen: string; SoDienThoai: string; Email: string };
};

export default function GuidesPage() {
  const { data, error, loading } = useApi<Guide[]>('/guides');
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Điều phối & hướng dẫn viên</h1>
          <p className="page-desc">Danh sách HDV, thẻ hành nghề và tình trạng sẵn sàng nhận đoàn</p>
        </div>
      </div>
      <ApiNotice error={error} />
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Họ tên</th><th>Số thẻ HDV</th><th>Ngoại ngữ</th><th>Kinh nghiệm</th><th>Liên hệ</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {data?.length ? data.map((g) => (
                <tr key={g.HDVID}>
                  <td className="strong">{g.NhanVien.HoTen}</td>
                  <td className="code">{g.SoTheHDV}</td>
                  <td>{g.NgonNgu}</td>
                  <td>{g.KinhNghiem ?? '—'}</td>
                  <td><div>{g.NhanVien.SoDienThoai}</div><div className="sub">{g.NhanVien.Email}</div></td>
                  <td><Status value={g.TrangThai} /></td>
                </tr>
              )) : <EmptyRow cols={6} loading={loading} />}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
