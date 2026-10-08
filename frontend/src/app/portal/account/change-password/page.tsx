'use client';
import { useState } from 'react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';

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
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <CustomerAccountLayout>
        <div className="card" style={{ padding: '28px', borderRadius: '12px', maxWidth: '560px' }}>
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>🔒 Đổi mật khẩu</h2>
            <p style={{ fontSize: '13px', color: '#64748B' }}>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
          </div>

          {errorMsg && (
            <div className="notice" style={{ background: '#FEE2E2', borderColor: '#FECACA', color: '#B91C1C', marginBottom: '20px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="notice" style={{ background: '#DCFCE7', borderColor: '#BBF7D0', color: '#15803D', marginBottom: '20px' }}>
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                Mật khẩu hiện tại <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                className="input"
                type="password"
                required
                style={{ width: '100%' }}
                placeholder="Nhập mật khẩu cũ"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                Mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                className="input"
                type="password"
                required
                style={{ width: '100%' }}
                placeholder="Tối thiểu 8 ký tự, bao gồm chữ và số"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                Xác nhận mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                className="input"
                type="password"
                required
                style={{ width: '100%' }}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '12.5px', color: '#64748B' }}>
              <div>📌 <strong>Yêu cầu mật khẩu an toàn:</strong></div>
              <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                <li>Độ dài tối thiểu 8 ký tự</li>
                <li>Chứa ít nhất 1 chữ cái và 1 số</li>
              </ul>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ padding: '10px', fontSize: '14px', marginTop: '6px' }}>
              {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      </CustomerAccountLayout>

      <CustomerFooter />
    </div>
  );
}
