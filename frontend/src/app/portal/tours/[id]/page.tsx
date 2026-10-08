'use client';
import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { api, useApi } from '@/lib/api';
import { vnd } from '@/lib/ui';
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
  const tour = tourApi.data;

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
  const [payMethod, setPayMethod] = useState<'VNPAY' | 'CASH_CARD'>('VNPAY');
  const [loadingVnpay, setLoadingVnpay] = useState(false);
  const [confirmingPay, setConfirmingPay] = useState(false);

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

  // Review states
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Active departure schedule
  const activeLichId = selectedLichId || (tour?.LichKhoiHanh && tour.LichKhoiHanh.length > 0 ? tour.LichKhoiHanh[0].LichID : null);

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

  const rawTotal = tour ? Number(tour.GiaNguoiLon) * adults + Number(tour.GiaTreEm) * children : 0;
  const finalTotal = Math.max(rawTotal - voucherDiscount, 0);

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

    setBookingLoading(true);
    try {
      const customerId = user?.customerId || 1;
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

  const parseItineraryDays = (raw: string | null) => {
    if (!raw) return [];
    const lines = raw.split(/\r?\n|•/).map((l) => l.trim()).filter(Boolean);
    return lines.map((l, idx) => {
      const parts = l.split(':');
      if (parts.length >= 2) {
        return { title: parts[0].trim(), detail: parts.slice(1).join(':').trim() };
      }
      return { title: `Ngày ${idx + 1}`, detail: l };
    });
  };

  const itineraryDays = parseItineraryDays(tour?.LichTrinh || null);

  // Polling tự động kiểm tra trạng thái thanh toán từ điện thoại
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#005BAA', color: '#FFF', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase' }}>
                ✈️ BAO GỒM VÉ MÁY BAY KHỨ HỒI
              </span>
              <span style={{ background: '#FEF3C7', color: '#B45309', fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px' }}>
                ⭐ 5.0 (Xuất sắc)
              </span>
              <span className="code" style={{ fontSize: '12px', fontWeight: 700 }}>Mã tour: {tour.MaTour}</span>
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
              src={tour.HinhAnhURL || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'}
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
              <div className="card" style={{ padding: '26px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '14px' }}>
                  Điểm nổi bật của hành trình
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#005BAA', marginBottom: '2px' }}>✈️ Vé máy bay khứ hồi</div>
                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>Đầy đủ 20kg ký gửi + 7kg xách tay tiêu chuẩn hàng không.</p>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#005BAA', marginBottom: '2px' }}>🏨 Khách sạn 4 sao cao cấp</div>
                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>Nghỉ dưỡng tiện nghi, view đẹp, kèm buffet sáng hàng ngày.</p>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#005BAA', marginBottom: '2px' }}>🍲 Ẩm thực đặc sản chọn lọc</div>
                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>Thưởng thức các bữa ăn đặc sản địa phương phong phú.</p>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#005BAA', marginBottom: '2px' }}>🛡️ Bảo hiểm du lịch tối đa 120Tr</div>
                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0 }}>An tâm tuyệt đối trong suốt chuyến đi.</p>
                  </div>
                </div>
              </div>

              {/* 2. LỊCH TRÌNH THEO NGÀY (TIMELINE) */}
              <div className="card" style={{ padding: '26px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '18px' }}>
                  Lịch trình chi tiết từng ngày
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {itineraryDays.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%', background: '#005BAA',
                        color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, background: '#F8FAFC', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                          {item.title}
                        </h4>
                        <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. DỊCH VỤ BAO GỒM & KHÔNG BAO GỒM */}
              <div className="card" style={{ padding: '26px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
                  Điều khoản Dịch vụ
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '13px', lineHeight: 1.7 }}>
                  <div>
                    <h4 style={{ color: '#059669', fontWeight: 800, marginBottom: '6px' }}>✓ Giá tour bao gồm:</h4>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#475569' }}>
                      <li>Vé máy bay khứ hồi (20kg ký gửi + 7kg xách tay)</li>
                      <li>Khách sạn 4 sao tiêu chuẩn (2 khách/phòng)</li>
                      <li>Xe du lịch máy lạnh đưa đón suốt tuyến</li>
                      <li>Các bữa ăn theo lịch trình</li>
                      <li>Vé tham quan các thắng cảnh nổi tiếng</li>
                      <li>Bảo hiểm du lịch tối đa 120.000.000 VNĐ</li>
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: '#DC2626', fontWeight: 800, marginBottom: '6px' }}>✕ Không bao gồm:</h4>
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#475569' }}>
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
            <div style={{ position: 'sticky', top: '90px' }}>
              <div className="card" style={{ padding: '24px', borderRadius: '18px', background: '#FFFFFF', border: '1px solid #CBD5E1', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Giá trọn gói từ:</span>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#005BAA', marginTop: '2px', marginBottom: '16px' }}>
                  {vnd(tour.GiaNguoiLon)}
                </div>

                {/* CHỌN LỊCH */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                    Chọn Ngày Khởi Hành:
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%', fontSize: '13px' }}
                    value={activeLichId || ''}
                    onChange={(e) => setSelectedLichId(Number(e.target.value))}
                  >
                    {tour.LichKhoiHanh && tour.LichKhoiHanh.length > 0 ? (
                      tour.LichKhoiHanh.map((l) => (
                        <option key={l.LichID} value={l.LichID}>
                          {l.MaLich} — {new Date(l.NgayKhoiHanh).toLocaleDateString('vi-VN')} (Còn {l.SoChoToiDa - l.SoChoDaDat} chỗ)
                        </option>
                      ))
                    ) : (
                      <option value={tour.TourID}>LICH-OCT15 — 15/10/2026 (Còn 25 chỗ)</option>
                    )}
                  </select>
                </div>

                {/* SỐ KHÁCH: BỐ CỤC CHUẨN LỮ HÀNH CAO CẤP */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  {/* NGƯỜI LỚN */}
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Người lớn</div>
                      <div style={{ fontSize: '11.5px', color: '#0284C7', fontWeight: 700 }}>{vnd(tour.GiaNguoiLon)}/khách</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, adults - 1);
                          setAdults(val);
                          syncPassengersCount(val, children);
                        }}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
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
                        style={{ width: '45px', textAlign: 'center', fontWeight: 800, padding: '4px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = adults + 1;
                          setAdults(val);
                          syncPassengersCount(val, children);
                        }}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* TRẺ EM */}
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                        Trẻ em <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>(2 - 11 tuổi)</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#0284C7', fontWeight: 700 }}>{vnd(tour.GiaTreEm)}/khách</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(0, children - 1);
                          setChildren(val);
                          syncPassengersCount(adults, val);
                        }}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
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
                        style={{ width: '45px', textAlign: 'center', fontWeight: 800, padding: '4px' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = children + 1;
                          setChildren(val);
                          syncPassengersCount(adults, val);
                        }}
                        style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 800, cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* FORM HÀNH KHÁCH & CCCD 12 SỐ */}
                <div style={{ marginBottom: '14px', background: '#F8FAFC', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#0284C7', display: 'block', marginBottom: '8px' }}>
                    Danh sách Hành Khách & CCCD (12 số):
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {passengers.map((p, idx) => (
                      <div key={idx} style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                          Khách {idx + 1} ({idx < adults ? 'Người lớn' : 'Trẻ em'})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          />
                          <input
                            className="input"
                            placeholder="Số CCCD / Mã định danh (12 số)"
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
                            style={{ fontSize: '12px', padding: '6px 8px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VOUCHER INPUT */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                    Mã giảm giá (VIETTOUR2026, BAYHE2026...):
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      className="input"
                      placeholder="MÃ GIẢM GIÁ"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      style={{ flex: 1, textTransform: 'uppercase', fontSize: '12.5px', fontWeight: 800 }}
                    />
                    <button className="btn btn-outline btn-sm" onClick={handleApplyVoucher} disabled={validatingVoucher} style={{ fontWeight: 800 }}>
                      Áp dụng
                    </button>
                  </div>
                  {voucherApplied && <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700, marginTop: '4px' }}>✓ {voucherApplied}</div>}
                  {voucherError && <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600, marginTop: '4px' }}>✕ {voucherError}</div>}
                </div>

                {/* TỔNG TIỀN */}
                <div style={{ background: '#EFF6FF', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#005BAA' }}>TỔNG CỘNG:</span>
                    <strong style={{ fontSize: '20px', fontWeight: 900, color: '#005BAA' }}>
                      {vnd(finalTotal)}
                    </strong>
                  </div>
                </div>

                {/* NÚT ĐẶT NGAY */}
                <button
                  className="btn btn-primary"
                  onClick={handleBooking}
                  disabled={bookingLoading}
                  style={{ width: '100%', padding: '14px', background: '#005BAA', borderColor: '#005BAA', fontWeight: 900, fontSize: '15px' }}
                >
                  {bookingLoading ? 'Đang gửi...' : '🚀 ĐẶT TOUR & NHẬN VÉ QR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL THANH TOÁN QR SAU KHI ĐẶT THÀNH CÔNG */}
      {createdBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto', borderRadius: '18px', background: '#FFFFFF', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '32px' }}>🎉</div>
              <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#0F172A', margin: '4px 0' }}>ĐẶT TOUR THÀNH CÔNG!</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Mã đơn: <strong style={{ color: '#005BAA' }}>{createdBooking.MaDon}</strong></p>
            </div>

            <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '10px', borderRadius: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Số tiền thanh toán:</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#005BAA' }}>{vnd(createdBooking.TongTien)}</div>
            </div>

            {/* TAB CHUYỂN ĐỔI: VNPAY vs TIỀN MẶT/THẺ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', background: '#F1F5F9', padding: '4px', borderRadius: '10px' }}>
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

            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <Link href={`/portal/ticket/${createdBooking.MaDon}`} style={{ fontSize: '13px', color: '#005BAA', fontWeight: 700 }}>
                Xem trước vé điện tử Boarding Pass →
              </Link>
            </div>
          </div>
        </div>
      )}

      <CustomerFooter />
    </div>
  );
}
