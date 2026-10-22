import { LogOut } from 'lucide-react';

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
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--rose-50)',
            color: 'var(--rose-600)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 14px',
            border: '1px solid var(--rose-200)'
          }}>
            <LogOut size={20} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '6px' }}>Xác nhận đăng xuất</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản VietTour không?
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            className="btn btn-outline"
            onClick={onClose}
            style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600 }}
          >
            Hủy bỏ
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            style={{ padding: '8px 14px', fontSize: '13px', background: 'var(--rose-600)', borderColor: 'var(--rose-600)', fontWeight: 600 }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
