'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('khach.hung@gmail.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ user: { name: string; roles: string[] } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      alert(`Đăng nhập thành công! Xin chào ${res.user.name}`);
      router.push('/portal/my-bookings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', padding: '0 16px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>Đăng Nhập Khách Hàng</h1>
          <p className="sub" style={{ marginTop: '4px' }}>Quản lý đơn đặt tour và vé điện tử của bạn</p>
        </div>

        {error && <div className="notice" style={{ background: '#FEE2E2', color: '#B91C1C', borderColor: '#FECACA' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Địa chỉ Email</label>
            <input className="input" type="email" required style={{ width: '100%' }} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mật khẩu</label>
            <input className="input" type="password" required style={{ width: '100%' }} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Đang xử lý...' : 'Đăng Nhập Ngay'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
          Chưa có tài khoản khách hàng?{' '}
          <Link href="/portal/register" style={{ color: '#0D6EFD', fontWeight: 600 }}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
