'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { api } from '@/lib/api';
import { vnd } from '@/lib/ui';

type Passenger = {
  ChiTietID: number;
  HoTen: string;
  LoaiKhach: string;
  CCCD: string | null;
  NgaySinh: string | null;
  MaQRVe: string | null;
  TrangThaiDiemDanh: number;
  GhiChu: string | null;
};

type TicketData = {
  DonHangID: number;
  MaDon: string;
  NgayDat: string;
  SoLuongNguoiLon: number;
  SoLuongTreEm: number;
  TongTien: string;
  GiamGia: string;
  TienCoc: string;
  TrangThaiDon: string;
  PhuongThucTT: string | null;
  KhachHang: {
    HoTen: string;
    SoDienThoai: string;
    Email: string;
    CCCD: string | null;
  };
  LichKhoiHanh: {
    MaLich: string;
    NgayKhoiHanh: string;
    NgayKetThuc: string;
    Tour: {
      MaTour: string;
      TenTour: string;
      ThoiGian: string;
      DiemKhoiHanh: string;
      DiemDen: string;
      PhuongTien: string | null;
      HinhAnhURL: string | null;
    };
    DieuPhoiTour?: Array<{
      HuongDanVien?: {
        NhanVien?: {
          HoTen: string;
          SoDienThoai: string;
          Email: string;
        };
      };
    }>;
  };
  ChiTietHanhKhach: Passenger[];
  ThanhToan?: Array<{
    MaGiaoDich: string;
    SoTien: string;
    HinhThucTT: string;
    NgayThanhToan: string;
  }>;
};

export default function TicketDetailPage({ params }: { params: Promise<{ maDon: string }> }) {
  const resolvedParams = use(params);
  const maDon = decodeURIComponent(resolvedParams.maDon);

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await api<TicketData>(`/bookings/ticket/${maDon}`);
      setTicket(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tìm thấy vé điện tử');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [maDon]);

  const handleCheckin = async (chiTietId: number) => {
    try {
      setCheckingInId(chiTietId);
      await api(`/bookings/checkin/${chiTietId}`, { method: 'POST' });
      setCheckinMsg('Đã điểm danh (Check-in) thành công!');
      await fetchTicket();
      setTimeout(() => setCheckinMsg(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Điểm danh thất bại');
    } finally {
      setCheckingInId(null);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const hdv = ticket?.LichKhoiHanh?.DieuPhoiTour?.[0]?.HuongDanVien?.NhanVien;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://viettour.vn/portal/ticket/${maDon}`;

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="no-print">
        <CustomerHeader />
      </div>

      <main style={{ flex: 1, padding: '32px 16px', maxWidth: '980px', margin: '0 auto', width: '100%' }}>
        {/* TOP CONTROLS */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link
            href="/portal/my-bookings"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#005BAA', fontWeight: 700, textDecoration: 'none', fontSize: '14px' }}
          >
            ← Quay lại đơn của tôi
          </Link>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: '#0F172A',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              🖨️ In Vé / Lưu PDF
            </button>
          </div>
        </div>

        {checkinMsg && (
          <div style={{ background: '#10B981', color: '#FFF', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', fontWeight: 700, textAlign: 'center' }}>
            {checkinMsg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#005BAA', fontWeight: 700 }}>
            Đang tải dữ liệu vé điện tử...
          </div>
        ) : error || !ticket ? (
          <div style={{ background: '#FFF', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Không tìm thấy vé điện tử</h2>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Mã đơn <strong>{maDon}</strong> không tồn tại hoặc đã bị gỡ bỏ.</p>
            <Link href="/portal" style={{ display: 'inline-block', marginTop: '16px', color: '#005BAA', fontWeight: 700 }}>Về Trang chủ VietTour</Link>
          </div>
        ) : (
          /* ========================================================================= */
          /* AIRLINE & LUXURY TRAVEL BOARDING PASS / E-TICKET */
          /* ========================================================================= */
          <div
            id="e-ticket-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(15,23,42,0.12)',
              border: '1px solid #CBD5E1',
            }}
          >
            {/* TICKET TOP HEADER: LUXURY AIRLINE STYLE */}
            <div style={{
              background: 'linear-gradient(135deg, #0A192F 0%, #005BAA 60%, #E11D48 100%)',
              color: '#FFFFFF',
              padding: '24px 32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#FFF', color: '#005BAA', fontWeight: 900, padding: '4px 10px', borderRadius: '6px', fontSize: '14px' }}>
                    VIETTOUR
                  </div>
                  <span style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.9 }}>
                    E-TICKET & BOARDING PASS
                  </span>
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 900, margin: '8px 0 0', letterSpacing: '-0.3px', color: '#FFF' }}>
                  VÉ ĐIỆN TỬ VÀ THẺ LÊN ĐOÀN DU LỊCH
                </h1>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  background: ticket.TrangThaiDon === 'Da thanh toan' ? '#10B981' : '#F59E0B',
                  color: '#FFFFFF',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  display: 'inline-block',
                }}>
                  {ticket.TrangThaiDon === 'Da thanh toan' ? '✓ ĐÃ XÁC THỰC — ĐÃ THANH TOÁN' : '⏳ CHỜ THANH TOÁN'}
                </span>
                <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '6px' }}>
                  Mã đơn: <strong style={{ color: '#FFF', fontSize: '15px' }}>{ticket.MaDon}</strong>
                </div>
              </div>
            </div>

            {/* FLIGHT & ROUTE BANNER */}
            <div style={{
              background: '#F8FAFC',
              borderBottom: '1px dashed #CBD5E1',
              padding: '24px 32px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Điểm Khởi Hành</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>
                  {ticket.LichKhoiHanh?.Tour?.DiemKhoiHanh || 'TP. Hồ Chí Minh'}
                </div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {new Date(ticket.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#005BAA', fontWeight: 700, marginBottom: '2px' }}>
                  ✈️ {ticket.LichKhoiHanh?.Tour?.ThoiGian || 'Tour Trọn Gói'}
                </div>
                <div style={{ height: '2px', background: '#005BAA', position: 'relative', margin: '8px 20px' }}>
                  <div style={{ position: 'absolute', right: '45%', top: '-8px', fontSize: '14px' }}>✈️</div>
                </div>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Phương tiện: {ticket.LichKhoiHanh?.Tour?.PhuongTien || 'Máy bay & Xe du lịch'}
                </span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700 }}>Điểm Đến</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#E11D48' }}>
                  {ticket.LichKhoiHanh?.Tour?.DiemDen}
                </div>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {new Date(ticket.LichKhoiHanh?.NgayKetThuc).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* TOUR DETAILS & QR CODE */}
            <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: '28px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                  {ticket.LichKhoiHanh?.Tour?.TenTour}
                </h3>
                <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <span>Mã tour: <strong>{ticket.LichKhoiHanh?.Tour?.MaTour}</strong></span>
                  <span>Mã lịch bay: <strong>{ticket.LichKhoiHanh?.MaLich}</strong></span>
                  <span>Số lượng: <strong>{ticket.SoLuongNguoiLon} người lớn{ticket.SoLuongTreEm > 0 ? `, ${ticket.SoLuongTreEm} trẻ em` : ''}</strong></span>
                </div>

                {/* THÔNG TIN NGƯỜI ĐẶT & HDV */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Trưởng đoàn / Người đặt</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{ticket.KhachHang?.HoTen}</div>
                    <div style={{ fontSize: '12.5px', color: '#475569' }}>SĐT: {ticket.KhachHang?.SoDienThoai}</div>
                    <div style={{ fontSize: '12.5px', color: '#475569' }}>Email: {ticket.KhachHang?.Email}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Hướng dẫn viên phụ trách</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#005BAA', marginTop: '2px' }}>
                      {hdv?.HoTen || 'Lê Hoàng Nam (Chính thức)'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569' }}>
                      Hotline đón đoàn: <strong>{hdv?.SoDienThoai || '0908 123 456'}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>Hỗ trợ 24/7 suốt tuyến</div>
                  </div>
                </div>

                {/* THÔNG TIN THANH TOÁN */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '20px', fontSize: '13px', color: '#475569' }}>
                  <div>Tổng cước vé: <strong style={{ color: '#0F172A', fontSize: '15px' }}>{vnd(ticket.TongTien)}</strong></div>
                  {Number(ticket.GiamGia) > 0 && <div>Đã giảm: <strong style={{ color: '#E11D48' }}>-{vnd(ticket.GiamGia)}</strong></div>}
                  <div>Đã thanh toán: <strong style={{ color: '#10B981', fontSize: '15px' }}>{vnd(ticket.TienCoc)}</strong></div>
                  <div>Hình thức: <strong>{ticket.PhuongThucTT || 'VNPay / Ngân hàng'}</strong></div>
                </div>
              </div>

              {/* QR CODE XÁC THỰC ONLINE BẰNG ĐIỆN THOẠI */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#F8FAFC', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                <div style={{ background: '#FFF', padding: '8px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(currentUrl)}`}
                    alt="Mã QR Xác Thực Vé Điện Tử"
                    style={{ width: '150px', height: '150px', display: 'block' }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '10px', lineHeight: 1.4 }}>
                  📱 <strong>Quét bằng Camera</strong> điện thoại để xác thực vé & điểm danh lên xe
                </div>
              </div>
            </div>

            {/* DANH SÁCH HÀNH KHÁCH & ĐIỂM DANH CHECK-IN */}
            <div style={{ borderTop: '1px solid #E2E8F0', padding: '24px 32px', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Danh Sách Hành Khách Đi Tour ({ticket.ChiTietHanhKhach?.length || 1})
                </h4>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Yêu cầu xuất trình Căn cước công dân (CCCD) khi lên máy bay và nhận phòng
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ticket.ChiTietHanhKhach && ticket.ChiTietHanhKhach.length > 0 ? (
                  ticket.ChiTietHanhKhach.map((p, idx) => (
                    <div
                      key={p.ChiTietID}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 18px',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        flexWrap: 'wrap',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#005BAA', color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '13px' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{p.HoTen}</div>
                          <div style={{ fontSize: '12.5px', color: '#64748B', display: 'flex', gap: '12px', marginTop: '2px' }}>
                            <span>Loại khách: <strong>{p.LoaiKhach}</strong></span>
                            {p.CCCD && <span>CCCD 12 số: <strong style={{ color: '#005BAA' }}>{p.CCCD}</strong></span>}
                            <span>Mã vé cá nhân: <code style={{ color: '#E11D48' }}>{p.MaQRVe || `VT-${ticket.MaDon}-${idx + 1}`}</code></span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.TrangThaiDiemDanh === 1 ? (
                          <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
                            ✓ ĐÃ ĐIỂM DANH (CHECK-IN)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCheckin(p.ChiTietID)}
                            disabled={checkingInId === p.ChiTietID}
                            style={{
                              background: '#005BAA',
                              color: '#FFF',
                              border: 'none',
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              cursor: 'pointer',
                            }}
                          >
                            {checkingInId === p.ChiTietID ? 'Đang xác nhận...' : '📲 HDV Điểm Danh'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', background: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B' }}>
                    1. <strong>{ticket.KhachHang?.HoTen}</strong> (Trưởng đoàn) — CCCD: {ticket.KhachHang?.CCCD || 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER NOTICE */}
            <div style={{ background: '#0F172A', color: '#94A3B8', padding: '18px 32px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                © 2026 VietTour System — Tổng đài cứu trợ khẩn cấp: <strong style={{ color: '#FFF' }}>1900 1234</strong> (24/7)
              </div>
              <div style={{ color: '#CBD5E1' }}>
                Vui lòng có mặt tại điểm đón trước giờ khởi hành ít nhất <strong>45 phút</strong>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="no-print">
        <CustomerFooter />
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          #e-ticket-card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
      `}</style>
    </div>
  );
}
