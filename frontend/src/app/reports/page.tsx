'use client';
import { useState } from 'react';
import { downloadFile, useApi } from '@/lib/api';
import { ApiNotice, vnd } from '@/lib/ui';
import { TrendingUp, Trophy, Users, BarChart3 } from 'lucide-react';

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
};

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
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

      {/* BÁO CÁO DOANH THU THEO QUÝ */}
      <section className="card">
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} strokeWidth={1.5} style={{ color: '#09090B' }} />
            <h2 className="card-title" style={{ margin: 0 }}>Doanh thu & Lượt khách phân bổ theo Quý</h2>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {(data?.quarters ?? [1, 2, 3, 4].map((q) => ({ quy: q, sokhach: 0, doanhthu: 0 }))).map((q) => (
            <div
              key={q.quy}
              style={{
                background: '#F8FAFC',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>QUÝ {q.quy}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: '6px 0' }}>
                {vnd(q.doanhthu)}
              </div>
              <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600 }}>
                {q.sokhach.toLocaleString('vi-VN')} lượt khách
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
