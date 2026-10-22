'use client';
import { useState } from 'react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import { useAuth } from '@/context/AuthContext';
import { Edit2, Check, User } from 'lucide-react';

export default function AccountProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Cập nhật thông tin cá nhân thành công!');
    setIsEditing(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

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
              <p style={{ fontSize: '12.5px', color: '#71717A', margin: 0 }}>Quản lý thông tin tài khoản và địa chỉ liên hệ của bạn</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
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
                  cursor: 'pointer'
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

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '11px', color: '#71717A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Địa chỉ liên hệ</label>
                <div style={{ fontSize: '13.5px', color: address ? '#27272A' : '#A1A1AA' }}>
                  {address || 'Chưa cập nhật địa chỉ. Nhấn "Chỉnh sửa thông tin" để bổ sung.'}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>Họ và tên *</label>
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
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>Số điện thoại *</label>
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
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#09090B', display: 'block', marginBottom: '4px' }}>Địa chỉ liên hệ</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #E4E4E7', outline: 'none' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập địa chỉ nhà / tỉnh thành của bạn..."
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 600, borderRadius: '6px', background: '#FFFFFF', color: '#09090B', border: '1px solid #E4E4E7', cursor: 'pointer' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: 600, borderRadius: '6px', background: '#09090B', color: '#FAFAFA', border: 'none', cursor: 'pointer' }}
                >
                  Lưu thay đổi
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
