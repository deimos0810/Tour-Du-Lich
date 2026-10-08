'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import { useApi, api } from '@/lib/api';
import { Status, vnd, date } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';

type Passenger = {
  ChiTietID: number;
  HoTen: string;
  LoaiKhach: string;
  CCCD: string | null;
  MaQRVe: string | null;
  TrangThaiDiemDanh: number;
};

type Booking = {
  DonHangID: number;
  MaDon: string;
  NgayDat: string;
  SoLuongNguoiLon: number;
  SoLuongTreEm: number;
  TongTien: string;
  GiamGia?: string;
  TienCoc?: string;
  TienConLai?: string;
  TrangThaiDon: string;
  PhuongThucTT?: string | null;
  LichKhoiHanh: {
    MaLich: string;
    NgayKhoiHanh: string;
    NgayKetThuc?: string;
    Tour: { TenTour: string; HinhAnhURL: string | null; ThoiGian: string; MaTour?: string };
  };
  ChiTietHanhKhach?: Passenger[];
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [statusTab, setStatusTab] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // State quản lý Modal Thanh toán (VNPay & Tiền mặt/Thẻ tại quầy) & Vé QR Code
  const [payModalBooking, setPayModalBooking] = useState<Booking | null>(null);
  const [payTab, setPayTab] = useState<'VNPAY' | 'CASH_CARD'>('VNPAY');
  const [ticketModalBooking, setTicketModalBooking] = useState<Booking | null>(null);
  const [loadingPay, setLoadingPay] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const bookingsApi = useApi<Booking[]>(user ? '/portal/my-bookings' : null);
  const bookings = bookingsApi.data ?? [];

  // Tự động xử lý khi VNPay Sandbox phản hồi quay lại trang (vnp_ResponseCode)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const vnpRspCode = urlParams.get('vnp_ResponseCode');

    if (vnpRspCode) {
      if (vnpRspCode === '00') {
        setToastMsg('Thanh toán qua Cổng VNPay Sandbox THÀNH CÔNG! Đơn hàng của bạn đã được cập nhật.');
        api(`/vnpay/vnpay_ipn${window.location.search}`)
          .then(() => bookingsApi.reload())
          .catch(() => bookingsApi.reload());
      } else {
        setToastMsg('Giao dịch thanh toán VNPay không thành công hoặc đã bị hủy.');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'Cho thanh toan', label: 'Chờ thanh toán' },
    { id: 'Da thanh toan', label: 'Đã thanh toán' },
    { id: 'Da dat coc', label: 'Đã đặt cọc' },
    { id: 'Da huy', label: 'Đã hủy' },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (statusTab === 'ALL') return true;
    return b.TrangThaiDon === statusTab;
  });

  // Mở modal thanh toán
  const handleOpenPayModal = (booking: Booking) => {
    setPayModalBooking(booking);
    setPayTab('VNPAY');
  };

  // Thanh toán VNPay trực tiếp điều hướng sang sandbox
  const handlePayVNPayDirect = async (booking: Booking) => {
    setLoadingPay(true);
    try {
      const amount = Number(booking.TienConLai || booking.TongTien);
      const res = await api<{ paymentUrl: string }>('/vnpay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId: booking.DonHangID,
          amount,
          orderInfo: `Thanh toan don tour ${booking.MaDon} qua VNPay`,
        }),
      });
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể kết nối cổng VNPay Sandbox');
    } finally {
      setLoadingPay(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopySuccess(`Đã sao chép ${label}!`);
      setTimeout(() => setCopySuccess(null), 2500);
    }
  };

  const currentPayAmount = payModalBooking
    ? Number(payModalBooking.TienConLai || payModalBooking.TongTien)
    : 0;

  // Lắng nghe thanh toán từ điện thoại và tự động đóng modal khi hoàn tất
  useEffect(() => {
    if (!payModalBooking?.MaDon) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/bookings/ticket/${payModalBooking.MaDon}`);
        if (res.ok) {
          const data = await res.json();
          if (data.TrangThaiDon === 'Da thanh toan') {
            clearInterval(interval);
            setPayModalBooking(null);
            bookingsApi.reload();
            setToastMsg(`🎉 Đơn hàng ${payModalBooking.MaDon} đã thanh toán thành công qua di động!`);
          }
        }
      } catch (e) {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [payModalBooking]);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      {/* TOAST THÔNG BÁO */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          background: toastMsg.includes('THÀNH CÔNG') || toastMsg.includes('thành công') ? '#10B981' : '#EF4444',
          color: '#FFFFFF',
          padding: '14px 22px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          zIndex: 2000,
          fontSize: '14px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '16px', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {copySuccess && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 700,
          zIndex: 2000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          ✓ {copySuccess}
        </div>
      )}

      <CustomerAccountLayout>
        <div className="card" style={{ padding: '28px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>Đơn Đặt Tour Của Tôi</h2>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                Quản lý hành trình, thanh toán trực tuyến VNPay hoặc giữ chỗ tại quầy, xuất vé điện tử QR Code
              </p>
            </div>
            <Link href="/portal" className="btn btn-outline btn-sm" style={{ fontWeight: 700, color: '#005BAA' }}>
              + Đặt tour mới
            </Link>
          </div>

          {/* ACTIVE UNDERLINE TABS */}
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #E2E8F0', marginBottom: '24px', overflowX: 'auto' }}>
            {tabs.map((t) => {
              const active = statusTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setStatusTab(t.id)}
                  style={{
                    padding: '10px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: active ? '3px solid #005BAA' : '3px solid transparent',
                    color: active ? '#005BAA' : '#64748B',
                    fontWeight: active ? 800 : 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* BOOKING LIST */}
          {filteredBookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredBookings.map((b) => (
                <div key={b.DonHangID} style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#FFFFFF', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="code" style={{ fontSize: '14px', fontWeight: 800, color: '#005BAA' }}>Mã đơn: {b.MaDon}</span>
                      <span style={{ fontSize: '12.5px', color: '#64748B' }}>• Ngày đặt: {date(b.NgayDat)}</span>
                    </div>
                    <Status value={b.TrangThaiDon} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '20px', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.LichKhoiHanh?.Tour?.HinhAnhURL || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500'}
                      alt={b.LichKhoiHanh?.Tour?.TenTour}
                      style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '8px' }}
                    />

                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                        {b.LichKhoiHanh?.Tour?.TenTour}
                      </h4>
                      <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        <span>Khởi hành: <strong style={{ color: '#0F172A' }}>{new Date(b.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong></span>
                        <span>Số khách: <strong>{b.SoLuongNguoiLon} người lớn{b.SoLuongTreEm > 0 ? `, ${b.SoLuongTreEm} trẻ em` : ''}</strong></span>
                        {b.ChiTietHanhKhach && b.ChiTietHanhKhach.length > 0 && (
                          <span style={{ color: '#005BAA' }}>• {b.ChiTietHanhKhach.length} vé danh sách</span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>Tổng thanh toán:</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#005BAA' }}>
                        {vnd(b.TongTien)}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedBooking(b)} style={{ fontWeight: 600 }}>
                          Chi tiết
                        </button>

                        {/* NÚT THANH TOÁN QR NẾU CHỜ THANH TOÁN */}
                        {b.TrangThaiDon === 'Cho thanh toan' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenPayModal(b)}
                            style={{ background: '#005BAA', borderColor: '#005BAA', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <span>💳</span> Thanh toán QR / VNPay
                          </button>
                        )}

                        {/* NÚT XEM VÉ QR CODE NẾU ĐÃ THANH TOÁN */}
                        {(b.TrangThaiDon === 'Da thanh toan' || b.TrangThaiDon === 'Da dat coc') && (
                          <button
                            className="btn btn-sm"
                            onClick={() => setTicketModalBooking(b)}
                            style={{ background: '#10B981', color: '#FFF', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <span>🎟️</span> Vé điện tử QR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              Chưa có đơn đặt tour nào trong mục này.
            </div>
          )}
        </div>
      </CustomerAccountLayout>

      {/* ========================================================================= */}
      {/* 1. MODAL THANH TOÁN: VIETQR QUÉT ĐIỆN THOẠI & VNPAY SANDBOX */}
      {/* ========================================================================= */}
      {payModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Thanh Toán Đơn Tour</h3>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Mã đơn: <strong>{payModalBooking.MaDon}</strong></span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setPayModalBooking(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px', background: '#F8FAFC', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12.5px', color: '#64748B' }}>Số tiền cần thanh toán:</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#005BAA', marginTop: '2px' }}>
                {vnd(currentPayAmount)}
              </div>
            </div>

            {/* TAB CHUYỂN ĐỔI: CỔNG VNPAY vs TIỀN MẶT/THẺ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => setPayTab('VNPAY')}
                style={{
                  padding: '9px',
                  border: 'none',
                  borderRadius: '6px',
                  background: payTab === 'VNPAY' ? '#0284C7' : 'transparent',
                  color: payTab === 'VNPAY' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Cổng VNPay Trực Tuyến
              </button>
              <button
                onClick={() => setPayTab('CASH_CARD')}
                style={{
                  padding: '9px',
                  border: 'none',
                  borderRadius: '6px',
                  background: payTab === 'CASH_CARD' ? '#0284C7' : 'transparent',
                  color: payTab === 'CASH_CARD' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Tiền mặt / Thẻ tại quầy
              </button>
            </div>

            {/* TAB 1: CỔNG VNPAY SANDBOX */}
            {payTab === 'VNPAY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <button
                  onClick={() => handlePayVNPayDirect(payModalBooking)}
                  disabled={loadingPay}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: '#0284C7',
                    borderColor: '#0284C7',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {loadingPay ? 'Đang kết nối cổng VNPay...' : 'Thanh toán ngay qua Cổng VNPay Sandbox →'}
                </button>

                <div style={{
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#78350F',
                  lineHeight: 1.5,
                }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px' }}>Lưu ý kiểm thử cổng VNPay Sandbox:</div>
                  <div style={{ marginBottom: '6px' }}>
                    • Không quét mã QR bằng App Ngân Hàng thật bên ngoài (sẽ báo <em>&quot;Nhà cung cấp không khả dụng&quot;</em> do đây là môi trường thử nghiệm).
                  </div>
                  <div>
                    • Trên giao diện VNPay, chọn mục <strong>&quot;Thẻ nội địa &amp; tài khoản ngân hàng&quot;</strong> → Chọn <strong>NCB</strong> → Nhập thẻ thử nghiệm:
                    <div style={{ background: '#FFFBEB', padding: '6px 8px', borderRadius: '6px', marginTop: '4px', border: '1px solid #FDE68A' }}>
                      Số thẻ: <strong>9704198526191432198</strong><br />
                      Tên chủ thẻ: <strong>NGUYEN VAN A</strong> | Ngày PH: <strong>07/15</strong><br />
                      Mã OTP: <strong>123456</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TIỀN MẶT / THẺ TẠI QUẦY (GIỮ CHỖ) */}
            {payTab === 'CASH_CARD' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '13px',
                  color: '#166534',
                }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '6px', color: '#15803D' }}>
                    Đã ghi nhận yêu cầu giữ chỗ (Thời hạn 24 giờ)
                  </div>
                  <p style={{ margin: '0 0 10px', lineHeight: 1.5 }}>
                    Chuyến đi của Quý khách tiếp tục được bảo lưu trên hệ thống. Quý khách vui lòng đến trực tiếp văn phòng hoặc liên hệ tổng đài để hoàn tất thanh toán trước khi thời hạn kết thúc.
                  </p>
                  <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DCFCE7', fontSize: '12.5px', color: '#1E293B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>Văn phòng VietTour: <strong>Số 40, Đường số 13, KĐT Vạn Phúc, TP. Hồ Chí Minh</strong></div>
                    <div>Hình thức hỗ trợ: <strong>Tiền mặt hoặc Quẹt thẻ POS (ATM / Visa / Mastercard)</strong></div>
                    <div>Hotline hỗ trợ 24/7: <strong style={{ color: '#0284C7' }}>1900 1234</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => setPayModalBooking(null)}
                  className="btn btn-primary"
                  style={{ width: '100%', background: '#0F172A', borderColor: '#0F172A', fontWeight: 700, fontSize: '13px', padding: '11px', borderRadius: '8px' }}
                >
                  Đã hiểu &amp; Đóng cửa sổ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL VÉ ĐIỆN TỬ MÃ QR CODE (E-TICKET BOARDING PASS) */}
      {/* ========================================================================= */}
      {ticketModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Vé Điện Tử & Thẻ Đoàn</h3>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>✓ VÉ HỢP LỆ — ĐÃ THANH TOÁN</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setTicketModalBooking(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {/* MÃ QR VÉ ĐIỆN TỬ: TRỎ ĐẾN LINK CÔNG KHAI TRA CỨU */}
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '14px', border: '2px solid #005BAA', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${originUrl}/portal/ticket/${ticketModalBooking.MaDon}`)}`}
                  alt="Vé điện tử QR Code VietTour"
                  style={{ width: '200px', height: '200px', display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '12.5px', color: '#334155', textAlign: 'center', background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                📱 <strong>Dùng Camera điện thoại quét mã QR</strong> để mở trang xác thực vé điện tử và điểm danh lên xe / máy bay.
              </div>

              <div style={{ width: '100%', background: '#F8FAFC', padding: '14px', borderRadius: '10px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Tour: <strong>{ticketModalBooking.LichKhoiHanh?.Tour?.TenTour}</strong></div>
                <div>Khởi hành: <strong>{new Date(ticketModalBooking.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong></div>
                <div>Mã vé: <code style={{ color: '#005BAA', fontWeight: 700 }}>{ticketModalBooking.MaDon}</code></div>
                <div>Số lượng: <strong>{ticketModalBooking.SoLuongNguoiLon} người lớn{ticketModalBooking.SoLuongTreEm > 0 ? `, ${ticketModalBooking.SoLuongTreEm} trẻ em` : ''}</strong></div>
              </div>

              {/* NÚT MỞ VÉ TOÀN MÀN HÌNH / XEM BOARDING PASS */}
              <Link
                href={`/portal/ticket/${ticketModalBooking.MaDon}`}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', background: '#005BAA', borderColor: '#005BAA', fontSize: '14px', fontWeight: 800, textAlign: 'center', textDecoration: 'none' }}
              >
                ✈️ Xem & In Thẻ Boarding Pass Đầy Đủ
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: '14px', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Chi tiết đơn #{selectedBooking.MaDon}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <div>Tour: <strong>{selectedBooking.LichKhoiHanh?.Tour?.TenTour}</strong></div>
              <div>Thời gian: <strong>{selectedBooking.LichKhoiHanh?.Tour?.ThoiGian}</strong></div>
              <div>Ngày khởi hành: <strong>{new Date(selectedBooking.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong></div>
              <div>Số lượng: <strong>{selectedBooking.SoLuongNguoiLon} người lớn{selectedBooking.SoLuongTreEm > 0 ? `, ${selectedBooking.SoLuongTreEm} trẻ em` : ''}</strong></div>
              <div>Tổng tiền: <strong style={{ color: '#005BAA', fontSize: '16px' }}>{vnd(selectedBooking.TongTien)}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span>Trạng thái:</span>
                <Status value={selectedBooking.TrangThaiDon} />
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setSelectedBooking(null)}>Đóng</button>
              {(selectedBooking.TrangThaiDon === 'Da thanh toan' || selectedBooking.TrangThaiDon === 'Da dat coc') && (
                <Link href={`/portal/ticket/${selectedBooking.MaDon}`} className="btn btn-primary" style={{ background: '#10B981', borderColor: '#10B981', textDecoration: 'none', fontWeight: 700 }}>
                  Xem Vé QR
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <CustomerFooter />
    </div>
  );
}
