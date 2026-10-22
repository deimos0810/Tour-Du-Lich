'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import { useApi, api, downloadFile } from '@/lib/api';
import { Status, vnd, date } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, QrCode, X, Check, Plane, Star } from 'lucide-react';

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
    Tour: { TourID?: number; TenTour: string; HinhAnhURL: string | null; ThoiGian: string; MaTour?: string };
  };
  ChiTietHanhKhach?: Passenger[];
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [statusTab, setStatusTab] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // State quản lý Modal Thanh toán (VNPay & ZaloPay & Tiền mặt/Thẻ tại quầy) & Vé QR Code
  const [payModalBooking, setPayModalBooking] = useState<Booking | null>(null);
  const [payTab, setPayTab] = useState<'VNPAY' | 'ZALOPAY' | 'CASH_CARD'>('VNPAY');
  const [ticketModalBooking, setTicketModalBooking] = useState<Booking | null>(null);
  const [loadingPay, setLoadingPay] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Modal Hủy tour
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelPreview, setCancelPreview] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Modal Đánh giá tour
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [loadingReview, setLoadingReview] = useState(false);

  const bookingsApi = useApi<Booking[]>(user ? `/portal/my-bookings?customerId=${user.customerId ?? 1}` : null);
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

  // Thanh toán ZaloPay trực tiếp điều hướng sang sandbox
  const handlePayZaloPayDirect = async (booking: Booking) => {
    setLoadingPay(true);
    try {
      const amount = Number(booking.TienConLai || booking.TongTien);
      const res = await api<{ order_url: string; return_code: number; return_message: string }>('/zalopay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId: booking.DonHangID,
          amount,
          orderInfo: `Thanh toan don tour ${booking.MaDon} qua ZaloPay`,
        }),
      });
      if (res.order_url) {
        window.location.href = res.order_url;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể kết nối cổng ZaloPay Sandbox');
    } finally {
      setLoadingPay(false);
    }
  };

  // Mở modal hủy tour
  const handleOpenCancelModal = async (booking: Booking) => {
    setCancelModalBooking(booking);
    setCancelReason('');
    setCancelPreview(null);
    try {
      const data = await api<any>(`/portal/bookings/${booking.DonHangID}/cancel-preview`);
      setCancelPreview(data);
    } catch (e: any) {
      alert(e.message || 'Lỗi kiểm tra điều kiện hủy tour');
    }
  };

  // Xác nhận hủy tour
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy tour!');
      return;
    }
    setLoadingCancel(true);
    try {
      const res = await api<any>(`/portal/bookings/${cancelModalBooking.DonHangID}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ lyDoHuy: cancelReason.trim() }),
      });
      setToastMsg(`Đã hủy đơn ${cancelModalBooking.MaDon} thành công. ${res.tienHoan > 0 ? `Tiền hoàn dự kiến: ${vnd(res.tienHoan)}.` : ''}`);
      setCancelModalBooking(null);
      bookingsApi.reload();
    } catch (err: any) {
      alert(err.message || 'Hủy đơn không thành công');
    } finally {
      setLoadingCancel(false);
    }
  };

  // Gửi đánh giá tour
  const handleSubmitReview = async () => {
    if (!reviewModalBooking) return;
    if (!reviewComment.trim()) {
      alert('Vui lòng nhập lời nhận xét của bạn về chuyến đi!');
      return;
    }
    setLoadingReview(true);
    try {
      const tourId = (reviewModalBooking.LichKhoiHanh as any)?.Tour?.TourID || (reviewModalBooking.LichKhoiHanh as any)?.TourID || 1;
      await api('/portal/reviews', {
        method: 'POST',
        body: JSON.stringify({
          donHangId: reviewModalBooking.DonHangID,
          tourId,
          soSao: reviewRating,
          binhLuan: reviewComment.trim(),
        }),
      });
      setToastMsg(`Cảm ơn bạn đã gửi đánh giá cho chuyến đi ${reviewModalBooking.LichKhoiHanh?.Tour?.TenTour}!`);
      setReviewModalBooking(null);
      setReviewComment('');
    } catch (err: any) {
      alert(err.message || 'Không thể gửi đánh giá');
    } finally {
      setLoadingReview(false);
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
            setToastMsg(`Đơn hàng ${payModalBooking.MaDon} đã thanh toán thành công qua di động!`);
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
          background: toastMsg.includes('THÀNH CÔNG') || toastMsg.includes('thành công') ? 'var(--emerald-600)' : 'var(--rose-600)',
          color: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 2000,
          fontSize: '13.5px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {copySuccess && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--zinc-900)',
          color: '#FFFFFF',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 2000,
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Check size={14} strokeWidth={2} />
          <span>{copySuccess}</span>
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

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedBooking(b)} style={{ fontWeight: 500, fontSize: '12.5px' }}>
                          Chi tiết
                        </button>

                        {/* NÚT THANH TOÁN QR NẾU CHỜ THANH TOÁN */}
                        {b.TrangThaiDon === 'Cho thanh toan' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenPayModal(b)}
                            style={{ background: 'var(--zinc-900)', borderColor: 'var(--zinc-900)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                          >
                            <CreditCard size={13} strokeWidth={1.5} /> Thanh toán trực tuyến
                          </button>
                        )}

                        {/* NÚT XEM VÉ QR CODE NẾU ĐÃ THANH TOÁN */}
                        {(b.TrangThaiDon === 'Da thanh toan' || b.TrangThaiDon === 'Da dat coc') && (
                          <button
                            className="btn btn-sm"
                            onClick={() => setTicketModalBooking(b)}
                            style={{ background: 'var(--emerald-600)', color: '#FFF', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                          >
                            <QrCode size={13} strokeWidth={1.5} /> Vé điện tử QR
                          </button>
                        )}

                        {/* NÚT ĐÁNH GIÁ TOUR */}
                        {(b.TrangThaiDon === 'Da thanh toan' || b.TrangThaiDon === 'Hoan thanh') && (
                          <button
                            className="btn btn-sm"
                            onClick={() => {
                              setReviewModalBooking(b);
                              setReviewRating(5);
                              setReviewComment('');
                            }}
                            style={{ background: 'var(--zinc-100)', color: '#B45309', border: '1px solid var(--border)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}
                          >
                            <Star size={13} strokeWidth={1.5} fill="#B45309" color="#B45309" /> Đánh giá
                          </button>
                        )}

                        {/* NÚT HỦY TOUR */}
                        {b.TrangThaiDon !== 'Da huy' && b.TrangThaiDon !== 'Hoan thanh' && (
                          <button
                            className="btn btn-sm"
                            onClick={() => handleOpenCancelModal(b)}
                            style={{ background: 'var(--rose-50)', color: 'var(--rose-600)', border: '1px solid var(--rose-200)', fontWeight: 500, fontSize: '12.5px' }}
                          >
                            Hủy đơn
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '520px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', margin: 0 }}>Thanh Toán Đơn Tour</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã đơn: <strong>{payModalBooking.MaDon}</strong></span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setPayModalBooking(null)} style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px', background: '#F8FAFC', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12.5px', color: '#64748B' }}>Số tiền cần thanh toán:</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#005BAA', marginTop: '2px' }}>
                {vnd(currentPayAmount)}
              </div>
            </div>

            {/* TAB CHUYỂN ĐỔI: VNPAY vs ZALOPAY vs TIỀN MẶT/THẺ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '16px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => setPayTab('VNPAY')}
                style={{
                  padding: '9px 6px',
                  border: 'none',
                  borderRadius: '6px',
                  background: payTab === 'VNPAY' ? '#0284C7' : 'transparent',
                  color: payTab === 'VNPAY' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                VNPay Sandbox
              </button>
              <button
                onClick={() => setPayTab('ZALOPAY')}
                style={{
                  padding: '9px 6px',
                  border: 'none',
                  borderRadius: '6px',
                  background: payTab === 'ZALOPAY' ? '#0068FF' : 'transparent',
                  color: payTab === 'ZALOPAY' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Ví ZaloPay
              </button>
              <button
                onClick={() => setPayTab('CASH_CARD')}
                style={{
                  padding: '9px 6px',
                  border: 'none',
                  borderRadius: '6px',
                  background: payTab === 'CASH_CARD' ? '#0284C7' : 'transparent',
                  color: payTab === 'CASH_CARD' ? '#FFFFFF' : '#475569',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Tại quầy
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

            {/* TAB 2: VÍ ZALOPAY SANDBOX */}
            {payTab === 'ZALOPAY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12.5px',
                  color: '#1E40AF',
                  lineHeight: 1.5,
                }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: '#0068FF', color: '#FFF', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', fontWeight: 900 }}>ZaloPay</span>
                    Cổng Ví Điện Tử ZaloPay Sandbox
                  </div>
                  <div>Thanh toán tức thì bằng App ZaloPay / Ví điện tử hoặc chuyển khoản Napas 24/7. Tự động xác thực giao dịch sau khi hoàn tất.</div>
                </div>

                <button
                  onClick={() => handlePayZaloPayDirect(payModalBooking)}
                  disabled={loadingPay}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: '#0068FF',
                    borderColor: '#0068FF',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {loadingPay ? 'Đang kết nối cổng ZaloPay...' : 'Thanh toán ngay qua Ví ZaloPay Sandbox →'}
                </button>
              </div>
            )}

            {/* TAB 3: TIỀN MẶT / THẺ TẠI QUẦY (GIỮ CHỖ) */}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', margin: 0 }}>Vé Điện Tử & Thẻ Đoàn</h3>
                <span style={{ fontSize: '12px', color: 'var(--emerald-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} strokeWidth={2} /> VÉ HỢP LỆ — ĐÃ THANH TOÁN
                </span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setTicketModalBooking(null)} style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {/* MÃ QR VÉ ĐIỆN TỬ */}
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${originUrl}/portal/ticket/${ticketModalBooking.MaDon}`)}`}
                  alt="Vé điện tử QR Code VietTour"
                  style={{ width: '200px', height: '200px', display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--zinc-600)', textAlign: 'center', background: 'var(--zinc-50)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                Dùng Camera điện thoại quét mã QR để mở trang xác thực vé điện tử và điểm danh lên xe / máy bay.
              </div>

              <div style={{ width: '100%', background: 'var(--zinc-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Tour: <strong>{ticketModalBooking.LichKhoiHanh?.Tour?.TenTour}</strong></div>
                <div>Khởi hành: <strong>{new Date(ticketModalBooking.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong></div>
                <div>Mã vé: <code style={{ color: 'var(--zinc-900)', fontWeight: 700 }}>{ticketModalBooking.MaDon}</code></div>
                <div>Số lượng: <strong>{ticketModalBooking.SoLuongNguoiLon} người lớn{ticketModalBooking.SoLuongTreEm > 0 ? `, ${ticketModalBooking.SoLuongTreEm} trẻ em` : ''}</strong></div>
              </div>

              {/* NÚT MỞ VÉ TOÀN MÀN HÌNH */}
              <Link
                href={`/portal/ticket/${ticketModalBooking.MaDon}`}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', background: 'var(--zinc-900)', borderColor: 'var(--zinc-900)', fontSize: '13.5px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plane size={14} strokeWidth={1.5} /> Xem & In Thẻ Boarding Pass
              </Link>
              <button
                className="btn btn-outline"
                style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '14px', fontWeight: 800, color: '#C8102E', borderColor: '#C8102E' }}
                onClick={() => downloadFile(`/export/ticket/pdf/${ticketModalBooking.MaDon}`, `ve-dien-tu-${ticketModalBooking.MaDon}.pdf`).catch((e) => alert(e instanceof Error ? e.message : 'Không thể tải vé PDF'))}
              >
                Tải Vé PDF (Boarding Pass)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '520px', width: '100%', padding: '24px', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', margin: 0 }}>Chi tiết đơn #{selectedBooking.MaDon}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedBooking(null)} style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div>Tour: <strong>{selectedBooking.LichKhoiHanh?.Tour?.TenTour}</strong></div>
              <div>Thời gian: <strong>{selectedBooking.LichKhoiHanh?.Tour?.ThoiGian}</strong></div>
              <div>Ngày khởi hành: <strong>{new Date(selectedBooking.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong></div>
              <div>Số lượng: <strong>{selectedBooking.SoLuongNguoiLon} người lớn{selectedBooking.SoLuongTreEm > 0 ? `, ${selectedBooking.SoLuongTreEm} trẻ em` : ''}</strong></div>
              <div>Tổng tiền: <strong style={{ color: 'var(--zinc-900)', fontSize: '16px' }}>{vnd(selectedBooking.TongTien)}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span>Trạng thái:</span>
                <Status value={selectedBooking.TrangThaiDon} />
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedBooking(null)}>Đóng</button>
              {selectedBooking.TrangThaiDon !== 'Da huy' && selectedBooking.TrangThaiDon !== 'Hoan thanh' && (
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    handleOpenCancelModal(b);
                  }}
                  style={{ background: 'var(--rose-50)', color: 'var(--rose-600)', border: '1px solid var(--rose-200)', fontWeight: 500 }}
                >
                  Hủy đơn này
                </button>
              )}
              {(selectedBooking.TrangThaiDon === 'Da thanh toan' || selectedBooking.TrangThaiDon === 'Hoan thanh') && (
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    setReviewModalBooking(b);
                    setReviewRating(5);
                    setReviewComment('');
                  }}
                  style={{ background: 'var(--zinc-100)', color: '#B45309', border: '1px solid var(--border)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Star size={13} strokeWidth={1.5} fill="#B45309" color="#B45309" /> Đánh giá
                </button>
              )}
              {(selectedBooking.TrangThaiDon === 'Da thanh toan' || selectedBooking.TrangThaiDon === 'Da dat coc') && (
                <Link href={`/portal/ticket/${selectedBooking.MaDon}`} className="btn btn-primary btn-sm" style={{ background: 'var(--zinc-900)', borderColor: 'var(--zinc-900)', textDecoration: 'none', fontWeight: 600 }}>
                  Xem Vé QR
                </Link>
              )}
              {(selectedBooking.TrangThaiDon === 'Da thanh toan' || selectedBooking.TrangThaiDon === 'Da dat coc') && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontWeight: 600, color: 'var(--rose-600)', borderColor: 'var(--rose-300)' }}
                  onClick={() => downloadFile(`/export/ticket/pdf/${selectedBooking.MaDon}`, `ve-dien-tu-${selectedBooking.MaDon}.pdf`).catch((e) => alert(e instanceof Error ? e.message : 'Không thể tải vé PDF'))}
                >
                  Tải Vé PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL HỦY ĐƠN ĐẶT TOUR & TÍNH PHÍ HOÀN HỦY */}
      {/* ========================================================================= */}
      {cancelModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '520px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rose-600)', margin: 0 }}>Hủy Đơn Đặt Tour</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã đơn: <strong>{cancelModalBooking.MaDon}</strong></span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setCancelModalBooking(null)} style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', background: 'var(--zinc-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '13px' }}>
              <div style={{ fontWeight: 600, color: 'var(--zinc-900)', marginBottom: '4px' }}>
                {cancelModalBooking.LichKhoiHanh?.Tour?.TenTour}
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                Khởi hành: <strong>{new Date(cancelModalBooking.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong>
              </div>
            </div>

            {cancelPreview ? (
              <div style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '12.5px', color: '#92400E' }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>Chính sách hủy lữ hành áp dụng:</div>
                  <div>• {cancelPreview.policyNote} (Còn <strong>{cancelPreview.daysUntil}</strong> ngày đến ngày đi)</div>
                </div>

                <div style={{ background: 'var(--zinc-50)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--border)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tổng tiền đã đóng:</span>
                    <strong>{vnd(cancelPreview.tienGoc)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn tiền:</span>
                    <strong style={{ color: cancelPreview.refundPercent > 0 ? 'var(--emerald-600)' : 'var(--rose-600)' }}>{cancelPreview.refundPercent}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phí phạt hủy tour:</span>
                    <span style={{ color: 'var(--rose-600)', fontWeight: 600 }}>{vnd(cancelPreview.tienPhat)}</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--zinc-900)' }}>Số tiền hoàn lại cho bạn:</span>
                    <strong style={{ color: 'var(--emerald-600)', fontSize: '16px' }}>{vnd(cancelPreview.tienHoan)}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Đang kiểm tra chính sách hoàn hủy...
              </div>
            )}

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--zinc-900)', marginBottom: '6px' }}>
                Lý do hủy tour (Bắt buộc):
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Nhập lý do bạn muốn hủy đơn (VD: Việc bận đột xuất, thay đổi kế hoạch cá nhân...)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{ width: '100%', fontSize: '13px', padding: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setCancelModalBooking(null)} disabled={loadingCancel}>
                Đóng
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleConfirmCancel}
                disabled={loadingCancel || !cancelReason.trim()}
                style={{ background: 'var(--rose-600)', borderColor: 'var(--rose-600)', fontWeight: 600 }}
              >
                {loadingCancel ? 'Đang xử lý...' : 'Xác Nhận Hủy Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL ĐÁNH GIÁ CHẤT LƯỢNG TOUR */}
      {/* ========================================================================= */}
      {reviewModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '500px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', margin: 0 }}>Đánh Giá Chuyến Đi</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đơn hàng: <strong>{reviewModalBooking.MaDon}</strong></span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setReviewModalBooking(null)} style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }}>
              <div style={{ fontWeight: 800, color: '#0F172A' }}>
                {reviewModalBooking.LichKhoiHanh?.Tour?.TenTour}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                Bạn cảm thấy chuyến đi như thế nào?
              </label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '32px',
                      cursor: 'pointer',
                      transform: star <= reviewRating ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.15s',
                      filter: star <= reviewRating ? 'none' : 'grayscale(100%) opacity(30%)',
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#F59E0B', marginTop: '6px' }}>
                {reviewRating === 5 && 'Xuất sắc (5 sao)'}
                {reviewRating === 4 && 'Rất hài lòng (4 sao)'}
                {reviewRating === 3 && 'Bình thường (3 sao)'}
                {reviewRating === 2 && 'Cần cải thiện (2 sao)'}
                {reviewRating === 1 && 'Không hài lòng (1 sao)'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                Nhận xét chi tiết (Hướng dẫn viên, khách sạn, đồ ăn...):
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Chia sẻ nhận xét của bạn về trải nghiệm thực tế..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ width: '100%', fontSize: '13px', padding: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setReviewModalBooking(null)} disabled={loadingReview}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitReview}
                disabled={loadingReview || !reviewComment.trim()}
                style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800 }}
              >
                {loadingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerFooter />
    </div>
  );
}
