'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { api, getImageUrl, useApi, getApiUrl } from '@/lib/api';
import { bookingSchema, firstError } from '@/lib/validations';
import { vnd } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import { Plane, Building2, Utensils, ShieldCheck, Check, X, CheckCircle2, Star, Lock, Smartphone } from 'lucide-react';

type Review = {
  DanhGiaID: number;
  SoSao: number;
  BinhLuan: string | null;
  NgayDanhGia: string;
  KhachHang?: { HoTen: string };
};

type Tour = {
  TourID: number;
  MaTour: string;
  TenTour: string;
  DiemKhoiHanh: string | null;
  DiemDen: string;
  ThoiGian: string;
  GiaNguoiLon: string;
  GiaTreEm: string;
  PhuongTien: string | null;
  HinhAnhURL: string | null;
  MoTaChiTiet: string | null;
  LichTrinh: string | null;
  DanhMuc: { TenDanhMuc: string };
  LichKhoiHanh: { LichID: number; MaLich: string; NgayKhoiHanh: string; SoChoToiDa: number; SoChoDaDat: number }[];
  DanhGia?: Review[];
};

type PassengerInput = {
  hoTen: string;
  gioiTinh: string;
  cccd: string;
};

export default function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tourId = resolvedParams.id;
  const { user } = useAuth();

  const tourApi = useApi<Tour>(`/tours/${tourId}`);
  const vouchersApi = useApi<Array<{
    VoucherID: number;
    MaVoucher: string;
    TenChuongTrinh: string;
    PhanTramGiam: number | string;
    GiamToiDa: number | string;
    GiaTriDonToiThieu: number | string;
    NgayKetThuc: string;
    ApDungVoucher?: Array<{ Tour: { TourID: number } }>;
  }>>('/portal/vouchers');
  const tour = tourApi.data;

  // Đồng hồ thời gian thực (mỗi 1 giây) để tự động gỡ khuyến mãi/voucher ngay khi hết hạn (ngày, giờ, giây)
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const rawPromo = (tour as any)?.KhuyenMai;
  const activePromo =
    rawPromo && new Date(rawPromo.NgayKetThuc).getTime() > nowTs ? rawPromo : null;

  const formatPromoCountdown = (endIso: string) => {
    const diff = new Date(endIso).getTime() - nowTs;
    if (diff <= 0) return 'Đã kết thúc';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (days > 0) {
      return `Còn ${days} ngày ${hours} giờ (đến ${new Date(endIso).toLocaleDateString('vi-VN')})`;
    }
    return `Còn ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const validVouchersForTour = (vouchersApi.data || []).filter((v) => {
    const endMs = new Date(v.NgayKetThuc).getTime() + 86400000 - 1;
    if (nowTs > endMs) return false;
    if (v.ApDungVoucher && v.ApDungVoucher.length > 0 && tour) {
      return v.ApDungVoucher.some((a) => a.Tour.TourID === tour.TourID);
    }
    return true;
  });

  // Booking states
  const [selectedLichId, setSelectedLichId] = useState<number | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);

  // Passengers list with CCCD
  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { hoTen: user?.name || '', gioiTinh: 'Nam', cccd: '' }
  ]);

  // Modal Thanh toán sau khi đặt tour thành công
  const [createdBooking, setCreatedBooking] = useState<{ MaDon: string; TongTien: number; DonHangID: number } | null>(null);
  const [payMethod, setPayMethod] = useState<'VNPAY' | 'ZALOPAY' | 'CASH_CARD'>('VNPAY');
  const [loadingVnpay, setLoadingVnpay] = useState(false);
  const [loadingZalopay, setLoadingZalopay] = useState(false);
  const [confirmingPay, setConfirmingPay] = useState(false);

  const handlePayVNPay = async (donHangId: number, amount: number, maDon: string) => {
    try {
      setLoadingVnpay(true);
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/portal/my-bookings` : undefined;
      const res = await api<{ paymentUrl: string }>('/vnpay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId,
          amount,
          orderInfo: `Thanh toan don tour ${maDon} qua VNPay`,
          returnUrl,
        }),
      });
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (err: any) {
      alert('Không thể kết nối cổng VNPay: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setLoadingVnpay(false);
    }
  };

  const handlePayZaloPay = async (donHangId: number, amount: number, maDon: string) => {
    try {
      setLoadingZalopay(true);
      const res = await api<{ order_url: string }>('/zalopay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId,
          amount,
          orderInfo: `Thanh toan don tour ${maDon} qua ZaloPay`,
        }),
      });
      if (res.order_url) {
        window.location.href = res.order_url;
      }
    } catch (err: any) {
      alert('Không thể kết nối cổng ZaloPay: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setLoadingZalopay(false);
    }
  };

  // Review states
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Image lightbox preview
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Filter out past / expired departures
  const [hideExpired, setHideExpired] = useState(true);

  const isDepartureExpired = (l: { NgayKhoiHanh: string; TrangThai?: string }) => {
    const isPast = new Date(l.NgayKhoiHanh).getTime() < Date.now();
    const isClosed = ['Dong', 'Hoan thanh', 'Huy'].includes(l.TrangThai || '');
    return isPast || isClosed;
  };

  const allDepartures = tour?.LichKhoiHanh || [];
  const validDepartures = allDepartures.filter((l) => (hideExpired ? !isDepartureExpired(l) : true));

  // Determine active departure: pick first non-expired with remaining seats
  const defaultDeparture =
    allDepartures.find((l) => !isDepartureExpired(l) && l.SoChoToiDa - l.SoChoDaDat > 0) ||
    validDepartures[0] ||
    allDepartures[0] ||
    null;

  const activeLichId = selectedLichId !== null ? selectedLichId : defaultDeparture?.LichID || null;
  const activeSchedule = allDepartures.find((l) => l.LichID === activeLichId) || defaultDeparture;

  const totalSlots = activeSchedule ? activeSchedule.SoChoToiDa : 0;
  const bookedSeats = activeSchedule ? activeSchedule.SoChoDaDat : 0;
  const remainingSeats = activeSchedule ? Math.max(0, activeSchedule.SoChoToiDa - activeSchedule.SoChoDaDat) : 0;
  const totalGuestsSelected = adults + children;
  const isScheduleExpired = activeSchedule ? isDepartureExpired(activeSchedule) : false;
  const isSoldOut = activeSchedule ? remainingSeats === 0 : false;
  const isExceededSeats = activeSchedule ? totalGuestsSelected > remainingSeats : false;
  const canBook = Boolean(activeSchedule && !isScheduleExpired && !isSoldOut && !isExceededSeats);

  const syncPassengersCount = (newAdults: number, newChildren: number) => {
    const total = newAdults + newChildren;
    setPassengers((prev) => {
      const next = [...prev];
      if (next.length < total) {
        for (let i = next.length; i < total; i++) {
          next.push({ hoTen: '', gioiTinh: 'Nam', cccd: '' });
        }
      } else if (next.length > total) {
        return next.slice(0, total);
      }
      return next;
    });
  };

  const giaNL = activePromo ? Number(activePromo.GiaNguoiLonKM) : Number(tour?.GiaNguoiLon || 0);
  const giaTE = activePromo ? Number(activePromo.GiaTreEmKM) : Number(tour?.GiaTreEm || 0);
  const rawTotal = tour ? giaNL * adults + giaTE * children : 0;
  const finalTotal = Math.max(rawTotal - voucherDiscount, 0);

  // Tự động kiểm tra lại điều kiện mã giảm giá khi tổng tiền thay đổi hoặc mã hết hạn
  useEffect(() => {
    if (!voucherApplied || !voucherCode.trim()) return;
    const matched = validVouchersForTour.find((v) => v.MaVoucher.toUpperCase() === voucherCode.trim().toUpperCase());
    if (matched && rawTotal < Number(matched.GiaTriDonToiThieu)) {
      setVoucherDiscount(0);
      setVoucherApplied(null);
      setVoucherError(`Đơn tối thiểu ${vnd(matched.GiaTriDonToiThieu)} để áp dụng mã ${matched.MaVoucher}`);
    } else if (matched) {
      const recomputed = Math.min(Math.round((rawTotal * Number(matched.PhanTramGiam)) / 100), Number(matched.GiamToiDa));
      setVoucherDiscount(recomputed);
      setVoucherApplied(`${matched.TenChuongTrinh} (-${vnd(recomputed)})`);
    }
  }, [rawTotal, nowTs]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setValidatingVoucher(true);
    setVoucherError(null);
    try {
      const res = await api<{ valid: boolean; giamGia: number; tenChuongTrinh: string }>(
        '/bookings/voucher/validate',
        {
          method: 'POST',
          body: JSON.stringify({
            maKhuyenMai: voucherCode.trim().toUpperCase(),
            tongTien: rawTotal,
            tourId: tour?.TourID,
          }),
        }
      );
      setVoucherDiscount(res.giamGia);
      setVoucherApplied(`Áp dụng thành công: ${res.tenChuongTrinh} (-${vnd(res.giamGia)})`);
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'Mã không hợp lệ hoặc không đủ điều kiện');
      setVoucherDiscount(0);
      setVoucherApplied(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleBooking = async () => {
    if (!tour || !activeLichId) {
      alert('Vui lòng chọn ngày khởi hành!');
      return;
    }

    if (!canBook) {
      if (isScheduleExpired) {
        alert('Lịch khởi hành này đã qua ngày hoặc đã đóng nhận khách!');
      } else if (isSoldOut) {
        alert('Chuyến đi này đã kín chỗ (Hết ghế trống)!');
      } else if (isExceededSeats) {
        alert(`Số lượng khách (${totalGuestsSelected} khách) vượt quá số ghế trống còn lại (${remainingSeats} chỗ)! Vui lòng giảm số khách.`);
      }
      return;
    }

    if (!user?.customerId) {
      alert('Vui lòng đăng nhập tài khoản khách hàng để đặt tour!');
      return;
    }
    const invalid = firstError(bookingSchema, {
      soLuongNguoiLon: adults,
      soLuongTreEm: children,
      hanhKhach: passengers.map((p) => ({ hoTen: p.hoTen, cccd: p.cccd.trim() })),
    });
    if (invalid) {
      alert(invalid);
      return;
    }

    setBookingLoading(true);
    try {
      const customerId = user.customerId;
      const res = await api<{ MaDon: string; TongTien: string; DonHangID: number }>(
        '/auth/customer-booking',
        {
          method: 'POST',
          body: JSON.stringify({
            khachHangId: customerId,
            lichId: activeLichId,
            soLuongNguoiLon: adults,
            soLuongTreEm: children,
            ghiChu: `Khách đặt trực tuyến từ trang chi tiết #${tour.MaTour}`,
            maKhuyenMai: voucherApplied ? voucherCode.trim().toUpperCase() : undefined,
            hanhKhach: passengers.map((p, idx) => ({
              hoTen: p.hoTen.trim() || `Hành khách ${idx + 1}`,
              gioiTinh: p.gioiTinh,
              cccd: p.cccd.trim() || undefined,
              loaiKhach: idx < adults ? 'Nguoi lon' : 'Tre em',
            })),
          }),
        }
      );

      setCreatedBooking({
        MaDon: res.MaDon,
        TongTien: Number(res.TongTien) - voucherDiscount,
        DonHangID: res.DonHangID,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Đặt tour thất bại');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userComment.trim()) return;
    setSubmittingReview(true);
    setTimeout(() => {
      setSubmittingReview(false);
      setReviewSuccess(true);
      setUserComment('');
    }, 800);
  };

  type ItineraryDayItem = {
    day?: number;
    title: string;
    detail: string;
    image?: string | null;
    highlights?: string[];
    meals?: string | null;
  };

  const parseItineraryDays = (raw: string | null): ItineraryDayItem[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          day: item.day || idx + 1,
          title: item.title || `Ngày ${idx + 1}`,
          detail: item.detail || '',
          image: item.image || null,
          highlights: Array.isArray(item.highlights) ? item.highlights : [],
          meals: item.meals || null,
        }));
      }
    } catch {
      // fallback to plain text parsing
    }

    const lines = raw.split(/\r?\n|•/).map((l) => l.trim()).filter(Boolean);
    return lines.map((l, idx) => {
      const parts = l.split(':');
      if (parts.length >= 2) {
        return { day: idx + 1, title: parts[0].trim(), detail: parts.slice(1).join(':').trim() };
      }
      return { day: idx + 1, title: `Ngày ${idx + 1}`, detail: l };
    });
  };

  const getDayImage = (item: ItineraryDayItem, idx: number, destination?: string | null) => {
    if (item.image) return getImageUrl(item.image);
    const dest = (destination || '').toLowerCase();
    if (dest.includes('đà nẵng') || dest.includes('da nang')) {
      const imgs = [
        'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
        'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
        'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=800',
      ];
      return imgs[idx % imgs.length];
    }
    if (dest.includes('sapa') || dest.includes('lào cai')) {
      const imgs = [
        'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
        'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800',
      ];
      return imgs[idx % imgs.length];
    }
    if (dest.includes('nhật') || dest.includes('tokyo') || dest.includes('japan')) {
      const imgs = [
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800',
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
        'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
        'https://images.unsplash.com/photo-1478436127897-769e00d0c715?w=800',
        'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800',
        'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
      ];
      return imgs[idx % imgs.length];
    }
    if (dest.includes('hạ long') || dest.includes('quảng ninh')) {
      const imgs = [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
        'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
      ];
      return imgs[idx % imgs.length];
    }
    if (dest.includes('phú quốc')) {
      const imgs = [
        'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
        'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      ];
      return imgs[idx % imgs.length];
    }
    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800';
  };

  const itineraryDays = parseItineraryDays(tour?.LichTrinh || null);

  // Polling tự động kiểm tra trạng thái thanh toán từ điện thoại
  useEffect(() => {
    if (!createdBooking?.MaDon) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/bookings/ticket/${createdBooking.MaDon}`);
        if (res.ok) {
          const data = await res.json();
          if (data.TrangThaiDon === 'Da thanh toan') {
            clearInterval(interval);
            alert(`Giao dịch thành công trên điện thoại! Đã kích hoạt vé điện tử cho mã đơn ${createdBooking.MaDon}.`);
            window.location.href = `/portal/ticket/${createdBooking.MaDon}`;
          }
        }
      } catch (e) {
        // ignore network error
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [createdBooking]);

  if (tourApi.loading) {
    return (
      <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CustomerHeader />
        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#005BAA', fontWeight: 700 }}>
          Đang tải thông tin chi tiết tour du lịch...
        </div>
        <CustomerFooter />
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <CustomerHeader />
        <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Không tìm thấy tour du lịch</h2>
          <Link href="/portal" className="btn btn-primary">Quay lại trang chủ</Link>
        </div>
        <CustomerFooter />
      </div>
    );
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <main style={{ flex: 1, paddingBottom: '60px' }}>
        {/* BREADCRUMB */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '14px 0' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', fontSize: '13.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/portal" style={{ color: '#005BAA', textDecoration: 'none', fontWeight: 600 }}>Trang chủ</Link>
            <span>/</span>
            <Link href="/portal" style={{ color: '#005BAA', textDecoration: 'none', fontWeight: 600 }}>Tour du lịch</Link>
            <span>/</span>
            <span style={{ color: '#0F172A', fontWeight: 700 }}>{tour.TenTour}</span>
          </div>
        </div>

        {/* HERO TITLE & GALLERY */}
        <div style={{ maxWidth: '1280px', margin: '24px auto 0', padding: '0 24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--zinc-900)', color: '#FFF', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-sm)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Plane size={12} strokeWidth={1.5} /> BAO GỒM VÉ MÁY BAY KHỨ HỒI
              </span>
              <span style={{ background: 'var(--zinc-100)', color: '#B45309', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Star size={12} strokeWidth={1.5} fill="#B45309" color="#B45309" /> 5.0 (Xuất sắc)
              </span>
              <span className="code" style={{ fontSize: '12px', fontWeight: 600 }}>Mã tour: {tour.MaTour}</span>
              {activePromo && (
                <span style={{ background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>Ưu đãi -{activePromo.PhanTramGiam}% • {activePromo.TenChuongTrinh}</span>
                  <span style={{ color: '#92400E', fontWeight: 500, fontSize: '11.5px' }}>({formatPromoCountdown(activePromo.NgayKetThuc)})</span>
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              {tour.TenTour}
            </h1>
          </div>

          {/* LARGE PHOTO BANNER */}
          <div style={{
            position: 'relative',
            height: '400px',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            marginBottom: '32px'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(tour.HinhAnhURL) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'}
              alt={tour.TenTour}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, insetInline: 0,
              background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 100%)',
              padding: '24px 30px', display: 'flex', gap: '30px', color: '#FFFFFF', flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: '#CBD5E1', display: 'block' }}>Thời gian:</span>
                <strong style={{ fontSize: '16px' }}>{tour.ThoiGian}</strong>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#CBD5E1', display: 'block' }}>Khởi hành từ:</span>
                <strong style={{ fontSize: '16px' }}>{tour.DiemKhoiHanh || 'TP. Hồ Chí Minh'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#CBD5E1', display: 'block' }}>Điểm đến:</span>
                <strong style={{ fontSize: '16px' }}>{tour.DiemDen}</strong>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#CBD5E1', display: 'block' }}>Phương tiện:</span>
                <strong style={{ fontSize: '16px' }}>{tour.PhuongTien || 'Hàng không Vietnam Airlines / Vietjet Air'}</strong>
              </div>
            </div>
          </div>

          {/* MAIN 2-COLUMN LAYOUT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '36px', alignItems: 'start' }}>
            {/* LEFT COLUMN: TABS & DETAILS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* 1. ĐIỂM NỔI BẬT */}
              <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '14px' }}>
                  Điểm nổi bật của hành trình
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: 'var(--zinc-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--zinc-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Plane size={15} strokeWidth={1.5} /> Vé máy bay khứ hồi
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Đầy đủ 20kg ký gửi + 7kg xách tay tiêu chuẩn hàng không.</p>
                  </div>
                  <div style={{ background: 'var(--zinc-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--zinc-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Building2 size={15} strokeWidth={1.5} /> Khách sạn 4 sao cao cấp
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Nghỉ dưỡng tiện nghi, view đẹp, kèm buffet sáng hàng ngày.</p>
                  </div>
                  <div style={{ background: 'var(--zinc-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--zinc-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Utensils size={15} strokeWidth={1.5} /> Ẩm thực đặc sản chọn lọc
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Thưởng thức các bữa ăn đặc sản địa phương phong phú.</p>
                  </div>
                  <div style={{ background: 'var(--zinc-50)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--zinc-900)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={15} strokeWidth={1.5} /> Bảo hiểm du lịch tối đa 120Tr
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>An tâm tuyệt đối trong suốt chuyến đi.</p>
                  </div>
                </div>
              </div>

              {/* 2. LỊCH TRÌNH THEO NGÀY (TIMELINE WITH IMAGES) */}
              <div style={{ padding: '28px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>📸</span> Lịch trình chi tiết từng ngày & Hình ảnh thực tế
                    </h2>
                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                      Hình ảnh chụp thực tế tại các thắng cảnh & điểm dừng chân tiêu chuẩn cao cấp
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#EFF6FF', color: '#0284C7', padding: '6px 14px', borderRadius: '20px', border: '1px solid #BFDBFE' }}>
                    {itineraryDays.length} ngày hành trình
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {itineraryDays.map((item, idx) => {
                    const imgUrl = getDayImage(item, idx, tour.DiemDen);
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '260px 1fr',
                          gap: '20px',
                          background: '#F8FAFC',
                          borderRadius: '14px',
                          border: '1px solid #E2E8F0',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        }}
                      >
                        {/* Ảnh ngày */}
                        <div
                          style={{
                            position: 'relative',
                            height: '100%',
                            minHeight: '190px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            background: '#0F172A',
                          }}
                          onClick={() => setPreviewImage({ url: imgUrl, title: item.title })}
                          title="Nhấn để phóng to ảnh chi tiết"
                        >
                          <img
                            src={imgUrl}
                            alt={item.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.4s ease',
                              display: 'block',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '12px',
                              left: '12px',
                              background: 'rgba(15, 23, 42, 0.88)',
                              color: '#FFFFFF',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 800,
                              letterSpacing: '0.5px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                          >
                            NGÀY {item.day || idx + 1}
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '10px',
                              right: '10px',
                              background: 'rgba(0, 0, 0, 0.65)',
                              color: '#FFF',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backdropFilter: 'blur(4px)',
                            }}
                          >
                            🔍 Phóng to ảnh
                          </div>
                        </div>

                        {/* Nội dung ngày */}
                        <div style={{ padding: '16px 20px 16px 4px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', marginBottom: '8px', lineHeight: 1.4 }}>
                              {item.title}
                            </h3>
                            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.7, margin: 0 }}>
                              {item.detail}
                            </p>
                          </div>

                          {/* Highlights & Meals Tags */}
                          <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {item.highlights && item.highlights.map((h, i) => (
                              <span key={i} style={{ background: '#E0F2FE', color: '#0369A1', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                                📍 {h}
                              </span>
                            ))}
                            {item.meals && (
                              <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                                🍽️ {item.meals}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. DỊCH VỤ BAO GỒM & KHÔNG BAO GỒM */}
              <div style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '16px' }}>
                  Điều khoản Dịch vụ
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', lineHeight: 1.7 }}>
                  <div>
                    <h4 style={{ color: 'var(--emerald-600)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} strokeWidth={2} /> Giá tour bao gồm:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--zinc-600)' }}>
                      <li>Vé máy bay khứ hồi (20kg ký gửi + 7kg xách tay)</li>
                      <li>Khách sạn 4 sao tiêu chuẩn (2 khách/phòng)</li>
                      <li>Xe du lịch máy lạnh đưa đón suốt tuyến</li>
                      <li>Các bữa ăn theo lịch trình</li>
                      <li>Vé tham quan các thắng cảnh nổi tiếng</li>
                      <li>Bảo hiểm du lịch tối đa 120.000.000 VNĐ</li>
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--rose-600)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <X size={14} strokeWidth={2} /> Không bao gồm:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--zinc-600)' }}>
                      <li>Chi phí cá nhân: giặt ủi, minibar, đồ uống ngoài</li>
                      <li>Phụ thu phòng đơn (nếu ở 1 mình)</li>
                      <li>Tiền tip bồi dưỡng cho HDV và tài xế</li>
                      <li>Thuế VAT (xuất hóa đơn theo yêu cầu)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4. CHÍNH SÁCH HOÀN HỦY TOUR THEO BÁO CÁO WORD */}
              <div className="card" style={{ padding: '26px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>
                  Chính sách Phạt Hủy Tour (Theo Hợp Đồng Lữ Hành)
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '14px' }}>
                  Căn cứ theo mốc thời gian khách hàng gửi yêu cầu hủy so với ngày khởi hành:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <span>Hủy trước <strong>15 ngày</strong> trước ngày khởi hành:</span>
                    <strong style={{ color: '#059669' }}>Phí phạt 0% (Hoàn 100% tiền cọc)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <span>Hủy từ <strong>8 đến 14 ngày</strong> trước ngày khởi hành:</span>
                    <strong style={{ color: '#F59E0B' }}>Phí phạt 30% tổng giá tour</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <span>Hủy từ <strong>4 đến 7 ngày</strong> trước ngày khởi hành:</span>
                    <strong style={{ color: '#EA580C' }}>Phí phạt 50% tổng giá tour</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px' }}>
                    <span>Hủy từ <strong>1 đến 3 ngày</strong> hoặc ngày khởi hành:</span>
                    <strong style={{ color: '#DC2626' }}>Phí phạt 100% (Không hoàn tiền)</strong>
                  </div>
                </div>
              </div>

              {/* 5. ĐÁNH GIÁ NHẬN XÉT */}
              <div className="card" style={{ padding: '26px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Đánh giá từ du khách
                  </h2>
                  <span style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '13px' }}>
                    ⭐ 5.0 / 5
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tour.DanhGia && tour.DanhGia.length > 0 ? (
                    tour.DanhGia.map((r) => (
                      <div key={r.DanhGiaID} style={{ padding: '12px 16px', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '14px', color: '#0F172A' }}>{r.KhachHang?.HoTen || 'Khách hàng VietTour'}</strong>
                          <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>{new Date(r.NgayDanhGia).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div style={{ color: '#F59E0B', fontSize: '12px', marginBottom: '4px' }}>{'⭐'.repeat(r.SoSao)}</div>
                        <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{r.BinhLuan}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#F8FAFC', fontSize: '13px', color: '#64748B' }}>
                      Chuyến đi tuyệt vời, hướng dẫn viên chuyên nghiệp và tận tình. 5 sao cho VietTour!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY BOOKING BOX */}
            <div style={{ position: 'sticky', top: '88px' }}>
              <div style={{ padding: '24px', borderRadius: '14px', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)' }}>
                {/* 1. HEADER GIÁ TOUR */}
                <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
                      {activePromo ? 'Giá ưu đãi trọn gói / khách:' : 'Giá trọn gói từ / khách:'}
                    </span>
                    {activePromo && (
                      <span style={{ background: '#FEF2F2', color: '#BE123C', border: '1px solid #FECDD3', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        Tiết kiệm {activePromo.PhanTramGiam}%
                      </span>
                    )}
                  </div>
                  {activePromo ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                          {vnd(activePromo.GiaNguoiLonKM)}
                        </span>
                        <span style={{ fontSize: '14px', color: '#94A3B8', textDecoration: 'line-through', fontWeight: 500 }}>
                          {vnd(tour.GiaNguoiLon)}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '4px', fontWeight: 500 }}>
                        {activePromo.TenChuongTrinh} • {formatPromoCountdown(activePromo.NgayKetThuc)}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                      {vnd(tour.GiaNguoiLon)}
                    </div>
                  )}
                </div>

                {/* 2. CHỌN LỊCH KHỞI HÀNH */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                      Đợt khởi hành
                    </label>
                    <label style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={hideExpired}
                        onChange={(e) => setHideExpired(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: '#0F172A' }}
                      />
                      <span>Ẩn lịch đã qua</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto', paddingRight: '2px' }}>
                    {validDepartures.length > 0 ? (
                      validDepartures.map((l) => {
                        const isSelected = l.LichID === activeLichId;
                        const expired = isDepartureExpired(l);
                        const remaining = Math.max(0, l.SoChoToiDa - l.SoChoDaDat);
                        const isFull = remaining === 0;

                        return (
                          <div
                            key={l.LichID}
                            onClick={() => !expired && setSelectedLichId(l.LichID)}
                            style={{
                              padding: '11px 13px',
                              borderRadius: '10px',
                              border: isSelected ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                              background: isSelected ? '#F8FAFC' : expired ? '#F8FAFC' : '#FFFFFF',
                              cursor: expired ? 'not-allowed' : 'pointer',
                              opacity: expired ? 0.55 : 1,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                                  {new Date(l.NgayKhoiHanh).toLocaleDateString('vi-VN')}
                                </span>
                                <span style={{ fontSize: '11.5px', color: '#64748B', fontFamily: 'monospace' }}>
                                  {l.MaLich}
                                </span>
                              </div>
                              <div>
                                {expired ? (
                                  <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                                    Đã đóng
                                  </span>
                                ) : isFull ? (
                                  <span style={{ background: '#FEF2F2', color: '#991B1B', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                                    Hết chỗ
                                  </span>
                                ) : remaining <= 5 ? (
                                  <span style={{ background: '#FFFBEB', color: '#92400E', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                                    Còn {remaining} chỗ
                                  </span>
                                ) : (
                                  <span style={{ background: '#ECFDF5', color: '#065F46', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                                    Còn {remaining} chỗ
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
                              <span>Đã đăng ký: <strong style={{ color: '#334155', fontWeight: 600 }}>{l.SoChoDaDat} khách</strong></span>
                              <span>Quy mô đoàn: <strong style={{ color: '#334155', fontWeight: 600 }}>{l.SoChoToiDa} chỗ</strong></span>
                            </div>

                            <div style={{ height: '4px', width: '100%', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min(100, Math.round((l.SoChoDaDat / l.SoChoToiDa) * 100))}%`,
                                  background: expired ? '#94A3B8' : isFull ? '#DC2626' : remaining <= 5 ? '#D97706' : '#0F172A',
                                  borderRadius: '2px',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#475569', fontSize: '12.5px', textAlign: 'center' }}>
                        Hiện chưa có đợt khởi hành mới. Quý khách vui lòng bỏ chọn &quot;Ẩn lịch đã qua&quot; hoặc liên hệ tổng đài 1900 1234.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. THÔNG TIN SỐ CHỖ CỦA ĐỢT ĐANG CHỌN */}
                {activeSchedule && (
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                      <div style={{ background: '#FFFFFF', padding: '8px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Tổng số chỗ</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{activeSchedule.SoChoToiDa}</div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '8px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Đã đăng ký</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{activeSchedule.SoChoDaDat}</div>
                      </div>
                      <div style={{ background: '#FFFFFF', padding: '8px 6px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>Còn nhận</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: remainingSeats > 0 ? '#047857' : '#B91C1C' }}>
                          {remainingSeats} chỗ
                        </div>
                      </div>
                    </div>

                    {(isScheduleExpired || isSoldOut || isExceededSeats) && (
                      <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '12px', fontWeight: 500 }}>
                        {isScheduleExpired
                          ? 'Đợt khởi hành này đã đóng đăng ký. Vui lòng chọn ngày khác.'
                          : isSoldOut
                          ? `Đợt khởi hành này đã đủ ${activeSchedule.SoChoToiDa}/${activeSchedule.SoChoToiDa} khách. Vui lòng chọn đợt khác.`
                          : `Số lượng đang chọn (${totalGuestsSelected} khách) vượt quá số chỗ còn trống (${remainingSeats} chỗ).`}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SỐ LƯỢNG HÀNH KHÁCH (THIẾT KẾ STEPPER CHUẨN LỮ HÀNH) */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                      Số lượng hành khách
                    </label>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                      Đã chọn: <strong style={{ color: '#0F172A' }}>{totalGuestsSelected} khách</strong>
                    </span>
                  </div>

                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF' }}>
                    {/* NGƯỜI LỚN */}
                    <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                          Người lớn <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 400 }}>(Từ 12 tuổi)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                            {vnd(giaNL)}/khách
                          </span>
                          {activePromo && (
                            <span style={{ fontSize: '11.5px', color: '#94A3B8', textDecoration: 'line-through' }}>
                              {vnd(tour.GiaNguoiLon)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#F8FAFC', padding: '2px' }}>
                        <button
                          type="button"
                          disabled={adults <= 1}
                          onClick={() => {
                            const val = Math.max(1, adults - 1);
                            setAdults(val);
                            syncPassengersCount(val, children);
                          }}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: 'none',
                            background: adults <= 1 ? 'transparent' : '#FFFFFF',
                            color: adults <= 1 ? '#94A3B8' : '#0F172A',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: adults <= 1 ? 'not-allowed' : 'pointer',
                            boxShadow: adults <= 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '36px', textAlign: 'center', fontSize: '13.5px', fontWeight: 700, color: '#0F172A', userSelect: 'none' }}>
                          {adults}
                        </span>
                        <button
                          type="button"
                          disabled={remainingSeats > 0 && totalGuestsSelected >= remainingSeats}
                          onClick={() => {
                            if (remainingSeats > 0 && totalGuestsSelected >= remainingSeats) return;
                            const val = adults + 1;
                            setAdults(val);
                            syncPassengersCount(val, children);
                          }}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: 'none',
                            background: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? 'transparent' : '#FFFFFF',
                            color: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? '#94A3B8' : '#0F172A',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? 'not-allowed' : 'pointer',
                            boxShadow: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* TRẺ EM */}
                    <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                          Trẻ em <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 400 }}>(2 – 11 tuổi)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                            {vnd(giaTE)}/khách
                          </span>
                          {activePromo && (
                            <span style={{ fontSize: '11.5px', color: '#94A3B8', textDecoration: 'line-through' }}>
                              {vnd(tour.GiaTreEm)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#F8FAFC', padding: '2px' }}>
                        <button
                          type="button"
                          disabled={children <= 0}
                          onClick={() => {
                            const val = Math.max(0, children - 1);
                            setChildren(val);
                            syncPassengersCount(adults, val);
                          }}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: 'none',
                            background: children <= 0 ? 'transparent' : '#FFFFFF',
                            color: children <= 0 ? '#94A3B8' : '#0F172A',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: children <= 0 ? 'not-allowed' : 'pointer',
                            boxShadow: children <= 0 ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '36px', textAlign: 'center', fontSize: '13.5px', fontWeight: 700, color: '#0F172A', userSelect: 'none' }}>
                          {children}
                        </span>
                        <button
                          type="button"
                          disabled={remainingSeats > 0 && totalGuestsSelected >= remainingSeats}
                          onClick={() => {
                            if (remainingSeats > 0 && totalGuestsSelected >= remainingSeats) return;
                            const val = children + 1;
                            setChildren(val);
                            syncPassengersCount(adults, val);
                          }}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: 'none',
                            background: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? 'transparent' : '#FFFFFF',
                            color: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? '#94A3B8' : '#0F172A',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? 'not-allowed' : 'pointer',
                            boxShadow: remainingSeats > 0 && totalGuestsSelected >= remainingSeats ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. THÔNG TIN HÀNH KHÁCH & CCCD 12 SỐ */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Thông tin hành khách ({passengers.length})
                    </label>
                    <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                      Bắt buộc đủ Họ tên &amp; CCCD
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto', paddingRight: '2px' }}>
                    {passengers.map((p, idx) => {
                      const isAdult = idx < adults;
                      const hasName = p.hoTen.trim().length >= 2;
                      const hasCccd = p.cccd.trim().length === 12;
                      const isValid = hasName && hasCccd;

                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#F8FAFC',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${isValid ? '#E2E8F0' : '#CBD5E1'}`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                              Hành khách {idx + 1} • {isAdult ? 'Người lớn' : 'Trẻ em'}
                            </span>
                            {isValid ? (
                              <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Check size={12} /> Đã nhập đủ
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#B45309', fontWeight: 500 }}>
                                Cần điền đủ
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                              className="input"
                              placeholder={`Họ và tên hành khách ${idx + 1}`}
                              value={p.hoTen}
                              required
                              onChange={(e) => {
                                const val = e.target.value;
                                setPassengers((prev) => {
                                  const next = [...prev];
                                  next[idx].hoTen = val;
                                  return next;
                                });
                              }}
                              style={{
                                fontSize: '12.5px',
                                padding: '7px 10px',
                                width: '100%',
                                background: '#FFFFFF',
                              }}
                            />

                            <div>
                              <input
                                className="input"
                                placeholder="Số CCCD / Mã định danh (đủ 12 chữ số)"
                                maxLength={12}
                                value={p.cccd}
                                required
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setPassengers((prev) => {
                                    const next = [...prev];
                                    next[idx].cccd = val;
                                    return next;
                                  });
                                }}
                                style={{
                                  fontSize: '12.5px',
                                  padding: '7px 10px',
                                  width: '100%',
                                  background: '#FFFFFF',
                                }}
                              />
                              {p.cccd.trim().length > 0 && p.cccd.trim().length < 12 && (
                                <div style={{ fontSize: '11px', color: '#B45309', marginTop: '3px' }}>
                                  Đã nhập {p.cccd.trim().length}/12 chữ số
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6. MÃ GIẢM GIÁ (VOUCHER) */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Mã ưu đãi (Voucher)
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      className="input"
                      placeholder="Nhập mã ưu đãi..."
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      style={{ flex: 1, textTransform: 'uppercase', fontSize: '12.5px', fontWeight: 700, fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleApplyVoucher}
                      disabled={validatingVoucher}
                      style={{ fontWeight: 600, padding: '0 14px' }}
                    >
                      {validatingVoucher ? '...' : 'Áp dụng'}
                    </button>
                  </div>

                  {validVouchersForTour.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {validVouchersForTour.map((v) => {
                        const isEligible = rawTotal >= Number(v.GiaTriDonToiThieu);
                        return (
                          <button
                            key={v.VoucherID}
                            type="button"
                            onClick={() => {
                              setVoucherCode(v.MaVoucher);
                              setVoucherError(null);
                            }}
                            title={`${v.TenChuongTrinh} — Đơn tối thiểu ${vnd(v.GiaTriDonToiThieu)}`}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: voucherCode === v.MaVoucher ? '1px solid #0F172A' : '1px solid #E2E8F0',
                              background: voucherCode === v.MaVoucher ? '#F1F5F9' : '#FFFFFF',
                              color: isEligible ? '#0F172A' : '#94A3B8',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {v.MaVoucher} (-{Number(v.PhanTramGiam)}%)
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {voucherApplied && (
                    <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={13} strokeWidth={2} /> <span>{voucherApplied}</span>
                    </div>
                  )}
                  {voucherError && (
                    <div style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 500, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={13} strokeWidth={2} /> <span>{voucherError}</span>
                    </div>
                  )}
                </div>

                {/* 7. TỔNG CỘNG & NÚT ĐẶT TOUR */}
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #E2E8F0' }}>
                  {voucherDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
                      <span>Tạm tính ({totalGuestsSelected} khách):</span>
                      <span>{vnd(rawTotal)} (Giảm -{vnd(voucherDiscount)})</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Tổng thanh toán:</span>
                    <strong style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                      {vnd(finalTotal)}
                    </strong>
                  </div>
                </div>

                {(() => {
                  const isPassengersIncomplete = passengers.some((p) => p.hoTen.trim().length < 2 || p.cccd.trim().length !== 12);
                  const missingCount = passengers.filter((p) => p.hoTen.trim().length < 2 || p.cccd.trim().length !== 12).length;
                  const isButtonDisabled = bookingLoading || !canBook || isPassengersIncomplete;

                  return (
                    <button
                      className="btn btn-primary"
                      onClick={handleBooking}
                      disabled={isButtonDisabled}
                      style={{
                        width: '100%',
                        padding: '13px',
                        background: isButtonDisabled ? '#E2E8F0' : '#0F172A',
                        borderColor: isButtonDisabled ? '#E2E8F0' : '#0F172A',
                        color: isButtonDisabled ? '#64748B' : '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        borderRadius: '8px',
                        cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {bookingLoading
                        ? 'Đang khởi tạo đơn...'
                        : isScheduleExpired
                        ? 'Đợt khởi hành đã đóng'
                        : isSoldOut
                        ? 'Đợt khởi hành đã hết chỗ'
                        : isExceededSeats
                        ? `Vượt quá số ghế trống (Còn ${remainingSeats} chỗ)`
                        : isPassengersIncomplete
                        ? `Vui lòng điền đủ Họ tên & CCCD (${missingCount} khách)`
                        : 'Đặt tour & Nhận vé điện tử'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THANH TOÁN QR SAU KHI ĐẶT THÀNH CÔNG */}
      {createdBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--emerald-50)',
                color: 'var(--emerald-600)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 10px',
                border: '1px solid var(--emerald-200)',
              }}>
                <CheckCircle2 size={24} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--zinc-900)', margin: '4px 0', letterSpacing: '-0.3px' }}>
                ĐẶT TOUR THÀNH CÔNG
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>Mã đơn: <strong style={{ color: 'var(--zinc-900)' }}>{createdBooking.MaDon}</strong></p>
            </div>

            <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '10px', borderRadius: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Số tiền thanh toán:</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#005BAA' }}>{vnd(createdBooking.TongTien)}</div>
            </div>

            {/* TAB CHUYỂN ĐỔI: VNPAY vs TIỀN MẶT TẠI QUẦY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => setPayMethod('VNPAY')}
                style={{
                  padding: '9px 8px', border: 'none', borderRadius: '6px',
                  background: payMethod === 'VNPAY' ? '#0F172A' : 'transparent',
                  color: payMethod === 'VNPAY' ? '#FFF' : '#475569',
                  fontWeight: 700, fontSize: '12.5px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Cổng VNPAY (QR / ATM / Thẻ)
              </button>
              <button
                onClick={() => setPayMethod('CASH_CARD')}
                style={{
                  padding: '9px 8px', border: 'none', borderRadius: '6px',
                  background: payMethod === 'CASH_CARD' ? '#0F172A' : 'transparent',
                  color: payMethod === 'CASH_CARD' ? '#FFF' : '#475569',
                  fontWeight: 700, fontSize: '12.5px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Thanh toán tại quầy
              </button>
            </div>

            {/* TAB 1: CỔNG VNPAY TRỰC TUYẾN */}
            {payMethod === 'VNPAY' && (
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
                  onClick={() => handlePayVNPay(createdBooking.DonHangID, createdBooking.TongTien, createdBooking.MaDon)}
                  disabled={loadingVnpay}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '13px', background: '#0F172A', borderColor: '#0F172A',
                    fontWeight: 700, fontSize: '14px', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <Lock size={15} />
                  {loadingVnpay ? 'Đang kết nối cổng VNPay...' : 'Thanh toán qua VNPAY →'}
                </button>
              </div>
            )}

            {/* TAB 2: TIỀN MẶT / THẺ TẠI QUẦY (GIỮ CHỖ) */}
            {payMethod === 'CASH_CARD' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '12.5px',
                  color: '#334155',
                }}>
                  <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '6px', color: '#0F172A' }}>
                    Xác nhận giữ chỗ tạm thời (Hiệu lực 24 giờ)
                  </div>
                  <p style={{ margin: '0 0 10px', lineHeight: 1.55, color: '#475569' }}>
                    Đơn đặt chỗ của Quý khách đang ở trạng thái <strong>Chờ thanh toán</strong> (chưa phát hành vé điện tử). Quý khách vui lòng đọc mã đơn <strong>{createdBooking.MaDon}</strong> và thanh toán tại quầy giao dịch trong vòng 24 giờ để nhận vé lên đoàn:
                  </p>
                  <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12.5px', color: '#1E293B', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div>• Quầy giao dịch Sân bay: <strong>Quầy VietTour — Sảnh Đi Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất (45 Trường Sơn, Q. Tân Bình, TP.HCM)</strong></div>
                    <div>• Đại lý Phòng vé Trung tâm: <strong>190 Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM</strong></div>
                    <div>• Phương thức chấp nhận: <strong>Tiền mặt (VNĐ) hoặc Quẹt thẻ POS (Napas / Visa / Mastercard)</strong></div>
                    <div>• Tổng đài hỗ trợ: <strong style={{ color: '#0F172A' }}>1900 1234 (07:00 – 22:00)</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCreatedBooking(null)}
                    className="btn btn-outline"
                    style={{ flex: 1, fontWeight: 600, fontSize: '13px', padding: '10px' }}
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    disabled={loadingVnpay}
                    onClick={async () => {
                      try {
                        setLoadingVnpay(true);
                        await api(`/bookings/${createdBooking.DonHangID}/request-cash`, {
                          method: 'POST',
                          body: JSON.stringify({
                            ghiChu: `Khách xác nhận nộp tiền mặt tại quầy giao dịch VietTour cho đơn ${createdBooking.MaDon}`,
                          }),
                        });
                        alert(
                          `Đã ghi nhận đăng ký thanh toán tiền mặt tại quầy cho đơn ${createdBooking.MaDon}! Sau khi thu ngân/Admin xác nhận đã thu, trạng thái đơn sẽ chuyển sang "Đã thanh toán".`,
                        );
                        window.location.href = '/portal/my-bookings';
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Không thể xác nhận thanh toán tại quầy');
                      } finally {
                        setLoadingVnpay(false);
                      }
                    }}
                    className="btn btn-primary"
                    style={{
                      flex: 2,
                      background: '#0F172A',
                      borderColor: '#0F172A',
                      fontWeight: 700,
                      fontSize: '13px',
                      padding: '10px',
                    }}
                  >
                    {loadingVnpay ? 'Đang ghi nhận...' : 'Xác nhận thanh toán tiền mặt tại quầy'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#64748B' }}>
              Vé điện tử &amp; Mã QR chỉ được kích hoạt sau khi đơn hàng hoàn tất thanh toán.
            </div>
          </div>
        </div>
      )}

      {/* MODAL PHÓNG TO HÌNH ẢNH LỊCH TRÌNH */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '900px',
              width: '100%',
              background: '#0F172A',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'relative', width: '100%', height: '520px', background: '#000' }}>
              <img
                src={previewImage.url}
                alt={previewImage.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <button
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px 20px', background: '#0F172A', color: '#FFF' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{previewImage.title}</h4>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94A3B8' }}>Hình ảnh thực tế điểm đến trong hành trình tour {tour.TenTour}</p>
            </div>
          </div>
        </div>
      )}

      <CustomerFooter />
    </div>
  );
}
