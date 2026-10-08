'use client';
import { useState } from 'react';
import CustomerHeader from '@/components/customer/CustomerHeader';
import CustomerFooter from '@/components/customer/CustomerFooter';
import CustomerAccountLayout from '@/components/customer/CustomerAccountLayout';
import { useAuth } from '@/context/AuthContext';

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
    <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CustomerHeader />

      <CustomerAccountLayout>
        <div className="card" style={{ padding: '28px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Thông tin cá nhân</h2>
              <p style={{ fontSize: '13px', color: '#64748B' }}>Quản lý thông tin tài khoản và địa chỉ liên hệ của bạn</p>
            </div>
            {!isEditing && (
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(true)}>
                ✏️ Chỉnh sửa thông tin
              </button>
            )}
          </div>

          {successMsg && (
            <div className="notice" style={{ background: '#DCFCE7', borderColor: '#BBF7D0', color: '#15803D', marginBottom: '20px' }}>
              ✓ {successMsg}
            </div>
          )}

          {!isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Họ và tên</label>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{name || user?.name || '—'}</div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email đăng nhập</label>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>{user?.email || '—'}</div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số điện thoại liên hệ</label>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>{phone || user?.phone || 'Chưa cập nhật'}</div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Hạng thành viên</label>
                <div>
                  <span style={{ fontSize: '12.5px', background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '4px 12px', borderRadius: '12px', fontWeight: 600, display: 'inline-block' }}>
                    Thành viên Mới
                  </span>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Địa chỉ liên hệ</label>
                <div style={{ fontSize: '14.5px', color: address ? '#1E293B' : '#94A3B8', fontStyle: address ? 'normal' : 'italic' }}>
                  {address || 'Chưa cập nhật địa chỉ. Nhấn "Chỉnh sửa thông tin" để bổ sung.'}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>Họ và tên *</label>
                <input className="input" type="text" required style={{ width: '100%' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập họ và tên" />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>Số điện thoại *</label>
                <input className="input" type="tel" required style={{ width: '100%' }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', display: 'block', marginBottom: '4px' }}>Địa chỉ liên hệ</label>
                <input className="input" type="text" style={{ width: '100%' }} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nhập địa chỉ nhà / tỉnh thành của bạn..." />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          )}
        </div>
      </CustomerAccountLayout>

      <CustomerFooter />
    </div>
  );
}
