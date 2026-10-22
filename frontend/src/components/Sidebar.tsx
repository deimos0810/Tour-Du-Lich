'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Compass,
  Calendar,
  ClipboardList,
  Tag,
  Users,
  UserCheck,
  Building2,
  WalletCards,
  ShieldCheck,
  Globe,
  ShoppingBag,
  LogOut,
} from 'lucide-react';

export default function Sidebar() {
  const path = usePathname();
  const { user, logout } = useAuth();
  const primaryRole = user?.primaryRole || 'Guest';

  // Kiểm tra quyền xem menu theo từng Vai trò
  const isAllowed = (href: string) => {
    if (!user) return false;
    if (primaryRole === 'Admin') return true;

    if (primaryRole === 'Dieu hanh') {
      return ['/', '/tours', '/departures', '/guides', '/suppliers', '/customers', '/promotions', '/reports'].includes(href);
    }

    if (primaryRole === 'Ke toan') {
      return ['/', '/bookings', '/settlements', '/suppliers', '/customers', '/reports'].includes(href);
    }

    if (primaryRole === 'HDV') {
      return ['/departures', '/guides'].includes(href);
    }

    if (primaryRole === 'Khach hang') {
      return ['/portal', '/portal/my-bookings'].includes(href);
    }

    return true;
  };

  const NAV = [
    {
      title: 'TỔNG QUAN',
      items: [
        { href: '/', label: 'Dashboard tổng quan', icon: LayoutDashboard },
        { href: '/reports', label: 'Báo cáo thống kê tour', icon: BarChart3 },
      ],
    },
    {
      title: 'KINH DOANH & KHÁCH HÀNG',
      items: [
        { href: '/tours', label: 'Quản lý tour du lịch', icon: Compass },
        { href: '/departures', label: 'Lịch khởi hành', icon: Calendar },
        { href: '/bookings', label: 'Booking & đặt cọc', icon: ClipboardList },
        { href: '/promotions', label: 'Khuyến mãi & voucher', icon: Tag },
        { href: '/customers', label: 'Danh sách khách hàng', icon: Users },
      ],
    },
    {
      title: 'VẬN HÀNH & ĐIỀU HÀNH',
      items: [
        { href: '/guides', label: 'Điều phối & tính công HDV', icon: UserCheck },
        { href: '/suppliers', label: 'Nhà cung cấp dịch vụ', icon: Building2 },
        { href: '/settlements', label: 'Quyết toán tài chính', icon: WalletCards },
      ],
    },
    {
      title: 'HỆ THỐNG & TÀI KHOẢN',
      items: [
        { href: '/users', label: 'Quản trị người dùng & quyền', icon: ShieldCheck },
      ],
    },
    {
      title: 'KHÁCH DU LỊCH',
      items: [
        { href: '/portal', label: 'Website xem & đặt tour', icon: Globe },
        { href: '/portal/my-bookings', label: 'Đơn tour của tôi', icon: ShoppingBag },
      ],
    },
  ];

  const isActive = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  return (
    <aside className="sidebar">
      {/* BRAND HEADER */}
      <div className="brand">
        <div className="brand-badge">VT</div>
        <div>
          <div className="brand-title">VietTour</div>
          <div className="brand-subtitle">Hệ thống quản trị</div>
        </div>
      </div>

      {/* NAVIGATION MENU */}
      <nav className="nav">
        {NAV.map((g) => {
          const allowedItems = g.items.filter((i) => isAllowed(i.href));
          if (allowedItems.length === 0) return null;

          return (
            <div key={g.title} style={{ marginBottom: '14px' }}>
              <div className="nav-section-title">{g.title}</div>
              {allowedItems.map((i) => {
                const active = isActive(i.href);
                const IconComponent = i.icon;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={`nav-link ${active ? 'active' : ''}`}
                  >
                    <IconComponent size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* USER & LOGOUT SECTION */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--zinc-900)' }}>
            {user?.name || 'Chưa đăng nhập'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--zinc-500)', marginTop: '2px' }}>
            Vai trò: <span style={{ fontWeight: 600, color: 'var(--zinc-800)' }}>{primaryRole}</span>
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'var(--rose-600)',
            borderColor: 'var(--rose-200)',
            background: 'var(--rose-50)',
            fontWeight: 500,
          }}
          onClick={logout}
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
