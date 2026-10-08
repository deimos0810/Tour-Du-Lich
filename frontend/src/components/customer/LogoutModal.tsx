'use client';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function LogoutModal({ isOpen, onClose, onConfirm }: Props) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '28px', borderRadius: '14px', background: '#FFFFFF' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#FEF2F2',
            color: '#DC2626',
            display: 'grid',
            placeItems: 'center',
            fontSize: '18px',
            fontWeight: 800,
            margin: '0 auto 14px',
            border: '1px solid #FCA5A5'
          }}>
            !
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>Xác nhận đăng xuất</h3>
          <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản VietTour không?
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            className="btn btn-outline"
            onClick={onClose}
            style={{ padding: '10px', fontSize: '14px', fontWeight: 600 }}
          >
            Hủy bỏ
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            style={{ padding: '10px', fontSize: '14px', background: '#DC2626', borderColor: '#DC2626', fontWeight: 700 }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
