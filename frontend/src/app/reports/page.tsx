'use client';
import { useState } from 'react';
import { downloadFile, useApi } from '@/lib/api';
import { ApiNotice, vnd } from '@/lib/ui';
import { TrendingUp, Trophy, Users, BarChart3, Star, CalendarDays, Filter } from 'lucide-react';

type QuarterlyTourStat = {
  quy: number;
  matour: string;
  tentour: string;
  tendanhmuc: string;
  sochuyen: number;
  sodon: number;
  sokhach: number;
  doanhthu: number;
  sodanhgia: number;
  diemtb: number | null;
};

type ReportData = {
  year: number;
  years: number[];
  totals: {
    sodon: number;
    sokhach: number;
    doanhthu: number;
    dahuy: number;
  };
  customersByTour: {
    tourid: number;
    matour: string;
    tentour: string;
    sokhach: number;
    sodon: number;
  }[];
  topTours: {
    tourid: number;
    tentour: string;
    diemden: string;
    sodon: number;
    sokhach: number;
    doanhthu: number;
    diemtb: number | null;
  }[];
  monthly: {
    thang: number;
    sokhach: number;
    sodon: number;
    doanhthu: number;
    chiphi: number;
    caoDiem: boolean;
  }[];
  peakMonths: number[];
  quarters: {
    quy: number;
    sokhach: number;
    doanhthu: number;
  }[];
  quarterlyTours?: QuarterlyTourStat[];
};

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState<number | 'ALL'>('ALL');
  const { data, error, loading } = useApi<ReportData>(`/reports/overview?year=${selectedYear}`);
  const [exporting, setExporting] = useState(false);

  const exportExcel = async () => {
    setExporting(true);
    try {
      await downloadFile('/export/reports/excel', 'bao-cao-tai-chinh.xlsx');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể xuất file Excel');
    } finally {
      setExporting(false);
    }
  };

  const maxCustomersMonth = Math.max(1, ...(data?.monthly.map((m) => m.sokhach) ?? [1]));
  const maxRevenueMonth = Math.max(1, ...(data?.monthly.map((m) => m.doanhthu) ?? [1]));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Báo cáo Thống kê & Phân tích Kinh doanh</h1>
          <p className="page-desc">
            Số lượng khách theo tour, doanh thu, top tour đặt nhiều nhất và mùa cao điểm du lịch
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Năm thống kê:</label>
          <select
            className="select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ fontWeight: 700, color: '#0D6EFD' }}
          >
            {[2026, 2025, 2024].map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <button className="btn btn-outline btn-sm" onClick={exportExcel} disabled={exporting}>
            {exporting ? 'Đang xuất...' : 'Xuất Excel Báo cáo tài chính'}
          </button>
        </div>
      </div>

      <ApiNotice error={error} />

      {/* 4 THẺ CHỈ SỐ KPI TỔNG QUAN NĂM */}
      <section className="kpi-grid">
        <div className="card kpi" style={{ padding: '20px', borderRadius: '10px' }}>
          <div className="kpi-label" style={{ color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
            Tổng lượt khách tham gia
          </div>
          <div className="kpi-value" style={{ fontSize: '26px', fontWeight: 800, color: '#0D6EFD', marginTop: '6px' }}>
            {data?.totals.sokhach.toLocaleString('vi-VN') ?? '—'} <span style={{ fontSize: '14px', fontWeight: 600 }}>khách</span>
          </div>
          <div className="kpi-note" style={{ color: '#16A34A', fontSize: '11.5px', marginTop: '4px' }}>
            Trong {data?.totals.sodon ?? 0} đơn đặt chỗ thành công
          </div>
        </div>

        <div className="card kpi" style={{ padding: '20px', borderRadius: '10px' }}>
          <div className="kpi-label" style={{ color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
            Tổng doanh thu tour {selectedYear}
          </div>
          <div className="kpi-value" style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
            {data ? vnd(data.totals.doanhthu) : '—'}
          </div>
          <div className="kpi-note" style={{ color: '#64748B', fontSize: '11.5px', marginTop: '4px' }}>
            Sau khi trừ các voucher khuyến mãi
          </div>
        </div>

        <div className="card kpi" style={{ padding: '20px', borderRadius: '10px' }}>
          <div className="kpi-label" style={{ color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
            Mùa cao điểm du lịch
          </div>
          <div className="kpi-value" style={{ fontSize: '22px', fontWeight: 800, color: '#B45309', marginTop: '6px' }}>
            {data?.peakMonths.length ? data.peakMonths.map((m) => `Tháng ${m}`).join(', ') : 'Tháng 6, 7, 8'}
          </div>
          <div className="kpi-note" style={{ color: '#B45309', fontSize: '11.5px', marginTop: '4px' }}>
            Lượng khách & doanh thu đột biến nhất
          </div>
        </div>

        <div className="card kpi" style={{ padding: '20px', borderRadius: '10px' }}>
          <div className="kpi-label" style={{ color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
            Tỷ lệ đơn hoàn hủy
          </div>
          <div className="kpi-value" style={{ fontSize: '26px', fontWeight: 800, color: '#DC2626', marginTop: '6px' }}>
            {data?.totals.sodon
              ? `${Math.round(((data.totals.dahuy || 0) / (data.totals.sodon + (data.totals.dahuy || 0))) * 100)}%`
              : '0%'}
          </div>
          <div className="kpi-note" style={{ color: '#64748B', fontSize: '11.5px', marginTop: '4px' }}>
            {data?.totals.dahuy ?? 0} đơn đã hủy giải phóng chỗ
          </div>
        </div>
      </section>

      {/* BIỂU ĐỒ MÙA CAO ĐIỂM (12 THÁNG) */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <div className="card-head">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} strokeWidth={1.5} style={{ color: '#09090B' }} />
              <h2 className="card-title" style={{ margin: 0 }}>Phân tích Mùa Cao Điểm: Lượt khách & Doanh thu theo 12 Tháng</h2>
            </div>
            <p style={{ fontSize: '12px', color: '#71717A', margin: '2px 0 0' }}>
              Xác định mùa du lịch cao điểm dựa trên số lượng khách khởi hành thực tế
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#0D6EFD', borderRadius: '2px' }} /> Bình thường
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', background: '#F59E0B', borderRadius: '2px' }} /> Mùa cao điểm
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="bars" style={{ height: '240px' }}>
            {(data?.monthly ?? []).map((m) => {
              const heightPct = (m.sokhach / maxCustomersMonth) * 85;
              return (
                <div className="bar-col" key={m.thang} title={`Tháng ${m.thang}: ${m.sokhach} khách — ${vnd(m.doanhthu)}`}>
                  <span className="bar-value" style={{ color: m.caoDiem ? '#B45309' : '#0F172A', fontWeight: 700 }}>
                    {m.sokhach > 0 ? `${m.sokhach}k` : '0'}
                  </span>
                  <div
                    className="bar"
                    style={{
                      height: `${Math.max(heightPct, 4)}%`,
                      background: m.caoDiem
                        ? 'linear-gradient(180deg, #F59E0B 0%, #D97706 100%)'
                        : '#0D6EFD',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  <span className="bar-label" style={{ fontWeight: m.caoDiem ? 700 : 500, color: m.caoDiem ? '#B45309' : undefined }}>
                    T{m.thang}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2 BẢNG THỐNG KÊ CHI TIẾT: SỐ LƯỢNG KHÁCH THEO TOUR & TOP TOUR ĐƯỢC ĐẶT NHIỀU NHẤT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* TOP TOUR ĐƯỢC ĐẶT NHIỀU NHẤT */}
        <section className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={16} strokeWidth={1.5} style={{ color: '#09090B' }} />
              <h2 className="card-title" style={{ margin: 0 }}>Top Tour được đặt nhiều nhất ({selectedYear})</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên tour</th>
                  <th>Điểm đến</th>
                  <th>Số đơn</th>
                  <th>Lượt khách</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {data?.topTours.length ? (
                  data.topTours.map((t, idx) => (
                    <tr key={t.tourid}>
                      <td>
                        <div className="strong" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: idx === 0 ? '#FEF3C7' : '#F1F5F9',
                              color: idx === 0 ? '#B45309' : '#475569',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '11px',
                              fontWeight: 800,
                            }}
                          >
                            {idx + 1}
                          </span>
                          {t.tentour}
                        </div>
                      </td>
                      <td>{t.diemden}</td>
                      <td>
                        <span className="badge badge-info">{t.sodon} đơn</span>
                      </td>
                      <td className="strong">{t.sokhach}</td>
                      <td style={{ color: '#0D6EFD', fontWeight: 700 }}>{vnd(t.doanhthu)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty">
                      Chưa có dữ liệu thống kê
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* SỐ LƯỢNG KHÁCH THEO TỪNG TOUR */}
        <section className="card">
          <div className="card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} strokeWidth={1.5} style={{ color: '#09090B' }} />
              <h2 className="card-title" style={{ margin: 0 }}>Thống kê Lượng khách theo từng Tour</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã tour</th>
                  <th>Chương trình tour</th>
                  <th>Lượt khách</th>
                  <th>Số đơn</th>
                </tr>
              </thead>
              <tbody>
                {data?.customersByTour.length ? (
                  data.customersByTour.map((c) => (
                    <tr key={c.tourid}>
                      <td className="code">{c.matour}</td>
                      <td className="strong">{c.tentour}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            color: c.sokhach > 0 ? '#16A34A' : '#94A3B8',
                          }}
                        >
                          {c.sokhach} khách
                        </span>
                      </td>
                      <td className="sub">{c.sodon} booking</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="empty">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* BÁO CÁO CHI TIẾT THEO QUÝ (DOANH THU, LƯỢT ĐẶT, ĐÁNH GIÁ, KHÁCH THEO TỪNG TOUR) */}
      <section className="card" style={{ marginBottom: '24px' }}>
        <div className="card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={17} strokeWidth={1.5} style={{ color: '#2563EB' }} />
              <h2 className="card-title" style={{ margin: 0, fontSize: '16px' }}>
                Phân Tích Chi Tiết Tour Theo Từng Quý ({selectedYear})
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', margin: '3px 0 0' }}>
              Thống kê số lượng tour hoạt động, doanh thu, số lượt đặt (booking), lượt khách và phản hồi đánh giá của khách hàng theo quý
            </p>
          </div>

          {/* QUARTER FILTER PILLS */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: 'Tất cả 4 Quý' },
              { key: 1, label: 'Quý 1 (T1-T3)' },
              { key: 2, label: 'Quý 2 (T4-T6)' },
              { key: 3, label: 'Quý 3 (T7-T9)' },
              { key: 4, label: 'Quý 4 (T10-T12)' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`btn btn-sm ${selectedQuarter === tab.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedQuarter(tab.key as any)}
                style={{ fontSize: '12px', fontWeight: selectedQuarter === tab.key ? 700 : 500 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 CARDS TỔNG QUAN TỪNG QUÝ */}
        <div className="card-body" style={{ paddingBottom: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
            {[1, 2, 3, 4].map((qNum) => {
              const qData = data?.quarters?.find((q) => q.quy === qNum) || { quy: qNum, sokhach: 0, doanhthu: 0 };
              const qTours = data?.quarterlyTours?.filter((t) => t.quy === qNum) || [];
              const totalBookings = qTours.reduce((sum, t) => sum + t.sodon, 0);
              const totalReviews = qTours.reduce((sum, t) => sum + t.sodanhgia, 0);
              const isSelected = selectedQuarter === qNum || selectedQuarter === 'ALL';

              return (
                <div
                  key={qNum}
                  onClick={() => setSelectedQuarter(qNum === selectedQuarter ? 'ALL' : qNum)}
                  style={{
                    background: selectedQuarter === qNum ? '#EFF6FF' : '#F8FAFC',
                    padding: '16px',
                    borderRadius: '8px',
                    border: `1.5px solid ${selectedQuarter === qNum ? '#2563EB' : '#E2E8F0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedQuarter === qNum ? '0 4px 6px -1px rgba(37, 99, 235, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: selectedQuarter === qNum ? '#1D4ED8' : '#475569' }}>
                      QUÝ {qNum} {qNum === 1 ? '(Xuân)' : qNum === 2 ? '(Hè)' : qNum === 3 ? '(Thu)' : '(Đông)'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: '#E0E7FF',
                        color: '#3730A3',
                        fontWeight: 600,
                      }}
                    >
                      {qTours.length} tour
                    </span>
                  </div>

                  <div style={{ fontSize: '19px', fontWeight: 800, color: '#0F172A', margin: '8px 0 4px' }}>
                    {vnd(qData.doanhthu)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B' }}>
                    <span>{qData.sokhach.toLocaleString('vi-VN')} khách ({totalBookings} đơn)</span>
                    <span style={{ color: '#F59E0B', fontWeight: 600 }}>{totalReviews} đánh giá</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BẢNG CHI TIẾT TỪNG TOUR TRONG QUÝ */}
          <div className="table-wrap" style={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
            <table className="table" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th>TÊN TOUR & MÃ CHƯƠNG TRÌNH</th>
                  <th style={{ textAlign: 'center' }}>QUÝ</th>
                  <th style={{ textAlign: 'center' }}>SỐ CHUYẾN</th>
                  <th style={{ textAlign: 'center' }}>SỐ LƯỢT ĐẶT</th>
                  <th style={{ textAlign: 'center' }}>LƯỢT KHÁCH</th>
                  <th style={{ textAlign: 'center' }}>ĐÁNH GIÁ & ĐIỂM TB</th>
                  <th style={{ textAlign: 'right' }}>DOANH THU QUÝ</th>
                  <th style={{ textAlign: 'right' }}>TỶ TRỌNG</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredTours = (data?.quarterlyTours || []).filter(
                    (t) => selectedQuarter === 'ALL' || t.quy === selectedQuarter
                  );

                  if (!filteredTours.length) {
                    return (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                          Chưa có tour phát sinh doanh thu trong {selectedQuarter === 'ALL' ? 'năm này' : `Quý ${selectedQuarter}`}.
                        </td>
                      </tr>
                    );
                  }

                  const totalQuarterRevenue = filteredTours.reduce((sum, t) => sum + t.doanhthu, 0);

                  return (
                    <>
                      {filteredTours.map((t, idx) => {
                        const pct = totalQuarterRevenue > 0 ? ((t.doanhthu / totalQuarterRevenue) * 100).toFixed(1) : '0';
                        return (
                          <tr key={`${t.matour}-${t.quy}-${idx}`}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>{t.tentour}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span className="code" style={{ fontSize: '11px' }}>{t.matour}</span>
                                {t.tendanhmuc && (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: '#F1F5F9',
                                      color: '#475569',
                                    }}
                                  >
                                    {t.tendanhmuc}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '12px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: t.quy === 1 ? '#EFF6FF' : t.quy === 2 ? '#FEF3C7' : t.quy === 3 ? '#ECFDF5' : '#FDF2F8',
                                  color: t.quy === 1 ? '#1D4ED8' : t.quy === 2 ? '#B45309' : t.quy === 3 ? '#047857' : '#BE185D',
                                }}
                              >
                                Quý {t.quy}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.sochuyen}</td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.sodon} đơn</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: '#047857' }}>
                              {t.sokhach} khách
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {t.sodanhgia > 0 && t.diemtb ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Star size={13} fill="#F59E0B" color="#F59E0B" />
                                  <strong style={{ color: '#B45309', fontSize: '12.5px' }}>{t.diemtb}</strong>
                                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>({t.sodanhgia} đánh giá)</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>Chưa có đánh giá</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                              {vnd(t.doanhthu)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 600, color: '#2563EB', fontSize: '12px' }}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}

                      {/* DÒNG TỔNG KẾT */}
                      <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                        <td>TỔNG CỘNG ({selectedQuarter === 'ALL' ? 'TẤT CẢ CÁC QUÝ' : `QUÝ ${selectedQuarter}`})</td>
                        <td style={{ textAlign: 'center' }}>—</td>
                        <td style={{ textAlign: 'center' }}>
                          {filteredTours.reduce((sum, t) => sum + t.sochuyen, 0)} chuyến
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {filteredTours.reduce((sum, t) => sum + t.sodon, 0)} đơn
                        </td>
                        <td style={{ textAlign: 'center', color: '#047857' }}>
                          {filteredTours.reduce((sum, t) => sum + t.sokhach, 0)} khách
                        </td>
                        <td style={{ textAlign: 'center', color: '#B45309' }}>
                          {filteredTours.reduce((sum, t) => sum + t.sodanhgia, 0)} lượt đánh giá
                        </td>
                        <td style={{ textAlign: 'right', color: '#0D6EFD', fontSize: '14px' }}>
                          {vnd(totalQuarterRevenue)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#2563EB' }}>100%</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
