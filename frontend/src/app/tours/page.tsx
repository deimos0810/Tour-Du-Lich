'use client';
import { useMemo, useState } from 'react';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, vnd } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Eye, Edit2, Trash2, X, MapPin, Calendar, Package } from 'lucide-react';

type Tour = {
  TourID: number;
  MaTour: string;
  TenTour: string;
  DiemKhoiHanh: string;
  DiemDen: string;
  ThoiGian: string;
  GiaNguoiLon: string;
  GiaTreEm: string;
  PhuThuPhongDon?: string;
  HinhAnhURL: string | null;
  PhongCachTour?: string | null;
  PhuongTien?: string | null;
  MoTaChiTiet?: string | null;
  LichTrinh?: string | null;
  DichVuDiKem?: string | null;
  TrangThaiDuyet: string;
  DanhMuc: { DanhMucID: number; TenDanhMuc: string };
};

type Category = { DanhMucID: number; TenDanhMuc: string };

const INITIAL_FORM = {
  TenTour: '',
  MaTour: '',
  DanhMucID: '1',
  ThoiGian: '3 ngày 2 đêm',
  DiemKhoiHanh: 'TP. Hồ Chí Minh',
  DiemDen: '',
  GiaNguoiLon: '',
  GiaTreEm: '',
  PhuThuPhongDon: '0',
  PhuongTien: 'Máy bay & Xe du lịch cao cấp',
  PhongCachTour: 'Nghỉ dưỡng',
  HinhAnhURL: '',
  MoTaChiTiet: '',
  LichTrinh: 'Ngày 1: Đón khách tại sân bay, tham quan điểm đầu tiên và nhận phòng khách sạn.\nNgày 2: Trải nghiệm ẩm thực địa phương, vui chơi giải trí và ngắm hoàng hôn.\nNgày 3: Mua sắm đặc sản, trả phòng và tiễn đoàn về điểm đón ban đầu.',
  DichVuDiKem: '• Vé máy bay khứ hồi theo lịch trình\n• Khách sạn tiêu chuẩn 4 - 5 sao (2 khách/phòng)\n• Các bữa ăn chính tiêu chuẩn cao cấp\n• Vé tham quan tất cả các điểm theo chương trình\n• Bảo hiểm du lịch trách nhiệm cao tới 100.000.000đ\n• Hướng dẫn viên suốt tuyến tận tâm',
  TrangThaiDuyet: 'Dang mo ban',
};

export default function ToursPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [danhMucId, setDanhMucId] = useState('');
  const [trangThai, setTrangThai] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [viewingTour, setViewingTour] = useState<Tour | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (danhMucId) p.set('danhMucId', danhMucId);
    if (trangThai) p.set('trangThai', trangThai);
    return `/tours?${p}`;
  }, [search, danhMucId, trangThai]);

  const tours = useApi<Tour[]>(query);
  const cats = useApi<Category[]>('/tours/categories');

  const openCreateModal = () => {
    setEditingTour(null);
    setFormData({
      ...INITIAL_FORM,
      DanhMucID: cats.data && cats.data.length > 0 ? String(cats.data[0].DanhMucID) : '1',
    });
    setShowModal(true);
  };

  const openEditModal = (t: Tour) => {
    setEditingTour(t);
    setFormData({
      TenTour: t.TenTour,
      MaTour: t.MaTour,
      DanhMucID: String(t.DanhMuc.DanhMucID),
      ThoiGian: t.ThoiGian,
      DiemKhoiHanh: t.DiemKhoiHanh || 'TP. Hồ Chí Minh',
      DiemDen: t.DiemDen,
      GiaNguoiLon: String(Math.round(Number(t.GiaNguoiLon))),
      GiaTreEm: String(Math.round(Number(t.GiaTreEm))),
      PhuThuPhongDon: String(Math.round(Number(t.PhuThuPhongDon || 0))),
      PhuongTien: t.PhuongTien || '',
      PhongCachTour: t.PhongCachTour || '',
      HinhAnhURL: t.HinhAnhURL || '',
      MoTaChiTiet: t.MoTaChiTiet || '',
      LichTrinh: t.LichTrinh || '',
      DichVuDiKem: t.DichVuDiKem || '',
      TrangThaiDuyet: t.TrangThaiDuyet,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TenTour.trim() || !formData.DiemDen.trim() || !formData.GiaNguoiLon) {
      alert('Vui lòng điền đầy đủ Tên tour, Điểm đến và Giá người lớn!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        TenTour: formData.TenTour.trim(),
        MaTour: formData.MaTour.trim() || undefined,
        DanhMucID: Number(formData.DanhMucID),
        ThoiGian: formData.ThoiGian.trim(),
        DiemKhoiHanh: formData.DiemKhoiHanh.trim(),
        DiemDen: formData.DiemDen.trim(),
        GiaNguoiLon: Number(formData.GiaNguoiLon),
        GiaTreEm: Number(formData.GiaTreEm || 0),
        PhuThuPhongDon: Number(formData.PhuThuPhongDon || 0),
        PhuongTien: formData.PhuongTien.trim() || null,
        PhongCachTour: formData.PhongCachTour.trim() || null,
        HinhAnhURL: formData.HinhAnhURL.trim() || null,
        MoTaChiTiet: formData.MoTaChiTiet.trim() || null,
        LichTrinh: formData.LichTrinh.trim() || null,
        DichVuDiKem: formData.DichVuDiKem.trim() || null,
        TrangThaiDuyet: formData.TrangThaiDuyet,
        NhanVienTaoID: user?.employeeId || 1,
      };

      if (editingTour) {
        await api(`/tours/${editingTour.TourID}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        alert('Cập nhật thông tin tour thành công!');
      } else {
        await api('/tours', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Tạo tour du lịch mới thành công!');
      }

      setShowModal(false);
      void tours.reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể lưu thông tin tour'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (t: Tour) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tour "${t.TenTour}" (Mã: ${t.MaTour})?`)) return;
    try {
      await api(`/tours/${t.TourID}`, { method: 'DELETE' });
      alert('Đã xóa tour thành công!');
      void tours.reload();
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa: tour đã có lịch khởi hành hoặc đơn hàng liên kết.');
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản lý tour du lịch</h1>
          <p className="page-desc">Chương trình tour, bảng giá người lớn/trẻ em, lịch trình và dịch vụ đi kèm</p>
        </div>
        <button className="btn btn-primary" id="btn-add-tour" onClick={openCreateModal}>
          <Plus size={14} strokeWidth={1.5} /> Thêm tour mới
        </button>
      </div>

      <ApiNotice error={tours.error} />

      <div className="card">
        <div className="toolbar">
          <input
            className="input"
            id="tour-search"
            placeholder="Tìm theo tên hoặc mã tour, điểm đến..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            id="tour-category"
            value={danhMucId}
            onChange={(e) => setDanhMucId(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {cats.data?.map((c) => (
              <option key={c.DanhMucID} value={c.DanhMucID}>
                {c.TenDanhMuc}
              </option>
            ))}
          </select>
          <select
            className="select"
            id="tour-status"
            value={trangThai}
            onChange={(e) => setTrangThai(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Dang mo ban">Đang mở bán</option>
            <option value="Dong ban">Tạm dừng (Đóng bán)</option>
            <option value="Cho duyet">Chờ duyệt</option>
            <option value="Nhap">Nháp</option>
          </select>
          <span className="count">{tours.data?.length ?? 0} tour</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>TOUR & MÃ</th>
                <th>DANH MỤC</th>
                <th>ĐIỂM ĐẾN</th>
                <th>THỜI GIAN</th>
                <th>GIÁ NL / TRẺ EM</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {tours.data?.length ? (
                tours.data.map((t) => (
                  <tr key={t.TourID}>
                    <td>
                      <div className="cell-flex">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {t.HinhAnhURL ? (
                          <img
                            className="thumb"
                            src={t.HinhAnhURL}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&auto=format&fit=crop&q=80';
                            }}
                          />
                        ) : (
                          <div className="thumb" />
                        )}
                        <div>
                          <div className="strong">{t.TenTour}</div>
                          <div className="code">{t.MaTour}</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.DanhMuc.TenDanhMuc}</td>
                    <td>
                      <div className="strong">{t.DiemDen}</div>
                      <div className="sub">Từ: {t.DiemKhoiHanh || 'TP.HCM'}</div>
                    </td>
                    <td>{t.ThoiGian}</td>
                    <td>
                      <div className="strong" style={{ color: '#0D6EFD' }}>
                        {vnd(t.GiaNguoiLon)}
                      </div>
                      <div className="sub">TE: {vnd(t.GiaTreEm)}</div>
                    </td>
                    <td>
                      <Status value={t.TrangThaiDuyet} />
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Xem chi tiết"
                          onClick={() => setViewingTour(t)}
                          style={{ padding: '5px 8px' }}
                        >
                          <Eye size={13} strokeWidth={1.5} />
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Chỉnh sửa tour"
                          onClick={() => openEditModal(t)}
                          style={{ padding: '5px 8px' }}
                        >
                          <Edit2 size={13} strokeWidth={1.5} />
                        </button>
                        <button
                          className="btn btn-danger-outline btn-sm"
                          title="Xóa tour"
                          onClick={() => remove(t)}
                          style={{ padding: '5px 8px' }}
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow cols={7} loading={tours.loading} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TẠO & CHỈNH SỬA TOUR DU LỊCH */}
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
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-md)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--zinc-900)', margin: 0 }}>
                  {editingTour ? `Cập nhật Tour #${editingTour.MaTour}` : 'Thêm Tour du lịch mới'}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Thiết lập thông tin hành trình, đơn giá và dịch vụ đi kèm
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowModal(false)}
                style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Tên chương trình tour <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    required
                    placeholder="VD: Tour Đà Nẵng - Bà Nà Hills - Phố Cổ Hội An 4N3Đ"
                    value={formData.TenTour}
                    onChange={(e) => setFormData({ ...formData, TenTour: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Mã tour (Tùy chọn)
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="Tự sinh nếu để trống"
                    value={formData.MaTour}
                    onChange={(e) => setFormData({ ...formData, MaTour: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Danh mục tour
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={formData.DanhMucID}
                    onChange={(e) => setFormData({ ...formData, DanhMucID: e.target.value })}
                  >
                    {cats.data?.map((c) => (
                      <option key={c.DanhMucID} value={c.DanhMucID}>
                        {c.TenDanhMuc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Thời gian
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="VD: 4 ngày 3 đêm"
                    value={formData.ThoiGian}
                    onChange={(e) => setFormData({ ...formData, ThoiGian: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Điểm khởi hành
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    value={formData.DiemKhoiHanh}
                    onChange={(e) => setFormData({ ...formData, DiemKhoiHanh: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Điểm đến <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    required
                    placeholder="VD: Đà Nẵng, Phú Quốc..."
                    value={formData.DiemDen}
                    onChange={(e) => setFormData({ ...formData, DiemDen: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#0D6EFD' }}>
                    Giá người lớn (VNĐ) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%', fontWeight: 700 }}
                    required
                    min="0"
                    placeholder="VD: 4500000"
                    value={formData.GiaNguoiLon}
                    onChange={(e) => setFormData({ ...formData, GiaNguoiLon: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Giá trẻ em (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    min="0"
                    placeholder="VD: 3200000"
                    value={formData.GiaTreEm}
                    onChange={(e) => setFormData({ ...formData, GiaTreEm: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Phụ thu phòng đơn (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    min="0"
                    placeholder="VD: 1200000"
                    value={formData.PhuThuPhongDon}
                    onChange={(e) => setFormData({ ...formData, PhuThuPhongDon: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Phương tiện di chuyển
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="VD: Máy bay & Xe ô tô đời mới"
                    value={formData.PhuongTien}
                    onChange={(e) => setFormData({ ...formData, PhuongTien: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Phong cách tour
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="VD: Nghỉ dưỡng biển, Mạo hiểm..."
                    value={formData.PhongCachTour}
                    onChange={(e) => setFormData({ ...formData, PhongCachTour: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Trạng thái duyệt
                  </label>
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={formData.TrangThaiDuyet}
                    onChange={(e) => setFormData({ ...formData, TrangThaiDuyet: e.target.value })}
                  >
                    <option value="Dang mo ban">Đang mở bán</option>
                    <option value="Dong ban">Tạm dừng (Đóng bán)</option>
                    <option value="Cho duyet">Chờ duyệt</option>
                    <option value="Nhap">Nháp</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  URL Ảnh đại diện Tour
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.HinhAnhURL}
                  onChange={(e) => setFormData({ ...formData, HinhAnhURL: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Lịch trình chi tiết từng ngày
                  </label>
                  <textarea
                    className="input"
                    rows={6}
                    style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                    placeholder="Ngày 1: ...&#10;Ngày 2: ...&#10;Ngày 3: ..."
                    value={formData.LichTrinh}
                    onChange={(e) => setFormData({ ...formData, LichTrinh: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Dịch vụ đi kèm (Bao gồm trong tour)
                  </label>
                  <textarea
                    className="input"
                    rows={6}
                    style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                    placeholder="• Vé máy bay khứ hồi&#10;• Khách sạn 4 sao&#10;• Bảo hiểm du lịch..."
                    value={formData.DichVuDiKem}
                    onChange={(e) => setFormData({ ...formData, DichVuDiKem: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Mô tả tổng quan tour
                </label>
                <textarea
                  className="input"
                  rows={3}
                  style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Giới thiệu nét độc đáo của tour du lịch..."
                  value={formData.MoTaChiTiet}
                  onChange={(e) => setFormData({ ...formData, MoTaChiTiet: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : editingTour ? 'Lưu thay đổi' : 'Tạo tour du lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT TOUR */}
      {viewingTour && (
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
          onClick={() => setViewingTour(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: 'var(--shadow-md)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '6px' }}>
                  {viewingTour.DanhMuc.TenDanhMuc}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--zinc-900)', margin: '4px 0' }}>
                  {viewingTour.TenTour}
                </h2>
                <div className="code">Mã tour: {viewingTour.MaTour}</div>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setViewingTour(null)}
                style={{ padding: '4px 8px' }}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>

            {viewingTour.HinhAnhURL && (
              <div style={{ borderRadius: '8px', overflow: 'hidden', height: '220px', marginBottom: '20px', background: '#F1F5F9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingTour.HinhAnhURL}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <div className="sub">Giá người lớn</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0D6EFD' }}>{vnd(viewingTour.GiaNguoiLon)}</div>
              </div>
              <div>
                <div className="sub">Giá trẻ em</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>{vnd(viewingTour.GiaTreEm)}</div>
              </div>
              <div>
                <div className="sub">Thời gian</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{viewingTour.ThoiGian}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tuyến đường & Phương tiện:</h3>
              <p style={{ fontSize: '13px', color: 'var(--zinc-700)', margin: 0 }}>
                Khởi hành từ <strong>{viewingTour.DiemKhoiHanh || 'TP.HCM'}</strong> đến <strong>{viewingTour.DiemDen}</strong> bằng {viewingTour.PhuongTien || 'Ô tô/Máy bay'}.
              </p>
            </div>

            {viewingTour.LichTrinh && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lịch trình chi tiết:</h3>
                <div style={{ fontSize: '12.5px', color: 'var(--zinc-700)', whiteSpace: 'pre-line', background: 'var(--zinc-50)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  {viewingTour.LichTrinh}
                </div>
              </div>
            )}

            {viewingTour.DichVuDiKem && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dịch vụ đi kèm:</h3>
                <div style={{ fontSize: '12.5px', color: 'var(--zinc-700)', whiteSpace: 'pre-line', background: 'var(--zinc-50)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  {viewingTour.DichVuDiKem}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  const t = viewingTour;
                  setViewingTour(null);
                  openEditModal(t);
                }}
              >
                Chỉnh sửa tour này
              </button>
              <button className="btn btn-primary" onClick={() => setViewingTour(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
