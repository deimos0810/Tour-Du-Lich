'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import { useApi, api, downloadFile, getImageUrl, getApiUrl } from '@/lib/api';
import { Status, vnd, date, uiAlert } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, QrCode, X, Check, Plane, Star, AlertTriangle, ShieldCheck, Smartphone, Lock } from 'lucide-react';

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
  KhachHangID?: number;
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
  lanIp?: string | null;
  LichKhoiHanh: {
    MaLich: string;
    NgayKhoiHanh: string;
    NgayKetThuc?: string;
    Tour: { TourID?: number; TenTour: string; HinhAnhURL: string | null; ThoiGian: string; MaTour?: string };
  };
  ChiTietHanhKhach?: Passenger[];
  GhiChu?: string | null;
  DanhGia?: Array<{
    DanhGiaID: number;
    SoSao: number;
    BinhLuan: string | null;
    NgayDanhGia: string;
  }>;
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [statusTab, setStatusTab] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // State quản lý Modal Thanh toán (VNPay & ZaloPay & Tiền mặt/Thẻ tại quầy) & Vé QR Code
  const [payModalBooking, setPayModalBooking] = useState<Booking | null>(null);
  const [payTab, setPayTab] = useState<'VNPAY' | 'ZALOPAY' | 'CASH_CARD'>('VNPAY');
  const [ticketModalBooking, setTicketModalBooking] = useState<Booking | null>(null);
  const [selectedPassengerIdx, setSelectedPassengerIdx] = useState<number>(0);
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
  const [vnpaySynced, setVnpaySynced] = useState(0);

  // Tự động xử lý khi Cổng VNPAY phản hồi quay lại trang (vnp_ResponseCode)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawSearch = window.location.search;
    if (!rawSearch) return;
    const urlParams = new URLSearchParams(rawSearch);
    const vnpRspCode = urlParams.get('vnp_ResponseCode');

    if (vnpRspCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
      if (vnpRspCode === '00') {
        setToastMsg('Thanh toán qua Cổng VNPAY THÀNH CÔNG! Trạng thái đơn đã chuyển sang "Đã thanh toán" & kích hoạt Vé điện tử QR.');
        api(`/vnpay/vnpay_ipn${rawSearch}`)
          .then(() => {
            setVnpaySynced((c) => c + 1);
            void bookingsApi.reload();
          })
          .catch(() => {
            setVnpaySynced((c) => c + 1);
            void bookingsApi.reload();
          });
      } else {
        setToastMsg('Giao dịch thanh toán VNPay không thành công hoặc đã bị hủy.');
      }
    }
  }, []);

  // Đảm bảo sau khi VNPAY IPN hoàn tất và user từ AuthContext đã load xong thì danh sách đơn luôn tự làm mới
  useEffect(() => {
    if (vnpaySynced > 0 && user) {
      void bookingsApi.reload();
    }
  }, [vnpaySynced, user]);

  const isBookingCompleted = (b: Booking) => {
    if (b.TrangThaiDon === 'Da huy') return false;
    const hasReviewed = Boolean(b.DanhGia && b.DanhGia.length > 0);
    const hasCheckedIn = Boolean(b.ChiTietHanhKhach && b.ChiTietHanhKhach.some((p) => p.TrangThaiDiemDanh === 1));
    const lichTrangThai = (b.LichKhoiHanh as any)?.TrangThai;
    const isPastReturn = Boolean(
      b.LichKhoiHanh?.NgayKetThuc && new Date(b.LichKhoiHanh.NgayKetThuc).getTime() <= Date.now(),
    );
    return (
      b.TrangThaiDon === 'Hoan thanh' ||
      lichTrangThai === 'Hoan thanh' ||
      hasReviewed ||
      ((b.TrangThaiDon === 'Da thanh toan' || b.TrangThaiDon === 'Da xac nhan') && (hasCheckedIn || isPastReturn))
    );
  };

  const getEffectiveStatus = (b: Booking) => {
    if (b.TrangThaiDon === 'Da huy') return 'Da huy';
    if (isBookingCompleted(b)) return 'Hoan thanh';
    return b.TrangThaiDon;
  };

  const canCancelBooking = (b: Booking) => {
    const eff = getEffectiveStatus(b);
    if (eff === 'Da huy' || eff === 'Hoan thanh') return false;
    if (b.TrangThaiDon === 'Cho thanh toan') return true;
    const isPastDepart = Boolean(
      b.LichKhoiHanh?.NgayKhoiHanh && new Date(b.LichKhoiHanh.NgayKhoiHanh).getTime() <= Date.now(),
    );
    return !isPastDepart;
  };

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'Cho thanh toan', label: 'Chờ thanh toán' },
    { id: 'Da thanh toan', label: 'Đã thanh toán' },
    { id: 'Hoan thanh', label: 'Đã hoàn thành' },
    { id: 'Da huy', label: 'Đã hủy' },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (statusTab === 'ALL') return true;
    return getEffectiveStatus(b) === statusTab;
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
      const amount = Number(
        booking.TienConLai ?? Math.max(0, Number(booking.TongTien) - Number(booking.GiamGia || 0) - Number(booking.TienCoc || 0)),
      );
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/portal/my-bookings` : undefined;
      const res = await api<{ paymentUrl: string }>('/vnpay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId: booking.DonHangID,
          amount,
          orderInfo: `Thanh toan don tour ${booking.MaDon} qua VNPay`,
          returnUrl,
        }),
      });
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (err) {
      void uiAlert(err instanceof Error ? err.message : 'Không thể kết nối cổng VNPay Sandbox');
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
      void uiAlert(err instanceof Error ? err.message : 'Không thể kết nối cổng ZaloPay Sandbox');
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
      const cid = user?.customerId || (booking as any).KhachHangID;
      const query = cid ? `?customerId=${cid}` : '';
      const data = await api<any>(`/portal/bookings/${booking.DonHangID}/cancel-preview${query}`);
      setCancelPreview(data);
    } catch (e: any) {
      void uiAlert(e.message || 'Lỗi kiểm tra điều kiện hủy tour');
      setCancelModalBooking(null);
    }
  };

  // Xác nhận hủy tour
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    if (!cancelReason.trim()) {
      void uiAlert('Vui lòng nhập lý do hủy tour!');
      return;
    }
    setLoadingCancel(true);
    try {
      const cid = user?.customerId || (cancelModalBooking as any).KhachHangID;
      const res = await api<any>(`/portal/bookings/${cancelModalBooking.DonHangID}/cancel`, {
        method: 'POST',
        body: JSON.stringify({
          customerId: cid,
          lyDo: cancelReason.trim(),
          lyDoHuy: cancelReason.trim(),
        }),
      });
      setToastMsg(
        `Đã hủy đơn ${cancelModalBooking.MaDon} thành công! ${
          res?.hoanTien > 0 ? `Số tiền hoàn trả: ${vnd(res.hoanTien)} (${res.refundPercent || Math.round((res.tyLeHoan || 0) * 100)}%).` : 'Đã giải phóng chỗ giữ trên hệ thống.'
        }`,
      );
      setCancelModalBooking(null);
      void bookingsApi.reload();
    } catch (err: any) {
      void uiAlert(err.message || 'Hủy đơn không thành công');
    } finally {
      setLoadingCancel(false);
    }
  };

  // Gửi đánh giá tour
  const handleSubmitReview = async () => {
    if (!reviewModalBooking) return;
    if (!reviewComment.trim()) {
      void uiAlert('Vui lòng nhập lời nhận xét của bạn về chuyến đi!');
      return;
    }
    setLoadingReview(true);
    try {
      const tourId = (reviewModalBooking.LichKhoiHanh as any)?.Tour?.TourID || (reviewModalBooking.LichKhoiHanh as any)?.TourID || 1;
      const cid = user?.customerId || (reviewModalBooking as any).KhachHangID;
      await api('/portal/reviews', {
        method: 'POST',
        body: JSON.stringify({
          customerId: cid,
          donHangId: reviewModalBooking.DonHangID,
          tourId,
          soSao: reviewRating,
          binhLuan: reviewComment.trim(),
        }),
      });
      setToastMsg(`Cảm ơn bạn đã gửi đánh giá cho chuyến đi ${reviewModalBooking.LichKhoiHanh?.Tour?.TenTour}!`);
      setReviewModalBooking(null);
      setReviewComment('');
      bookingsApi.reload();
    } catch (err: any) {
      void uiAlert(err.message || 'Không thể gửi đánh giá');
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
        const res = await fetch(`${getApiUrl()}/bookings/ticket/${payModalBooking.MaDon}`);
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
                Quản lý hành trình, thanh toán trực tuyến qua cổng VNPAY và xuất vé điện tử QR Code
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span className="code" style={{ fontSize: '14px', fontWeight: 800, color: '#005BAA' }}>Mã đơn: {b.MaDon}</span>
                      <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                        • Đặt lúc: {new Date(b.NgayDat).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {date(b.NgayDat)}
                      </span>
                    </div>
                    <Status value={getEffectiveStatus(b)} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '20px', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(b.LichKhoiHanh?.Tour?.HinhAnhURL) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500'}
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

                        {/* NÚT XEM VÉ QR CODE NẾU ĐÃ THANH TOÁN HOẶC HOÀN THÀNH */}
                        {(b.TrangThaiDon === 'Da thanh toan' || isBookingCompleted(b)) && (
                          <button
                            className="btn btn-sm"
                            onClick={() => {
                              setSelectedPassengerIdx(0);
                              setTicketModalBooking(b);
                            }}
                            style={{ background: 'var(--emerald-600)', color: '#FFF', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                          >
                            <QrCode size={13} strokeWidth={1.5} /> Vé điện tử QR
                          </button>
                        )}

                        {/* NÚT ĐÁNH GIÁ TOUR */}
                        {(b.TrangThaiDon === 'Da thanh toan' || isBookingCompleted(b)) && (
                          b.DanhGia && b.DanhGia.length > 0 ? (
                            <span
                              className="badge"
                              style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '5px 10px' }}
                              title={b.DanhGia[0].BinhLuan || 'Đã đánh giá'}
                            >
                              <Star size={12} fill="#92400E" color="#92400E" /> Đã đánh giá ({b.DanhGia[0].SoSao}★)
                            </span>
                          ) : (
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
                          )
                        )}

                        {/* NÚT HỦY TOUR (CHỈ HIỂN THỊ KHI CHƯA HOÀN THÀNH / CHƯA ĐÁNH GIÁ / CHƯA ĐIỂM DANH / CHƯA HỦY) */}
                        {canCancelBooking(b) && (
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

                  {/* KHUNG HIỂN THỊ LÝ DO HỦY ĐƠN */}
                  {b.TrangThaiDon === 'Da huy' && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '12px 14px',
                        background: '#fff1f2',
                        border: '1.5px solid #fecdd3',
                        borderRadius: '10px',
                        fontSize: '12.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9f1239', fontWeight: 700 }}>
                        <AlertTriangle size={15} color="#e11d48" />
                        <span>Thông tin hủy đơn đặt tour</span>
                      </div>
                      <div style={{ marginTop: '6px', color: '#881337', lineHeight: 1.45 }}>
                        <span style={{ fontWeight: 700 }}>Lý do hủy: </span>
                        {b.GhiChu ? (
                          b.GhiChu.includes('[QUẢN TRỊ VIÊN HỦY]') ? (
                            <span>
                              {b.GhiChu.split('Lý do:')[1]?.trim() || b.GhiChu}
                              <span
                                style={{
                                  display: 'inline-block',
                                  marginLeft: '6px',
                                  background: '#ffe4e6',
                                  color: '#be123c',
                                  padding: '1px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                }}
                              >
                                Hủy bởi Quản trị viên
                              </span>
                            </span>
                          ) : (
                            b.GhiChu
                          )
                        ) : (
                          'Đơn đặt tour đã được hủy theo quy định.'
                        )}
                      </div>
                    </div>
                  )}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '12.5px',
                color: '#475569',
                lineHeight: 1.5,
              }}>
                <ShieldCheck size={20} color="#0F172A" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                    Cổng thanh toán trực tuyến VNPAY
                  </div>
                  <div>
                    Hỗ trợ ứng dụng Ngân hàng quét VNPAY-QR, Thẻ ATM nội địa (Napas) và Thẻ quốc tế (Visa, Master, JCB). Vé điện tử &amp; Mã QR lên đoàn sẽ được kích hoạt ngay sau khi thanh toán thành công.
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePayVNPayDirect(payModalBooking)}
                disabled={loadingPay}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  background: '#0F172A',
                  borderColor: '#0F172A',
                  fontWeight: 700,
                  fontSize: '14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={15} />
                {loadingPay ? 'Đang kết nối cổng VNPay...' : 'Thanh toán qua VNPAY →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL VÉ ĐIỆN TỬ MÃ QR CÁ NHÂN (MỖI KHÁCH CHỈ XEM ĐƯỢC QR CỦA CHÍNH MÌNH) */}
      {/* ========================================================================= */}
      {ticketModalBooking && (() => {
        const passengers = ticketModalBooking.ChiTietHanhKhach ?? [];
        const norm = (s?: string | null) => (s || '').trim().toLowerCase();
        const userNorm = norm(user?.name);
        const myIdx = passengers.findIndex(
          (p) => userNorm && (norm(p.HoTen) === userNorm || norm(p.HoTen).includes(userNorm) || userNorm.includes(norm(p.HoTen))),
        );
        const resolvedIdx = myIdx >= 0 ? myIdx : 0;
        const currentPassenger = passengers[resolvedIdx] ?? null;

        const baseHost = (() => {
          if (typeof window !== 'undefined') {
            const u = new URL(window.location.origin);
            if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && ticketModalBooking.lanIp) {
              u.hostname = ticketModalBooking.lanIp;
            }
            return u.origin;
          }
          return originUrl;
        })();
        const qrTargetUrl = currentPassenger
          ? `${baseHost}/portal/ticket/${ticketModalBooking.MaDon}?khach=${currentPassenger.ChiTietID}`
          : `${baseHost}/portal/ticket/${ticketModalBooking.MaDon}`;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', margin: 0 }}>Vé Điện Tử Cá Nhân &amp; Mã QR</h3>
                  <span style={{ fontSize: '12px', color: 'var(--emerald-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} strokeWidth={2} /> VÉ HỢP LỆ — ĐÃ THANH TOÁN
                  </span>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setTicketModalBooking(null)} style={{ padding: '4px 8px' }}>
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                {/* MÃ QR VÉ ĐIỆN TỬ RIÊNG CỦA CHỦ TÀI KHOẢN */}
                <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(qrTargetUrl)}`}
                    alt="Vé điện tử QR Code VietTour"
                    style={{ width: '190px', height: '190px', display: 'block' }}
                  />
                </div>

                {currentPassenger && (
                  <div style={{ width: '100%', background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #0F172A', fontSize: '12.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>
                        Vé của bạn: {currentPassenger.HoTen} ({currentPassenger.LoaiKhach === 'Nguoi lon' ? 'Người lớn' : 'Trẻ em'})
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Mã vé: <code style={{ color: '#0F172A', fontWeight: 700 }}>{currentPassenger.MaQRVe || `VT-${ticketModalBooking.MaDon}-${resolvedIdx + 1}`}</code>
                        {currentPassenger.CCCD ? ` • CCCD: ${currentPassenger.CCCD}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: currentPassenger.TrangThaiDiemDanh === 1 ? '#F0FDF4' : '#F1F5F9',
                      color: currentPassenger.TrangThaiDiemDanh === 1 ? '#15803D' : '#475569',
                      border: `1px solid ${currentPassenger.TrangThaiDiemDanh === 1 ? '#BBF7D0' : '#CBD5E1'}`,
                    }}>
                      {currentPassenger.TrangThaiDiemDanh === 1 ? '✓ Đã điểm danh' : 'Chưa điểm danh'}
                    </span>
                  </div>
                )}

                {passengers.length > 1 && (
                  <div style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#475569' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Lock size={13} /> Bảo mật chống điểm danh hộ ({passengers.length} khách trong đơn):
                    </div>
                    <div>
                      Mỗi tài khoản chỉ được phép hiển thị <strong>Mã QR cá nhân của chính mình</strong> ({currentPassenger?.HoTen}). Mã QR của {passengers.length - 1} hành khách đi cùng đã được ẩn để tránh điểm danh hộ.
                    </div>
                  </div>
                )}

                <div style={{ width: '100%', background: 'var(--zinc-50)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div>Tour: <strong>{ticketModalBooking.LichKhoiHanh?.Tour?.TenTour}</strong></div>
                  <div>Khởi hành: <strong>{new Date(ticketModalBooking.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong></div>
                  <div>Mã đơn: <code style={{ color: 'var(--zinc-900)', fontWeight: 700 }}>{ticketModalBooking.MaDon}</code> • Tổng đoàn: <strong>{ticketModalBooking.SoLuongNguoiLon} người lớn{ticketModalBooking.SoLuongTreEm > 0 ? `, ${ticketModalBooking.SoLuongTreEm} trẻ em` : ''}</strong></div>
                </div>

                {/* NÚT MỞ VÉ TOÀN MÀN HÌNH */}
                <Link
                  href={currentPassenger ? `/portal/ticket/${ticketModalBooking.MaDon}?khach=${currentPassenger.ChiTietID}` : `/portal/ticket/${ticketModalBooking.MaDon}`}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', background: 'var(--zinc-900)', borderColor: 'var(--zinc-900)', fontSize: '13.5px', fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plane size={14} strokeWidth={1.5} /> Xem &amp; In Thẻ Boarding Pass Chi Tiết
                </Link>
                <button
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '11px', fontSize: '13.5px', fontWeight: 700, color: '#0F172A', borderColor: '#CBD5E1' }}
                  onClick={() => downloadFile(`/export/ticket/pdf/${ticketModalBooking.MaDon}`, `ve-dien-tu-${ticketModalBooking.MaDon}.pdf`).catch((e) => void uiAlert(e instanceof Error ? e.message : 'Không thể tải vé PDF'))}
                >
                  Tải Vé PDF (Boarding Pass)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                <Status value={getEffectiveStatus(selectedBooking)} />
              </div>
              {selectedBooking.TrangThaiDon === 'Da huy' && (
                <div style={{ marginTop: '10px', padding: '12px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', color: '#9f1239' }}>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <AlertTriangle size={14} color="#e11d48" /> Lý do hủy đơn:
                  </div>
                  <div style={{ fontSize: '13px', color: '#881337', lineHeight: 1.45 }}>
                    {selectedBooking.GhiChu?.includes('[QUẢN TRỊ VIÊN HỦY]')
                      ? selectedBooking.GhiChu.split('Lý do:')[1]?.trim() || selectedBooking.GhiChu
                      : selectedBooking.GhiChu || 'Đơn đã bị hủy theo quy định'}
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedBooking(null)}>Đóng</button>
              {canCancelBooking(selectedBooking) && (
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
              {(selectedBooking.TrangThaiDon === 'Da thanh toan' || isBookingCompleted(selectedBooking)) && (
                selectedBooking.DanhGia && selectedBooking.DanhGia.length > 0 ? (
                  <span
                    className="badge"
                    style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12.5px' }}
                    title={selectedBooking.DanhGia[0].BinhLuan || 'Đã đánh giá'}
                  >
                    <Star size={13} fill="#92400E" color="#92400E" /> Đã đánh giá ({selectedBooking.DanhGia[0].SoSao}★)
                  </span>
                ) : (
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
                )
              )}
              {(selectedBooking.TrangThaiDon === 'Da thanh toan' || selectedBooking.TrangThaiDon === 'Da dat coc' || isBookingCompleted(selectedBooking)) && (
                <Link href={`/portal/ticket/${selectedBooking.MaDon}`} className="btn btn-primary btn-sm" style={{ background: 'var(--zinc-900)', borderColor: 'var(--zinc-900)', textDecoration: 'none', fontWeight: 600 }}>
                  Xem Vé QR
                </Link>
              )}
              {(selectedBooking.TrangThaiDon === 'Da thanh toan' || selectedBooking.TrangThaiDon === 'Da dat coc' || isBookingCompleted(selectedBooking)) && (
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontWeight: 600, color: 'var(--rose-600)', borderColor: 'var(--rose-300)' }}
                  onClick={() => downloadFile(`/export/ticket/pdf/${selectedBooking.MaDon}`, `ve-dien-tu-${selectedBooking.MaDon}.pdf`).catch((e) => void uiAlert(e instanceof Error ? e.message : 'Không thể tải vé PDF'))}
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
          <div style={{ maxWidth: '540px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--rose-600)', margin: 0 }}>Hủy Đơn Đặt Tour</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã đơn: <strong>{cancelModalBooking.MaDon}</strong></span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setCancelModalBooking(null)} style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ marginBottom: '14px', background: 'var(--zinc-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '13px' }}>
              <div style={{ fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '4px' }}>
                {cancelModalBooking.LichKhoiHanh?.Tour?.TenTour}
              </div>
              <div style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span>Khởi hành: <strong>{new Date(cancelModalBooking.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong></span>
                <span>Trạng thái đơn: <strong>{cancelModalBooking.TrangThaiDon === 'Cho thanh toan' ? 'Chờ thanh toán' : 'Đã thanh toán'}</strong></span>
              </div>
            </div>

            {cancelPreview ? (
              <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div
                  style={{
                    background: cancelPreview.isUnpaid ? '#ECFDF5' : '#FFFBEB',
                    border: cancelPreview.isUnpaid ? '1px solid #6EE7B7' : '1px solid #FCD34D',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    fontSize: '12.5px',
                    color: cancelPreview.isUnpaid ? '#065F46' : '#92400E',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                    {cancelPreview.isUnpaid ? '✓ Chính sách hủy đơn Chờ thanh toán (Miễn phí 100%):' : 'Chính sách hoàn hủy lữ hành áp dụng:'}
                  </div>
                  <div>
                    • {cancelPreview.policyNote} (Còn <strong>{cancelPreview.daysUntil}</strong> ngày đến ngày khởi hành)
                  </div>
                </div>

                <div style={{ background: 'var(--zinc-50)', borderRadius: 'var(--radius-md)', padding: '12px', border: '1px solid var(--border)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Giá trị đơn đặt chỗ:</span>
                    <strong>{vnd(cancelPreview.tongTienDon ?? cancelModalBooking.TongTien)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Số tiền khách đã đóng:</span>
                    <strong>{vnd(cancelPreview.tienGoc ?? 0)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tỷ lệ hoàn tiền áp dụng:</span>
                    <strong style={{ color: (cancelPreview.refundPercent ?? 0) > 0 ? 'var(--emerald-600)' : 'var(--rose-600)' }}>
                      {cancelPreview.refundPercent ?? 0}%
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phí phạt hủy tour:</span>
                    <span style={{ color: 'var(--rose-600)', fontWeight: 600 }}>{vnd(cancelPreview.tienPhat ?? 0)}</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--zinc-900)' }}>Số tiền hoàn lại cho bạn:</span>
                    <strong style={{ color: 'var(--emerald-600)', fontSize: '16px' }}>{vnd(cancelPreview.tienHoan ?? 0)}</strong>
                  </div>
                </div>

                {/* BẢNG QUY ĐỊNH CƠ CHẾ HOÀN HỦY VIETTOUR RÕ RÀNG */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', fontSize: '11.5px', color: '#475569', lineHeight: 1.55 }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Quy định cơ chế hủy đơn tại VietTour:</div>
                  <div>• <strong>Đơn Chờ thanh toán:</strong> Hủy giữ chỗ miễn phí 100% (Phí phạt 0 đ), hệ thống tự động hoàn trả ghế trống về lịch khởi hành.</div>
                  <div>• <strong>Đơn Đã thanh toán:</strong> Hủy trước ≥ 15 ngày hoàn <strong>100%</strong> | Trước 7–14 ngày hoàn <strong>70%</strong> (phạt 30%) | Trước 3–6 ngày hoàn <strong>50%</strong> (phạt 50%) | Dưới 3 ngày trước giờ khởi hành: <strong>Không hoàn tiền (0%)</strong>.</div>
                  <div>• <strong>Đơn Đã hoàn thành / Đã điểm danh / Đã đánh giá:</strong> Không thể hủy đơn.</div>
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
