'use client';
import Link from 'next/link';
import { UserSession } from '@/context/AuthContext';

type Props = {
  user: UserSession;
  onLogoutClick: () => void;
  onClose: () => void;
};

export default function CustomerAccountDropdown({ user, onLogoutClick, onClose }: Props) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      width: '260px',
      background: '#FFFFFF',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #E2E8F0',
      zIndex: 50,
      overflow: 'hidden'
    }}>
      {/* HEADER TÊN VÀ EMAIL */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px', marginBottom: '2px' }}>
          {user.name}
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', wordBreak: 'break-all' }}>
          {user.email}
        </div>
        <div style={{ marginTop: '6px' }}>
          <span className="badge badge-info" style={{ fontSize: '10.5px' }}>Khách hàng thân thiết</span>
        </div>
      </div>

      {/* MENU ITEMS */}
      <div style={{ padding: '6px 0' }}>
        {(user.roles?.some((r: string) => ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(r)) || ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(user.primaryRole || '')) && (
          <Link
            href="/"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              fontSize: '13.5px',
              color: '#0284C7',
              background: '#F0F9FF',
              textDecoration: 'none',
              fontWeight: 700,
              borderBottom: '1px solid #E0F2FE',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E0F2FE')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F0F9FF')}
          >
            <span>⚙️</span>
            <span>Dashboard Quản Trị</span>
          </Link>
        )}

        <Link
          href="/portal/account"
          onClick={onClose}
          style={{
            display: 'block',
            padding: '10px 16px',
            fontSize: '13.5px',
            color: '#1E293B',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Thông tin tài khoản
        </Link>

        <Link
          href="/portal/my-bookings"
          onClick={onClose}
          style={{
            display: 'block',
            padding: '10px 16px',
            fontSize: '13.5px',
            color: '#1E293B',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Đơn đặt tour của tôi
        </Link>

        <Link
          href="/portal/favorites"
          onClick={onClose}
          style={{
            display: 'block',
            padding: '10px 16px',
            fontSize: '13.5px',
            color: '#1E293B',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Tour yêu thích
        </Link>

        <Link
          href="/portal/account/change-password"
          onClick={onClose}
          style={{
            display: 'block',
            padding: '10px 16px',
            fontSize: '13.5px',
            color: '#1E293B',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Đổi mật khẩu
        </Link>
      </div>

      <div style={{ borderTop: '1px solid #E2E8F0', padding: '6px 0' }}>
        <button
          onClick={() => {
            onClose();
            onLogoutClick();
          }}
          style={{
            width: '100%',
            display: 'block',
            padding: '10px 16px',
            fontSize: '13.5px',
            color: '#DC2626',
            background: 'none',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
