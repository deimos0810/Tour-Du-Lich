'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const primaryRole = user?.primaryRole || 'Guest';

  // Kiểm tra quyền xem menu theo từng Vai trò
  const isAllowed = (href: string) => {
    if (!user) return false;
    if (primaryRole === 'Admin') return true;

    if (primaryRole === 'Dieu hanh') {
      return ['/', '/tours', '/departures', '/guides', '/suppliers', '/customers'].includes(href);
    }

    if (primaryRole === 'Ke toan') {
      return ['/', '/bookings', '/settlements', '/suppliers', '/customers'].includes(href);
    }

    if (primaryRole === 'HDV') {
      return ['/departures'].includes(href);
    }

    if (primaryRole === 'Khach hang') {
      return ['/portal', '/portal/my-bookings'].includes(href);
    }

    return true;
  };

  const NAV = [
    {
      title: 'TỔNG QUAN',
      items: [{ href: '/', label: 'Dashboard tổng quan' }],
    },
    {
      title: 'KINH DOANH & KHÁCH HÀNG',
      items: [
        { href: '/tours', label: 'Quản lý tour du lịch' },
        { href: '/departures', label: 'Lịch khởi hành' },
        { href: '/bookings', label: 'Booking & đặt cọc' },
        { href: '/customers', label: 'Danh sách khách hàng' },
      ],
    },
    {
      title: 'VẬN HÀNH & ĐIỀU HÀNH',
      items: [
        { href: '/guides', label: 'Điều phối & HDV' },
        { href: '/suppliers', label: 'Nhà cung cấp dịch vụ' },
        { href: '/settlements', label: 'Quyết toán tài chính' },
      ],
    },
    {
      title: 'KHÁCH DU LỊCH',
      items: [
        { href: '/portal', label: 'Website xem & đặt tour' },
        { href: '/portal/my-bookings', label: 'Đơn tour của tôi' },
      ],
    },
  ];

  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <aside className="sidebar">
      {/* BRAND HEADER */}
      <div className="brand">
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: '#0D6EFD',
          color: '#FFFFFF',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: '15px'
        }}>
          VT
        </div>
        <div>
          <div className="brand-name">VietTour</div>
          <div className="brand-sub">Hệ thống quản lý</div>
        </div>
      </div>

      {/* NAVIGATION MENU TEXT-ONLY */}
      <nav className="nav">
        {NAV.map((g) => {
          const allowedItems = g.items.filter((i) => isAllowed(i.href));
          if (allowedItems.length === 0) return null;

          return (
            <div key={g.title} style={{ marginBottom: '16px' }}>
              <div className="nav-group">{g.title}</div>
              {allowedItems.map((i) => {
                const active = isActive(i.href);
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    style={{
                      display: 'block',
                      padding: '8px 12px',
                      margin: '2px 0',
                      borderRadius: '6px',
                      fontSize: '13.5px',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#0D6EFD' : '#334155',
                      background: active ? '#EFF6FF' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {i.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* USER LOGOUT SECTION */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', background: '#FFFFFF' }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{user?.name || 'Chưa đăng nhập'}</div>
          <div style={{ fontSize: '11.5px', color: '#64748B' }}>Chức danh: <strong style={{ color: '#0D6EFD' }}>{primaryRole}</strong></div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: '100%', justifyContent: 'center', color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2', fontWeight: 600 }}
          onClick={logout}
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
