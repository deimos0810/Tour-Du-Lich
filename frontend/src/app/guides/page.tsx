'use client';
import { useState } from 'react';
import { useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, vnd, date } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import { Users, DollarSign, FileText, Printer, Star, X } from 'lucide-react';

type Guide = {
  HDVID: number;
  SoTheHDV: string;
  NgonNgu: string;
  KinhNghiem: string | null;
  TrangThai: string;
  NhanVien: { HoTen: string; SoDienThoai: string; Email: string };
};

type PayrollTour = {
  DieuPhoiID: number;
  MaLich: string;
  TenTour: string;
  NgayKhoiHanh: string;
  NgayKetThuc: string;
  TrangThai: string;
  soNgay: number;
  tienCong: number;
  phuCap: number;
  diemDanhGia: number | null;
  soDanhGia: number;
  thuong: number;
  daChot: boolean;
};

type PayrollItem = {
  HDVID: number;
  HoTen: string;
  SoTheHDV: string;
  SoDienThoai: string;
  TrangThai: string;
  soTour: number;
  soNgay: number;
  tienCong: number;
  phuCap: number;
  thuong: number;
  tongThuNhap: number;
  tours: PayrollTour[];
};

type PayrollResponse = {
  thang: string;
  donGiaNgay: number;
  quyDinh: {
    DON_GIA_NGAY: number;
    PHU_CAP_DOAN: number;
    THUONG_XUAT_SAC: number;
    THUONG_TOT: number;
  };
  data: PayrollItem[];
};

export default function GuidesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'LIST' | 'PAYROLL'>('LIST');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [detailGuide, setDetailGuide] = useState<PayrollItem | null>(null);

  const guidesApi = useApi<Guide[]>('/guides');
  const payrollApi = useApi<PayrollResponse>(`/guide-payroll?month=${selectedMonth}`);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Điều phối & Tính công Hướng dẫn viên</h1>
          <p className="page-desc">Quản lý hồ sơ thẻ HDV, lịch dẫn đoàn và bảng tổng hợp thù lao công tác phí</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'LIST' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('LIST')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Users size={14} strokeWidth={1.5} />
            <span>Danh sách HDV</span>
          </button>
          <button
            className={`btn ${activeTab === 'PAYROLL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('PAYROLL')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <DollarSign size={14} strokeWidth={1.5} />
            <span>Bảng tính công HDV</span>
          </button>
        </div>
      </div>

      <ApiNotice error={activeTab === 'LIST' ? guidesApi.error : payrollApi.error} />

      {activeTab === 'LIST' ? (
        <div className="card">
          <div className="toolbar">
            <span className="strong">Hồ sơ Hướng dẫn viên du lịch VietTour</span>
            <span className="count">{guidesApi.data?.length ?? 0} hướng dẫn viên</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Số thẻ hành nghề</th>
                  <th>Ngoại ngữ</th>
                  <th>Kinh nghiệm</th>
                  <th>Liên hệ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {guidesApi.data?.length ? (
                  guidesApi.data.map((g) => (
                    <tr key={g.HDVID}>
                      <td className="strong">{g.NhanVien.HoTen}</td>
                      <td className="code">{g.SoTheHDV}</td>
                      <td>{g.NgonNgu}</td>
                      <td>{g.KinhNghiem ?? '—'}</td>
                      <td>
                        <div>{g.NhanVien.SoDienThoai}</div>
                        <div className="sub">{g.NhanVien.Email}</div>
                      </td>
                      <td>
                        <Status value={g.TrangThai} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow cols={6} loading={guidesApi.loading} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          {/* QUY CHẾ TÍNH CÔNG THEO ĐỀ CƯƠNG */}
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#09090B', fontSize: '13px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={15} strokeWidth={1.5} />
                <span>Quy chế tính thù lao Hướng dẫn viên (ERP VietTour)</span>
              </div>
              <div style={{ fontSize: '12px', color: '#52525B', lineHeight: 1.6 }}>
                • Đơn giá ngày công: <strong>800.000đ / ngày</strong> · Phụ cấp trách nhiệm đoàn: <strong>300.000đ / tour</strong>
                <br />
                • Thưởng chất lượng dịch vụ: <strong>+500.000đ</strong> (Rating ≥ 4.5/5.0) hoặc <strong>+200.000đ</strong> (Rating ≥ 4.0/5.0)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF' }}>Kỳ tính lương:</label>
              <input
                type="month"
                className="input"
                style={{ fontWeight: 700, color: '#0D6EFD', background: '#FFFFFF' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="card">
            <div className="toolbar">
              <span className="strong">Bảng tổng hợp thu nhập HDV — Kỳ {selectedMonth}</span>
              <span className="count">{payrollApi.data?.data.length ?? 0} nhân sự</span>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hướng dẫn viên</th>
                    <th>Số tour đã dẫn</th>
                    <th>Số ngày công</th>
                    <th>Tiền công nhật</th>
                    <th>Phụ cấp đoàn</th>
                    <th>Thưởng rating</th>
                    <th>Tổng thu nhập</th>
                    <th style={{ textAlign: 'right' }}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollApi.data?.data.length ? (
                    payrollApi.data.data.map((item) => (
                      <tr key={item.HDVID}>
                        <td>
                          <div className="strong">{item.HoTen}</div>
                          <div className="code">{item.SoTheHDV}</div>
                        </td>
                        <td>
                          <span className="badge badge-info">{item.soTour} tour</span>
                        </td>
                        <td>
                          <strong>{item.soNgay}</strong> ngày
                        </td>
                        <td>{vnd(item.tienCong)}</td>
                        <td>{vnd(item.phuCap)}</td>
                        <td>
                          <span style={{ color: item.thuong > 0 ? '#16A34A' : '#64748B', fontWeight: 600 }}>
                            {item.thuong > 0 ? `+${vnd(item.thuong)}` : '0đ'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0D6EFD' }}>
                            {vnd(item.tongThuNhap)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setDetailGuide(item)}
                          >
                            Xem bảng kê
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow cols={8} loading={payrollApi.loading} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT BẢNG KÊ CÔNG TÁC PHÍ */}
      {detailGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setDetailGuide(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E4E4E7',
              maxWidth: '750px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} strokeWidth={1.5} style={{ color: '#09090B' }} />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                    Bảng kê chi tiết công tác phí HDV
                  </h2>
                </div>
                <p style={{ fontSize: '12.5px', color: '#71717A', margin: '2px 0 0' }}>
                  Nhân sự: <strong>{detailGuide.HoTen}</strong> ({detailGuide.SoTheHDV}) — Kỳ {selectedMonth}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setDetailGuide(null)}
                style={{ border: '1px solid #E4E4E7', background: '#FFFFFF', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <table className="table" style={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <thead>
                  <tr>
                    <th>Chuyến đi</th>
                    <th>Thời gian</th>
                    <th>Số ngày</th>
                    <th>Tiền công</th>
                    <th>Phụ cấp</th>
                    <th>Rating & Thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {detailGuide.tours.length ? (
                    detailGuide.tours.map((t) => (
                      <tr key={t.DieuPhoiID}>
                        <td>
                          <div className="strong">{t.TenTour}</div>
                          <div className="code">{t.MaLich}</div>
                        </td>
                        <td className="sub">
                          {date(t.NgayKhoiHanh)} → {date(t.NgayKetThuc)}
                        </td>
                        <td>{t.soNgay} ngày</td>
                        <td>{vnd(t.tienCong)}</td>
                        <td>{vnd(t.phuCap)}</td>
                        <td>
                          {t.diemDanhGia !== null ? (
                            <div>
                              <span style={{ color: '#09090B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Star size={12} strokeWidth={1.5} fill="#F59E0B" color="#F59E0B" />
                                <span>{t.diemDanhGia.toFixed(1)}/5</span>
                              </span>
                              {t.thuong > 0 && (
                                <div style={{ color: '#059669', fontSize: '11px', fontWeight: 600 }}>
                                  +{vnd(t.thuong)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="sub">Chưa có đánh giá</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="empty">
                        Chưa có tour nào được hoàn thành trong kỳ này
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                background: '#F8FAFC',
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontSize: '13px', color: '#64748B' }}>
                Tổng ngày dẫn đoàn: <strong>{detailGuide.soNgay} ngày</strong> · Tổng tour: <strong>{detailGuide.soTour} chuyến</strong>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0D6EFD' }}>
                Tổng thu nhập: {vnd(detailGuide.tongThuNhap)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  window.print();
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} strokeWidth={1.5} />
                <span>In phiếu tính công</span>
              </button>
              <button className="btn btn-primary" onClick={() => setDetailGuide(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
