'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type AuthScreen = 'login' | 'register' | 'forgot_email' | 'forgot_reset';

export default function LoginPage() {
  const { login } = useAuth();
  const [screen, setScreen] = useState<AuthScreen>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register Form State
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(300);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 5-minute countdown for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (screen === 'forgot_reset' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screen, timerSeconds]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      login(res.user, res.token);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Tên tài khoản hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: regEmail, password: regPassword, hoTen: regName, phone: regPhone }),
      });

      setToastMessage('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      setScreen('login');
      setLoginEmail(regEmail);
      setLoginPassword(regPassword);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng ký tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });

      setToastMessage(`Mã OTP xác thực đã được gửi tới email ${forgotEmail}. Vui lòng kiểm tra hộp thư.`);
      setTimerSeconds(300);
      setOtpCode(''); // Always require manual input from Gmail
      setScreen('forgot_reset');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Email này chưa được đăng ký trong hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp!');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, otp: otpCode, newPassword }),
      });

      setToastMessage('Khôi phục mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.');
      setScreen('login');
      setLoginEmail(forgotEmail);
      setLoginPassword(newPassword);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
      padding: '24px',
      position: 'relative'
    }}>
      {/* TOAST NOTIFICATION TRÊN CÙNG */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#10B981',
          color: '#FFFFFF',
          padding: '14px 22px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: 600
        }}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', fontSize: '16px', marginLeft: '12px' }}>✕</button>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* LOGO & TITLE HEADING (ĐÃ ĐỔI TÊN THÀNH VIETTOUR, KHÔNG CÓ CHỮ ERP) */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #0D6EFD 0%, #1D4ED8 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '24px',
            fontWeight: 900,
            boxShadow: '0 8px 20px rgba(13, 110, 253, 0.25)',
            letterSpacing: '-0.5px'
          }}>
            VT
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0F172A', lineHeight: 1.2, margin: '0 0 6px', letterSpacing: '-0.3px' }}>
            VietTour
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Hệ thống Quản lý & Tạo lập Cơ sở dữ liệu Tour Du lịch
          </p>
        </div>

        {/* AUTH CARD */}
        <div className="card" style={{
          padding: '32px 28px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          background: '#FFFFFF'
        }}>
          {errorMessage && (
            <div style={{
              background: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '13.5px',
              lineHeight: 1.5,
              fontWeight: 600
            }}>
              {errorMessage}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. MÀN HÌNH ĐĂNG NHẬP */}
          {/* ========================================================================= */}
          {screen === 'login' && (
            <div>
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: '2px solid #0D6EFD',
                    color: '#0D6EFD',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    cursor: 'pointer'
                  }}
                >
                  ĐĂNG NHẬP
                </button>
                <button
                  type="button"
                  onClick={() => { setScreen('register'); setErrorMessage(null); }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: '2px solid transparent',
                    color: '#64748B',
                    fontWeight: 600,
                    fontSize: '14.5px',
                    cursor: 'pointer'
                  }}
                >
                  ĐĂNG KÝ
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '6px' }}>
                    Tên tài khoản / Email <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    type="email"
                    required
                    style={{ width: '100%', padding: '10px 12px', fontSize: '14px' }}
                    placeholder="Nhập email đăng nhập"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '6px' }}>
                    Mật khẩu <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      style={{ width: '100%', paddingRight: '40px', paddingLeft: '12px', height: '42px', fontSize: '14px' }}
                      placeholder="Nhập mật khẩu"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748B',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setScreen('forgot_email'); setErrorMessage(null); setForgotEmail(loginEmail); }}
                    style={{ background: 'none', border: 'none', color: '#0D6EFD', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>
                  {loading ? 'Đang xác thực...' : 'Đăng nhập'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => { setScreen('register'); setErrorMessage(null); }}
                    style={{ background: 'none', border: 'none', color: '#0D6EFD', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đăng ký Khách hàng mới
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. MÀN HÌNH ĐĂNG KÝ */}
          {/* ========================================================================= */}
          {screen === 'register' && (
            <div>
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setScreen('login'); setErrorMessage(null); }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: '2px solid transparent',
                    color: '#64748B',
                    fontWeight: 600,
                    fontSize: '14.5px',
                    cursor: 'pointer'
                  }}
                >
                  ĐĂNG NHẬP
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    border: 'none',
                    background: 'none',
                    borderBottom: '2px solid #0D6EFD',
                    color: '#0D6EFD',
                    fontWeight: 700,
                    fontSize: '14.5px',
                    cursor: 'pointer'
                  }}
                >
                  ĐĂNG KÝ
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>Họ và tên <span style={{ color: '#DC2626' }}>*</span></label>
                  <input className="input" type="text" required style={{ width: '100%' }} placeholder="Nguyễn Văn A" value={regName} onChange={(e) => setRegName(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>Số điện thoại <span style={{ color: '#DC2626' }}>*</span></label>
                  <input className="input" type="tel" required style={{ width: '100%' }} placeholder="0908 123 456" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>Email đăng nhập <span style={{ color: '#DC2626' }}>*</span></label>
                  <input className="input" type="email" required style={{ width: '100%' }} placeholder="address@domain.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>Mật khẩu <span style={{ color: '#DC2626' }}>*</span></label>
                  <input className="input" type="password" required style={{ width: '100%' }} placeholder="Tối thiểu 6 ký tự" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>
                  {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => { setScreen('login'); setErrorMessage(null); }}
                    style={{ background: 'none', border: 'none', color: '#0D6EFD', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. QUÊN MẬT KHẨU - BƯỚC 1 */}
          {/* ========================================================================= */}
          {screen === 'forgot_email' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D6EFD', textAlign: 'center', marginBottom: '6px', textTransform: 'uppercase' }}>
                QUÊN MẬT KHẨU
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginBottom: '20px' }}>
                Nhập email đã đăng ký để nhận mã xác thực OTP
              </p>

              <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '6px' }}>
                    Email xác thực <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    type="email"
                    required
                    style={{ width: '100%', padding: '10px 12px' }}
                    placeholder="nguyenvana@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '11px', fontSize: '14.5px', fontWeight: 700 }}>
                  {loading ? 'Đang gửi...' : 'Gửi mã xác thực OTP'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                  Quay lại{' '}
                  <button
                    type="button"
                    onClick={() => { setScreen('login'); setErrorMessage(null); }}
                    style={{ background: 'none', border: 'none', color: '#0D6EFD', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. ĐẶT LẠI MẬT KHẨU VÀ OTP - BƯỚC 2 */}
          {/* ========================================================================= */}
          {screen === 'forgot_reset' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0D6EFD', textAlign: 'center', marginBottom: '6px', textTransform: 'uppercase' }}>
                KHÔI PHỤC MẬT KHẨU
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginBottom: '4px' }}>
                Mã xác minh 6 số đã được gửi tới email
              </p>
              <div style={{ textAlign: 'center', fontWeight: 700, color: '#0F172A', fontSize: '14px', marginBottom: '16px' }}>
                {forgotEmail}
              </div>

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Nhập mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    type="password"
                    required
                    style={{ width: '100%' }}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Xác nhận mật khẩu mới <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    type="password"
                    required
                    style={{ width: '100%' }}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>
                    Mã OTP 6 chữ số <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    type="text"
                    required
                    maxLength={6}
                    style={{ width: '100%', letterSpacing: '6px', fontWeight: 800, fontSize: '18px', textAlign: 'center', height: '44px' }}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', marginBottom: 0, lineHeight: 1.4 }}>
                    Vui lòng kiểm tra hộp thư Gmail của bạn (bao gồm cả thư mục Spam/Quảng cáo) để nhập mã xác thực 6 số.
                  </p>
                </div>

                <div style={{ textAlign: 'center', margin: '6px 0' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0D6EFD', letterSpacing: '1px' }}>
                    {formatTimer(timerSeconds)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Chưa nhận được mã?{' '}
                    <button
                      type="button"
                      onClick={handleRequestOTP}
                      disabled={timerSeconds > 240}
                      style={{ background: 'none', border: 'none', color: timerSeconds > 240 ? '#94A3B8' : '#0D6EFD', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Gửi lại mã OTP
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading || timerSeconds === 0} style={{ width: '100%', padding: '11px', fontSize: '14.5px', fontWeight: 700 }}>
                  {loading ? 'Đang xử lý...' : 'Xác nhận khôi phục'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
                  Quay lại{' '}
                  <button
                    type="button"
                    onClick={() => { setScreen('login'); setErrorMessage(null); }}
                    style={{ background: 'none', border: 'none', color: '#0D6EFD', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
