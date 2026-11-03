'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { AlertTriangle, X, ArrowRight, Bell } from 'lucide-react';

export type CancellationNotice = {
  donHangId: number;
  maDon: string;
  tenTour: string;
  maTour?: string;
  hinhAnhUrl?: string | null;
  thoiGian?: string;
  ngayKhoiHanh?: string;
  tongTien: string;
  ghiChu?: string;
  lyDoHuy: string;
  cancelTime?: string;
  isAdminCancelled: boolean;
};

export default function CancellationNoticeModal() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeNotice, setActiveNotice] = useState<CancellationNotice | null>(null);

  useEffect(() => {
    if (!user || !user.customerId) return;

    let isMounted = true;
    const checkCancellations = async () => {
      try {
        const notices = await api<CancellationNotice[]>(`/portal/cancellation-notices?customerId=${user.customerId}`);
        if (!isMounted || !notices || notices.length === 0) return;

        // Lấy danh sách ID các đơn bị hủy mà khách hàng đã bấm "Đã hiểu / Đã xem"
        const viewedRaw = localStorage.getItem('viettour_viewed_cancellations');
        const viewedIds: number[] = viewedRaw ? JSON.parse(viewedRaw) : [];

        // Tìm đơn bị Admin hủy đầu tiên mà khách hàng chưa xem thông báo
        const unviewedNotice = notices.find(
          (n) => n.isAdminCancelled && !viewedIds.includes(n.donHangId),
        );

        if (unviewedNotice) {
          setActiveNotice(unviewedNotice);
        }
      } catch (err) {
        // Bỏ qua lỗi ngầm để không làm phiền trải nghiệm
      }
    };

    void checkCancellations();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const markAsViewed = () => {
    if (!activeNotice) return;
    try {
      const viewedRaw = localStorage.getItem('viettour_viewed_cancellations');
      const viewedIds: number[] = viewedRaw ? JSON.parse(viewedRaw) : [];
      if (!viewedIds.includes(activeNotice.donHangId)) {
        viewedIds.push(activeNotice.donHangId);
        localStorage.setItem('viettour_viewed_cancellations', JSON.stringify(viewedIds));
      }
    } catch {}
    setActiveNotice(null);
  };

  const handleGoToBookings = () => {
    markAsViewed();
    router.push('/portal/my-bookings');
  };

  if (!activeNotice) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header Thông báo nổi bật */}
        <div
          style={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            padding: '24px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={markAsViewed}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={28} color="#FFFFFF" />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  opacity: 0.85,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Bell size={12} />
                Thông báo quan trọng từ VietTour
              </div>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '19px', fontWeight: 800, lineHeight: 1.25 }}>
                Đơn đặt tour #{activeNotice.maDon} đã bị hủy
              </h2>
            </div>
          </div>
        </div>

        {/* Nội dung thông báo */}
        <div style={{ padding: '24px' }}>
          {/* Thông tin chuyến tour */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Chuyến đi đã đặt
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {activeNotice.tenTour}
            </div>
            {activeNotice.ngayKhoiHanh && (
              <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                Khởi hành: <strong>{new Date(activeNotice.ngayKhoiHanh).toLocaleDateString('vi-VN')}</strong>
                {activeNotice.thoiGian && ` · ${activeNotice.thoiGian}`}
              </div>
            )}
          </div>

          {/* KHUNG LÝ DO HỦY ĐƠN TỪ ADMIN - NỔI BẬT */}
          <div
            style={{
              background: '#fff1f2',
              border: '1.5px solid #fecdd3',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#9f1239',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <AlertTriangle size={15} color="#e11d48" />
              Lý do hủy từ Quản trị viên:
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#881337',
                lineHeight: 1.5,
                fontWeight: 600,
                background: '#ffffff',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #ffe4e6',
              }}
            >
              "{activeNotice.lyDoHuy}"
            </div>
            {activeNotice.cancelTime && (
              <div style={{ fontSize: '11px', color: '#be123c', marginTop: '8px', textAlign: 'right' }}>
                Thời gian xử lý: {activeNotice.cancelTime}
              </div>
            )}
          </div>

          {/* Hướng dẫn và liên hệ */}
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', lineHeight: 1.5 }}>
            Nếu quý khách có bất kỳ câu hỏi nào về việc hoàn tiền hoặc cần hỗ trợ đặt chuyến đi khác, vui lòng liên hệ tổng đài hỗ trợ 24/7 của chúng tôi: <strong style={{ color: '#0f172a' }}>1900 1234</strong>.
          </p>
        </div>

        {/* Footer Nút bấm */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={markAsViewed}
            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}
          >
            Đã hiểu
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGoToBookings}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Xem đơn hàng của tôi</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
