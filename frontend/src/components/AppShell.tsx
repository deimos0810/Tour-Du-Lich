'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isPortalPage = pathname.startsWith('/portal');

  // Điều hướng tự động dựa trên trạng thái xác thực
  useEffect(() => {
    if (!isLoading) {
      if (isAuthPage && user) {
        // Đã đăng nhập mà vào /login -> Chuyển về Dashboard hoặc Portal tùy vai trò
        router.push(user.redirectUrl || '/');
      } else if (!isAuthPage && !isPortalPage && !user) {
        // Chưa đăng nhập mà vào trang Quản trị -> Chuyển về /login
        router.push('/login');
      } else if (!isAuthPage && !isPortalPage && user?.primaryRole === 'Khach hang') {
        // Khách hàng không được truy cập các trang nội bộ -> chuyển về Portal
        router.replace('/portal');
      }
    }
  }, [isLoading, isAuthPage, isPortalPage, user, router]);

  // 1. Auth Layout (Cho /login, /register, /forgot-password)
  if (isAuthPage) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#F8FAFC',
        margin: 0,
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowX: 'hidden'
      }}>
        {children}
      </div>
    );
  }

  // 2. Customer Portal Layout
  if (isPortalPage) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', background: '#F8FAFC', margin: 0, padding: 0 }}>
        {children}
      </div>
    );
  }

  // Nếu đang loading xác thực hoặc chưa đăng nhập ở trang Admin
  if (isLoading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        color: '#64748B',
        fontSize: '14px',
        fontWeight: 500
      }}>
        Đang kiểm tra phiên làm việc...
      </div>
    );
  }

  // Nếu là khách hàng đang ở trang Admin nội bộ -> chặn render và chuyển hướng
  if (!isPortalPage && !isAuthPage && user?.primaryRole === 'Khach hang') {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        padding: '20px',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#DC2626', fontWeight: 900, fontSize: '24px', marginBottom: '8px' }}>
          403 — Không có quyền truy cập
        </h2>
        <p style={{ color: '#64748B', maxWidth: '480px', marginBottom: '16px', fontSize: '14px' }}>
          Tài khoản Khách hàng không có quyền truy cập vào phân hệ Quản trị Lữ hành nội bộ (ERP).
        </p>
        <button
          onClick={() => router.replace('/portal')}
          style={{
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Quay lại Cổng Khách hàng
        </button>
      </div>
    );
  }

  // 3. Dashboard Layout (Chỉ mount khi đã ĐĂNG NHẬP THÀNH CÔNG và ở các trang Quản trị)
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
