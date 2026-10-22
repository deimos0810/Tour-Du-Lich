'use client';
import { useState } from 'react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import { Lock, AlertCircle, Check, ShieldCheck } from 'lucide-react';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự!');
      return;
    }

    if (!/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      setErrorMsg('Mật khẩu mới phải chứa cả chữ cái và số!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu mới và xác nhận mật khẩu không trùng khớp!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <CustomerAccountLayout>
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #E4E4E7', maxWidth: '540px' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E4E4E7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Lock size={18} strokeWidth={1.5} style={{ color: '#09090B' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#09090B', margin: 0, letterSpacing: '-0.02em' }}>Đổi mật khẩu</h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
          </div>

          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} strokeWidth={1.5} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} strokeWidth={2} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>
                Mật khẩu hiện tại <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="password"
                required
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #E4E4E7', outline: 'none' }}
                placeholder="Nhập mật khẩu cũ"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>
                Mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="password"
                required
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #E4E4E7', outline: 'none' }}
                placeholder="Tối thiểu 8 ký tự, bao gồm chữ và số"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>
                Xác nhận mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                type="password"
                required
                style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #E4E4E7', outline: 'none' }}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div style={{ background: '#F4F4F5', padding: '12px', borderRadius: '6px', border: '1px solid #E4E4E7', fontSize: '12px', color: '#52525B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#09090B', marginBottom: '4px' }}>
                <ShieldCheck size={14} strokeWidth={1.5} />
                <span>Yêu cầu mật khẩu an toàn:</span>
              </div>
              <ul style={{ margin: '2px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
                <li>Độ dài tối thiểu 8 ký tự</li>
                <li>Chứa ít nhất 1 chữ cái và 1 số</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                background: '#09090B',
                color: '#FAFAFA',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '4px'
              }}
            >
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </CustomerAccountLayout>

      <CustomerFooter />
    </div>
  );
}
