'use client';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Check, QrCode, Calendar, Users, X, ShieldCheck } from 'lucide-react';

function SandboxPayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const maDon = params?.maDon as string;

  const method = searchParams?.get('method') || 'Banking';
  const isZaloPay = method.toLowerCase().includes('zalo');
  const appTransId = searchParams?.get('appTransId');

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otp, setOtp] = useState('123456');

  useEffect(() => {
    if (!maDon) return;
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/bookings/ticket/${maDon}`);
        if (!res.ok) throw new Error('Không tìm thấy thông tin đơn hàng này');
        const data = await res.json();
        setBooking(data);
        if (data.TrangThaiDon === 'Da thanh toan') {
          setPaidSuccess(true);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi khi tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [maDon]);

  const handleConfirmPay = async () => {
    if (!otp || otp.length < 6) {
      alert('Vui lòng nhập mã OTP 6 số để xác thực giao dịch!');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (isZaloPay) {
        // Gọi API xác nhận thanh toán ZaloPay Gateway
        const res = await fetch('http://localhost:4000/api/zalopay/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maDon,
            appTransId: appTransId || `ZP-${Date.now().toString().slice(-8)}`,
            amount: finalAmount,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Xác nhận ZaloPay thất bại');
        }
      } else {
        // Chuyển khoản VietQR / Mobile banking thông thường
        const res = await fetch(`http://localhost:4000/api/bookings/confirm-by-madon/${maDon}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hinhThucTT: 'Chuyen khoan',
            maGiaoDich: `MB-PAY-${Date.now().toString().slice(-8)}`,
            ghiChu: 'Thanh toán quét mã QR Mobile Sandbox',
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Xác nhận thanh toán thất bại');
        }
      }

      setPaidSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra khi xác nhận thanh toán');
    } finally {
      setSubmitting(false);
    }
  };

  const vnd = (num: any) => Number(num || 0).toLocaleString('vi-VN') + ' đ';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #CBD5E1', borderTopColor: isZaloPay ? '#0068FF' : '#0284C7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: '15px', fontWeight: 600 }}>{isZaloPay ? 'Đang kết nối cổng Ví ZaloPay...' : 'Đang kết nối cổng thanh toán Napas 24/7...'}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (errorMsg && !booking) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--rose-50)',
            color: 'var(--rose-600)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px',
            border: '1px solid var(--rose-200)',
          }}>
            <AlertTriangle size={22} strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '8px' }}>Không Thể Thanh Toán</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>{errorMsg}</p>
          <Link href="/portal" style={{ display: 'inline-block', background: 'var(--zinc-900)', color: '#FFF', padding: '9px 18px', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
            Về Trang Chủ VietTour
          </Link>
        </div>
      </div>
    );
  }

  const finalAmount = Math.max(Number(booking?.TongTien || 0) - Number(booking?.GiamGia || 0), 0);
  const primaryColor = isZaloPay ? '#0068FF' : '#0284C7';
  const gradientHeader = isZaloPay
    ? 'linear-gradient(135deg, #0068FF 0%, #004ecc 100%)'
    : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)';

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', justifyContent: 'center', padding: '16px 12px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
        {/* APP HEADER GIẢ LẬP MOBILE / ZALOPAY */}
        <div style={{ background: gradientHeader, color: '#FFFFFF', padding: '20px 20px 16px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#FFFFFF', color: primaryColor, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '13px' }}>
                {isZaloPay ? 'ZP' : 'VT'}
              </div>
              <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.2px' }}>
                {isZaloPay ? 'Cổng Ví ZaloPay Sandbox' : 'VietTour Pay Sandbox'}
              </span>
            </div>
            <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '12px', fontWeight: 700 }}>
              {isZaloPay ? 'ZALOPAY GATEWAY' : 'MÔ PHỎNG DI ĐỘNG'}
            </span>
          </div>

          <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
            <span style={{ fontSize: '12px', color: '#E0F2FE', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              SỐ TIỀN CẦN THANH TOÁN
            </span>
            <div style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px', marginTop: '2px' }}>
              {vnd(finalAmount)}
            </div>
            <div style={{ fontSize: '12px', color: '#BAE6FD', marginTop: '4px' }}>
              Mã giao dịch: <strong>{maDon}</strong> {appTransId ? `(${appTransId.slice(-6)})` : ''}
            </div>
          </div>
        </div>

        {paidSuccess ? (
          /* MÀN HÌNH THANH TOÁN THÀNH CÔNG */
          <div style={{ padding: '32px 24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--emerald-50)', color: 'var(--emerald-600)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', border: '1px solid var(--emerald-200)' }}>
              <Check size={32} strokeWidth={2} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--zinc-900)', marginBottom: '8px' }}>
              GIAO DỊCH THÀNH CÔNG
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
              Đơn hàng <strong>{maDon}</strong> đã được thanh toán thành công qua {isZaloPay ? 'Ví ZaloPay' : 'Cổng trực tuyến'}. Màn hình máy tính của bạn sẽ tự động kích hoạt vé ngay tức thì!
            </p>

            <div style={{ background: 'var(--zinc-50)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)', textAlign: 'left', fontSize: '13px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Người thụ hưởng:</span>
                <strong style={{ color: 'var(--zinc-900)' }}>VIETTOUR CORP</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phương thức:</span>
                <strong style={{ color: primaryColor }}>{isZaloPay ? 'Ví Điện Tử ZaloPay' : 'Chuyển Khoản Ngân Hàng'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số tiền:</span>
                <strong style={{ color: 'var(--emerald-600)', fontSize: '14px' }}>{vnd(finalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian:</span>
                <span style={{ color: 'var(--zinc-900)' }}>{new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Trạng thái vé:</span>
                <strong style={{ color: primaryColor }}>Đã xuất vé điện tử</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href={`/portal/ticket/${maDon}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: primaryColor,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                }}
              >
                <QrCode size={14} strokeWidth={1.5} /> Xem Thẻ Lên Tàu & Vé Điện Tử QR
              </Link>
              <Link
                href="/portal/my-bookings"
                style={{
                  display: 'block',
                  background: '#F1F5F9',
                  color: '#334155',
                  textDecoration: 'none',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Về Đơn Hàng Của Tôi
              </Link>
            </div>
          </div>
        ) : (
          /* MÀN HÌNH XÁC NHẬN THANH TOÁN */
          <div style={{ padding: '20px 20px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* THÔNG TIN TOUR */}
            <div style={{ background: 'var(--zinc-50)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>HÀNH TRÌNH DU LỊCH</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--zinc-900)', marginTop: '3px' }}>
                {booking?.LichKhoiHanh?.Tour?.TenTour || 'Tour Du Lịch VietTour'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--zinc-600)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} strokeWidth={1.5} /> Khởi hành: {booking?.LichKhoiHanh?.NgayKhoiHanh ? new Date(booking.LichKhoiHanh.NgayKhoiHanh).toLocaleDateString('vi-VN') : '15/10/2026'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--zinc-600)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={13} strokeWidth={1.5} /> Khách: {booking?.SoLuongNguoiLon || 1} Người lớn {booking?.SoLuongTreEm ? `, ${booking.SoLuongTreEm} Trẻ em` : ''}
              </div>
            </div>

            {/* THÔNG TIN THỤ HƯỞNG */}
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '14px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                {isZaloPay ? 'THÔNG TIN ĐỐI TÁC ZALOPAY' : 'THÔNG TIN THỤ HƯỞNG'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Đơn vị nhận:</span>
                <strong style={{ color: '#0F172A' }}>VIETTOUR TRAVEL</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: '#64748B' }}>Cổng xử lý:</span>
                <span style={{ color: primaryColor, fontWeight: 700 }}>{isZaloPay ? 'ZaloPay Merchant Gateway' : 'Vietcombank (VCB)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748B' }}>Nội dung:</span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>VIETTOUR {maDon}</span>
              </div>
            </div>

            {/* TÀI KHOẢN NGUỒN SANDBOX */}
            <div style={{ background: isZaloPay ? '#EFF6FF' : '#F0F9FF', borderRadius: '14px', padding: '14px', border: `1px solid ${isZaloPay ? '#BFDBFE' : '#BAE6FD'}`, marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', color: primaryColor, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                {isZaloPay ? 'VÍ ĐIỆN TỬ ZALOPAY TEST' : 'TÀI KHOẢN THANH TOÁN (SANDBOX)'}
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                {isZaloPay ? 'Ví ZaloPay Demo (Số dư 50.000.000 đ)' : 'Ví / Tài khoản Khách Hàng Test'}
              </div>
              <div style={{ fontSize: '12px', color: primaryColor, marginTop: '2px' }}>
                Số dư khả dụng: <strong>100.000.000 đ</strong> (Đủ điều kiện thanh toán)
              </div>
            </div>

            {/* NHẬP MÃ OTP SANDBOX */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>Mã OTP Xác Thực Giao Dịch:</label>
                <span style={{ fontSize: '11.5px', color: primaryColor, fontWeight: 600 }}>Mặc định: 123456</span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 800,
                  letterSpacing: '6px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: `1.5px solid ${primaryColor}`,
                  background: '#F8FAFC',
                  color: '#0F172A',
                  outline: 'none',
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <X size={14} strokeWidth={2} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* NÚT XÁC NHẬN */}
            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={handleConfirmPay}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: primaryColor,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {submitting ? (
                  'ĐANG XỬ LÝ GIAO DỊCH...'
                ) : (
                  <>
                    <Check size={16} strokeWidth={2} />
                    <span>XÁC NHẬN THANH TOÁN ({isZaloPay ? 'ZALOPAY' : 'SANDBOX'})</span>
                  </>
                )}
              </button>
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <ShieldCheck size={13} strokeWidth={1.5} />
                <span>Giao dịch được mã hóa an toàn theo tiêu chuẩn PCI-DSS &amp; ZaloPay Gateway</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobileSandboxPayPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0F172A', color: '#FFF', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>
        Đang kết nối cổng thanh toán...
      </div>
    }>
      <SandboxPayContent />
    </Suspense>
  );
}
