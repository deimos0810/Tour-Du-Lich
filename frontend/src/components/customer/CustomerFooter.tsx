'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CustomerFooter() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ text: 'Vui lòng nhập địa chỉ email hợp lệ!', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch('http://localhost:4000/api/portal/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đăng ký không thành công');

      setMessage({
        text: data.message || `Đã gửi mã giảm giá VIETTOUR2026 đến ${email}!`,
        type: 'success',
      });
      setEmail('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Lỗi khi gửi thông tin đăng ký', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer style={{ background: '#0F172A', color: '#94A3B8', paddingTop: '60px', paddingBottom: '30px', marginTop: '60px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* CỘT 1: THÔNG TIN VIETTOUR */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px', background: '#0284C7',
                color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '16px'
              }}>
                VT
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>VIETTOUR</span>
            </div>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, marginBottom: '16px' }}>
              Nền tảng đặt vé tour và dịch vụ lữ hành trọn gói cao cấp hàng đầu Việt Nam. Khám phá vẻ đẹp di sản văn hóa, nghỉ dưỡng và thiên nhiên với quy chuẩn 5 sao.
            </p>
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div>Địa chỉ: Số 40, Đường số 13, KĐT Vạn Phúc, TP. Hồ Chí Minh</div>
              <div>Tổng đài đặt tour: <strong style={{ color: '#F8FAFC' }}>1900 1234</strong></div>
              <div>Email liên hệ: <strong style={{ color: '#F8FAFC' }}>cskh@viettour.vn</strong></div>
            </div>
          </div>

          {/* CỘT 2: ĐIỂM ĐẾN PHỔ BIẾN */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Điểm Đến Nổi Bật</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/portal#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>Đà Nẵng — Hội An — Bà Nà</Link></li>
              <li><Link href="/portal#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>Sapa — Đỉnh Fansipan</Link></li>
              <li><Link href="/portal#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>Phú Quốc — Đảo Ngọc Thiên Đường</Link></li>
              <li><Link href="/portal#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>Vịnh Hạ Long — Du Thuyền 5 Sao</Link></li>
              <li><Link href="/portal#tours" style={{ color: '#94A3B8', textDecoration: 'none' }}>Nhật Bản: Tokyo — Fuji — Kyoto</Link></li>
            </ul>
          </div>

          {/* CỘT 3: CHÍNH SÁCH & HỖ TRỢ */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Chính Sách & Điều Khoản</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/portal/policy?tab=booking-cancellation" style={{ color: '#94A3B8', textDecoration: 'none' }}>Quy định đặt & hủy tour</Link></li>
              <li><Link href="/portal/policy?tab=privacy" style={{ color: '#94A3B8', textDecoration: 'none' }}>Chính sách bảo mật thông tin</Link></li>
              <li><Link href="/portal/policy?tab=insurance" style={{ color: '#94A3B8', textDecoration: 'none' }}>Bảo hiểm du lịch trọn gói</Link></li>
              <li><Link href="/portal/policy?tab=payment-guide" style={{ color: '#94A3B8', textDecoration: 'none' }}>Hướng dẫn thanh toán trực tuyến</Link></li>
              <li><Link href="/portal/policy?tab=faq" style={{ color: '#94A3B8', textDecoration: 'none' }}>Câu hỏi thường gặp (FAQ)</Link></li>
            </ul>
          </div>

          {/* CỘT 4: ĐĂNG KÝ NHẬN ƯU ĐÃI (GỬI EMAIL THỰC TẾ) */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>Đăng Ký Nhận Ưu Đãi</h4>
            <p style={{ fontSize: '13.5px', lineHeight: 1.6, marginBottom: '12px' }}>
              Nhập email để nhận thông tin ưu đãi tour và nhận ngay mã giảm giá 10% gửi trực tiếp về hòm thư của bạn!
            </p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn..."
                  required
                  style={{ background: '#1E293B', borderColor: '#334155', color: '#FFF', fontSize: '13px', flex: 1 }}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px', background: '#0284C7', borderColor: '#0284C7', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  {submitting ? 'Đang gửi...' : 'Đăng ký'}
                </button>
              </div>

              {message && (
                <div style={{
                  fontSize: '12px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: message.type === 'success' ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                  color: message.type === 'success' ? '#4ADE80' : '#F87171',
                  border: `1px solid ${message.type === 'success' ? '#16A34A' : '#DC2626'}`,
                  lineHeight: 1.4,
                }}>
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1E293B', paddingTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
          © 2026 VietTour — Bản quyền thuộc về Công ty Du lịch & Lữ hành VietTour.
        </div>
      </div>
    </footer>
  );
}
