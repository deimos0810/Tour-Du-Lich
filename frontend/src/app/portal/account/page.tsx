'use client';
import { useEffect, useState } from 'react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Edit2, Check, User, ShieldCheck } from 'lucide-react';

export default function AccountProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cccd, setCccd] = useState(user?.cccd || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cccdShakeKey, setCccdShakeKey] = useState(0);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCccd(user.cccd || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanCccd = cccd.trim();

    if (cleanCccd.length > 0 && !/^\d{12}$/.test(cleanCccd)) {
      setErrorMsg('Số CCCD / Mã định danh cá nhân phải gồm đúng 12 chữ số (hoặc để trống nếu chưa muốn lưu)!');
      setCccdShakeKey((k) => k + 1);
      return;
    }

    try {
      setSaving(true);
      const updated = await api<any>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          hoTen: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          cccd: cleanCccd || null,
        }),
      });

      updateUser({
        name: updated?.name || name.trim(),
        phone: updated?.phone || phone.trim(),
        address: updated?.address ?? (address.trim() || null),
        cccd: updated?.cccd ?? (cleanCccd || null),
      });

      setSuccessMsg(
        cleanCccd
          ? 'Cập nhật thông tin & lưu số CCCD thành công! Hệ thống sẽ tự động điền CCCD của bạn khi đặt tour.'
          : 'Cập nhật thông tin cá nhân thành công!',
      );
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể lưu thông tin cá nhân');
    } finally {
      setSaving(false);
    }
  };

  const savedCccd = (cccd || user?.cccd || '').trim();

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <CustomerAccountLayout>
        <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid #E4E4E7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E4E4E7' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <User size={18} strokeWidth={1.5} style={{ color: '#09090B' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#09090B', margin: 0, letterSpacing: '-0.02em' }}>Thông tin cá nhân</h2>
              </div>
              <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>Quản lý thông tin tài khoản, số CCCD định danh và địa chỉ liên hệ của bạn</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setIsEditing(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#09090B',
                  border: '1px solid #E4E4E7',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={13} strokeWidth={1.5} />
                <span>Chỉnh sửa thông tin</span>
              </button>
            )}
          </div>

          {successMsg && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} strokeWidth={2} />
              <span>{successMsg}</span>
            </div>
          )}

          {!isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#71717A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#09090B' }}>{name || user?.name || '—'}</div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#71717A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Email đăng nhập</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#09090B' }}>{user?.email || '—'}</div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#71717A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Số điện thoại liên hệ</label>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#09090B' }}>{phone || user?.phone || 'Chưa cập nhật'}</div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#71717A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Hạng thành viên</label>
                <div>
                  <span style={{ fontSize: '11.5px', background: '#F4F4F5', color: '#09090B', border: '1px solid #E4E4E7', padding: '3px 10px', borderRadius: '4px', fontWeight: 600, display: 'inline-block' }}>
                    Thành viên Mới
                  </span>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2', background: savedCccd ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${savedCccd ? '#BBF7D0' : '#E2E8F0'}`, borderRadius: '8px', padding: '12px 14px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <ShieldCheck size={14} style={{ color: savedCccd ? '#16A34A' : '#64748B' }} />
                  <span>Số CCCD / Định danh cá nhân (Tự động điền khi đặt tour)</span>
                </label>
                {savedCccd ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#09090B', fontFamily: 'monospace', letterSpacing: '1px' }}>
                      {savedCccd}
                    </span>
                    <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                      ✓ Đã kích hoạt tự động điền & khóa bảo vệ khi đặt tour
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    Chưa cập nhật. <span style={{ color: '#0F172A', fontWeight: 500 }}>Khuyến nghị bổ sung số CCCD (12 chữ số)</span> để hệ thống tự động điền nhanh thông tin của bạn mỗi khi đăng ký tour.
                  </div>
                )}
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '11px', color: '#71717A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Địa chỉ liên hệ</label>
                <div style={{ fontSize: '13.5px', color: address ? '#27272A' : '#A1A1AA' }}>
                  {address || 'Chưa cập nhật địa chỉ. Nhấn "Chỉnh sửa thông tin" để bổ sung.'}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <style>{`
                @keyframes profileCccdShake {
                  0%, 100% { transform: translateX(0); }
                  20%, 60% { transform: translateX(-5px); background-color: #FEF2F2; }
                  40%, 80% { transform: translateX(5px); background-color: #FEE2E2; }
                }
              `}</style>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>
                  Họ và tên <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #E4E4E7', outline: 'none' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>
                  Số điện thoại <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #E4E4E7', outline: 'none' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B' }}>
                    Số CCCD / Mã định danh cá nhân (12 chữ số)
                  </label>
                  <span style={{ fontSize: '11px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '1px 8px', borderRadius: '999px', fontWeight: 600 }}>
                    Khuyến nghị để tự động điền nhanh
                  </span>
                </div>
                <input
                  key={cccdShakeKey}
                  type="text"
                  maxLength={12}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13.5px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.8px',
                    borderRadius: '6px',
                    border: errorMsg ? '2px solid #DC2626' : '1px solid #E4E4E7',
                    backgroundColor: errorMsg ? '#FEF2F2' : '#FFFFFF',
                    animation: errorMsg ? 'profileCccdShake 0.45s ease-in-out' : undefined,
                    outline: 'none',
                  }}
                  value={cccd}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setCccd(digits);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Nhập 12 chữ số CCCD của bạn (không bắt buộc điền ngay)..."
                />
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px', lineHeight: 1.45 }}>
                  Khi đã lưu CCCD tại đây, mỗi khi bạn đặt tour hệ thống sẽ <strong>tự động điền sẵn và khóa cố định CCCD của riêng bạn</strong> ở vị trí Hành khách 1 (những người đi cùng do bạn đại diện đăng ký vẫn nhập tay bình thường).
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>Địa chỉ liên hệ</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #E4E4E7', outline: 'none' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ nhà / tỉnh thành của bạn..."
                />
              </div>

              {errorMsg && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '9px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                  * {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setErrorMsg(null);
                    setName(user?.name || '');
                    setPhone(user?.phone || '');
                    setCccd(user?.cccd || '');
                    setAddress(user?.address || '');
                    setIsEditing(false);
                  }}
                  style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 600, borderRadius: '6px', background: '#FFFFFF', color: '#09090B', border: '1px solid #E4E4E7', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 600, borderRadius: '6px', background: '#09090B', color: '#FAFAFA', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </CustomerAccountLayout>

      <CustomerFooter />
    </div>
  );
}
