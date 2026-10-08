'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hoTen, setHoTen] = useState('');
  const [phone, setPhone] = useState('');
  const [cccd, setCccd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, hoTen, phone, cccd }),
      });

      alert('Đăng ký tài khoản khách hàng thành công! Bạn có thể đăng nhập ngay.');
      router.push('/portal/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>Đăng Ký Tài Khoản Khách Hàng</h1>
          <p className="sub" style={{ marginTop: '4px' }}>Tạo tài khoản để dễ dàng đặt tour và nhận ưu đãi</p>
        </div>

        {error && <div className="notice" style={{ background: '#FEE2E2', color: '#B91C1C', borderColor: '#FECACA' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Họ và tên <span style={{ color: 'red' }}>*</span></label>
            <input className="input" type="text" required style={{ width: '100%' }} placeholder="VD: Nguyễn Văn A" value={hoTen} onChange={(e) => setHoTen(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số điện thoại <span style={{ color: 'red' }}>*</span></label>
            <input className="input" type="tel" required style={{ width: '100%' }} placeholder="VD: 0908123456" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email đăng nhập <span style={{ color: 'red' }}>*</span></label>
            <input className="input" type="email" required style={{ width: '100%' }} placeholder="VD: address@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số CCCD / Hộ chiếu</label>
            <input className="input" type="text" style={{ width: '100%' }} placeholder="VD: 031092008761" value={cccd} onChange={(e) => setCccd(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mật khẩu <span style={{ color: 'red' }}>*</span></label>
            <input className="input" type="password" required style={{ width: '100%' }} placeholder="Nhập mật khẩu của bạn" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
          Đã có tài khoản?{' '}
          <Link href="/portal/login" style={{ color: '#0D6EFD', fontWeight: 600 }}>Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
