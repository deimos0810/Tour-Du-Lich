'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { findLabel } from '@/lib/nav';
import { Search, LogOut } from 'lucide-react';

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
      {/* BREADCRUMB / VIEW TITLE */}
      <div className="breadcrumb-nav">
        <span>Hệ thống</span>
        <span style={{ color: 'var(--zinc-300)' }}>/</span>
        <strong>{findLabel(path) || 'Dashboard'}</strong>
      </div>

      {/* SEARCH BAR & USER ACTION */}
      <div className="header-actions">
        {!isPortal && (
          <div className="search-container">
            <Search size={15} strokeWidth={1.5} />
            <input
              className="search-input"
              placeholder="Tìm kiếm mã tour, đơn booking..."
            />
          </div>
        )}

        {/* LIVE SYSTEM STATUS BADGE */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--emerald-200)',
          background: 'var(--emerald-50)',
          color: 'var(--emerald-600)',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald-600)' }} />
          <span>Hệ thống trực tuyến</span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '12px', borderLeft: '1px solid var(--border)' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--zinc-900)',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 600,
              fontSize: '11.5px',
              letterSpacing: '-0.3px',
            }}>
              {getInitials(user.name)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--zinc-900)', lineHeight: 1.2 }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {user.primaryRole}
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-outline btn-sm"
              title="Đăng xuất"
              style={{
                padding: '5px 8px',
                marginLeft: '4px',
                color: 'var(--zinc-600)',
                borderColor: 'var(--border)',
              }}
            >
              <LogOut size={13} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
