'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { findLabel } from '@/lib/nav';

export default function Header() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const isPortal = path.startsWith('/portal');

  const getInitials = (name: string) => {
    if (!name) return 'VT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="header">
      {/* PAGE TITLE & BREADCRUMB */}
      <div className="breadcrumb" style={{ fontSize: '13.5px', color: '#64748B' }}>
        <span>Trang chủ / <strong style={{ color: '#0F172A', fontWeight: 700 }}>{findLabel(path) || 'Dashboard'}</strong></span>
      </div>

      {/* SEARCH BAR & USER ACTION */}
      <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {!isPortal && (
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              className="input"
              style={{ width: '100%', padding: '7px 12px', fontSize: '13px', background: '#F8FAFC', borderColor: '#E2E8F0' }}
              placeholder="Tìm kiếm tour, mã booking..."
            />
          </div>
        )}

        {user ? (
          <div className="user" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar" style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#0D6EFD',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: '12px'
            }}>
              {getInitials(user.name)}
            </div>
            <div>
              <div className="user-name" style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{user.name}</div>
              <div className="user-role" style={{ fontSize: '11px', color: '#64748B' }}>{user.primaryRole}</div>
            </div>
            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              style={{ padding: '4px 10px', fontSize: '12px', color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2', fontWeight: 600, marginLeft: '8px' }}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
