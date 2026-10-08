'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import CustomerAccountDropdown from './CustomerAccountDropdown';
import LogoutModal from './LogoutModal';

export default function CustomerHeader() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click bên ngoài
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

  return (
    <>
      {/* 1. TOP BAR THÔNG TIN VIETTOUR */}
      <div style={{ background: '#0F172A', color: '#94A3B8', fontSize: '12.5px', padding: '7px 0', borderBottom: '1px solid #1E293B' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Hotline: <strong style={{ color: '#F59E0B' }}>1900 1234 — 0908.123.456</strong></span>
            <span>Email: <strong style={{ color: '#E2E8F0' }}>cskh@viettour.vn</strong></span>
            <span>Giờ làm việc: <strong>08:00 - 18:00 (T2 - T7)</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ color: '#38BDF8', fontWeight: 600 }}>Ưu đãi giảm 20% khi đặt tour trực tuyến</span>
            <Link href="/portal/my-bookings" style={{ color: '#94A3B8', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} className="topbar-link">
              Tra cứu đơn hàng
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          {/* LOGO VIETTOUR BRANDING */}
          <Link href="/portal" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0D6EFD 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(13, 110, 253, 0.25)',
              letterSpacing: '-0.5px'
            }}>
              VT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '21px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px', lineHeight: 1.15, whiteSpace: 'nowrap' }}>
                VietTour
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>
                Du lịch & Trải nghiệm
              </div>
            </div>
          </Link>

          {/* NAVIGATION MENU */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '26px', whiteSpace: 'nowrap' }}>
            <Link href="/portal" style={{ textDecoration: 'none', color: '#0284C7', fontWeight: 700, fontSize: '14.5px' }}>
              Trang chủ
            </Link>

            <Link href="/portal?category=MIEN_TRUNG#tours" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, fontSize: '14.5px', transition: 'color 0.15s' }}>
              Tour Miền Trung
            </Link>

            <Link href="/portal?category=MIEN_BAC#tours" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, fontSize: '14.5px', transition: 'color 0.15s' }}>
              Tour Miền Bắc
            </Link>

            <Link href="/portal?category=QUOC_TE#tours" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, fontSize: '14.5px', transition: 'color 0.15s' }}>
              Tour Quốc Tế
            </Link>

            <Link href="/portal#promotions" style={{ textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '14.5px', transition: 'color 0.15s' }}>
              Khuyến mãi
            </Link>

            <Link href="/portal#about" style={{ textDecoration: 'none', color: '#475569', fontWeight: 600, fontSize: '14.5px', transition: 'color 0.15s' }}>
              Về chúng tôi
            </Link>
          </nav>

          {/* ACTION BUTTONS & ACCOUNT DROPDOWN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Link
              href="/portal/my-bookings"
              style={{
                color: '#0F172A',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                transition: 'all 0.15s',
              }}
            >
              <span>Vé điện tử QR</span>
            </Link>

            {/* NÚT QUẢN TRỊ VIÊN DÀNH CHO ADMIN / NHÂN VIÊN */}
            {user && (user.roles?.some((r: string) => ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(r)) || ['Admin', 'Dieu hanh', 'Ke toan', 'HDV'].includes(user.primaryRole || '')) && (
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0F172A',
                  color: '#38BDF8',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid #0284C7',
                  boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
                  transition: 'all 0.2s',
                }}
                className="admin-return-btn"
                title="Trở về Trang Tổng Quan Quản Trị Hệ Thống"
              >
                <span>⚙️</span>
                <span>Dashboard Quản Trị</span>
              </Link>
            )}

            {user ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    padding: '6px 14px',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: '#0D6EFD',
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '12px',
                    fontWeight: 800
                  }}>
                    {getInitials(user.name)}
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748B' }}>▼</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/login" className="btn btn-outline" style={{ fontSize: '13.5px', padding: '8px 18px', color: '#0D6EFD', borderColor: '#0D6EFD', fontWeight: 700 }}>
                  Đăng nhập
                </Link>
                <Link href="/login" className="btn btn-primary" style={{ fontSize: '13.5px', padding: '8px 18px', background: '#0D6EFD', borderColor: '#0D6EFD', fontWeight: 700 }}>
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
