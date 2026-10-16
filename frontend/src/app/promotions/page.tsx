'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, date, vnd } from '@/lib/ui';

type Promotion = {
  KhuyenMaiID: number;
  MaKhuyenMai: string;
  TenChuongTrinh: string;
  PhanTramGiam: string;
  GiamToiDa: string;
  GiaTriDonToiThieu: string;
  NgayBatDau: string;
  NgayKetThucKM: string;
  TrangThai: number;
  _count?: { DonDatTour: number };
};

const INITIAL_FORM = {
  MaKhuyenMai: '',
  TenChuongTrinh: '',
  PhanTramGiam: '10',
  GiamToiDa: '1000000',
  GiaTriDonToiThieu: '3000000',
  NgayBatDau: new Date().toISOString().slice(0, 10),
  NgayKetThucKM: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
  TrangThai: 1,
};

export default function PromotionsPage() {
  const { data, error, loading, reload } = useApi<Promotion[]>('/promotions');
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData(INITIAL_FORM);
    setShowModal(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setFormData({
      MaKhuyenMai: p.MaKhuyenMai,
      TenChuongTrinh: p.TenChuongTrinh,
      PhanTramGiam: String(Math.round(Number(p.PhanTramGiam))),
      GiamToiDa: String(Math.round(Number(p.GiamToiDa))),
      GiaTriDonToiThieu: String(Math.round(Number(p.GiaTriDonToiThieu))),
      NgayBatDau: p.NgayBatDau.slice(0, 10),
      NgayKetThucKM: p.NgayKetThucKM.slice(0, 10),
      TrangThai: p.TrangThai,
    });
    setShowModal(true);
  };

  const handleToggle = async (p: Promotion) => {
    try {
      await api(`/promotions/${p.KhuyenMaiID}/toggle`, { method: 'PATCH' });
      void reload();
    } catch (err: any) {
      alert(err?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleDelete = async (p: Promotion) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã "${p.MaKhuyenMai}"?`)) return;
    try {
      await api(`/promotions/${p.KhuyenMaiID}`, { method: 'DELETE' });
      alert('Đã xóa mã khuyến mãi thành công!');
      void reload();
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa mã khuyến mãi này');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.MaKhuyenMai.trim() || !formData.TenChuongTrinh.trim()) {
      alert('Vui lòng nhập Mã khuyến mãi và Tên chương trình!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        MaKhuyenMai: formData.MaKhuyenMai.trim().toUpperCase(),
        TenChuongTrinh: formData.TenChuongTrinh.trim(),
        PhanTramGiam: Number(formData.PhanTramGiam),
        GiamToiDa: Number(formData.GiamToiDa),
        GiaTriDonToiThieu: Number(formData.GiaTriDonToiThieu),
        NgayBatDau: formData.NgayBatDau,
        NgayKetThucKM: formData.NgayKetThucKM,
        TrangThai: Number(formData.TrangThai),
      };

      if (editingPromo) {
        await api(`/promotions/${editingPromo.KhuyenMaiID}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        alert('Cập nhật khuyến mãi thành công!');
      } else {
        await api('/promotions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Tạo mã khuyến mãi mới thành công!');
      }

      setShowModal(false);
      void reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Thao tác thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản lý Khuyến mãi & Voucher</h1>
          <p className="page-desc">Chương trình ưu đãi, mã giảm giá booking tour du lịch và thời hạn áp dụng</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Icon name="plus" size={14} /> Thêm mã voucher mới
        </button>
      </div>

      <ApiNotice error={error} />

      <div className="card">
        <div className="toolbar">
          <span className="strong">Danh sách chương trình khuyến mãi</span>
          <span className="count">{data?.length ?? 0} mã</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Mã voucher</th>
                <th>Tên chương trình</th>
                <th>Mức giảm giá</th>
                <th>Giảm tối đa</th>
                <th>Đơn tối thiểu</th>
                <th>Thời gian áp dụng</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? (
                data.map((p) => {
                  const now = new Date();
                  const isExpired = now > new Date(p.NgayKetThucKM);
                  return (
                    <tr key={p.KhuyenMaiID}>
                      <td>
                        <span
                          style={{
                            background: '#EFF6FF',
                            color: '#0D6EFD',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '13px',
                            letterSpacing: '1px',
                            border: '1px dashed #BFDBFE',
                          }}
                        >
                          {p.MaKhuyenMai}
                        </span>
                      </td>
                      <td className="strong">{p.TenChuongTrinh}</td>
                      <td>
                        <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '14px' }}>
                          -{Number(p.PhanTramGiam)}%
                        </span>
                      </td>
                      <td>{vnd(p.GiamToiDa)}</td>
                      <td className="sub">{vnd(p.GiaTriDonToiThieu)}</td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          {date(p.NgayBatDau)} → {date(p.NgayKetThucKM)}
                        </div>
                        {isExpired && (
                          <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600 }}>
                            Hết hạn
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-info">
                          {p._count?.DonDatTour || 0} đơn
                        </span>
                      </td>
                      <td>
                        {p.TrangThai === 1 ? (
                          <span className="badge badge-success">Đang áp dụng</span>
                        ) : (
                          <span className="badge badge-muted">Tạm dừng</span>
                        )}
                      </td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleToggle(p)}
                            title={p.TrangThai === 1 ? 'Tạm dừng mã' : 'Kích hoạt mã'}
                          >
                            {p.TrangThai === 1 ? 'Tắt' : 'Bật'}
                          </button>
                          <button
                            className="icon-btn"
                            title="Chỉnh sửa"
                            onClick={() => openEditModal(p)}
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            className="icon-btn"
                            title="Xóa mã"
                            style={{ color: '#DC2626' }}
                            onClick={() => handleDelete(p)}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow cols={9} loading={loading} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA KHUYẾN MÃI */}
      {showModal && (
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {editingPromo ? '✏️ Cập nhật mã khuyến mãi' : '🎁 Thêm chương trình khuyến mãi mới'}
              </h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowModal(false)}
                style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Mã Voucher <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%', textTransform: 'uppercase', fontWeight: 800 }}
                    required
                    placeholder="VD: HE2026"
                    value={formData.MaKhuyenMai}
                    onChange={(e) => setFormData({ ...formData, MaKhuyenMai: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Tên chương trình ưu đãi <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    required
                    placeholder="VD: Khuyến mãi Chào Hè Rực Rỡ 2026"
                    value={formData.TenChuongTrinh}
                    onChange={(e) => setFormData({ ...formData, TenChuongTrinh: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#DC2626' }}>
                    % Giảm giá <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%', fontWeight: 700 }}
                    required
                    min="1"
                    max="100"
                    placeholder="VD: 10"
                    value={formData.PhanTramGiam}
                    onChange={(e) => setFormData({ ...formData, PhanTramGiam: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    min="0"
                    placeholder="VD: 1000000"
                    value={formData.GiamToiDa}
                    onChange={(e) => setFormData({ ...formData, GiamToiDa: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    min="0"
                    placeholder="VD: 3000000"
                    value={formData.GiaTriDonToiThieu}
                    onChange={(e) => setFormData({ ...formData, GiaTriDonToiThieu: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Ngày bắt đầu <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    value={formData.NgayBatDau}
                    onChange={(e) => setFormData({ ...formData, NgayBatDau: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Ngày kết thúc (Hết hạn) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    value={formData.NgayKetThucKM}
                    onChange={(e) => setFormData({ ...formData, NgayKetThucKM: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : editingPromo ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
