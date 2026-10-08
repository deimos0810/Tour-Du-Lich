'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LogoutModal from './LogoutModal';

type Props = {
  children: React.ReactNode;
};

export default function CustomerAccountLayout({ children }: Props) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'VT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    { href: '/portal/account', label: 'Thông tin cá nhân' },
    { href: '/portal/my-bookings', label: 'Đơn đặt tour của tôi' },
    { href: '/portal/favorites', label: 'Tour yêu thích' },
    { href: '/portal/account/change-password', label: 'Đổi mật khẩu' },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '30px 20px', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px', alignItems: 'start' }}>
        {/* SIDEBAR TÀI KHOẢN BÊN TRÁI */}
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid #E2E8F0', marginBottom: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#0D6EFD',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 auto 12px',
              boxShadow: '0 4px 10px rgba(13, 110, 253, 0.2)'
            }}>
              {getInitials(user.name)}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>{user.name}</h3>
            <p style={{ fontSize: '12.5px', color: '#64748B', wordBreak: 'break-all', margin: 0 }}>{user.email}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#0D6EFD' : '#334155',
                    background: active ? '#EFF6FF' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                display: 'block',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#DC2626',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                marginTop: '12px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div>{children}</div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
      />
    </div>
  );
}
