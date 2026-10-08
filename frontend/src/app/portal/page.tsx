'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { api, useApi } from '@/lib/api';
import { ApiNotice, vnd } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';

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

  // Đọc danh mục từ query parameters trên URL (khi click từ navbar)
  useEffect(() => {
    const handleUrlCategory = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat && ['MIEN_TRUNG', 'MIEN_BAC', 'QUOC_TE', 'ALL'].includes(cat)) {
        setCategoryFilter(cat);
        const el = document.getElementById('tour-list-section');
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150);
        }
      }
    };
    handleUrlCategory();
    window.addEventListener('popstate', handleUrlCategory);
    return () => window.removeEventListener('popstate', handleUrlCategory);
  }, []);

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
  const [payMethod, setPayMethod] = useState<'VNPAY' | 'CASH_CARD'>('VNPAY');
  const [loadingVnpay, setLoadingVnpay] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const handlePayVNPay = async (donHangId: number, amount: number, maDon: string) => {
    try {
      setLoadingVnpay(true);
      const res = await api<{ paymentUrl: string }>('/vnpay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId,
          amount,
          orderInfo: `Thanh toan don tour ${maDon} qua VNPay`,
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

  // Modal Xem chi tiết tour nhanh
  const [detailTour, setDetailTour] = useState<Tour | null>(null);
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'SCHEDULES' | 'REVIEWS'>('OVERVIEW');

  const tours = useApi<Tour[]>(`/tours`);

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
      return next;
    });
  };

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
      { hoTen: user?.name || '', gioiTinh: 'Nam', cccd: '', loaiKhach: 'Nguoi lon' }
    ]);
    if (t.LichKhoiHanh && t.LichKhoiHanh.length > 0) {
      setSelectedLichId(t.LichKhoiHanh[0].LichID);
    } else {
      setSelectedLichId(t.TourID || 1);
    }
  };

  const handleOpenDetail = (t: Tour) => {
    setDetailTour(t);
    setDetailTab('OVERVIEW');
  };

  // Tính tiền tạm tính
  const currentSubtotal = useMemo(() => {
    if (!selectedTour) return 0;
    return Number(selectedTour.GiaNguoiLon) * adults + Number(selectedTour.GiaTreEm) * children;
  }, [selectedTour, adults, children]);

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
      alert('Vui lòng chọn ngày khởi hành!');
      return;
    }

    setBookingLoading(true);
    try {
      const customerId = user?.customerId || 1;
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

      // Đặt tour thành công -> mở ngay modal thanh toán VNPay & Tiền mặt/Thẻ
      setCreatedBooking({
        MaDon: res.MaDon,
        TongTien: Number(res.TongTien) - voucherDiscount,
        DonHangID: res.DonHangID,
      });
      setSelectedTour(null);
      void tours.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Đặt tour thất bại');
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

  // Lọc danh sách tour theo tất cả tiêu chí
  const filteredTours = useMemo(() => {
    return (tours.data ?? []).filter((t) => {
      // 1. Chế độ tìm kiếm (Mode)
      if (searchMode === 'FLIGHT' && t.DanhMuc?.TenDanhMuc?.includes('Quoc Te')) {
        // Luôn hiển thị
      }
      // 2. Điểm đến / Từ khóa
      if (destKeyword.trim()) {
        const kw = destKeyword.toLowerCase().trim();
        const matchTitle = t.TenTour.toLowerCase().includes(kw);
        const matchDest = t.DiemDen.toLowerCase().includes(kw);
        const matchCat = t.DanhMuc?.TenDanhMuc?.toLowerCase().includes(kw);
        if (!matchTitle && !matchDest && !matchCat) return false;
      }
      // 3. Điểm khởi hành
      if (departLocation !== 'ALL') {
        if (!t.DiemKhoiHanh?.toLowerCase().includes(departLocation.toLowerCase())) return false;
      }
      // 4. Danh mục tabs
      if (categoryFilter === 'MIEN_TRUNG') {
        if (!t.TenTour.includes('Đà Nẵng') && !t.TenTour.includes('Hội An') && !t.TenTour.includes('Huế')) return false;
      }
      if (categoryFilter === 'MIEN_BAC') {
        if (!t.TenTour.includes('Sapa') && !t.TenTour.includes('Hạ Long') && !t.TenTour.includes('Hà Nội')) return false;
      }
      if (categoryFilter === 'QUOC_TE') {
        if (!t.TenTour.includes('Nhật') && !t.TenTour.includes('Hàn') && !t.TenTour.includes('Thái')) return false;
      }
      // 5. Mức giá
      const price = Number(t.GiaNguoiLon);
      if (priceRange === 'UNDER_5M' && price > 5000000) return false;
      if (priceRange === '5M_15M' && (price < 5000000 || price > 15000000)) return false;
      if (priceRange === 'OVER_15M' && price < 15000000) return false;

      return true;
    });
  }, [tours.data, searchMode, destKeyword, departLocation, categoryFilter, priceRange]);

  // Lắng nghe tự động (Polling mỗi 2 giây) khi quét QR trên điện thoại hoàn tất
  useEffect(() => {
    if (!createdBooking?.MaDon) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/bookings/ticket/${createdBooking.MaDon}`);
        if (res.ok) {
          const data = await res.json();
          if (data.TrangThaiDon === 'Da thanh toan') {
            clearInterval(interval);
            alert(`🎉 Giao dịch thành công trên điện thoại! Đã kích hoạt vé điện tử cho mã đơn ${createdBooking.MaDon}.`);
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
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 700,
          zIndex: 2000,
          boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
        }}>
          ✓ {copyNotice}
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
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              padding: '18px 24px',
              textAlign: 'left',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr)) 140px',
                gap: '16px',
                alignItems: 'flex-end',
              }}>
                {/* 1. KHỞI HÀNH TỪ */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Khởi hành từ
                  </label>
                  <select
                    className="select"
                    value={departLocation}
                    onChange={(e) => setDepartLocation(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', fontWeight: 600, borderRadius: '8px', border: '1px solid #CBD5E1' }}
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
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Điểm đến mong muốn
                  </label>
                  <input
                    className="input"
                    placeholder="Đà Nẵng, Sapa, Nhật Bản..."
                    value={destKeyword}
                    onChange={(e) => setDestKeyword(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 3. NGÀY ĐI */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Ngày khởi hành
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* 4. MỨC NGÂN SÁCH */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Khoảng giá dự kiến
                  </label>
                  <select
                    className="select"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
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
                    padding: '11px 20px',
                    background: '#0284C7',
                    borderColor: '#0284C7',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    height: '42px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
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
            borderRadius: '16px',
            padding: '18px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            border: '1px solid #E2E8F0',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '24px',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🎟️</span>
              <div>
                <strong style={{ fontSize: '14.5px', color: '#0F172A', display: 'block' }}>MÃ ƯU ĐÃI NĂM 2026</strong>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Nhập mã khi đặt tour để được giảm ngay</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end' }}>
              {[
                { code: 'VIETTOUR2026', label: 'Giảm 10% (Tối đa 1Tr)' },
                { code: 'BAYHE2026', label: 'Tour Bay Giảm 15% (Tối đa 1.5Tr)' },
                { code: 'TRIAN500K', label: 'Tri Ân Khách Mới (-500K)' },
              ].map((v) => (
                <div
                  key={v.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    gap: '8px',
                    fontSize: '12.5px',
                  }}
                >
                  <code style={{ fontWeight: 800, color: '#0369A1', fontSize: '13px' }}>{v.code}</code>
                  <span style={{ color: '#475569', fontSize: '12px' }}>({v.label})</span>
                  <button
                    onClick={() => handleCopy(v.code, `Mã ${v.code}`)}
                    style={{
                      border: 'none',
                      background: '#E2E8F0',
                      color: '#0F172A',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0284C7'; e.currentTarget.style.color = '#FFF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
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
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#005BAA', textTransform: 'uppercase', letterSpacing: '1px' }}>
                HÀNH TRÌNH CHỌN LỌC
              </span>
              <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                Tour Du Lịch Đang Mở Bán
              </h2>
            </div>

            {/* CATEGORY TABS */}
            <div style={{ display: 'flex', gap: '8px', background: '#FFFFFF', padding: '6px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              {[
                { id: 'ALL', label: 'Tất cả tour' },
                { id: 'MIEN_TRUNG', label: 'Miền Trung' },
                { id: 'MIEN_BAC', label: 'Miền Bắc' },
                { id: 'QUOC_TE', label: 'Quốc Tế' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: categoryFilter === c.id ? '#005BAA' : 'transparent',
                    color: categoryFilter === c.id ? '#FFFFFF' : '#475569',
                    fontWeight: 800,
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

          {/* TOUR CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
            {filteredTours.map((t) => {
              const nearestLich = t.LichKhoiHanh?.[0];
              const remainSeats = nearestLich ? nearestLich.SoChoToiDa - nearestLich.SoChoDaDat : 15;

              return (
                <div
                  key={t.TourID}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  {/* TOUR IMAGE */}
                  <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.HinhAnhURL || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
                      alt={t.TenTour}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                      <span style={{ background: '#005BAA', color: '#FFF', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        ✈️ Bao gồm vé máy bay
                      </span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '10px', right: '12px', background: 'rgba(15,23,42,0.85)', color: '#FFF', fontSize: '11.5px', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                      ⏳ {t.ThoiGian}
                    </div>
                  </div>

                  {/* TOUR BODY */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Mã: {t.MaTour}</span>
                      <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 700 }}>⭐ 5.0 (Xuất sắc)</span>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '10px', lineHeight: 1.35 }}>
                      {t.TenTour}
                    </h3>

                    <div style={{ fontSize: '12.5px', color: '#475569', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>📍 Khởi hành từ: <strong>{t.DiemKhoiHanh || 'TP. Hồ Chí Minh'}</strong> → <strong>{t.DiemDen}</strong></div>
                      <div>📅 Ngày gần nhất: <strong>{nearestLich ? new Date(nearestLich.NgayKhoiHanh).toLocaleDateString('vi-VN') : '15/10/2026'}</strong></div>
                      <div style={{ color: remainSeats <= 5 ? '#E11D48' : '#059669', fontWeight: 700 }}>
                        🔥 Còn lại: <strong>{remainSeats} chỗ trống</strong>
                      </div>
                    </div>

                    {/* PRICE & ACTION BUTTONS */}
                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block' }}>Giá ưu đãi từ:</span>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#005BAA' }}>
                          {vnd(t.GiaNguoiLon)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenDetail(t)}
                          style={{ fontWeight: 700 }}
                        >
                          Chi tiết
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenBooking(t)}
                          style={{ background: '#005BAA', borderColor: '#005BAA', fontWeight: 800 }}
                        >
                          Đặt Ngay
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
      {/* 4. MODAL ĐẶT TOUR ĐA BƯỚC (AIRLINE STEP-BY-STEP BOOKING) */}
      {/* ========================================================================= */}
      {selectedTour && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '18px', background: '#FFFFFF', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Đăng Ký Tour Trực Tuyến
                </h3>
                <span style={{ fontSize: '12.5px', color: '#005BAA', fontWeight: 700 }}>{selectedTour.TenTour}</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedTour(null)}>✕</button>
            </div>

            {/* BƯỚC TIẾN TRÌNH */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', background: '#F8FAFC', padding: '8px', borderRadius: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: bookingStep === 1 ? 800 : 500, color: bookingStep === 1 ? '#005BAA' : '#64748B' }}>
                1. Lịch & Số khách
              </span>
              <span>→</span>
              <span style={{ fontSize: '12.5px', fontWeight: bookingStep === 2 ? 800 : 500, color: bookingStep === 2 ? '#005BAA' : '#64748B' }}>
                2. Hành khách & CCCD
              </span>
              <span>→</span>
              <span style={{ fontSize: '12.5px', fontWeight: bookingStep === 3 ? 800 : 500, color: bookingStep === 3 ? '#005BAA' : '#64748B' }}>
                3. Mã giảm & Xác nhận
              </span>
            </div>

            {/* BƯỚC 1: CHỌN LỊCH VÀ SỐ KHÁCH */}
            {bookingStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Chọn Đợt Khởi Hành Mở Bán <span style={{ color: '#E11D48' }}>*</span>
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%', fontSize: '13.5px' }}
                    value={selectedLichId || ''}
                    onChange={(e) => setSelectedLichId(Number(e.target.value))}
                  >
                    {selectedTour.LichKhoiHanh && selectedTour.LichKhoiHanh.length > 0 ? (
                      selectedTour.LichKhoiHanh.map((l) => (
                        <option key={l.LichID} value={l.LichID}>
                          {l.MaLich} — Khởi hành {new Date(l.NgayKhoiHanh).toLocaleDateString('vi-VN')} (Còn {l.SoChoToiDa - l.SoChoDaDat} chỗ)
                        </option>
                      ))
                    ) : (
                      <option value={selectedTour.TourID}>LICH-OCT15 — Khởi hành 15/10/2026 (Còn 25 chỗ)</option>
                    )}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Người lớn</label>
                      <span style={{ fontSize: '12px', color: '#0284C7', fontWeight: 700 }}>{vnd(selectedTour.GiaNguoiLon)}/khách</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, adults - 1);
                          setAdults(val);
                          syncPassengersCount(val, children);
                        }}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={adults}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          setAdults(val);
                          syncPassengersCount(val, children);
                        }}
                        style={{ textAlign: 'center', fontWeight: 800, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = adults + 1;
                          setAdults(val);
                          syncPassengersCount(val, children);
                        }}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Trẻ em</label>
                        <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>(2 - 11 tuổi)</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#0284C7', fontWeight: 700 }}>{vnd(selectedTour.GiaTreEm)}/khách</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(0, children - 1);
                          setChildren(val);
                          syncPassengersCount(adults, val);
                        }}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={children}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setChildren(val);
                          syncPassengersCount(adults, val);
                        }}
                        style={{ textAlign: 'center', fontWeight: 800, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = children + 1;
                          setChildren(val);
                          syncPassengersCount(adults, val);
                        }}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>Tạm tính vé:</span>
                  <strong style={{ fontSize: '18px', color: '#0284C7' }}>{vnd(currentSubtotal)}</strong>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => setBookingStep(2)}
                  style={{ width: '100%', padding: '12px', background: '#0284C7', borderColor: '#0284C7', fontWeight: 800 }}
                >
                  Tiếp Tục: Nhập Thông Tin Hành Khách →
                </button>
              </div>
            )}

            {/* BƯỚC 2: DANH SÁCH HÀNH KHÁCH (CCCD 12 SỐ CHUẨN ĐỀ TÀI) */}
            {bookingStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                  Vui lòng nhập Họ tên và số <strong>CCCD (12 số)</strong> của các hành khách đi tour (bắt buộc theo quy định lữ hành & hàng không):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
                  {passengers.map((p, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#005BAA', marginBottom: '6px' }}>
                        Hành khách {idx + 1} ({p.loaiKhach})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '8px', marginBottom: '6px' }}>
                        <input
                          className="input"
                          placeholder="Họ và tên..."
                          value={p.hoTen}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPassengers((prev) => {
                              const next = [...prev];
                              next[idx].hoTen = val;
                              return next;
                            });
                          }}
                        />
                        <select
                          className="select"
                          value={p.gioiTinh}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPassengers((prev) => {
                              const next = [...prev];
                              next[idx].gioiTinh = val;
                              return next;
                            });
                          }}
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nu">Nữ</option>
                        </select>
                      </div>
                      <input
                        className="input"
                        placeholder="Số CCCD 12 số (người lớn)..."
                        maxLength={12}
                        value={p.cccd}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPassengers((prev) => {
                            const next = [...prev];
                            next[idx].cccd = val;
                            return next;
                          });
                        }}
                        style={{ width: '100%', fontSize: '12.5px' }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline" onClick={() => setBookingStep(1)}>← Quay lại</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setBookingStep(3)}
                    style={{ flex: 1, background: '#005BAA', fontWeight: 800 }}
                  >
                    Tiếp Tục: Mã Giảm Giá & Thanh Toán →
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 3: MÃ GIẢM GIÁ VÀ XÁC NHẬN */}
            {bookingStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Ô NHẬP VOUCHER */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Áp Dụng Mã Ưu Đãi (Voucher)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="input"
                      placeholder="Nhập VIETTOUR2026 hoặc BAYHE2026..."
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      style={{ flex: 1, textTransform: 'uppercase', fontWeight: 800 }}
                    />
                    <button
                      className="btn btn-outline"
                      onClick={handleApplyVoucher}
                      disabled={validatingVoucher}
                      style={{ fontWeight: 800 }}
                    >
                      {validatingVoucher ? 'Kiểm tra...' : 'Áp Dụng'}
                    </button>
                  </div>

                  {voucherApplied && (
                    <div style={{ fontSize: '12.5px', color: '#16A34A', fontWeight: 700, marginTop: '6px' }}>
                      ✓ {voucherApplied}
                    </div>
                  )}
                  {voucherError && (
                    <div style={{ fontSize: '12.5px', color: '#DC2626', fontWeight: 600, marginTop: '6px' }}>
                      ✕ {voucherError}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#005BAA', paddingTop: '8px', borderTop: '1px dashed #CBD5E1' }}>
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
                    style={{ flex: 1, background: '#10B981', borderColor: '#10B981', fontWeight: 900, fontSize: '14.5px' }}
                  >
                    {bookingLoading ? 'Đang khởi tạo đơn...' : '🚀 XÁC NHẬN & THANH TOÁN NGAY'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL THANH TOÁN VIETQR & VNPAY NGAY SAU KHI ĐẶT THÀNH CÔNG */}
      {/* ========================================================================= */}
      {createdBooking && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '18px', background: '#FFFFFF', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '36px', marginBottom: '4px' }}>🎉</div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: 0 }}>ĐẶT TOUR THÀNH CÔNG!</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                Mã đơn hàng: <strong style={{ color: '#005BAA', fontSize: '15px' }}>{createdBooking.MaDon}</strong>
              </p>
            </div>

            <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12.5px', color: '#64748B' }}>Số tiền thanh toán:</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#005BAA' }}>{vnd(createdBooking.TongTien)}</div>
            </div>

            {/* TAB CHUYỂN ĐỔI: VNPAY vs TIỀN MẶT/THẺ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => setPayMethod('VNPAY')}
                style={{
                  padding: '9px 8px', border: 'none', borderRadius: '6px',
                  background: payMethod === 'VNPAY' ? '#0284C7' : 'transparent',
                  color: payMethod === 'VNPAY' ? '#FFF' : '#475569',
                  fontWeight: 700, fontSize: '12.5px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Cổng VNPay Trực Tuyến
              </button>
              <button
                onClick={() => setPayMethod('CASH_CARD')}
                style={{
                  padding: '9px 8px', border: 'none', borderRadius: '6px',
                  background: payMethod === 'CASH_CARD' ? '#0284C7' : 'transparent',
                  color: payMethod === 'CASH_CARD' ? '#FFF' : '#475569',
                  fontWeight: 700, fontSize: '12.5px', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Tiền mặt / Thẻ tại quầy
              </button>
            </div>

            {/* TAB 1: CỔNG VNPAY TRỰC TUYẾN (SANDBOX) */}
            {payMethod === 'VNPAY' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <button
                  onClick={() => handlePayVNPay(createdBooking.DonHangID, createdBooking.TongTien, createdBooking.MaDon)}
                  disabled={loadingVnpay}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '13px', background: '#0284C7', borderColor: '#0284C7',
                    fontWeight: 700, fontSize: '14.5px', borderRadius: '8px', cursor: 'pointer',
                  }}
                >
                  {loadingVnpay ? 'Đang kết nối cổng VNPay...' : 'Thanh toán ngay qua Cổng VNPay Sandbox →'}
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
                    • Không quét mã QR bằng App Ngân Hàng thật bên ngoài (sẽ báo <em>"Nhà cung cấp không khả dụng"</em> do đây là môi trường thử nghiệm).
                  </div>
                  <div>
                    • Trên giao diện VNPay, chọn mục <strong>"Thẻ nội địa & tài khoản ngân hàng"</strong> → Chọn <strong>NCB</strong> → Nhập thẻ thử nghiệm:
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
            {payMethod === 'CASH_CARD' && (
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
                    Đã giữ chỗ thành công (Thời hạn 24 giờ)
                  </div>
                  <p style={{ margin: '0 0 10px', lineHeight: 1.5 }}>
                    Chuyến đi của Quý khách đã được bảo lưu trên hệ thống. Quý khách vui lòng hoàn tất thanh toán trước khi thời hạn giữ chỗ kết thúc.
                  </p>
                  <div style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #DCFCE7', fontSize: '12.5px', color: '#1E293B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>Văn phòng VietTour: <strong>Số 40, Đường số 13, KĐT Vạn Phúc, TP. Hồ Chí Minh</strong></div>
                    <div>Hình thức hỗ trợ: <strong>Tiền mặt hoặc Quẹt thẻ POS (ATM / Visa / Mastercard)</strong></div>
                    <div>Hotline hỗ trợ 24/7: <strong style={{ color: '#0284C7' }}>1900 1234</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href="/portal/my-bookings"
                    className="btn btn-outline"
                    style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontWeight: 700, fontSize: '13px', padding: '10px' }}
                  >
                    Xem đơn của tôi
                  </Link>
                  <button
                    onClick={() => setCreatedBooking(null)}
                    className="btn btn-primary"
                    style={{ flex: 1, background: '#0F172A', borderColor: '#0F172A', fontWeight: 700, fontSize: '13px', padding: '10px' }}
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <Link href={`/portal/ticket/${createdBooking.MaDon}`} style={{ fontSize: '13px', color: '#005BAA', fontWeight: 700 }}>
                Xem trước vé điện tử Boarding Pass →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT TOUR NHANH */}
      {detailTour && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', background: '#FFFFFF', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>{detailTour.TenTour}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setDetailTour(null)}>✕</button>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>{detailTour.MoTaChiTiet || 'Chương trình du lịch chất lượng cao của VietTour.'}</p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Link href={`/portal/tours/${detailTour.TourID}`} className="btn btn-outline" style={{ fontWeight: 700 }}>
                Trang Chi Tiết Đầy Đủ
              </Link>
              <button className="btn btn-primary" onClick={() => handleOpenBooking(detailTour)} style={{ background: '#005BAA', fontWeight: 800 }}>
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

          <div style={{ background: '#F0F9FF', borderRadius: '16px', padding: '24px 28px', border: '1px solid #BAE6FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0369A1' }}>Trụ sở điều hành VietTour tại Việt Nam</div>
              <div style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px' }}>Số 40, Đường số 13, Khu Đô Thị Vạn Phúc, TP. Thủ Đức, TP. Hồ Chí Minh</div>
              <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>Giấy phép kinh doanh lữ hành quốc tế số: 79-1234/2020/TCDL-GP LHQT</div>
            </div>
            <Link
              href="/portal/policy"
              className="btn btn-primary"
              style={{ padding: '10px 20px', background: '#0284C7', borderColor: '#0284C7', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' }}
            >
              Xem Chính Sách Hoàn Hủy & Bảo Vệ Khách Hàng →
            </Link>
          </div>
        </div>
      </section>

      <CustomerFooter />
    </div>
  );
}
