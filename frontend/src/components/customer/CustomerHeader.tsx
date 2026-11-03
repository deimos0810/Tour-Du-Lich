'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import CustomerAccountDropdown from './CustomerAccountDropdown';
import LogoutModal from './LogoutModal';
import CancellationNoticeModal, { CancellationNotice } from './CancellationNoticeModal';
import { QrCode, LayoutDashboard, ChevronDown, Phone, Mail, Clock, Bell, AlertTriangle } from 'lucide-react';

export default function CustomerHeader() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeNav, setActiveNav] = useState<string>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncNav = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (window.location.hash === '#about') {
        setActiveNav('ABOUT');
      } else if (cat) {
        setActiveNav(cat);
      } else {
        setActiveNav('ALL');
      }
    };
    syncNav();
    const onCustomNav = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.category) setActiveNav(detail.category);
    };
    window.addEventListener('popstate', syncNav);
    window.addEventListener('viettour:nav-filter', onCustomNav);
    return () => {
      window.removeEventListener('popstate', syncNav);
      window.removeEventListener('viettour:nav-filter', onCustomNav);
    };
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    category: string,
    targetId: string,
    href: string
  ) => {
    if (typeof window !== 'undefined' && window.location.pathname === '/portal') {
      e.preventDefault();
      window.history.pushState({}, '', href);
      setActiveNav(category);
      window.dispatchEvent(new CustomEvent('viettour:nav-filter', { detail: { category, targetId } }));
      if (targetId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Thông báo hủy đơn
  const [notices, setNotices] = useState<CancellationNotice[]>([]);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const noticesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !user.customerId) return;
    api<CancellationNotice[]>(`/portal/cancellation-notices?customerId=${user.customerId}`)
      .then((data) => {
        if (Array.isArray(data)) setNotices(data);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (noticesRef.current && !noticesRef.current.contains(event.target as Node)) {
        setNoticesOpen(false);
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
          <nav style={{ display: 'flex', alignItems: 'center', gap: '22px', whiteSpace: 'nowrap' }}>
            {[
              { key: 'ALL', label: 'Trang chủ', href: '/portal', targetId: 'top' },
              { key: 'MIEN_TRUNG', label: 'Tour Miền Trung', href: '/portal?category=MIEN_TRUNG#tour-list-section', targetId: 'tour-list-section' },
              { key: 'MIEN_BAC', label: 'Tour Miền Bắc', href: '/portal?category=MIEN_BAC#tour-list-section', targetId: 'tour-list-section' },
              { key: 'QUOC_TE', label: 'Tour Quốc Tế', href: '/portal?category=QUOC_TE#tour-list-section', targetId: 'tour-list-section' },
              { key: 'KHUYEN_MAI', label: 'Khuyến mãi', href: '/portal?category=KHUYEN_MAI#tour-list-section', targetId: 'tour-list-section' },
              { key: 'ABOUT', label: 'Về chúng tôi', href: '/portal#about', targetId: 'about' },
            ].map((item) => {
              const isActive = activeNav === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.key, item.targetId, item.href)}
                  style={{
                    textDecoration: 'none',
                    color: isActive ? 'var(--zinc-900)' : 'var(--zinc-600)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13.5px',
                    padding: '6px 2px',
                    borderBottom: isActive ? '2px solid var(--zinc-900)' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
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

            {/* CHUÔNG THÔNG BÁO CHO KHÁCH HÀNG */}
            {user && (
              <div style={{ position: 'relative' }} ref={noticesRef}>
                <button
                  type="button"
                  onClick={() => setNoticesOpen(!noticesOpen)}
                  title="Thông báo đơn đặt tour"
                  style={{
                    position: 'relative',
                    width: '34px',
                    height: '34px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: noticesOpen ? '#fef2f2' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: notices.length > 0 ? '#e11d48' : '#64748b',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Bell size={16} strokeWidth={1.8} />
                  {notices.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        background: '#e11d48',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 700,
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #ffffff',
                      }}
                    >
                      {notices.length}
                    </span>
                  )}
                </button>

                {/* Dropdown danh sách thông báo */}
                {noticesOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '320px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                      padding: '12px',
                      zIndex: 1000,
                      animation: 'fadeIn 0.15s ease-out',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #f1f5f9',
                        marginBottom: '8px',
                      }}
                    >
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                        Thông báo ({notices.length})
                      </strong>
                      <Link
                        href="/portal/my-bookings"
                        onClick={() => setNoticesOpen(false)}
                        style={{ fontSize: '11.5px', color: '#0D6EFD', textDecoration: 'none', fontWeight: 600 }}
                      >
                        Xem tất cả đơn
                      </Link>
                    </div>

                    {notices.length > 0 ? (
                      <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {notices.map((n) => (
                          <Link
                            key={n.donHangId}
                            href="/portal/my-bookings"
                            onClick={() => setNoticesOpen(false)}
                            style={{
                              textDecoration: 'none',
                              display: 'block',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              borderRadius: '8px',
                              padding: '10px 12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e11d48', fontSize: '12px', fontWeight: 700 }}>
                              <AlertTriangle size={13} />
                              <span>Đơn #{n.maDon} đã bị hủy</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600, marginTop: '3px' }}>
                              {n.tenTour}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#881337', marginTop: '4px', background: '#ffffff', padding: '6px 8px', borderRadius: '6px' }}>
                              <strong>Lý do: </strong>{n.lyDoHuy}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                        Không có thông báo mới nào
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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

      {/* POPUP THÔNG BÁO TỰ ĐỘNG KHI CÓ ĐƠN BỊ ADMIN HỦY */}
      <CancellationNoticeModal />
    </>
  );
}
