'use client';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, date, vnd } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';

type Departure = {
  LichID: number;
  MaLich: string;
  NgayKhoiHanh: string;
  NgayKetThuc: string;
  SoChoToiDa: number;
  SoChoDaDat: number;
  GiaTourKhuyenMai?: string | null;
  TrangThai: string;
  Tour: { TourID: number; MaTour: string; TenTour: string; GiaNguoiLon: string };
  DieuPhoiTour: {
    DieuPhoiID: number;
    TrangThai: string;
    HuongDanVien: { HDVID: number; SoTheHDV: string; NhanVien: { HoTen: string; SoDienThoai: string } };
  }[];
};

type GuideAvailable = {
  HDVID: number;
  SoTheHDV: string;
  TrangThai: string;
  NhanVien: { HoTen: string; SoDienThoai: string };
  assignedHere: boolean;
  conflicts: string[];
  available: boolean;
};

type TourSimple = { TourID: number; MaTour: string; TenTour: string; GiaNguoiLon: string };

export default function DeparturesPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<Departure[]>('/departures');
  const toursApi = useApi<TourSimple[]>('/tours');

  // Modal mở đợt khởi hành mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    TourID: '',
    NgayKhoiHanh: '',
    NgayKetThuc: '',
    SoChoToiDa: '30',
    GiaTourKhuyenMai: '',
    MaLich: '',
  });

  // Modal phân công HDV
  const [assigningLich, setAssigningLich] = useState<Departure | null>(null);
  const [availableGuides, setAvailableGuides] = useState<GuideAvailable[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [selectedHdvId, setSelectedHdvId] = useState<number | null>(null);
  const [assignNote, setAssignNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const returnDay = new Date(tomorrow);
    returnDay.setDate(returnDay.getDate() + 3);

    setCreateForm({
      TourID: toursApi.data && toursApi.data.length > 0 ? String(toursApi.data[0].TourID) : '',
      NgayKhoiHanh: tomorrow.toISOString().slice(0, 16),
      NgayKetThuc: returnDay.toISOString().slice(0, 16),
      SoChoToiDa: '30',
      GiaTourKhuyenMai: '',
      MaLich: '',
    });
    setShowCreateModal(true);
  };

  const handleCreateDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.TourID || !createForm.NgayKhoiHanh || !createForm.NgayKetThuc) {
      alert('Vui lòng chọn Tour và thời gian khởi hành!');
      return;
    }

    setSubmitting(true);
    try {
      await api('/departures/create', {
        method: 'POST',
        body: JSON.stringify({
          TourID: Number(createForm.TourID),
          NgayKhoiHanh: createForm.NgayKhoiHanh,
          NgayKetThuc: createForm.NgayKetThuc,
          SoChoToiDa: Number(createForm.SoChoToiDa),
          GiaTourKhuyenMai: createForm.GiaTourKhuyenMai ? Number(createForm.GiaTourKhuyenMai) : null,
          MaLich: createForm.MaLich.trim() || undefined,
        }),
      });
      alert('Tạo lịch khởi hành mới thành công!');
      setShowCreateModal(false);
      void reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể tạo lịch khởi hành'));
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = async (d: Departure) => {
    setAssigningLich(d);
    setSelectedHdvId(null);
    setAssignNote('');
    setLoadingGuides(true);
    try {
      const res = await api<GuideAvailable[]>(`/departures/${d.LichID}/available-guides`);
      setAvailableGuides(res);
      const firstAvailable = res.find((g) => g.available);
      if (firstAvailable) setSelectedHdvId(firstAvailable.HDVID);
    } catch (err: any) {
      alert('Không thể tải danh sách HDV: ' + (err?.message || 'Lỗi mạng'));
    } finally {
      setLoadingGuides(false);
    }
  };

  const handleAssignGuide = async () => {
    if (!assigningLich || !selectedHdvId) {
      alert('Vui lòng chọn một Hướng dẫn viên!');
      return;
    }

    setSubmitting(true);
    try {
      await api(`/departures/${assigningLich.LichID}/assign-guide`, {
        method: 'POST',
        body: JSON.stringify({
          HDVID: selectedHdvId,
          NhanVienID: user?.employeeId || 1,
          GhiChu: assignNote.trim() || undefined,
        }),
      });
      alert('Phân công Hướng dẫn viên thành công!');
      setAssigningLich(null);
      void reload();
    } catch (err: any) {
      alert('Lỗi phân công: ' + (err?.message || 'Thao tác thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (d: Departure, newStatus: string) => {
    if (!confirm(`Chuyển trạng thái chuyến "${d.MaLich}" sang "${newStatus}"?`)) return;
    try {
      await api(`/departures/${d.LichID}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ TrangThai: newStatus }),
      });
      alert('Đã cập nhật trạng thái chuyến đi!');
      void reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể cập nhật'));
    }
  };

  const handleUnassign = async (dieuPhoiId: number) => {
    if (!confirm('Hủy phân công HDV này khỏi chuyến đi?')) return;
    try {
      await api(`/assignments/${dieuPhoiId}`, { method: 'DELETE' });
      alert('Đã gỡ phân công HDV!');
      void reload();
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Thao tác thất bại'));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản lý Lịch khởi hành</h1>
          <p className="page-desc">Theo dõi từng chuyến đi, tình trạng giữ chỗ và phân công Hướng dẫn viên dẫn đoàn</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Icon name="plus" size={14} /> Mở đợt khởi hành mới
        </button>
      </div>

      <ApiNotice error={error} />

      <div className="card">
        <div className="toolbar">
          <span className="strong">Danh sách các đợt khởi hành</span>
          <span className="count">{data?.length ?? 0} chuyến</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Mã chuyến</th>
                <th>Tour du lịch</th>
                <th>Thời gian đi - về</th>
                <th>HDV phụ trách</th>
                <th>Số chỗ (Đã đặt / Tối đa)</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? (
                data.map((d) => {
                  const full = d.SoChoDaDat >= d.SoChoToiDa;
                  const guides = d.DieuPhoiTour || [];
                  return (
                    <tr key={d.LichID}>
                      <td className="code">{d.MaLich}</td>
                      <td>
                        <div className="strong">{d.Tour.TenTour}</div>
                        <div className="sub">
                          Mã tour: {d.Tour.MaTour}
                          {d.GiaTourKhuyenMai && (
                            <span style={{ color: '#DC2626', fontWeight: 700, marginLeft: '6px' }}>
                              (Ưu đãi: {vnd(d.GiaTourKhuyenMai)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                          {date(d.NgayKhoiHanh)} → {date(d.NgayKetThuc)}
                        </div>
                      </td>
                      <td>
                        {guides.length > 0 ? (
                          guides.map((g) => (
                            <div key={g.DieuPhoiID} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ fontWeight: 600, color: '#0F172A' }}>
                                👤 {g.HuongDanVien.NhanVien.HoTen}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748B' }}>
                                ({g.HuongDanVien.NhanVien.SoDienThoai})
                              </span>
                              <button
                                style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', fontSize: '11px' }}
                                title="Gỡ phân công"
                                onClick={() => handleUnassign(g.DieuPhoiID)}
                              >
                                ✕
                              </button>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#B45309', fontSize: '12.5px', fontWeight: 600 }}>
                            ⚠️ Chưa gán HDV
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="sub" style={{ fontWeight: 600 }}>
                          {d.SoChoDaDat} / {d.SoChoToiDa} chỗ
                        </div>
                        <div className="progress">
                          <span
                            style={{
                              width: `${Math.min((d.SoChoDaDat / d.SoChoToiDa) * 100, 100)}%`,
                              background: full ? '#DC2626' : '#0D6EFD',
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        {full && d.TrangThai === 'Cho khoi hanh' ? (
                          <span className="badge badge-warning">Đã đủ chỗ</span>
                        ) : (
                          <Status value={d.TrangThai} />
                        )}
                      </td>
                      <td>
                        <div className="actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openAssignModal(d)}
                            title="Phân công HDV"
                            style={{ fontWeight: 600 }}
                          >
                            + Gán HDV
                          </button>

                          {d.TrangThai === 'Cho khoi hanh' && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleUpdateStatus(d, 'Dang di')}
                              title="Khởi hành tour"
                              style={{ color: '#0D6EFD' }}
                            >
                              Khởi hành
                            </button>
                          )}

                          {d.TrangThai === 'Dang di' && (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleUpdateStatus(d, 'Hoan thanh')}
                              title="Kết thúc tour"
                              style={{ color: '#16A34A' }}
                            >
                              Hoàn thành
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow cols={7} loading={loading} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MỞ ĐỢT KHỞI HÀNH MỚI */}
      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                🗓️ Mở đợt khởi hành mới
              </h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeparture}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Chọn chương trình Tour <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  required
                  value={createForm.TourID}
                  onChange={(e) => setCreateForm({ ...createForm, TourID: e.target.value })}
                >
                  <option value="">-- Chọn Tour du lịch --</option>
                  {toursApi.data?.map((t) => (
                    <option key={t.TourID} value={t.TourID}>
                      {t.TenTour} ({t.MaTour}) — Giá: {vnd(t.GiaNguoiLon)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Ngày & giờ khởi hành <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    value={createForm.NgayKhoiHanh}
                    onChange={(e) => setCreateForm({ ...createForm, NgayKhoiHanh: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Ngày & giờ kết thúc <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    value={createForm.NgayKetThuc}
                    onChange={(e) => setCreateForm({ ...createForm, NgayKetThuc: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Số chỗ tối đa <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    required
                    min="1"
                    max="100"
                    value={createForm.SoChoToiDa}
                    onChange={(e) => setCreateForm({ ...createForm, SoChoToiDa: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Giá ưu đãi đợt này (VNĐ)
                  </label>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="Bỏ trống nếu giữ giá gốc"
                    value={createForm.GiaTourKhuyenMai}
                    onChange={(e) => setCreateForm({ ...createForm, GiaTourKhuyenMai: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                  Mã đợt khởi hành (Tùy chọn)
                </label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  placeholder="Hệ thống tự sinh nếu để trống (VD: LICH-DN-2026)"
                  value={createForm.MaLich}
                  onChange={(e) => setCreateForm({ ...createForm, MaLich: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo đợt khởi hành'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PHÂN CÔNG HƯỚNG DẪN VIÊN */}
      {assigningLich && (
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
          onClick={() => setAssigningLich(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  🚩 Phân công Hướng dẫn viên
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '2px 0 0' }}>
                  Chuyến đi: <strong>{assigningLich.Tour.TenTour}</strong> ({assigningLich.MaLich})
                </p>
                <p style={{ fontSize: '12px', color: '#0D6EFD', margin: '2px 0 0' }}>
                  Thời gian: {date(assigningLich.NgayKhoiHanh)} → {date(assigningLich.NgayKetThuc)}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setAssigningLich(null)}
                style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            {loadingGuides ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                Đang kiểm tra lịch làm việc của các HDV...
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                  Chọn Hướng dẫn viên đủ điều kiện:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {availableGuides.map((g) => {
                    const isSelected = selectedHdvId === g.HDVID;
                    const disabled = !g.available;
                    return (
                      <label
                        key={g.HDVID}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #0D6EFD' : '1px solid #E2E8F0',
                          background: disabled ? '#F8FAFC' : isSelected ? '#EFF6FF' : '#FFFFFF',
                          opacity: disabled ? 0.6 : 1,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="radio"
                            name="selectedGuide"
                            disabled={disabled}
                            checked={isSelected}
                            onChange={() => setSelectedHdvId(g.HDVID)}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                              {g.NhanVien.HoTen} — {g.SoTheHDV}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                              SĐT: {g.NhanVien.SoDienThoai} · Trạng thái: {g.TrangThai}
                            </div>
                          </div>
                        </div>

                        <div>
                          {g.assignedHere ? (
                            <span className="badge badge-info">Đã gán chuyến này</span>
                          ) : g.conflicts.length > 0 ? (
                            <span className="badge badge-danger">Trùng: {g.conflicts.join(', ')}</span>
                          ) : g.available ? (
                            <span className="badge badge-success">Sẵn sàng nhận đoàn</span>
                          ) : (
                            <span className="badge badge-muted">Không khả dụng</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                    Ghi chú bàn giao công việc
                  </label>
                  <input
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="VD: Trưởng đoàn kiêm quản lý xe vận chuyển..."
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setAssigningLich(null)}>
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!selectedHdvId || submitting}
                    onClick={handleAssignGuide}
                  >
                    {submitting ? 'Đang phân công...' : 'Xác nhận phân công HDV'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
