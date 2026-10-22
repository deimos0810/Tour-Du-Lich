'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import CustomerAccountDropdown from './CustomerAccountDropdown';
import LogoutModal from './LogoutModal';
import { QrCode, LayoutDashboard, ChevronDown, Phone, Mail, Clock } from 'lucide-react';

export default function CustomerHeader() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'VT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isStaffOrAdmin =
    user &&
    (user.roles?.some((r: string) => ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(r)) ||
      ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(user.primaryRole || ''));

  return (
    <>
      {/* 1. TOP BAR */}
      <div
        style={{
          background: 'var(--zinc-950)',
          color: 'var(--zinc-400)',
          fontSize: '12px',
          padding: '6px 0',
          borderBottom: '1px solid var(--zinc-800)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={12} strokeWidth={1.5} />
              Hotline: <strong style={{ color: 'var(--zinc-200)', fontWeight: 600 }}>1900 1234 — 0908.123.456</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} strokeWidth={1.5} />
              Email: <strong style={{ color: 'var(--zinc-200)', fontWeight: 600 }}>cskh@viettour.vn</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} strokeWidth={1.5} />
              Giờ làm việc: <strong>08:00 - 18:00 (T2 - T7)</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ color: 'var(--zinc-300)', fontWeight: 500 }}>
              Ưu đãi thành viên: Giảm đến 15% khi thanh toán trực tuyến
            </span>
            <Link
              href="/portal/my-bookings"
              style={{
                color: 'var(--zinc-400)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--zinc-400)')}
            >
              Tra cứu đơn hàng
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVBAR */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          background: '#FFFFFF',
          borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* LOGO */}
          <Link
            href="/portal"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--zinc-900)',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '15px',
                letterSpacing: '0.5px',
              }}
            >
              VT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--zinc-900)',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                }}
              >
                VietTour
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  whiteSpace: 'nowrap',
                }}
              >
                Enterprise Travel
              </div>
            </div>
          </Link>

          {/* NAVIGATION */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', whiteSpace: 'nowrap' }}>
            <Link
              href="/portal"
              style={{
                textDecoration: 'none',
                color: 'var(--zinc-900)',
                fontWeight: 600,
                fontSize: '13.5px',
              }}
            >
              Trang chủ
            </Link>

            <Link
              href="/portal?category=MIEN_TRUNG#tours"
              style={{
                textDecoration: 'none',
                color: 'var(--zinc-600)',
                fontWeight: 500,
                fontSize: '13.5px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--zinc-900)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--zinc-600)')}
            >
              Tour Miền Trung
            </Link>

            <Link
              href="/portal?category=MIEN_BAC#tours"
              style={{
                textDecoration: 'none',
                color: 'var(--zinc-600)',
                fontWeight: 500,
                fontSize: '13.5px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--zinc-900)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--zinc-600)')}
            >
              Tour Miền Bắc
            </Link>

            <Link
              href="/portal?category=QUOC_TE#tours"
              style={{
                textDecoration: 'none',
                color: 'var(--zinc-600)',
                fontWeight: 500,
                fontSize: '13.5px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--zinc-900)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--zinc-600)')}
            >
              Tour Quốc Tế
            </Link>

            <Link
              href="/portal#promotions"
              style={{
                textDecoration: 'none',
                color: 'var(--zinc-600)',
                fontWeight: 500,
                fontSize: '13.5px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--zinc-900)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--zinc-600)')}
            >
              Khuyến mãi
            </Link>

            <Link
              href="/portal#about"
              style={{
                textDecoration: 'none',
                color: 'var(--zinc-600)',
                fontWeight: 500,
                fontSize: '13.5px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--zinc-900)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--zinc-600)')}
            >
              Về chúng tôi
            </Link>
          </nav>

          {/* ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Link
              href="/portal/my-bookings"
              className="btn btn-outline btn-sm"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <QrCode size={14} strokeWidth={1.5} />
              <span>Vé điện tử QR</span>
            </Link>

            {isStaffOrAdmin && (
              <Link
                href="/"
                className="btn btn-primary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
                title="Trở về Trang Tổng Quan Quản Trị Hệ Thống"
              >
                <LayoutDashboard size={14} strokeWidth={1.5} />
                <span>Dashboard ERP</span>
              </Link>
            )}

            {user ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--zinc-50)',
                    border: '1px solid var(--border)',
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--zinc-900)',
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--zinc-900)' }}>
                    {user.name}
                  </span>
                  <ChevronDown size={14} strokeWidth={1.5} color="var(--zinc-500)" />
                </button>

                {dropdownOpen && (
                  <CustomerAccountDropdown
                    user={user}
                    onLogoutClick={() => setShowLogoutModal(true)}
                    onClose={() => setDropdownOpen(false)}
                  />
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  href="/login"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '13px', padding: '6px 14px' }}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/login"
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '13px', padding: '6px 14px' }}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
      />
    </>
  );
}
