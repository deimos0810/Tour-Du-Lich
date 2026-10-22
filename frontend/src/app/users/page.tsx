'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, date } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import { KeyRound, Lock, UserPlus, Award, X } from 'lucide-react';

type UserAccount = {
  TaiKhoanID: number;
  Email: string;
  SoDienThoai: string | null;
  TrangThai: number;
  NgayTao: string;
  HoTen: string;
  VaiTro: string[];
  NhanVien?: {
    NhanVienID: number;
    ChucVu: string;
    HuongDanVien?: { HDVID: number; SoTheHDV: string; NgonNgu: string } | null;
  } | null;
  KhachHang?: { KhachHangID: number } | null;
};

type RoleInfo = {
  VaiTroID: number;
  TenVaiTro: string;
  MoTa: string | null;
  _count: { PhanQuyen: number };
};

const INITIAL_STAFF_FORM = {
  hoTen: '',
  email: '',
  phone: '',
  password: '',
  vaiTro: 'Dieu hanh',
  chucVu: '',
  soTheHDV: '',
  ngonNgu: 'Tiếng Việt, Tiếng Anh',
  kinhNghiem: '3 năm kinh nghiệm tour nội địa & quốc tế',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const usersApi = useApi<UserAccount[]>(
    `/users?search=${encodeURIComponent(search)}&role=${encodeURIComponent(roleFilter)}`
  );
  const rolesApi = useApi<RoleInfo[]>('/users/roles');

  // Modal thêm nhân viên mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffForm, setStaffForm] = useState(INITIAL_STAFF_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Modal phân quyền
  const [editingRoleUser, setEditingRoleUser] = useState<UserAccount | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Modal đặt lại mật khẩu
  const [resetPwUser, setResetPwUser] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleToggleStatus = async (u: UserAccount) => {
    if (u.TaiKhoanID === currentUser?.id) {
      alert('Bạn không thể tự khóa tài khoản của chính mình!');
      return;
    }
    const action = u.TrangThai === 1 ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn có chắc muốn ${action} tài khoản "${u.Email}"?`)) return;

    try {
      await api(`/users/${u.TaiKhoanID}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ actorId: currentUser?.id }),
      });
      void usersApi.reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể đổi trạng thái tài khoản'));
    }
  };

  const handleOpenRoleModal = (u: UserAccount) => {
    setEditingRoleUser(u);
    setSelectedRoles([...u.VaiTro]);
  };

  const handleSaveRoles = async () => {
    if (!editingRoleUser) return;
    if (selectedRoles.length === 0) {
      alert('Tài khoản phải có ít nhất 1 vai trò!');
      return;
    }

    try {
      await api(`/users/${editingRoleUser.TaiKhoanID}/roles`, {
        method: 'PATCH',
        body: JSON.stringify({ roles: selectedRoles, actorId: currentUser?.id }),
      });
      alert('Cập nhật vai trò thành công!');
      setEditingRoleUser(null);
      void usersApi.reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể cập nhật vai trò'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwUser || !newPassword) return;

    try {
      await api(`/users/${resetPwUser.TaiKhoanID}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ newPassword }),
      });
      alert(`Đã đặt lại mật khẩu cho ${resetPwUser.Email} thành công!`);
      setResetPwUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể đổi mật khẩu'));
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify(staffForm),
      });
      alert('Thêm tài khoản nhân viên thành công!');
      setShowAddModal(false);
      setStaffForm(INITIAL_STAFF_FORM);
      void usersApi.reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể tạo tài khoản'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản trị người dùng & Phân quyền</h1>
          <p className="page-desc">Quản lý tài khoản hệ thống, cấp quyền truy cập và bảo mật tài khoản</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Icon name="plus" size={14} /> Thêm nhân viên mới
        </button>
      </div>

      <ApiNotice error={usersApi.error} />

      <div className="card">
        <div className="toolbar">
          <input
            className="input"
            placeholder="Tìm theo họ tên, email hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Dieu hanh">Điều hành</option>
            <option value="Ke toan">Kế toán</option>
            <option value="HDV">Hướng dẫn viên (HDV)</option>
            <option value="Khach hang">Khách hàng</option>
          </select>
          <span className="count">{usersApi.data?.length ?? 0} tài khoản</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Họ tên & Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò (Quyền hạn)</th>
                <th>Chức danh / Ghi chú</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {usersApi.data?.length ? (
                usersApi.data.map((u) => {
                  const isCurrent = u.TaiKhoanID === currentUser?.id;
                  return (
                    <tr key={u.TaiKhoanID}>
                      <td>
                        <div className="cell-flex">
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: u.VaiTro.includes('Admin') ? '#FEF3C7' : '#EFF6FF',
                              color: u.VaiTro.includes('Admin') ? '#B45309' : '#0D6EFD',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 700,
                              fontSize: '13px',
                            }}
                          >
                            {u.HoTen.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="strong">
                              {u.HoTen} {isCurrent && <span style={{ color: '#0D6EFD', fontSize: '11px' }}>(Bạn)</span>}
                            </div>
                            <div className="sub">{u.Email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.SoDienThoai || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {u.VaiTro.map((r) => (
                            <span
                              key={r}
                              className={`badge ${
                                r === 'Admin'
                                  ? 'badge-warning'
                                  : r === 'Dieu hanh' || r === 'Ke toan'
                                  ? 'badge-info'
                                  : r === 'HDV'
                                  ? 'badge-success'
                                  : 'badge-muted'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="sub">
                          {u.NhanVien?.ChucVu || (u.KhachHang ? 'Khách du lịch' : '—')}
                          {u.NhanVien?.HuongDanVien && ` (Thẻ: ${u.NhanVien.HuongDanVien.SoTheHDV})`}
                        </div>
                      </td>
                      <td className="sub">{date(u.NgayTao)}</td>
                      <td>
                        {u.TrangThai === 1 ? (
                          <span className="badge badge-success">Hoạt động</span>
                        ) : (
                          <span className="badge badge-danger">Đã khóa</span>
                        )}
                      </td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenRoleModal(u)}
                            title="Phân quyền vai trò"
                          >
                            Quyền
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setResetPwUser(u);
                              setNewPassword('123456');
                            }}
                            title="Đặt lại mật khẩu"
                          >
                            Đổi MK
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleToggleStatus(u)}
                            style={{
                              color: u.TrangThai === 1 ? '#DC2626' : '#16A34A',
                              borderColor: u.TrangThai === 1 ? '#FCA5A5' : '#86EFAC',
                            }}
                            disabled={isCurrent}
                          >
                            {u.TrangThai === 1 ? 'Khóa' : 'Mở'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow cols={7} loading={usersApi.loading} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PHÂN QUYỀN VAI TRÒ */}
      {editingRoleUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setEditingRoleUser(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E4E4E7',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <KeyRound size={18} strokeWidth={1.5} style={{ color: '#09090B' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                Phân quyền cho: {editingRoleUser.HoTen}
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '16px' }}>
              Email: <strong>{editingRoleUser.Email}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {['Admin', 'Dieu hanh', 'Ke toan', 'HDV', 'Khach hang'].map((role) => {
                const checked = selectedRoles.includes(role);
                return (
                  <label
                    key={role}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: checked ? '1px solid #0D6EFD' : '1px solid #E2E8F0',
                      background: checked ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: checked ? 700 : 500,
                      fontSize: '13.5px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRoles([...selectedRoles, role]);
                        } else {
                          setSelectedRoles(selectedRoles.filter((r) => r !== role));
                        }
                      }}
                    />
                    <span>{role}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setEditingRoleUser(null)}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleSaveRoles}>
                Lưu vai trò
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐẶT LẠI MẬT KHẨU */}
      {resetPwUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setResetPwUser(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E4E4E7',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock size={18} strokeWidth={1.5} style={{ color: '#09090B' }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                Đặt lại mật khẩu
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748B', marginBottom: '16px' }}>
              Cấp mật khẩu mới cho tài khoản <strong>{resetPwUser.Email}</strong>
            </p>

            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Mật khẩu mới
                </label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%', fontWeight: 700 }}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setResetPwUser(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Xác nhận đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM TÀI KHOẢN NHÂN VIÊN MỚI */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E4E4E7',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} strokeWidth={1.5} style={{ color: '#09090B' }} />
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#09090B', margin: 0 }}>
                  Thêm tài khoản nhân viên mới
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowAddModal(false)}
                style={{ border: '1px solid #E4E4E7', background: '#FFFFFF', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Họ và tên nhân viên <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  required
                  placeholder="VD: Nguyễn Văn Bảo"
                  value={staffForm.hoTen}
                  onChange={(e) => setStaffForm({ ...staffForm, hoTen: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Email đăng nhập <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    placeholder="VD: bao.nv@viettour.vn"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Số điện thoại <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    required
                    placeholder="VD: 0988123456"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Mật khẩu khởi tạo <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="password"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    minLength={6}
                    placeholder="Ít nhất 6 ký tự"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Vai trò chính <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={staffForm.vaiTro}
                    onChange={(e) => setStaffForm({ ...staffForm, vaiTro: e.target.value })}
                  >
                    <option value="Dieu hanh">Điều hành tour</option>
                    <option value="Ke toan">Kế toán</option>
                    <option value="HDV">Hướng dẫn viên (HDV)</option>
                    <option value="Admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              {staffForm.vaiTro === 'HDV' && (
                <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#09090B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={15} strokeWidth={1.5} />
                    <span>Thông tin nghiệp vụ Hướng dẫn viên</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Số thẻ HDV <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        className="input"
                        style={{ width: '100%' }}
                        required
                        placeholder="VD: HDV-QT-2026-99"
                        value={staffForm.soTheHDV}
                        onChange={(e) => setStaffForm({ ...staffForm, soTheHDV: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Ngoại ngữ <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        className="input"
                        style={{ width: '100%' }}
                        required
                        value={staffForm.ngonNgu}
                        onChange={(e) => setStaffForm({ ...staffForm, ngonNgu: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
