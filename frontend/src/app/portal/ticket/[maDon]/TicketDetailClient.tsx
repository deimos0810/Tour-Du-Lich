'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import { api, downloadFile } from '@/lib/api';
import { vnd } from '@/lib/ui';
import { useAuth, UserSession } from '@/context/AuthContext';
import { Printer, AlertTriangle, Check, Clock, UserCheck, Lock, Shield } from 'lucide-react';

export type Passenger = {
  ChiTietID: number;
  HoTen: string;
  LoaiKhach: string;
  CCCD: string | null;
  NgaySinh: string | null;
  MaQRVe: string | null;
  TrangThaiDiemDanh: number;
  GhiChu: string | null;
};

export type TicketData = {
  DonHangID: number;
  MaDon: string;
  NgayDat: string;
  SoLuongNguoiLon: number;
  SoLuongTreEm: number;
  TongTien: string;
  GiamGia: string;
  TienCoc: string;
  TienConLai?: string;
  TrangThaiDon: string;
  PhuongThucTT: string | null;
  lanIp?: string | null;
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

export default function TicketDetailClient({
  maDon,
  initialTicket,
  initialKhachId,
}: {
  maDon: string;
  initialTicket: TicketData | null;
  initialKhachId?: number | null;
}) {
  const { user, logout } = useAuth();

  const [ticket, setTicket] = useState<TicketData | null>(initialTicket);
  const [loading, setLoading] = useState(!initialTicket);
  const [error, setError] = useState<string | null>(null);
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);
  const [payingVnpay, setPayingVnpay] = useState(false);

  const initialDefaultPassengerId = (() => {
    const list = initialTicket?.ChiTietHanhKhach || [];
    if (!list.length) return null;
    if (initialKhachId) {
      const m = list.find((p) => p.ChiTietID === Number(initialKhachId));
      if (m) return m.ChiTietID;
    }
    return list[0].ChiTietID;
  })();

  const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(initialDefaultPassengerId);

  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const isGuideOrStaff = Boolean(
    user &&
      (user.roles?.some((r) => ['HDV', 'Huong dan vien', 'Admin', 'Dieu hanh'].includes(r)) ||
        ['HDV', 'Huong dan vien', 'Admin', 'Dieu hanh'].includes(user.primaryRole) ||
        user.employeeId != null),
  );

  const applyPassengerSelection = (res: TicketData) => {
    if (typeof window !== 'undefined' && res.ChiTietHanhKhach?.length > 0) {
      const sp = new URLSearchParams(window.location.search);
      const khachParam = Number(sp.get('khach') || initialKhachId || 0);
      const matchedFromUrl = res.ChiTietHanhKhach.find((p) => p.ChiTietID === khachParam);

      const norm = (s?: string | null) => (s || '').trim().toLowerCase();
      const savedUserRaw = localStorage.getItem('viettour_user');
      let currentUserName = user?.name || '';
      if (!currentUserName && savedUserRaw) {
        try {
          currentUserName = JSON.parse(savedUserRaw)?.name || '';
        } catch {}
      }
      const targetNorm = norm(currentUserName);
      const matchedByOwner = targetNorm
        ? res.ChiTietHanhKhach.find(
            (p) => norm(p.HoTen) === targetNorm || norm(p.HoTen).includes(targetNorm) || targetNorm.includes(norm(p.HoTen)),
          )
        : null;

      if (matchedFromUrl && (isGuideOrStaff || !matchedByOwner || matchedFromUrl.ChiTietID === matchedByOwner.ChiTietID)) {
        setSelectedPassengerId(matchedFromUrl.ChiTietID);
      } else if (matchedByOwner) {
        setSelectedPassengerId(matchedByOwner.ChiTietID);
      } else if (matchedFromUrl) {
        setSelectedPassengerId(matchedFromUrl.ChiTietID);
      } else {
        setSelectedPassengerId((prev) => prev ?? res.ChiTietHanhKhach[0].ChiTietID);
      }
    }
  };

  const fetchTicket = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api<TicketData>(`/bookings/ticket/${maDon}`);
      setTicket(res);
      setError(null);
      applyPassengerSelection(res);
    } catch (err) {
      if (!ticket) {
        setError(err instanceof Error ? err.message : 'Không tìm thấy thông tin đơn đặt tour');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicket) {
      applyPassengerSelection(initialTicket);
    } else {
      void fetchTicket(false);
    }
  }, [maDon, user?.name]);

  const handleCheckin = async (chiTietId: number) => {
    try {
      setCheckingInId(chiTietId);
      await api(`/bookings/checkin/${chiTietId}`, { method: 'POST' });
      setCheckinMsg('Đã xác nhận điểm danh (Check-in) hành khách lên đoàn thành công!');
      await fetchTicket(true);
      setTimeout(() => setCheckinMsg(null), 4000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Điểm danh thất bại');
    } finally {
      setCheckingInId(null);
    }
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await api<{ token: string; user: UserSession }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      localStorage.setItem('viettour_user', JSON.stringify(res.user));
      localStorage.setItem('viettour_token', res.token);
      window.location.reload();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Đăng nhập không thành công');
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePayVNPayNow = async () => {
    if (!ticket) return;
    try {
      setPayingVnpay(true);
      const amount = Number(
        ticket.TienConLai ??
          Math.max(0, Number(ticket.TongTien) - Number(ticket.GiamGia || 0) - Number(ticket.TienCoc || 0)),
      );
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/portal/my-bookings` : undefined;
      const res = await api<{ paymentUrl: string }>('/vnpay/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          donHangId: ticket.DonHangID,
          amount,
          orderInfo: `Thanh toan don tour ${ticket.MaDon} qua VNPay`,
          returnUrl,
        }),
      });
      if (res.paymentUrl) {
        window.location.href = res.paymentUrl;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể kết nối cổng VNPay');
    } finally {
      setPayingVnpay(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isPaid = ticket?.TrangThaiDon === 'Da thanh toan';
  const isCancelled = ticket?.TrangThaiDon === 'Da huy';
  const hdv = ticket?.LichKhoiHanh?.DieuPhoiTour?.[0]?.HuongDanVien?.NhanVien;
  const passengers = ticket?.ChiTietHanhKhach ?? [];
  const selectedPassenger =
    passengers.find((p) => p.ChiTietID === selectedPassengerId) ?? passengers[0] ?? null;
  const selectedPassengerIndex = selectedPassenger
    ? passengers.findIndex((p) => p.ChiTietID === selectedPassenger.ChiTietID)
    : 0;

  const getPassengerQrUrl = (passengerId?: number | null) => {
    if (!ticket) return '';
    const host = ticket.lanIp || '192.168.1.8';
    const base =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
        ? window.location.origin
        : `http://${host}:3000`;
    const suffix = passengerId ? `?khach=${passengerId}` : '';
    return `${base}/portal/ticket/${ticket.MaDon}${suffix}`;
  };

  const qrPayload = getPassengerQrUrl(selectedPassenger?.ChiTietID);
  const netPayable = ticket ? Math.max(0, Number(ticket.TongTien) - Number(ticket.GiamGia || 0)) : 0;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="no-print">
        <CustomerHeader />
      </div>

      <main style={{ flex: 1, padding: '28px 16px', maxWidth: '940px', margin: '0 auto', width: '100%' }}>
        {/* TOP CONTROLS & RBAC STATUS BAR */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Link
            href={isGuideOrStaff ? '/my-schedule' : '/portal/my-bookings'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0F172A',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '13.5px',
            }}
          >
            ← {isGuideOrStaff ? 'Quay lại Lịch dẫn tour (HDV)' : 'Quay lại đơn đặt tour của tôi'}
          </Link>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: isGuideOrStaff ? '#0F172A' : '#F1F5F9',
                color: isGuideOrStaff ? '#FFFFFF' : '#334155',
                border: '1px solid #CBD5E1',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <Shield size={13} />
              {user ? (
                <span>
                  Vai trò: <strong>{isGuideOrStaff ? `Hướng dẫn viên / Điều hành (${user.name})` : `Khách hàng (${user.name})`}</strong>
                </span>
              ) : (
                <span>Chế độ: Khách tra cứu vé</span>
              )}
              <button
                type="button"
                onClick={() => setShowQuickLogin((v) => !v)}
                style={{
                  marginLeft: '6px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '4px',
                  border: '1px solid #94A3B8',
                  background: isGuideOrStaff ? '#334155' : '#FFFFFF',
                  color: isGuideOrStaff ? '#FFFFFF' : '#0F172A',
                  cursor: 'pointer',
                }}
              >
                {user ? 'Đổi TK' : 'Đăng nhập HDV / Khách'}
              </button>
            </div>

            {isPaid && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} strokeWidth={1.6} /> In vé
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(`/export/ticket/pdf/${maDon}`, `ve-dien-tu-${maDon}.pdf`).catch((e) =>
                      alert(e instanceof Error ? e.message : 'Không thể tải vé PDF'),
                    )
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: '1px solid #0F172A',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  Tải vé PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* KHUNG ĐĂNG NHẬP NHANH TRÊN ĐIỆN THOẠI THẬT */}
        {showQuickLogin && (
          <div
            className="no-print"
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                Đăng nhập tài khoản để hiển thị đúng phân quyền trên trang vé (Khách hàng xem vé / HDV điểm danh)
              </div>
              {user && (
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: '1px solid #FECDD3',
                    background: '#FFF1F2',
                    color: '#BE123C',
                    cursor: 'pointer',
                  }}
                >
                  Đăng xuất tài khoản hiện tại
                </button>
              )}
            </div>
            {loginError && (
              <div style={{ fontSize: '12px', color: '#BE123C', marginBottom: '8px', fontWeight: 600 }}>
                {loginError}
              </div>
            )}
            <form onSubmit={handleQuickLogin} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="email"
                required
                placeholder="Email tài khoản (VD: hdv.nam@viettour.vn)"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="input"
                style={{ flex: '1 1 200px', fontSize: '12.5px', padding: '7px 10px' }}
              />
              <input
                type="password"
                required
                placeholder="Mật khẩu"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input"
                style={{ flex: '1 1 140px', fontSize: '12.5px', padding: '7px 10px' }}
              />
              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                {loginLoading ? 'Đang xử lý...' : 'Đăng nhập ngay'}
              </button>
            </form>
          </div>
        )}

        {checkinMsg && (
          <div
            style={{
              background: '#0F172A',
              color: '#FFFFFF',
              padding: '10px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontWeight: 600,
              textAlign: 'center',
              fontSize: '13px',
            }}
          >
            {checkinMsg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748B', fontWeight: 600, fontSize: '14px' }}>
            Đang tải thông tin chứng từ...
          </div>
        ) : error || !ticket ? (
          <div style={{ background: '#FFFFFF', padding: '40px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <AlertTriangle size={24} strokeWidth={1.6} color="#BE123C" style={{ margin: '0 auto 10px' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>Không tìm thấy dữ liệu</h2>
            <p style={{ color: '#64748B', fontSize: '13px' }}>
              Mã tra cứu <strong>{maDon}</strong> không tồn tại trên hệ thống.
            </p>
            <Link href="/portal" style={{ display: 'inline-block', marginTop: '14px', color: '#0F172A', fontWeight: 600, fontSize: '13px' }}>
              Về trang chủ VietTour
            </Link>
          </div>
        ) : (
          <div
            id="e-ticket-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            {/* BANNER SOÁT VÉ NHANH DÀNH RIÊNG CHO VAI TRÒ HƯỚNG DẪN VIÊN (RBAC) */}
            {isGuideOrStaff && isPaid && selectedPassenger && (
              <div
                className="no-print"
                style={{
                  background: '#F8FAFC',
                  borderBottom: '2px solid #0F172A',
                  padding: '14px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Chế độ Hướng dẫn viên soát vé • Hành khách đang chọn ({selectedPassengerIndex + 1}/{passengers.length})
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {selectedPassenger.HoTen} —{' '}
                    <span style={{ fontFamily: 'monospace', fontSize: '13.5px' }}>
                      {selectedPassenger.MaQRVe || `VT-${ticket.MaDon}-${selectedPassengerIndex + 1}`}
                    </span>
                    {selectedPassenger.CCCD ? ` (CCCD: ${selectedPassenger.CCCD})` : ''}
                  </div>
                </div>

                <div>
                  {selectedPassenger.TrangThaiDiemDanh === 1 ? (
                    <span
                      style={{
                        background: '#F0FDF4',
                        color: '#15803D',
                        border: '1px solid #BBF7D0',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Check size={14} strokeWidth={2.2} /> Hành khách này đã điểm danh
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCheckin(selectedPassenger.ChiTietID)}
                      disabled={checkingInId === selectedPassenger.ChiTietID}
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <UserCheck size={15} strokeWidth={1.8} />
                      {checkingInId === selectedPassenger.ChiTietID
                        ? 'Đang xác nhận...'
                        : `Xác nhận Điểm danh: ${selectedPassenger.HoTen}`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* HEADER CHỨNG TỪ TỐI GIẢN */}
            <div
              style={{
                background: '#FFFFFF',
                color: '#0F172A',
                padding: '22px 28px',
                borderBottom: '2px solid #0F172A',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.8px', color: '#0F172A' }}>
                    VIETTOUR
                  </span>
                  <span style={{ color: '#CBD5E1' }}>|</span>
                  <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {isPaid ? 'Electronic Ticket & Boarding Pass' : 'Booking Reservation Notice'}
                  </span>
                </div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.2px' }}>
                  {isPaid
                    ? 'VÉ ĐIỆN TỬ & THẺ LÊN ĐOÀN DU LỊCH'
                    : isCancelled
                    ? 'XÁC NHẬN ĐƠN ĐẶT TOUR ĐÃ HỦY'
                    : 'PHIẾU XÁC NHẬN GIỮ CHỖ TẠM THỜI (CHƯA XUẤT VÉ)'}
                </h1>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    background: isPaid ? '#F0FDF4' : isCancelled ? '#FFF1F2' : '#FFFBEB',
                    color: isPaid ? '#15803D' : isCancelled ? '#BE123C' : '#B45309',
                    border: `1px solid ${isPaid ? '#BBF7D0' : isCancelled ? '#FECDD3' : '#FDE68A'}`,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {isPaid ? (
                    <>
                      <Check size={12} strokeWidth={2.2} /> ĐÃ THANH TOÁN — VÉ HỢP LỆ
                    </>
                  ) : isCancelled ? (
                    <>ĐÃ HỦY ĐƠN</>
                  ) : (
                    <>
                      <Clock size={12} strokeWidth={1.8} /> CHỜ THANH TOÁN — CHƯA CÓ HIỆU LỰC LÊN ĐOÀN
                    </>
                  )}
                </span>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px' }}>
                  Mã đặt chỗ: <strong style={{ color: '#0F172A', fontSize: '14px', fontFamily: 'monospace' }}>{ticket.MaDon}</strong>
                </div>
              </div>
            </div>

            {/* THÔNG TIN TUYẾN HÀNH TRÌNH */}
            <div
              style={{
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                padding: '20px 28px',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                  Điểm khởi hành
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  {ticket.LichKhoiHanh?.Tour?.DiemKhoiHanh || 'TP. Hồ Chí Minh'}
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                  Ngày đi: <strong>{new Date(ticket.LichKhoiHanh?.NgayKhoiHanh).toLocaleDateString('vi-VN')}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', padding: '0 16px' }}>
                <div style={{ fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                  {ticket.LichKhoiHanh?.Tour?.ThoiGian || 'Tour trọn gói'}
                </div>
                <div style={{ width: '120px', height: '1px', background: '#94A3B8', margin: '6px auto' }} />
                <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                  {ticket.LichKhoiHanh?.Tour?.PhuongTien || 'Máy bay & Xe du lịch'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 600, marginBottom: '2px' }}>
                  Điểm đến
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  {ticket.LichKhoiHanh?.Tour?.DiemDen}
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                  Ngày về: <strong>{new Date(ticket.LichKhoiHanh?.NgayKetThuc).toLocaleDateString('vi-VN')}</strong>
                </div>
              </div>
            </div>

            {/* CHI TIẾT HÀNH TRÌNH & KHU VỰC MÃ QR THEO TỪNG HÀNH KHÁCH */}
            <div
              style={{
                padding: '24px 28px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
                  {ticket.LichKhoiHanh?.Tour?.TenTour}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
                  <span>
                    Mã tour: <strong style={{ color: '#0F172A' }}>{ticket.LichKhoiHanh?.Tour?.MaTour}</strong>
                  </span>
                  <span>
                    Mã lịch: <strong style={{ color: '#0F172A' }}>{ticket.LichKhoiHanh?.MaLich}</strong>
                  </span>
                  <span>
                    Số khách:{' '}
                    <strong style={{ color: '#0F172A' }}>
                      {ticket.SoLuongNguoiLon} người lớn{ticket.SoLuongTreEm > 0 ? `, ${ticket.SoLuongTreEm} trẻ em` : ''}
                    </strong>
                  </span>
                </div>

                {/* THÔNG TIN NGƯỜI ĐẶT & HDV */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '14px',
                    background: '#F8FAFC',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                      Trưởng đoàn / Người đặt
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '3px' }}>
                      {ticket.KhachHang?.HoTen}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                      SĐT: {ticket.KhachHang?.SoDienThoai}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569' }}>Email: {ticket.KhachHang?.Email}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                      Hướng dẫn viên phụ trách
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '3px' }}>
                      {hdv?.HoTen || 'Đang điều phối HDV đón đoàn'}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                      Liên hệ đón đoàn: <strong>{hdv?.SoDienThoai || '1900 1234'}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      Điểm hẹn: Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất
                    </div>
                  </div>
                </div>

                {/* THÔNG TIN THANH TOÁN */}
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '14px',
                    borderTop: '1px solid #F1F5F9',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    fontSize: '13px',
                    color: '#475569',
                  }}
                >
                  <div>
                    Tổng tiền sau ưu đãi: <strong style={{ color: '#0F172A', fontSize: '14.5px' }}>{vnd(netPayable)}</strong>
                  </div>
                  <div>
                    Đã thanh toán:{' '}
                    <strong style={{ color: isPaid ? '#15803D' : '#B45309', fontSize: '14.5px' }}>
                      {isPaid ? vnd(netPayable) : vnd(ticket.TienCoc || 0)}
                    </strong>
                  </div>
                  <div>
                    Phương thức:{' '}
                    <strong style={{ color: '#0F172A' }}>
                      {isPaid
                        ? ticket.PhuongThucTT === 'Tien mat'
                          ? 'Tiền mặt tại quầy'
                          : ticket.PhuongThucTT || 'VNPay / Chuyển khoản'
                        : ticket.PhuongThucTT === 'Tien mat'
                        ? 'Tiền mặt tại quầy (Chờ xác nhận thu)'
                        : 'Chưa thanh toán'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: MÃ QR PHÂN THEO TỪNG HÀNH KHÁCH ĐI TOUR */}
              {isPaid ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#0F172A',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '8px',
                    }}
                  >
                    {isGuideOrStaff ? 'Mã QR Soát Vé (Chế độ HDV)' : 'Mã QR Cá Nhân Của Bạn'}
                  </div>

                  {isGuideOrStaff && passengers.length > 1 && (
                    <div
                      className="no-print"
                      style={{
                        display: 'flex',
                        gap: '4px',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        marginBottom: '10px',
                        width: '100%',
                      }}
                    >
                      {passengers.map((p, idx) => {
                        const active = selectedPassenger?.ChiTietID === p.ChiTietID;
                        return (
                          <button
                            key={p.ChiTietID}
                            type="button"
                            onClick={() => setSelectedPassengerId(p.ChiTietID)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '5px',
                              border: active ? '1px solid #0F172A' : '1px solid #CBD5E1',
                              background: active ? '#0F172A' : '#FFFFFF',
                              color: active ? '#FFFFFF' : '#334155',
                              cursor: 'pointer',
                            }}
                          >
                            Khách {idx + 1}: {p.HoTen.split(' ').slice(-2).join(' ')}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(qrPayload)}`}
                      alt="Mã QR Xác Thực Vé Điện Tử"
                      style={{ width: '156px', height: '156px', display: 'block' }}
                    />
                  </div>

                  {selectedPassenger && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#0F172A', fontWeight: 700 }}>
                      {selectedPassenger.HoTen}
                      <div style={{ fontSize: '11px', color: '#475569', fontFamily: 'monospace', fontWeight: 600, marginTop: '2px' }}>
                        {selectedPassenger.MaQRVe || `VT-${ticket.MaDon}-${selectedPassengerIndex + 1}`}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', lineHeight: 1.4 }}>
                    {isGuideOrStaff
                      ? 'Chế độ HDV: Kiểm tra CCCD trùng khớp trước khi bấm xác nhận điểm danh'
                      : 'Bảo mật chống điểm danh hộ: Mỗi hành khách chỉ hiển thị duy nhất mã QR của chính mình'}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    padding: '20px 16px',
                    borderRadius: '8px',
                    border: '1px dashed #CBD5E1',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      display: 'grid',
                      placeItems: 'center',
                      marginBottom: '10px',
                      color: '#475569',
                    }}
                  >
                    <Lock size={18} strokeWidth={1.6} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Chưa cấp Mã QR Vé Điện Tử
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 14px', lineHeight: 1.5 }}>
                    Đơn đặt chỗ hiện đang ở trạng thái <strong>{isCancelled ? 'Đã hủy' : 'Chờ thanh toán'}</strong>. Vé điện tử và mã QR soát vé chỉ được sinh tự động sau khi hoàn tất thanh toán.
                  </p>
                  {!isCancelled && (
                    <button
                      type="button"
                      disabled={payingVnpay}
                      onClick={handlePayVNPayNow}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: '6px',
                        border: '1px solid #0F172A',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: payingVnpay ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {payingVnpay ? 'Đang chuyển cổng VNPay...' : 'Thanh toán qua VNPAY ngay →'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* DANH SÁCH HÀNH KHÁCH */}
            <div style={{ borderTop: '1px solid #E2E8F0', padding: '22px 28px', background: '#F8FAFC' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Danh sách hành khách đăng ký ({passengers.length || 1} khách)
                </h4>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  {isGuideOrStaff
                    ? 'Chế độ Hướng dẫn viên: Xác thực CCCD và bấm điểm danh từng hành khách lên đoàn'
                    : 'Bảo mật chống điểm danh hộ: Bạn chỉ được xem Mã QR của chính mình, vé của hành khách đi cùng đã được khóa'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {passengers.length > 0 ? (
                  passengers.map((p, idx) => {
                    const isSelected = selectedPassenger?.ChiTietID === p.ChiTietID;
                    const canViewThisPassengerTicket = isGuideOrStaff || isSelected;
                    return (
                      <div
                        key={p.ChiTietID}
                        onClick={() => isPaid && isGuideOrStaff && setSelectedPassengerId(p.ChiTietID)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: '#FFFFFF',
                          border: isSelected && isPaid ? '1.5px solid #0F172A' : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          flexWrap: 'wrap',
                          gap: '10px',
                          cursor: isPaid && isGuideOrStaff ? 'pointer' : 'default',
                          opacity: !canViewThisPassengerTicket && isPaid ? 0.85 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '6px',
                              background: isSelected && isPaid ? '#0F172A' : '#F1F5F9',
                              color: isSelected && isPaid ? '#FFFFFF' : '#0F172A',
                              border: '1px solid #CBD5E1',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{p.HoTen}</span>
                              {isSelected && isPaid && (
                                <span
                                  className="no-print"
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: '#0F172A',
                                    color: '#FFFFFF',
                                  }}
                                >
                                  {isGuideOrStaff ? 'Đang chọn soát vé' : 'Vé của bạn (Đang hiện Mã QR)'}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '2px' }}>
                              <span>
                                Phân loại: <strong style={{ color: '#334155' }}>{p.LoaiKhach === 'Nguoi lon' ? 'Người lớn' : 'Trẻ em'}</strong>
                              </span>
                              {canViewThisPassengerTicket && p.CCCD && (
                                <span>
                                  CCCD: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{p.CCCD}</strong>
                                </span>
                              )}
                              {isPaid ? (
                                canViewThisPassengerTicket ? (
                                  <span>
                                    Mã vé: <code style={{ color: '#0F172A', fontWeight: 700 }}>{p.MaQRVe || `VT-${ticket.MaDon}-${idx + 1}`}</code>
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Lock size={11} /> Mã QR cá nhân đã khóa (Chống điểm danh hộ)
                                  </span>
                                )
                              ) : (
                                <span style={{ color: '#B45309', fontWeight: 600 }}>Chưa cấp mã vé (Chờ thanh toán)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isPaid && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                            {p.TrangThaiDiemDanh === 1 ? (
                              <span
                                style={{
                                  background: '#F0FDF4',
                                  color: '#15803D',
                                  border: '1px solid #BBF7D0',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Check size={12} strokeWidth={2} /> Đã điểm danh lên đoàn
                              </span>
                            ) : isGuideOrStaff ? (
                              <button
                                type="button"
                                onClick={() => handleCheckin(p.ChiTietID)}
                                disabled={checkingInId === p.ChiTietID}
                                style={{
                                  background: '#0F172A',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <UserCheck size={13} strokeWidth={1.6} />
                                {checkingInId === p.ChiTietID ? 'Đang xác nhận...' : 'Điểm danh lên đoàn'}
                              </button>
                            ) : (
                              <span
                                style={{
                                  background: '#F1F5F9',
                                  color: '#475569',
                                  border: '1px solid #CBD5E1',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                }}
                              >
                                Chưa điểm danh
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '14px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '13px' }}>
                    1. <strong>{ticket.KhachHang?.HoTen}</strong> (Trưởng đoàn) — CCCD: {ticket.KhachHang?.CCCD || 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER CHỨNG TỪ */}
            <div
              style={{
                background: '#FFFFFF',
                borderTop: '1px solid #E2E8F0',
                color: '#64748B',
                padding: '14px 28px',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                Quầy giao dịch VietTour: <strong style={{ color: '#0F172A' }}>Ga Quốc Nội, Sân bay Quốc tế Tân Sơn Nhất, Q. Tân Bình, TP.HCM</strong> • Hotline:{' '}
                <strong style={{ color: '#0F172A' }}>1900 1234</strong>
              </div>
              <div>
                Quý khách vui lòng có mặt trước giờ khởi hành <strong>45 phút</strong>
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

