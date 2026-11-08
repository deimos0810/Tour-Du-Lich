'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { api, getImageUrl, useApi, getApiUrl, openVNPayGateway } from '@/lib/api';
import { bookingSchema, firstError } from '@/lib/validations';
import { ApiNotice, uiAlert, vnd } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import { Search, MapPin, Calendar, Users, Clock, Plane, Star, Ticket, Check, X, CheckCircle2, ShieldCheck, Lock, Smartphone } from 'lucide-react';

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
  DiemKhoiHanh?: string | null;
  DiemDen: string;
  ThoiGian: string;
  GiaNguoiLon: string;
  GiaTreEm: string;
  PhuongTien?: string | null;
  HinhAnhURL: string | null;
  MoTaChiTiet: string | null;
  LichTrinh: string | null;
  DanhMuc: { TenDanhMuc: string };
  LichKhoiHanh: { LichID: number; MaLich: string; NgayKhoiHanh: string; SoChoToiDa: number; SoChoDaDat: number }[];
  DanhGia?: Review[];
  KhuyenMai?: {
    CTKMID: number;
    TenChuongTrinh: string;
    PhanTramGiam: number;
    GiaNguoiLonKM: number;
    GiaTreEmKM: number;
    NgayKetThuc: string;
  } | null;
};

type PassengerInput = {
  hoTen: string;
  gioiTinh: string;
  cccd: string;
  loaiKhach: string;
};

export default function CustomerHomePage() {
  const { user } = useAuth();

  // Search & Filter state (Flight & Tour Search Engine)
  const [searchMode, setSearchMode] = useState<'FLIGHT' | 'COACH' | 'DEAL'>('FLIGHT');
  const [departLocation, setDepartLocation] = useState('ALL');
  const [destKeyword, setDestKeyword] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [priceRange, setPriceRange] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Đọc danh mục từ query parameters trên URL hoặc sự kiện click trực tiếp từ thanh điều hướng (không cần reload trang)
  useEffect(() => {
    const applyFilterAndScroll = (cat: string | null, section?: string) => {
      if (cat && ['MIEN_TRUNG', 'MIEN_BAC', 'QUOC_TE', 'KHUYEN_MAI', 'ALL'].includes(cat)) {
        setCategoryFilter(cat);
        if (cat !== 'ALL') {
          setDestKeyword('');
          setDepartLocation('ALL');
          setPriceRange('ALL');
        }
      }
      if (section === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (section === 'about') {
        const aboutEl = document.getElementById('about');
        if (aboutEl) setTimeout(() => aboutEl.scrollIntoView({ behavior: 'smooth' }), 60);
      } else if (section === 'tour-list-section' || (cat && cat !== 'ALL')) {
        const el = document.getElementById('tour-list-section');
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    };

    const handleUrlCategory = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      const hash = window.location.hash;
      if (hash === '#about') {
        applyFilterAndScroll(cat, 'about');
      } else if (cat) {
        applyFilterAndScroll(cat, 'tour-list-section');
      }
    };

    const handleCustomNav = (e: Event) => {
      const detail = (e as CustomEvent<{ category?: string; section?: string }>).detail;
      if (!detail) return;
      applyFilterAndScroll(detail.category ?? null, detail.section);
    };

    handleUrlCategory();
    window.addEventListener('popstate', handleUrlCategory);
    window.addEventListener('viettour:nav-filter', handleCustomNav as EventListener);
    return () => {
      window.removeEventListener('popstate', handleUrlCategory);
      window.removeEventListener('viettour:nav-filter', handleCustomNav as EventListener);
    };
  }, []);

  // Đồng hồ thời gian thực (cập nhật mỗi giây) để tự động ẩn khuyến mãi / voucher ngay khi hết hạn
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kiểm tra khuyến mãi của tour còn hiệu lực tại thời điểm hiện tại hay không
  const getActivePromo = (t?: Tour | null) => {
    const km = t?.KhuyenMai;
    if (!km) return null;
    const endMs = new Date(km.NgayKetThuc).getTime();
    if (Number.isNaN(endMs) || endMs <= nowTs) return null;
    return km;
  };

  // Kiểm tra ngày khởi hành đã qua hạn hay chưa
  const isDepartureExpired = (dateStr: string) => {
    const d = new Date(dateStr);
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
    return endOfDay < nowTs;
  };

  const [hidePastDatesInModal, setHidePastDatesInModal] = useState(true);

  // Modal Đặt tour đa bước (Step-by-step)
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [selectedLichId, setSelectedLichId] = useState<number | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { hoTen: user?.name || '', gioiTinh: 'Nam', cccd: '', loaiKhach: 'Nguoi lon' }
  ]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Modal Thanh toán sau khi đặt tour thành công
  const [createdBooking, setCreatedBooking] = useState<{ MaDon: string; TongTien: number; DonHangID: number } | null>(null);
  const [payMethod, setPayMethod] = useState<'VNPAY' | 'ZALOPAY' | 'CASH_CARD'>('VNPAY');
  const [loadingVnpay, setLoadingVnpay] = useState(false);
  const [loadingZalopay, setLoadingZalopay] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

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
        await openVNPayGateway(res.paymentUrl, maDon);
      }
    } catch (err: any) {
      void uiAlert('Không thể kết nối cổng VNPay: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setLoadingVnpay(false);
    }
  };

  const handlePayZaloPay = async (donHangId: number, amount: number, maDon: string) => {
    try {
      setLoadingZalopay(true);
      const res = await api<{ orderUrl?: string }>('/zalopay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId,
          amount,
          orderInfo: `Thanh toan don tour ${maDon} qua ZaloPay`,
        }),
      });
      if (res.orderUrl) {
        window.location.href = res.orderUrl;
      }
    } catch (err: any) {
      void uiAlert('Không thể kết nối cổng ZaloPay: ' + (err?.message || 'Lỗi kết nối'));
    } finally {
      setLoadingZalopay(false);
    }
  };

  // Modal Xem chi tiết tour nhanh
  const [detailTour, setDetailTour] = useState<Tour | null>(null);
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'SCHEDULES' | 'REVIEWS'>('OVERVIEW');

  const tours = useApi<Tour[]>(`/tours`);
  const publicVouchers = useApi<any[]>(`/portal/vouchers`);

  // Lọc danh sách voucher còn hạn tại thời điểm hiện tại
  const activeVouchersStrip = useMemo(() => {
    const list = (publicVouchers.data ?? []).filter((v) => {
      if (!v) return false;
      if (v.TrangThai !== 1 && v.TrangThai !== 'Hoat dong') return false;
      const startMs = new Date(v.NgayBatDau).getTime();
      const dEnd = new Date(v.NgayKetThuc);
      const endMs =
        dEnd.getHours() === 0 && dEnd.getMinutes() === 0
          ? new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), 23, 59, 59, 999).getTime()
          : dEnd.getTime();
      if (Number.isNaN(endMs) || endMs <= nowTs || startMs > nowTs) return false;
      const maxUsed = v.SoLuongToiDa ?? v.SoLuotToiDa;
      const curUsed = v.soDaDung ?? v.SoLuotDaDung ?? 0;
      if (maxUsed != null && curUsed >= maxUsed) return false;
      return true;
    });
    if (list.length > 0) {
      return list.map((v) => {
        const code = v.MaVoucher || v.MaCode;
        const pct = Number(v.PhanTramGiam ?? v.GiaTriGiam ?? 10);
        const maxVal = v.GiamToiDa ? ` (Tối đa ${vnd(v.GiamToiDa)})` : '';
        return {
          code,
          label: `${v.TenChuongTrinh ? `${v.TenChuongTrinh} — ` : ''}Giảm ${pct}%${maxVal}`,
        };
      });
    }
    return [];
  }, [publicVouchers.data, nowTs]);

  // Đồng bộ số lượng khách với mảng hành khách
  const syncPassengersCount = (newAdults: number, newChildren: number) => {
    const total = newAdults + newChildren;
    setPassengers((prev) => {
      const next = [...prev];
      if (next.length < total) {
        for (let i = next.length; i < total; i++) {
          next.push({
            hoTen: '',
            gioiTinh: 'Nam',
            cccd: '',
            loaiKhach: i < newAdults ? 'Nguoi lon' : 'Tre em',
          });
        }
      } else if (next.length > total) {
        return next.slice(0, total);
      }
      return next.map((p, idx) => ({
        ...p,
        loaiKhach: idx < newAdults ? 'Nguoi lon' : 'Tre em',
      }));
    });
  };

  // CCCD đã lưu trong hồ sơ cá nhân của tài khoản khách hàng (chỉ áp dụng cho Hành khách 1 - Chủ tài khoản)
  const ownerSavedCccd =
    user?.customerId && user?.cccd && /^\d{12}$/.test(user.cccd.trim()) ? user.cccd.trim() : '';

  const handleOpenBooking = (t: Tour) => {
    setSelectedTour(t);
    setDetailTour(null);
    setBookingStep(1);
    setVoucherCode('');
    setVoucherDiscount(0);
    setVoucherApplied(null);
    setVoucherError(null);
    setAdults(1);
    setChildren(0);
    setPassengers([
      { hoTen: user?.name || '', gioiTinh: 'Nam', cccd: ownerSavedCccd, loaiKhach: 'Nguoi lon' }
    ]);
    if (t.LichKhoiHanh && t.LichKhoiHanh.length > 0) {
      // Ưu tiên chọn đợt khởi hành gần nhất chưa qua ngày và còn chỗ trống
      const validUpcoming = t.LichKhoiHanh.find(
        (l) => !isDepartureExpired(l.NgayKhoiHanh) && l.SoChoToiDa - l.SoChoDaDat > 0
      );
      const fallbackUpcoming = t.LichKhoiHanh.find((l) => !isDepartureExpired(l.NgayKhoiHanh));
      setSelectedLichId((validUpcoming || fallbackUpcoming || t.LichKhoiHanh[0]).LichID);
    } else {
      setSelectedLichId(t.TourID || 1);
    }
  };

  // Tự động đồng bộ CCCD đã lưu của chủ tài khoản vào Hành khách 1
  useEffect(() => {
    if (!ownerSavedCccd) return;
    setPassengers((prev) => {
      if (prev.length === 0 || prev[0].cccd === ownerSavedCccd) return prev;
      const next = [...prev];
      next[0] = { ...next[0], hoTen: next[0].hoTen || user?.name || '', cccd: ownerSavedCccd };
      return next;
    });
  }, [ownerSavedCccd, user?.name]);

  const handleOpenDetail = (t: Tour) => {
    setDetailTour(t);
    setDetailTab('OVERVIEW');
  };

  // Thông tin lịch khởi hành đang chọn trong Modal Đặt ngay
  const selectedModalLich = useMemo(() => {
    if (!selectedTour?.LichKhoiHanh?.length) return null;
    return selectedTour.LichKhoiHanh.find((l) => l.LichID === selectedLichId) || selectedTour.LichKhoiHanh[0];
  }, [selectedTour, selectedLichId]);

  const modalMaxSeats = selectedModalLich ? selectedModalLich.SoChoToiDa : 30;
  const modalBookedSeats = selectedModalLich ? selectedModalLich.SoChoDaDat : 0;
  const modalRemainingSeats = Math.max(0, modalMaxSeats - modalBookedSeats);
  const modalTotalRequested = adults + children;
  const isModalScheduleExpired = selectedModalLich ? isDepartureExpired(selectedModalLich.NgayKhoiHanh) : false;
  const isModalSoldOut = modalRemainingSeats <= 0 || isModalScheduleExpired;
  const isModalOverCapacity = modalTotalRequested > modalRemainingSeats;

  // Kiểm tra trùng CCCD và ràng buộc đủ Họ tên + 12 số CCCD ở Bước 2
  const duplicateModalCccds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of passengers) {
      const c = p.cccd.trim();
      if (c.length === 12) counts.set(c, (counts.get(c) || 0) + 1);
    }
    const dups = new Set<string>();
    counts.forEach((cnt, k) => {
      if (cnt > 1) dups.add(k);
    });
    return dups;
  }, [passengers]);

  const isModalPassengersValid = useMemo(() => {
    if (passengers.length !== modalTotalRequested || modalTotalRequested < 1) return false;
    if (duplicateModalCccds.size > 0) return false;
    return passengers.every((p) => p.hoTen.trim().length >= 2 && /^\d{12}$/.test(p.cccd.trim()));
  }, [passengers, modalTotalRequested, duplicateModalCccds]);

  // Tính tiền tạm tính (Tự động về giá gốc ngay khi khuyến mãi hết hạn)
  const currentSubtotal = useMemo(() => {
    if (!selectedTour) return 0;
    const km = getActivePromo(selectedTour);
    const adultPrice = (km && typeof km.GiaNguoiLonKM === 'number') ? km.GiaNguoiLonKM : Number(selectedTour.GiaNguoiLon);
    const childPrice = (km && typeof km.GiaTreEmKM === 'number') ? km.GiaTreEmKM : Number(selectedTour.GiaTreEm);
    return adultPrice * adults + childPrice * children;
  }, [selectedTour, adults, children, nowTs]);

  const finalTotal = Math.max(currentSubtotal - voucherDiscount, 0);

  // Áp dụng voucher qua API backend
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
            tongTien: currentSubtotal,
            tourId: selectedTour?.TourID,
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

  // Gửi đơn đặt tour
  const handleConfirmBooking = async () => {
    if (!selectedTour || !selectedLichId) {
      void uiAlert('Vui lòng chọn ngày khởi hành!');
      return;
    }

    if (!user?.customerId) {
      void uiAlert('Vui lòng đăng nhập tài khoản khách hàng để đặt tour!');
      return;
    }
    const invalid = firstError(bookingSchema, {
      soLuongNguoiLon: adults,
      soLuongTreEm: children,
      hanhKhach: passengers.map((p) => ({ hoTen: p.hoTen, cccd: p.cccd.trim() })),
    });
    if (invalid) {
      void uiAlert(invalid);
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
            lichId: selectedLichId,
            soLuongNguoiLon: adults,
            soLuongTreEm: children,
            ghiChu: 'Khách đăng ký trực tuyến qua website VietTour',
            maKhuyenMai: voucherApplied ? voucherCode.trim().toUpperCase() : undefined,
            hanhKhach: passengers.map((p, idx) => ({
              hoTen: p.hoTen.trim() || `Hành khách ${idx + 1}`,
              gioiTinh: p.gioiTinh,
              cccd: p.cccd.trim() || undefined,
              loaiKhach: p.loaiKhach,
            })),
          }),
        }
      );

      // Đặt tour thành công -> mở ngay modal thanh toán trực tuyến VNPay
      setCreatedBooking({
        MaDon: res.MaDon,
        TongTien: Number((res as any).TienConLai ?? (Number(res.TongTien) - voucherDiscount)),
        DonHangID: res.DonHangID,
      });
      setSelectedTour(null);
      void tours.reload();
    } catch (e) {
      void uiAlert(e instanceof Error ? e.message : 'Đặt tour thất bại');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopyNotice(`Đã sao chép ${label}!`);
      setTimeout(() => setCopyNotice(null), 2500);
    }
  };

  // Lọc danh sách tour theo tất cả tiêu chí (kể cả bộ lọc Khuyến mãi trực tiếp)
  const filteredTours = useMemo(() => {
    return (tours.data ?? []).filter((t) => {
      const activePromo = getActivePromo(t);

      // 1. Điểm đến / Từ khóa
      if (destKeyword.trim()) {
        const kw = destKeyword.toLowerCase().trim();
        const matchTitle = t.TenTour.toLowerCase().includes(kw);
        const matchDest = t.DiemDen.toLowerCase().includes(kw);
        const matchCat = t.DanhMuc?.TenDanhMuc?.toLowerCase().includes(kw);
        if (!matchTitle && !matchDest && !matchCat) return false;
      }
      // 2. Điểm khởi hành
      if (departLocation !== 'ALL') {
        if (!t.DiemKhoiHanh?.toLowerCase().includes(departLocation.toLowerCase())) return false;
      }
      // 3. Lọc theo ngày khởi hành (nếu người dùng chọn trên thanh tìm kiếm)
      if (departDate) {
        const hasMatchingDate = (t.LichKhoiHanh ?? []).some(
          (l) => new Date(l.NgayKhoiHanh).toISOString().slice(0, 10) === departDate
        );
        if (!hasMatchingDate) return false;
      }
      // 4. Danh mục tabs (MIEN_TRUNG, MIEN_BAC, QUOC_TE, KHUYEN_MAI)
      if (categoryFilter === 'MIEN_TRUNG') {
        const catName = (t.DanhMuc?.TenDanhMuc || '').toLowerCase();
        const dest = (t.DiemDen || '').toLowerCase();
        if (
          !t.TenTour.includes('Đà Nẵng') &&
          !t.TenTour.includes('Hội An') &&
          !t.TenTour.includes('Huế') &&
          !t.TenTour.includes('Phong Nha') &&
          !t.TenTour.includes('Nha Trang') &&
          !t.TenTour.includes('Đà Lạt') &&
          !dest.includes('đà nẵng') &&
          !dest.includes('huế') &&
          !dest.includes('quảng bình') &&
          !dest.includes('nha trang') &&
          !dest.includes('đà lạt') &&
          !catName.includes('trung') &&
          !catName.includes('di sản') &&
          !catName.includes('di san')
        ) {
          return false;
        }
      }
      if (categoryFilter === 'MIEN_BAC') {
        const catName = (t.DanhMuc?.TenDanhMuc || '').toLowerCase();
        const dest = (t.DiemDen || '').toLowerCase();
        if (
          !t.TenTour.includes('Sapa') &&
          !t.TenTour.includes('Hạ Long') &&
          !t.TenTour.includes('Hà Nội') &&
          !t.TenTour.includes('Ninh Bình') &&
          !t.TenTour.includes('Tràng An') &&
          !dest.includes('lào cai') &&
          !dest.includes('quảng ninh') &&
          !dest.includes('ninh bình') &&
          !dest.includes('hà nội') &&
          !catName.includes('bắc') &&
          !catName.includes('bac')
        ) {
          return false;
        }
      }
      if (categoryFilter === 'QUOC_TE') {
        const catName = (t.DanhMuc?.TenDanhMuc || '').toLowerCase();
        const dest = (t.DiemDen || '').toLowerCase();
        if (
          !t.TenTour.includes('Nhật') &&
          !t.TenTour.includes('Hàn') &&
          !t.TenTour.includes('Seoul') &&
          !t.TenTour.includes('Tokyo') &&
          !t.TenTour.includes('Thái') &&
          !dest.includes('tokyo') &&
          !dest.includes('seoul') &&
          !dest.includes('nhật') &&
          !dest.includes('hàn') &&
          !catName.includes('quốc tế') &&
          !catName.includes('quoc te')
        ) {
          return false;
        }
      }
      if (categoryFilter === 'KHUYEN_MAI') {
        if (!activePromo) return false;
      }
      // 5. Mức giá
      const price = activePromo?.GiaNguoiLonKM ? Number(activePromo.GiaNguoiLonKM) : Number(t.GiaNguoiLon);
      if (priceRange === 'UNDER_5M' && price > 5000000) return false;
      if (priceRange === '5M_15M' && (price < 5000000 || price > 15000000)) return false;
      if (priceRange === 'OVER_15M' && price < 15000000) return false;

      return true;
    });
  }, [tours.data, searchMode, destKeyword, departLocation, departDate, categoryFilter, priceRange, nowTs]);

  // Lắng nghe tự động (Polling mỗi 2 giây) khi quét QR trên điện thoại hoàn tất
  useEffect(() => {
    if (!createdBooking?.MaDon) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/bookings/ticket/${createdBooking.MaDon}`);
        if (res.ok) {
          const data = await res.json();
          if (data.TrangThaiDon === 'Da thanh toan') {
            clearInterval(interval);
            await uiAlert(`Giao dịch thành công! Đã kích hoạt vé điện tử cho mã đơn ${createdBooking.MaDon}.`);
            window.location.href = `/portal/ticket/${createdBooking.MaDon}`;
          }
        }
      } catch (e) {
        // ignore polling network errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [createdBooking]);

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      {copyNotice && (
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
          border: '1px solid var(--zinc-800)',
        }}>
          <Check size={14} strokeWidth={2} />
          <span>{copyNotice}</span>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {/* ========================================================================= */}
        {/* 1. HERO BANNER & THANH TÌM KIẾM TOUR CAO CẤP (TỐI GIẢN - KHÔNG ICON AI) */}
        {/* ========================================================================= */}
        <section style={{
          background: 'linear-gradient(rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2000&q=85") center/cover no-repeat',
          color: '#FFFFFF',
          padding: '60px 20px 80px',
          position: 'relative',
        }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#38BDF8',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}>
              CÔNG TY DU LỊCH & LỮ HÀNH VIETTOUR
            </div>

            <h1 style={{ fontSize: '36px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.5px', color: '#FFFFFF', lineHeight: 1.25 }}>
              Khám Phá Hành Trình Du Lịch Việt Nam & Thế Giới
            </h1>
            <p style={{ fontSize: '15px', color: '#CBD5E1', maxWidth: '720px', margin: '0 auto 36px', lineHeight: 1.6 }}>
              Bao trọn gói vé máy bay khứ hồi, lưu trú tiêu chuẩn 4 - 5 sao, bảo hiểm du lịch trọn gói và dịch vụ chăm sóc tận tâm.
            </p>

            {/* THANH TÌM KIẾM TOUR CAO CẤP */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              padding: '18px 24px',
              textAlign: 'left',
              color: 'var(--zinc-900)',
              border: '1px solid var(--border)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr)) 140px',
                gap: '16px',
                alignItems: 'flex-end',
              }}>
                {/* 1. KHỞI HÀNH TỪ */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--zinc-600)', display: 'block', marginBottom: '6px' }}>
                    Khởi hành từ
                  </label>
                  <select
                    className="select"
                    value={departLocation}
                    onChange={(e) => setDepartLocation(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', fontWeight: 500, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  >
                    <option value="ALL">Tất cả điểm khởi hành</option>
                    <option value="TP.HCM">TP. Hồ Chí Minh (SGN)</option>
                    <option value="Hà Nội">Hà Nội (HAN)</option>
                    <option value="Đà Nẵng">Đà Nẵng (DAD)</option>
                    <option value="Cần Thơ">Cần Thơ (VCA)</option>
                  </select>
                </div>

                {/* 2. ĐIỂM ĐẾN */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--zinc-600)', display: 'block', marginBottom: '6px' }}>
                    Điểm đến mong muốn
                  </label>
                  <input
                    className="input"
                    placeholder="Đà Nẵng, Sapa, Nhật Bản..."
                    value={destKeyword}
                    onChange={(e) => setDestKeyword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  />
                </div>

                {/* 3. NGÀY ĐI */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--zinc-600)', display: 'block', marginBottom: '6px' }}>
                    Ngày khởi hành
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  />
                </div>

                {/* 4. MỨC NGÂN SÁCH */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--zinc-600)', display: 'block', marginBottom: '6px' }}>
                    Khoảng giá dự kiến
                  </label>
                  <select
                    className="select"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                  >
                    <option value="ALL">Mọi mức giá</option>
                    <option value="UNDER_5M">Dưới 5 triệu</option>
                    <option value="5M_15M">Từ 5 đến 15 triệu</option>
                    <option value="OVER_15M">Trên 15 triệu</option>
                  </select>
                </div>

                {/* NÚT TÌM KIẾM */}
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const el = document.getElementById('tour-list-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    padding: '9px 18px',
                    background: 'var(--zinc-900)',
                    borderColor: 'var(--zinc-900)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13.5px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Search size={14} strokeWidth={1.5} />
                  Tìm tour
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. PROMOTIONAL VOUCHERS STRIP */}
        {/* ========================================================================= */}
        <section style={{ maxWidth: '1280px', margin: '-25px auto 40px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '24px',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--zinc-100)',
                color: 'var(--zinc-800)',
                display: 'grid',
                placeItems: 'center',
              }}>
                <Ticket size={18} strokeWidth={1.5} />
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--zinc-900)', display: 'block', letterSpacing: '0.2px' }}>MÃ ƯU ĐÃI NĂM 2026</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nhập mã khi đặt tour để được giảm giá trực tiếp</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
              {activeVouchersStrip.map((v) => (
                <div
                  key={v.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--zinc-50)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '5px 10px',
                    gap: '8px',
                    fontSize: '12px',
                  }}
                >
                  <code style={{ fontWeight: 700, color: 'var(--zinc-900)', fontSize: '12.5px' }}>{v.code}</code>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>({v.label})</span>
                  <button
                    onClick={() => handleCopy(v.code, `Mã ${v.code}`)}
                    style={{
                      border: '1px solid var(--border)',
                      background: '#FFFFFF',
                      color: 'var(--zinc-800)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--zinc-900)'; e.currentTarget.style.color = '#FFF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = 'var(--zinc-800)'; }}
                  >
                    Lấy mã
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. DANH SÁCH TOUR DU LỊCH & BỘ LỌC DANH MỤC */}
        {/* ========================================================================= */}
        <section id="tour-list-section" style={{ maxWidth: '1280px', margin: '0 auto 60px', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--zinc-500)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                HÀNH TRÌNH CHỌN LỌC
              </span>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--zinc-900)', marginTop: '2px', letterSpacing: '-0.3px' }}>
                {categoryFilter === 'KHUYEN_MAI' ? 'Chương Trình Khuyến Mãi Đang Áp Dụng' : 'Tour Du Lịch Đang Mở Bán'}
              </h2>
            </div>

            {/* CATEGORY TABS */}
            <div style={{ display: 'flex', gap: '4px', background: '#FFFFFF', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'Tất cả tour' },
                { id: 'MIEN_TRUNG', label: 'Miền Trung' },
                { id: 'MIEN_BAC', label: 'Miền Bắc' },
                { id: 'QUOC_TE', label: 'Quốc Tế' },
                { id: 'KHUYEN_MAI', label: 'Đang khuyến mãi' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: categoryFilter === c.id ? 'var(--zinc-900)' : 'transparent',
                    color: categoryFilter === c.id ? '#FFFFFF' : 'var(--zinc-600)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <ApiNotice error={tours.error} />

          {filteredTours.length === 0 && !tours.loading && (
            <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '40px 24px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                Không tìm thấy hành trình phù hợp với bộ lọc hiện tại
              </div>
              <p style={{ fontSize: '13px', margin: '0 0 16px' }}>
                Quý khách có thể đặt lại bộ lọc để xem toàn bộ danh sách tour đang mở bán.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('ALL');
                  setDestKeyword('');
                  setDepartLocation('ALL');
                  setDepartDate('');
                  setPriceRange('ALL');
                }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #0F172A', background: '#0F172A', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Xem tất cả hành trình
              </button>
            </div>
          )}

          {/* TOUR CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredTours.map((t) => {
              const activePromo = getActivePromo(t);
              // Ưu tiên chọn lịch khởi hành chưa qua ngày và còn chỗ trống (tránh hiển thị ngày cũ đã qua như 25/10/2026)
              const upcomingLich =
                t.LichKhoiHanh?.find((l) => !isDepartureExpired(l.NgayKhoiHanh) && l.SoChoToiDa - l.SoChoDaDat > 0) ||
                t.LichKhoiHanh?.find((l) => !isDepartureExpired(l.NgayKhoiHanh)) ||
                t.LichKhoiHanh?.[t.LichKhoiHanh.length - 1];
              const isCardExpired = upcomingLich ? isDepartureExpired(upcomingLich.NgayKhoiHanh) : false;
              const maxSeats = upcomingLich ? upcomingLich.SoChoToiDa : 30;
              const bookedSeats = upcomingLich ? upcomingLich.SoChoDaDat : 0;
              const remainSeats = upcomingLich ? Math.max(0, upcomingLich.SoChoToiDa - upcomingLich.SoChoDaDat) : 15;
              const isCardUnavailable = isCardExpired || remainSeats <= 0;

              return (
                <div
                  key={t.TourID}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  {/* TOUR IMAGE */}
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(t.HinhAnhURL) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
                      alt={t.TenTour}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Plane size={11} strokeWidth={1.5} /> {t.PhuongTien || 'Bao gồm vé máy bay'}
                      </span>
                      {activePromo && (
                        <span style={{ background: '#BE123C', color: '#FFF', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          GIẢM {activePromo.PhanTramGiam}%
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', fontSize: '11px', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} strokeWidth={1.5} /> {t.ThoiGian}
                    </div>
                  </div>

                  {/* TOUR BODY */}
                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 500 }}>Mã: {t.MaTour}</span>
                      <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={12} strokeWidth={1.5} fill="#B45309" color="#B45309" /> 5.0 (Xuất sắc)
                      </span>
                    </div>

                    <Link
                      href={`/portal/tours/${t.TourID}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '10px', lineHeight: 1.35 }}>
                        {t.TenTour}
                      </h3>
                    </Link>

                    <div style={{ fontSize: '12.5px', color: 'var(--zinc-600)', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={12.5} strokeWidth={1.6} color="var(--zinc-500)" />
                        <span>Khởi hành: <strong>{t.DiemKhoiHanh || 'TP. Hồ Chí Minh'}</strong> → <strong>{t.DiemDen}</strong></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12.5} strokeWidth={1.6} color="var(--zinc-500)" />
                        <span>
                          Khởi hành gần nhất:{' '}
                          <strong style={{ color: isCardExpired ? '#94A3B8' : '#0F172A' }}>
                            {upcomingLich ? new Date(upcomingLich.NgayKhoiHanh).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                          </strong>
                          {isCardExpired && <span style={{ color: '#E11D48', fontSize: '11px', marginLeft: '4px' }}>(Đã khởi hành)</span>}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isCardUnavailable ? '#BE123C' : remainSeats <= 5 ? '#D97706' : '#047857', fontWeight: 600 }}>
                        <Users size={12.5} strokeWidth={1.6} />
                        {isCardExpired ? (
                          <span>Tình trạng: <strong>Đã đóng sổ đợt này</strong></span>
                        ) : remainSeats <= 0 ? (
                          <span>Đã đăng ký: <strong>{bookedSeats}/{maxSeats} khách</strong> • <strong>Đã hết chỗ</strong></span>
                        ) : (
                          <span>
                            Đã đăng ký: <strong>{bookedSeats}/{maxSeats} khách</strong> • Còn <strong>{remainSeats} chỗ trống</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* PRICE & ACTION BUTTONS */}
                    <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        {activePromo ? (
                          <>
                            <span style={{ fontSize: '11px', color: '#BE123C', fontWeight: 700, display: 'block' }}>
                              Ưu đãi giảm {activePromo.PhanTramGiam}%:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                              <span style={{ fontSize: '18px', fontWeight: 800, color: '#BE123C' }}>
                                {vnd(activePromo.GiaNguoiLonKM)}
                              </span>
                              <span style={{ fontSize: '12px', color: '#94A3B8', textDecoration: 'line-through' }}>
                                {vnd(t.GiaNguoiLon)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Giá trọn gói:</span>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--zinc-900)' }}>
                              {vnd(t.GiaNguoiLon)}
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link
                          href={`/portal/tours/${t.TourID}`}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '6px 12px', fontSize: '12.5px', textDecoration: 'none' }}
                        >
                          Chi tiết
                        </Link>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenBooking(t)}
                          disabled={isCardUnavailable}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12.5px',
                            background: isCardUnavailable ? '#E2E8F0' : 'var(--zinc-900)',
                            borderColor: isCardUnavailable ? '#CBD5E1' : 'var(--zinc-900)',
                            color: isCardUnavailable ? '#64748B' : '#FFFFFF',
                            cursor: isCardUnavailable ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {isCardUnavailable ? 'Hết chỗ' : 'Đặt ngay'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 4. MODAL ĐẶT TOUR ĐA BƯỚC (CHUẨN NGHIỆP VỤ LỮ HÀNH & RÀNG BUỘC TRƯỚC THANH TOÁN) */}
      {/* ========================================================================= */}
      {selectedTour && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ maxWidth: '610px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '14px', background: '#FFFFFF', padding: '24px 26px', border: '1px solid #E2E8F0', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)' }}>
            {/* HEADER MODAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
                  ĐĂNG KÝ GIỮ CHỖ TRỰC TUYẾN • {selectedTour.MaTour}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.35 }}>
                  {selectedTour.TenTour}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTour(null)}
                style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>

            {/* THANH TIẾN TRÌNH 3 BƯỚC RÕ RÀNG */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '20px', background: '#F8FAFC', padding: '5px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              {[
                { step: 1, label: '1. Ngày đi & Số chỗ' },
                { step: 2, label: '2. Thông tin khách' },
                { step: 3, label: '3. Ưu đãi & Thanh toán' },
              ].map((st) => {
                const isActive = bookingStep === st.step;
                const isDone = bookingStep > st.step;
                return (
                  <div
                    key={st.step}
                    style={{
                      textAlign: 'center',
                      padding: '8px 6px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: isActive ? 700 : 600,
                      background: isActive ? '#0F172A' : isDone ? '#F1F5F9' : 'transparent',
                      color: isActive ? '#FFFFFF' : isDone ? '#0F172A' : '#64748B',
                      transition: 'all 0.15s',
                    }}
                  >
                    {st.label}
                  </div>
                );
              })}
            </div>

            {/* BƯỚC 1: CHỌN LỊCH KHỞI HÀNH (HIỂN THỊ RÕ ĐÃ ĐĂNG KÝ / CÒN TRỐNG) & SỐ LƯỢNG KHÁCH */}
            {bookingStep === 1 && (() => {
              const activePromo = getActivePromo(selectedTour);
              const allSchedules = selectedTour.LichKhoiHanh ?? [];
              const visibleSchedules = hidePastDatesInModal
                ? allSchedules.filter((l) => !isDepartureExpired(l.NgayKhoiHanh))
                : allSchedules;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* CHỌN ĐỢT KHỞI HÀNH */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        Chọn đợt khởi hành mở bán
                      </label>
                      {allSchedules.some((l) => isDepartureExpired(l.NgayKhoiHanh)) && (
                        <label style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={hidePastDatesInModal}
                            onChange={(e) => setHidePastDatesInModal(e.target.checked)}
                            style={{ accentColor: '#0F172A' }}
                          />
                          Ẩn ngày đã qua
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '190px', overflowY: 'auto', paddingRight: '2px' }}>
                      {visibleSchedules.length === 0 ? (
                        <div style={{ padding: '14px', borderRadius: '10px', background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: '12.5px', fontWeight: 600, textAlign: 'center' }}>
                          Hiện tại không còn đợt khởi hành nào mở bán cho hành trình này.
                        </div>
                      ) : (
                        visibleSchedules.map((l) => {
                          const expired = isDepartureExpired(l.NgayKhoiHanh);
                          const remain = Math.max(0, l.SoChoToiDa - l.SoChoDaDat);
                          const full = remain <= 0;
                          const isSelected = selectedLichId === l.LichID;
                          const fillPercent = Math.min(100, Math.round((l.SoChoDaDat / Math.max(1, l.SoChoToiDa)) * 100));

                          return (
                            <div
                              key={l.LichID}
                              onClick={() => {
                                if (!expired && !full) {
                                  setSelectedLichId(l.LichID);
                                  // Nếu số khách đang chọn vượt quá số chỗ trống của lịch mới thì tự động hạ xuống
                                  if (adults + children > remain && remain >= 1) {
                                    const nextAdults = Math.min(adults, remain);
                                    const nextChildren = Math.max(0, Math.min(children, remain - nextAdults));
                                    setAdults(nextAdults);
                                    setChildren(nextChildren);
                                    syncPassengersCount(nextAdults, nextChildren);
                                  }
                                }
                              }}
                              style={{
                                padding: '11px 14px',
                                borderRadius: '10px',
                                border: isSelected ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                                background: expired || full ? '#F8FAFC' : isSelected ? '#F8FAFC' : '#FFFFFF',
                                opacity: expired || full ? 0.65 : 1,
                                cursor: expired || full ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                                    {new Date(l.NgayKhoiHanh).toLocaleDateString('vi-VN')}
                                  </span>
                                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>({l.MaLich})</span>
                                </div>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: expired ? '#E2E8F0' : full ? '#FFE4E6' : remain <= 5 ? '#FEF3C7' : '#ECFDF5',
                                    color: expired ? '#475569' : full ? '#BE123C' : remain <= 5 ? '#B45309' : '#047857',
                                  }}
                                >
                                  {expired ? 'Đã qua ngày' : full ? 'Hết chỗ (0 chỗ)' : `Còn ${remain} chỗ trống`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B', marginBottom: '5px' }}>
                                <span>Đã đăng ký: <strong style={{ color: '#0F172A' }}>{l.SoChoDaDat}</strong> khách</span>
                                <span>Tổng số chỗ: <strong style={{ color: '#0F172A' }}>{l.SoChoToiDa}</strong> chỗ</span>
                              </div>
                              <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${fillPercent}%`,
                                    height: '100%',
                                    background: full ? '#E11D48' : remain <= 5 ? '#D97706' : '#0F172A',
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* BẢNG TÓM TẮT SỐ CHỖ TRỰC TIẾP */}
                  {selectedModalLich && (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tình trạng chỗ đợt {selectedModalLich.MaLich}</span>
                        <span>Khởi hành: {new Date(selectedModalLich.NgayKhoiHanh).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                        <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Tổng số chỗ</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{modalMaxSeats}</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Đã đăng ký</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#334155' }}>{modalBookedSeats}</div>
                        </div>
                        <div style={{ background: '#FFFFFF', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>Còn nhận</div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: modalRemainingSeats > 0 ? '#047857' : '#BE123C' }}>
                            {modalRemainingSeats}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SỐ LƯỢNG HÀNH KHÁCH (THIẾT KẾ STEPPER GỌN GÀNG, RÀNG BUỘC KHÔNG VƯỢT QUÁ CHỖ TRỐNG) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        Số lượng hành khách tham gia
                      </label>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                        Đang chọn: <strong>{modalTotalRequested}</strong>/{modalRemainingSeats} chỗ trống
                      </span>
                    </div>

                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF' }}>
                      {/* NGƯỜI LỚN */}
                      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            Người lớn <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>(Từ 12 tuổi)</span>
                          </div>
                          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {activePromo ? (
                              <>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#BE123C' }}>
                                  {vnd(activePromo.GiaNguoiLonKM)}/khách
                                </span>
                                <span style={{ fontSize: '11.5px', color: '#94A3B8', textDecoration: 'line-through' }}>
                                  {vnd(selectedTour.GiaNguoiLon)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                {vnd(selectedTour.GiaNguoiLon)}/khách
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
                            style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: adults <= 1 ? 'transparent' : '#FFFFFF', color: adults <= 1 ? '#94A3B8' : '#0F172A', fontWeight: 700, fontSize: '15px', cursor: adults <= 1 ? 'not-allowed' : 'pointer' }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: '34px', textAlign: 'center', fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            {adults}
                          </span>
                          <button
                            type="button"
                            disabled={modalTotalRequested >= modalRemainingSeats}
                            onClick={() => {
                              if (modalTotalRequested >= modalRemainingSeats) return;
                              const val = adults + 1;
                              setAdults(val);
                              syncPassengersCount(val, children);
                            }}
                            style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: modalTotalRequested >= modalRemainingSeats ? 'transparent' : '#FFFFFF', color: modalTotalRequested >= modalRemainingSeats ? '#94A3B8' : '#0F172A', fontWeight: 700, fontSize: '15px', cursor: modalTotalRequested >= modalRemainingSeats ? 'not-allowed' : 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* TRẺ EM */}
                      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            Trẻ em <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>(2 – 11 tuổi)</span>
                          </div>
                          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {activePromo ? (
                              <>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#BE123C' }}>
                                  {vnd(activePromo.GiaTreEmKM)}/khách
                                </span>
                                <span style={{ fontSize: '11.5px', color: '#94A3B8', textDecoration: 'line-through' }}>
                                  {vnd(selectedTour.GiaTreEm)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                {vnd(selectedTour.GiaTreEm)}/khách
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
                            style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: children <= 0 ? 'transparent' : '#FFFFFF', color: children <= 0 ? '#94A3B8' : '#0F172A', fontWeight: 700, fontSize: '15px', cursor: children <= 0 ? 'not-allowed' : 'pointer' }}
                          >
                            −
                          </button>
                          <span style={{ minWidth: '34px', textAlign: 'center', fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            {children}
                          </span>
                          <button
                            type="button"
                            disabled={modalTotalRequested >= modalRemainingSeats}
                            onClick={() => {
                              if (modalTotalRequested >= modalRemainingSeats) return;
                              const val = children + 1;
                              setChildren(val);
                              syncPassengersCount(adults, val);
                            }}
                            style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: modalTotalRequested >= modalRemainingSeats ? 'transparent' : '#FFFFFF', color: modalTotalRequested >= modalRemainingSeats ? '#94A3B8' : '#0F172A', fontWeight: 700, fontSize: '15px', cursor: modalTotalRequested >= modalRemainingSeats ? 'not-allowed' : 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TẠM TÍNH & NÚT TIẾP TỤC BƯỚC 2 */}
                  <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                      Tạm tính ({adults} người lớn{children > 0 ? `, ${children} trẻ em` : ''}):
                    </span>
                    <strong style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{vnd(currentSubtotal)}</strong>
                  </div>

                  <button
                    type="button"
                    disabled={isModalSoldOut || isModalOverCapacity}
                    onClick={() => setBookingStep(2)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isModalSoldOut || isModalOverCapacity ? '#CBD5E1' : '#0F172A',
                      color: isModalSoldOut || isModalOverCapacity ? '#64748B' : '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: isModalSoldOut || isModalOverCapacity ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isModalSoldOut
                      ? 'Đợt khởi hành này đã hết chỗ hoặc đã qua ngày'
                      : isModalOverCapacity
                      ? `Vượt quá số chỗ còn trống (${modalRemainingSeats} chỗ)`
                      : 'Tiếp tục: Kê khai thông tin hành khách →'}
                  </button>
                </div>
              );
            })()}

            {/* BƯỚC 2: DANH SÁCH HÀNH KHÁCH (RÀNG BUỘC CHẶT CHẼ HỌ TÊN + 12 SỐ CCCD NGAY TẠI BƯỚC NÀY) */}
            {bookingStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '12.5px', color: '#334155', lineHeight: 1.45 }}>
                    Bắt buộc điền đầy đủ <strong>Họ và tên</strong> và <strong>Số CCCD/Định danh (đúng 12 chữ số)</strong> cho từng hành khách để xuất vé điện tử & bảo hiểm.
                  </div>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isModalPassengersValid ? '#ECFDF5' : '#FFF1F2',
                      color: isModalPassengersValid ? '#047857' : '#BE123C',
                      flexShrink: 0,
                    }}
                  >
                    {isModalPassengersValid
                      ? `Đã hợp lệ (${passengers.length}/${passengers.length} khách)`
                      : `Chưa đủ thông tin (${passengers.filter((p) => p.hoTen.trim().length >= 2 && /^\d{12}$/.test(p.cccd.trim())).length}/${passengers.length})`}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '330px', overflowY: 'auto', paddingRight: '2px' }}>
                  {passengers.map((p, idx) => {
                    const nameOk = p.hoTen.trim().length >= 2;
                    const cccdClean = p.cccd.trim();
                    const cccdOk = /^\d{12}$/.test(cccdClean);
                    const isDup = cccdOk && duplicateModalCccds.has(cccdClean);
                    const rowValid = nameOk && cccdOk && !isDup;

                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#FFFFFF',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: rowValid ? '1px solid #CBD5E1' : '1px solid #FDA4AF',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                            Hành khách {idx + 1} • {p.loaiKhach === 'Nguoi lon' ? 'Người lớn' : 'Trẻ em'}
                            {idx === 0 && user?.customerId ? ' (Chủ tài khoản)' : ''}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: rowValid ? '#047857' : '#BE123C' }}>
                            {rowValid
                              ? '✓ Đã hợp lệ'
                              : !nameOk
                              ? 'Cần nhập Họ tên'
                              : isDup
                              ? 'Trùng số CCCD'
                              : `CCCD: ${cccdClean.length}/12 số`}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '8px', marginBottom: '8px' }}>
                          <input
                            className="input"
                            placeholder="Họ và tên đầy đủ trên giấy tờ *"
                            value={p.hoTen}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPassengers((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], hoTen: val };
                                return next;
                              });
                            }}
                            style={{ fontSize: '13px', padding: '8px 10px' }}
                          />
                          <select
                            className="select"
                            value={p.gioiTinh}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPassengers((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], gioiTinh: val };
                                return next;
                              });
                            }}
                            style={{ fontSize: '13px', padding: '8px 10px' }}
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nu">Nữ</option>
                          </select>
                        </div>

                        {idx === 0 && ownerSavedCccd ? (
                          <div>
                            <div style={{ position: 'relative' }}>
                              <input
                                className="input"
                                readOnly
                                value={ownerSavedCccd}
                                title="Số CCCD của chủ tài khoản được lấy tự động từ Thông tin cá nhân"
                                style={{
                                  width: '100%',
                                  fontSize: '13px',
                                  padding: '8px 34px 8px 10px',
                                  fontFamily: 'monospace',
                                  fontWeight: 700,
                                  letterSpacing: '0.8px',
                                  backgroundColor: '#F1F5F9',
                                  color: '#0F172A',
                                  borderColor: '#94A3B8',
                                  cursor: 'not-allowed',
                                }}
                              />
                              <Lock
                                size={14}
                                style={{
                                  position: 'absolute',
                                  right: '10px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#475569',
                                }}
                              />
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>
                              Đã tự động điền CCCD của bạn từ hồ sơ và khóa chỉnh sửa tại đây. Nếu muốn đổi, vui lòng vào{' '}
                              <Link href="/portal/account" style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'underline' }}>
                                Thông tin cá nhân
                              </Link>
                              .
                            </div>
                          </div>
                        ) : (
                          <div>
                            <input
                              className="input"
                              placeholder={
                                idx === 0
                                  ? 'Số CCCD / Mã định danh của bạn (đúng 12 chữ số) *'
                                  : `Số CCCD / Mã định danh hành khách ${idx + 1} (đúng 12 chữ số) *`
                              }
                              maxLength={12}
                              value={p.cccd}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setPassengers((prev) => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], cccd: val };
                                  return next;
                                });
                              }}
                              style={{
                                width: '100%',
                                fontSize: '13px',
                                padding: '8px 10px',
                                fontFamily: 'monospace',
                                letterSpacing: '0.5px',
                                borderColor: cccdClean.length > 0 && (!cccdOk || isDup) ? '#F43F5E' : undefined,
                              }}
                            />
                            {idx === 0 && user?.customerId && (
                              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                                Gợi ý: Bạn có thể lưu sẵn CCCD trong{' '}
                                <Link href="/portal/account" style={{ color: '#0284C7', fontWeight: 600, textDecoration: 'underline' }}>
                                  Thông tin cá nhân
                                </Link>{' '}
                                để tự động điền cho các lần sau.
                              </div>
                            )}
                          </div>
                        )}
                        {isDup && (
                          <div style={{ fontSize: '11.5px', color: '#BE123C', marginTop: '4px', fontWeight: 600 }}>
                            Số CCCD này đang bị trùng với một hành khách khác trong cùng đoàn.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isModalPassengersValid && (
                  <div style={{ fontSize: '12px', color: '#BE123C', background: '#FFF1F2', border: '1px solid #FECDD3', padding: '8px 12px', borderRadius: '8px', fontWeight: 600 }}>
                    Vui lòng hoàn tất đầy đủ Họ tên và đúng 12 chữ số CCCD/Định danh cho toàn bộ {passengers.length} hành khách trước khi chuyển sang bước thanh toán.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setBookingStep(1)}
                    style={{ padding: '11px 16px', fontSize: '13px', fontWeight: 600 }}
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="button"
                    disabled={!isModalPassengersValid}
                    onClick={() => {
                      if (!isModalPassengersValid) return;
                      setBookingStep(3);
                    }}
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isModalPassengersValid ? '#0F172A' : '#CBD5E1',
                      color: isModalPassengersValid ? '#FFFFFF' : '#64748B',
                      fontWeight: 700,
                      fontSize: '13.5px',
                      cursor: isModalPassengersValid ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Tiếp tục: Áp dụng ưu đãi & Xác nhận →
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: MÃ GIẢM GIÁ VÀ XÁC NHẬN */}
            {bookingStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Ô NHẬP VOUCHER & GỢI Ý NHANH */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                    Mã giảm giá (Voucher)
                  </label>
                  {activeVouchersStrip.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {activeVouchersStrip.map((v) => (
                        <button
                          key={v.code}
                          type="button"
                          onClick={() => setVoucherCode(v.code)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: voucherCode === v.code ? '1px solid #0F172A' : '1px solid #CBD5E1',
                            background: voucherCode === v.code ? '#0F172A' : '#F8FAFC',
                            color: voucherCode === v.code ? '#FFFFFF' : '#334155',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <strong>{v.code}</strong> • {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="input"
                      placeholder="Nhập mã ưu đãi..."
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      style={{ flex: 1, textTransform: 'uppercase', fontWeight: 700, fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleApplyVoucher}
                      disabled={validatingVoucher}
                      style={{ fontWeight: 700, fontSize: '13px' }}
                    >
                      {validatingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>

                  {voucherApplied && (
                    <div style={{ fontSize: '12.5px', color: 'var(--emerald-600)', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} strokeWidth={2} /> <span>{voucherApplied}</span>
                    </div>
                  )}
                  {voucherError && (
                    <div style={{ fontSize: '12.5px', color: 'var(--rose-600)', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={12} strokeWidth={2} /> <span>{voucherError}</span>
                    </div>
                  )}
                </div>

                {/* TÓM TẮT CHI PHÍ */}
                <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Tổng tiền vé ({adults} lớn, {children} trẻ):</span>
                    <span>{vnd(currentSubtotal)}</span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#E11D48' }}>
                      <span>Giảm giá Voucher:</span>
                      <strong>-{vnd(voucherDiscount)}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: 'var(--zinc-900)', paddingTop: '8px', borderTop: '1px dashed #CBD5E1' }}>
                    <span>CẦN THANH TOÁN:</span>
                    <span>{vnd(finalTotal)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline" onClick={() => setBookingStep(2)}>← Quay lại</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    style={{ flex: 1, background: 'var(--zinc-900)', borderColor: 'var(--zinc-900)', fontWeight: 700, fontSize: '13.5px' }}
                  >
                    {bookingLoading ? 'Đang khởi tạo đơn...' : 'Xác nhận & Thanh toán ngay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL THANH TOÁN TRỰC TUYẾN VNPAY NGAY SAU KHI ĐẶT TOUR */}
      {/* ========================================================================= */}
      {createdBooking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.72)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{ maxWidth: '500px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '12px', background: '#FFFFFF', padding: '24px 26px', border: '1px solid #E2E8F0', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.18)' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#F8FAFC',
                color: '#0F172A',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 10px',
                border: '1px solid #CBD5E1',
              }}>
                <CheckCircle2 size={20} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>
                ĐÃ GHI NHẬN YÊU CẦU ĐẶT TOUR
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                Mã đơn đặt chỗ: <strong style={{ color: '#0F172A', fontSize: '13.5px', fontFamily: 'monospace' }}>{createdBooking.MaDon}</strong> • Trạng thái: <strong>Chờ thanh toán</strong>
              </p>
            </div>

            <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Tổng số tiền cần thanh toán:</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>{vnd(createdBooking.TongTien)}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: '#475569',
                lineHeight: 1.5,
              }}>
                <ShieldCheck size={20} color="#0F172A" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                    Thanh toán trực tuyến qua Cổng VNPAY
                  </div>
                  <div>
                    Hỗ trợ quét mã VNPAY-QR trên ứng dụng Ngân hàng, thẻ ATM nội địa (Napas) và thẻ quốc tế. Ngay sau khi giao dịch thành công, hệ thống sẽ tự động cấp <strong>Vé điện tử &amp; Mã QR soát vé</strong>.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCreatedBooking(null)}
                  className="btn btn-outline"
                  style={{ flex: 1, fontWeight: 600, fontSize: '13px', padding: '12px' }}
                >
                  Thanh toán sau
                </button>
                <button
                  type="button"
                  onClick={() => handlePayVNPay(createdBooking.DonHangID, createdBooking.TongTien, createdBooking.MaDon)}
                  disabled={loadingVnpay}
                  className="btn btn-primary"
                  style={{
                    flex: 2, padding: '12px', background: '#0F172A', borderColor: '#0F172A',
                    fontWeight: 700, fontSize: '13.5px', borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <Lock size={14} />
                  {loadingVnpay ? 'Đang kết nối cổng VNPay...' : 'Thanh toán qua VNPAY →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT TOUR NHANH */}
      {detailTour && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', background: '#FFFFFF', padding: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', margin: 0 }}>{detailTour.TenTour}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setDetailTour(null)} style={{ padding: '4px 8px' }}>
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--zinc-600)', lineHeight: 1.6 }}>{detailTour.MoTaChiTiet || 'Chương trình du lịch chất lượng cao của VietTour.'}</p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Link href={`/portal/tours/${detailTour.TourID}`} className="btn btn-outline" style={{ fontWeight: 600, fontSize: '13px' }}>
                Trang Chi Tiết Đầy Đủ
              </Link>
              <button className="btn btn-primary" onClick={() => handleOpenBooking(detailTour)} style={{ background: 'var(--zinc-900)', borderColor: 'var(--zinc-900)', fontWeight: 600, fontSize: '13px' }}>
                Đặt Tour Này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. GIỚI THIỆU VỀ CHÚNG TÔI (SECTION ABOUT) */}
      {/* ========================================================================= */}
      <section id="about" style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F0', padding: '70px 20px', marginTop: '40px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '1px' }}>
              THƯƠNG HIỆU LỮ HÀNH HÀNG ĐẦU
            </span>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#0F172A', margin: '8px 0 12px' }}>
              Về Công Ty Du Lịch VietTour
            </h2>
            <p style={{ fontSize: '15px', color: '#64748B', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              Tiên phong kiến tạo những chuyến đi an toàn, tiện nghi và đong đầy cảm xúc cùng hệ thống dịch vụ lữ hành trọn gói tiêu chuẩn 5 sao.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>10+ Năm</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Kinh Nghiệm Tổ Chức</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Hơn một thập kỷ đồng hành cùng hàng vạn du khách trên khắp các tuyến điểm di sản miền Trung, miền Bắc và quốc tế.
              </p>
            </div>

            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>4 - 5 Sao</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Tiêu Chuẩn Nghỉ Dưỡng</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Đối tác chiến lược của các tập đoàn khách sạn, hãng hàng không hàng đầu và hệ thống du thuyền hạng sang.
              </p>
            </div>

            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>100 Triệu</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Bảo Hiểm Toàn Diện</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Bảo hiểm du lịch trọn gói mức trách nhiệm cao được kích hoạt tự động ngay khi quý khách hoàn tất đặt tour.
              </p>
            </div>

            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284C7', marginBottom: '6px' }}>24/7</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Hỗ Trợ Chuyên Nghiệp</div>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Đội ngũ điều hành tour và hướng dẫn viên nhiệt tình, tận tâm chăm sóc khách hàng trong từng khoảnh khắc hành trình.
              </p>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '22px 26px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Hệ thống Phòng vé &amp; Quầy giao dịch VietTour</div>
              <div style={{ fontSize: '13.5px', color: '#334155', marginTop: '4px' }}>Quầy giao dịch Sân bay: Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất (45 Trường Sơn, Q. Tân Bình, TP.HCM)</div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>Đại lý Phòng vé Trung tâm: 190 Pasteur, Phường Võ Thị Sáu, Quận 3, TP.HCM • GP LHQT: 79-1234/2020/TCDL</div>
            </div>
            <Link
              href="/portal/policy"
              className="btn btn-primary"
              style={{ padding: '10px 18px', background: '#0F172A', borderColor: '#0F172A', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
            >
              Chính sách Hoàn hủy &amp; Bảo vệ khách hàng →
            </Link>
          </div>
        </div>
      </section>

      <CustomerFooter />
    </div>
  );
}
