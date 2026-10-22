'use client';
import Link from 'next/link';
import { UserSession } from '@/context/AuthContext';
import { LayoutDashboard, User, Package, Heart, KeyRound, LogOut } from 'lucide-react';

type Props = {
  user: UserSession;
  onLogoutClick: () => void;
  onClose: () => void;
};

export default function CustomerAccountDropdown({ user, onLogoutClick, onClose }: Props) {
  const isStaffOrAdmin =
    user.roles?.some((r: string) => ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(r)) ||
    ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(user.primaryRole || '');

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '260px',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border)',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* HEADER TÊN VÀ EMAIL */}
      <div style={{ padding: '14px 16px', background: 'var(--zinc-50)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 600, color: 'var(--zinc-900)', fontSize: '13.5px', marginBottom: '2px' }}>
          {user.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
          {user.email}
        </div>
        <div style={{ marginTop: '6px' }}>
          <span className="badge badge-default" style={{ fontSize: '10.5px' }}>
            Khách hàng thân thiết
          </span>
        </div>
      </div>

      {/* MENU ITEMS */}
      <div style={{ padding: '6px 0' }}>
        {isStaffOrAdmin && (
          <Link
            href="/"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 16px',
              fontSize: '13px',
              color: 'var(--zinc-900)',
              background: 'var(--zinc-100)',
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <LayoutDashboard size={14} strokeWidth={1.5} />
            <span>Dashboard Quản Trị</span>
          </Link>
        )}

        <Link
          href="/portal/account"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            color: 'var(--zinc-700)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          className="hover:bg-zinc-50"
        >
          <User size={14} strokeWidth={1.5} />
          <span>Thông tin tài khoản</span>
        </Link>

        <Link
          href="/portal/my-bookings"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            color: 'var(--zinc-700)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          className="hover:bg-zinc-50"
        >
          <Package size={14} strokeWidth={1.5} />
          <span>Đơn đặt tour của tôi</span>
        </Link>

        <Link
          href="/portal/favorites"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            color: 'var(--zinc-700)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          className="hover:bg-zinc-50"
        >
          <Heart size={14} strokeWidth={1.5} />
          <span>Tour yêu thích</span>
        </Link>

        <Link
          href="/portal/account/change-password"
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            color: 'var(--zinc-700)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
          className="hover:bg-zinc-50"
        >
          <KeyRound size={14} strokeWidth={1.5} />
          <span>Đổi mật khẩu</span>
        </Link>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0' }}>
        <button
          onClick={() => {
            onClose();
            onLogoutClick();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            color: 'var(--rose-600)',
            background: 'none',
            border: 'none',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
