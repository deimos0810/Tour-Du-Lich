'use client';
import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, date, vnd } from '@/lib/ui';
import {
  Tag,
  Ticket,
  Mail,
  Plus,
  Send,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  Search,
  Filter,
  Check,
} from 'lucide-react';

/* =============================================================================
 * TYPES
 * ===========================================================================*/
type TourRef = {
  TourID: number;
  MaTour: string;
  TenTour: string;
  GiaNguoiLon: number | string;
  TrangThaiDuyet?: string;
};

type CTKM = {
  CTKMID: number;
  TenChuongTrinh: string;
  MoTa?: string | null;
  PhanTramGiam: number | string;
  NgayBatDau: string;
  NgayKetThuc: string;
  TrangThai: number;
  TrangThaiHienThi?: 'Tam dung' | 'Sap dien ra' | 'Dang dien ra' | 'Het han';
  NhanVienTao?: { HoTen: string };
  ApDung?: Array<{ Tour: TourRef }>;
  _count?: { DonDatTour: number };
};

type Voucher = {
  VoucherID: number;
  MaVoucher: string;
  TenChuongTrinh: string;
  PhanTramGiam: number | string;
  GiamToiDa: number | string;
  GiaTriDonToiThieu: number | string;
  SoLuongToiDa?: number | null;
  NgayBatDau: string;
  NgayKetThuc: string;
  TrangThai: number;
  ApDungVoucher?: Array<{ Tour: { TourID: number; TenTour: string } }>;
  _count?: { DonDatTour: number };
};

type Subscriber = {
  DangKyID: number;
  Email: string;
  TrangThai: number;
  NguonDangKy: string;
  NgayDangKy: string;
  NgayHuy?: string | null;
};

type MailLog = {
  NhatKyID: number;
  LoaiMail: string;
  EmailNhan: string;
  TieuDe: string;
  TrangThai: 'Thanh cong' | 'That bai' | 'Bo qua';
  ChiTietLoi?: string | null;
  ThamChieu?: string | null;
  NgayGui: string;
};

type NewsletterOverview = {
  subscribers: { dangNhan: number; daHuy: number };
  mail30Ngay: { thanhCong: number; thatBai: number; boQua: number };
  flows: Array<{
    ma: string;
    ten: string;
    suKien: string;
    nguoiNhan: string;
    loai: string;
    cachGui: string;
    chongTrung: string;
    daGui30Ngay: number;
  }>;
};

/* =============================================================================
 * MAIN COMPONENT
 * ===========================================================================*/
export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<'PROMO' | 'VOUCHER' | 'NEWSLETTER'>('PROMO');

  // APIs
  const promoApi = useApi<CTKM[]>('/promotions');
  const voucherApi = useApi<Voucher[]>('/vouchers');
  const toursApi = useApi<TourRef[]>('/tours');
  const subsApi = useApi<Subscriber[]>('/notifications/subscribers');
  const logsApi = useApi<MailLog[]>('/notifications/logs?limit=50');
  const overviewApi = useApi<NewsletterOverview>('/notifications/overview');

  // Modal CTKM
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<CTKM | null>(null);
  const [promoForm, setPromoForm] = useState({
    TenChuongTrinh: '',
    MoTa: '',
    PhanTramGiam: '15',
    NgayBatDau: new Date().toISOString().slice(0, 16),
    NgayKetThuc: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16),
    TrangThai: 1,
    tourIds: [] as number[],
    guiThongBao: true,
  });

  // Modal Voucher
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [voucherForm, setVoucherForm] = useState({
    MaVoucher: '',
    TenChuongTrinh: '',
    PhanTramGiam: '10',
    GiamToiDa: '1000000',
    GiaTriDonToiThieu: '3000000',
    SoLuongToiDa: '',
    NgayBatDau: new Date().toISOString().slice(0, 10),
    NgayKetThuc: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    TrangThai: 1,
    guiThongBao: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [broadcastingId, setBroadcastingId] = useState<number | null>(null);
  const [searchPromo, setSearchPromo] = useState('');
  const [searchVoucher, setSearchVoucher] = useState('');

  // ---------------------------------------------------------------------------
  // CTKM HANDLERS
  // ---------------------------------------------------------------------------
  const openCreatePromo = () => {
    setEditingPromo(null);
    setPromoForm({
      TenChuongTrinh: '',
      MoTa: '',
      PhanTramGiam: '15',
      NgayBatDau: new Date().toISOString().slice(0, 16),
      NgayKetThuc: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      TrangThai: 1,
      tourIds: toursApi.data?.slice(0, 3).map((t) => t.TourID) || [],
      guiThongBao: true,
    });
    setShowPromoModal(true);
  };

  const openEditPromo = (p: CTKM) => {
    setEditingPromo(p);
    setPromoForm({
      TenChuongTrinh: p.TenChuongTrinh,
      MoTa: p.MoTa || '',
      PhanTramGiam: String(Math.round(Number(p.PhanTramGiam))),
      NgayBatDau: new Date(p.NgayBatDau).toISOString().slice(0, 16),
      NgayKetThuc: new Date(p.NgayKetThuc).toISOString().slice(0, 16),
      TrangThai: p.TrangThai,
      tourIds: p.ApDung?.map((a) => a.Tour.TourID) || [],
      guiThongBao: false,
    });
    setShowPromoModal(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.TenChuongTrinh.trim()) return alert('Vui lòng nhập tên chương trình');
    if (promoForm.tourIds.length === 0) return alert('Vui lòng chọn ít nhất 1 tour áp dụng');
    setSubmitting(true);
    try {
      const payload = {
        TenChuongTrinh: promoForm.TenChuongTrinh.trim(),
        MoTa: promoForm.MoTa.trim() || null,
        PhanTramGiam: Number(promoForm.PhanTramGiam),
        NgayBatDau: promoForm.NgayBatDau,
        NgayKetThuc: promoForm.NgayKetThuc,
        TrangThai: promoForm.TrangThai,
        tourIds: promoForm.tourIds,
        guiThongBao: promoForm.guiThongBao,
      };
      if (editingPromo) {
        await api(`/promotions/${editingPromo.CTKMID}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/promotions', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowPromoModal(false);
      void promoApi.reload();
      void logsApi.reload();
      void overviewApi.reload();
      alert(
        editingPromo
          ? 'Cập nhật khuyến mãi tour thành công!'
          : promoForm.guiThongBao
          ? 'Tạo khuyến mãi tour thành công & đã tự động phát email thông báo tới toàn bộ khách hàng đăng ký nhận tin!'
          : 'Tạo khuyến mãi tour thành công!'
      );
    } catch (err: any) {
      alert(err?.message || 'Lỗi lưu khuyến mãi tour');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePromo = async (p: CTKM) => {
    try {
      await api(`/promotions/${p.CTKMID}/toggle`, { method: 'PATCH' });
      void promoApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleDeletePromo = async (p: CTKM) => {
    if (!confirm(`Bạn có chắc muốn xóa khuyến mãi "${p.TenChuongTrinh}"?`)) return;
    try {
      await api(`/promotions/${p.CTKMID}`, { method: 'DELETE' });
      void promoApi.reload();
      alert('Đã xóa chương trình khuyến mãi');
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa');
    }
  };

  const handleBroadcastPromo = async (p: CTKM) => {
    if (!confirm(`Gửi email thông báo khuyến mãi "${p.TenChuongTrinh}" (-${p.PhanTramGiam}%) đến tất cả khách hàng đăng ký nhận tin?`)) return;
    setBroadcastingId(p.CTKMID);
    try {
      const res = await api<{ tongNguoiNhan: number; thanhCong: number; thatBai: number; daGuiTruocDo: number }>(
        `/notifications/broadcast/promotion/${p.CTKMID}`,
        { method: 'POST' }
      );
      alert(`Đã gửi thành công ${res.thanhCong}/${res.tongNguoiNhan} email! (${res.daGuiTruocDo} email đã nhận trước đó).`);
      void logsApi.reload();
      void overviewApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Lỗi gửi bản tin');
    } finally {
      setBroadcastingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // VOUCHER HANDLERS
  // ---------------------------------------------------------------------------
  const openCreateVoucher = () => {
    setEditingVoucher(null);
    setVoucherForm({
      MaVoucher: '',
      TenChuongTrinh: '',
      PhanTramGiam: '10',
      GiamToiDa: '1000000',
      GiaTriDonToiThieu: '3000000',
      SoLuongToiDa: '100',
      NgayBatDau: new Date().toISOString().slice(0, 10),
      NgayKetThuc: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      TrangThai: 1,
      guiThongBao: true,
    });
    setShowVoucherModal(true);
  };

  const openEditVoucher = (v: Voucher) => {
    setEditingVoucher(v);
    setVoucherForm({
      MaVoucher: v.MaVoucher,
      TenChuongTrinh: v.TenChuongTrinh,
      PhanTramGiam: String(Math.round(Number(v.PhanTramGiam))),
      GiamToiDa: String(Math.round(Number(v.GiamToiDa))),
      GiaTriDonToiThieu: String(Math.round(Number(v.GiaTriDonToiThieu))),
      SoLuongToiDa: v.SoLuongToiDa ? String(v.SoLuongToiDa) : '',
      NgayBatDau: v.NgayBatDau.slice(0, 10),
      NgayKetThuc: v.NgayKetThuc.slice(0, 10),
      TrangThai: v.TrangThai,
      guiThongBao: false,
    });
    setShowVoucherModal(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherForm.MaVoucher.trim() || !voucherForm.TenChuongTrinh.trim()) {
      return alert('Vui lòng nhập Mã voucher và Tên chương trình');
    }
    setSubmitting(true);
    try {
      const payload = {
        MaVoucher: voucherForm.MaVoucher.trim().toUpperCase(),
        TenChuongTrinh: voucherForm.TenChuongTrinh.trim(),
        PhanTramGiam: Number(voucherForm.PhanTramGiam),
        GiamToiDa: Number(voucherForm.GiamToiDa),
        GiaTriDonToiThieu: Number(voucherForm.GiaTriDonToiThieu),
        SoLuongToiDa: voucherForm.SoLuongToiDa ? Number(voucherForm.SoLuongToiDa) : null,
        NgayBatDau: voucherForm.NgayBatDau,
        NgayKetThuc: voucherForm.NgayKetThuc,
        TrangThai: voucherForm.TrangThai,
        guiThongBao: voucherForm.guiThongBao,
      };
      if (editingVoucher) {
        await api(`/vouchers/${editingVoucher.VoucherID}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/vouchers', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowVoucherModal(false);
      void voucherApi.reload();
      void logsApi.reload();
      void overviewApi.reload();
      alert(
        editingVoucher
          ? 'Cập nhật mã voucher thành công!'
          : voucherForm.guiThongBao
          ? 'Tạo mã voucher thành công & đã tự động gửi email thông báo tới toàn bộ khách hàng đăng ký nhận tin!'
          : 'Tạo mã voucher thành công!'
      );
    } catch (err: any) {
      alert(err?.message || 'Lỗi lưu mã voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVoucher = async (v: Voucher) => {
    try {
      await api(`/vouchers/${v.VoucherID}/toggle`, { method: 'PATCH' });
      void voucherApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleDeleteVoucher = async (v: Voucher) => {
    if (!confirm(`Bạn có chắc muốn xóa mã voucher "${v.MaVoucher}"?`)) return;
    try {
      await api(`/vouchers/${v.VoucherID}`, { method: 'DELETE' });
      void voucherApi.reload();
      alert('Đã xóa mã voucher');
    } catch (err: any) {
      alert(err?.message || 'Không thể xóa');
    }
  };

  const handleBroadcastVoucher = async (v: Voucher) => {
    if (!confirm(`Gửi mã voucher "${v.MaVoucher}" (-${v.PhanTramGiam}%) đến tất cả khách hàng đăng ký nhận tin?`)) return;
    setBroadcastingId(v.VoucherID);
    try {
      const res = await api<{ tongNguoiNhan: number; thanhCong: number; thatBai: number; daGuiTruocDo: number }>(
        `/notifications/broadcast/voucher/${v.VoucherID}`,
        { method: 'POST' }
      );
      alert(`Đã gửi thành công ${res.thanhCong}/${res.tongNguoiNhan} email! (${res.daGuiTruocDo} email đã nhận trước đó).`);
      void logsApi.reload();
      void overviewApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Lỗi gửi voucher');
    } finally {
      setBroadcastingId(null);
    }
  };

  const handleToggleSubscriber = async (s: Subscriber) => {
    try {
      await api(`/notifications/subscribers/${s.DangKyID}/toggle`, { method: 'PATCH' });
      void subsApi.reload();
      void overviewApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Lỗi cập nhật người đăng ký');
    }
  };

  // Filtered lists
  const filteredPromos = (promoApi.data || []).filter((p) =>
    searchPromo ? p.TenChuongTrinh.toLowerCase().includes(searchPromo.toLowerCase()) : true
  );
  const filteredVouchers = (voucherApi.data || []).filter((v) =>
    searchVoucher
      ? v.MaVoucher.toLowerCase().includes(searchVoucher.toLowerCase()) ||
        v.TenChuongTrinh.toLowerCase().includes(searchVoucher.toLowerCase())
      : true
  );

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Quản lý Khuyến mãi, Voucher & Nhận tin</h1>
          <p className="page-desc">
            Phân biệt rõ: Khuyến mãi tour (giảm % tự động theo thời gian) vs Mã giảm giá (voucher khách nhập khi thanh toán) vs Bản tin Email
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'PROMO' && (
            <button className="btn btn-primary" onClick={openCreatePromo}>
              <Plus size={15} />
              <span>Tạo Khuyến Mãi Tour (CTKM)</span>
            </button>
          )}
          {activeTab === 'VOUCHER' && (
            <button className="btn btn-primary" onClick={openCreateVoucher}>
              <Plus size={15} />
              <span>Tạo Mã Giảm Giá (Voucher)</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'PROMO' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('PROMO')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
        >
          <Tag size={15} />
          <span>1. Khuyến mãi tour (CTKM)</span>
          <span style={{ background: activeTab === 'PROMO' ? 'rgba(255,255,255,0.25)' : 'var(--zinc-200)', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
            {promoApi.data?.length ?? 0}
          </span>
        </button>

        <button
          className={`btn ${activeTab === 'VOUCHER' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('VOUCHER')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
        >
          <Ticket size={15} />
          <span>2. Mã giảm giá (Voucher)</span>
          <span style={{ background: activeTab === 'VOUCHER' ? 'rgba(255,255,255,0.25)' : 'var(--zinc-200)', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
            {voucherApi.data?.length ?? 0}
          </span>
        </button>

        <button
          className={`btn ${activeTab === 'NEWSLETTER' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('NEWSLETTER')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
        >
          <Mail size={15} />
          <span>3. Quản lý nhận tin & Nhật ký gửi Mail</span>
          <span style={{ background: activeTab === 'NEWSLETTER' ? 'rgba(255,255,255,0.25)' : 'var(--zinc-200)', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
            {subsApi.data?.filter((s) => s.TrangThai === 1).length ?? 0} sub
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KHUYẾN MÃI TOUR (CTKM) */}
      {/* ========================================================================= */}
      {activeTab === 'PROMO' && (
        <>
          <div className="card">
            <div className="toolbar">
              <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  className="input"
                  placeholder="Tìm kiếm chương trình khuyến mãi..."
                  value={searchPromo}
                  onChange={(e) => setSearchPromo(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '13px' }}
                />
              </div>
              <span className="count">{filteredPromos.length} chương trình</span>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Chương trình khuyến mãi</th>
                    <th>Mức giảm</th>
                    <th>Thời gian hiệu lực</th>
                    <th>Tour áp dụng</th>
                    <th>Trạng thái</th>
                    <th>Đơn đã đặt</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromos.length ? (
                    filteredPromos.map((p) => {
                      const state = p.TrangThaiHienThi || 'Dang dien ra';
                      const stateMap: Record<string, { label: string; color: string; bg: string }> = {
                        'Dang dien ra': { label: 'Đang diễn ra', color: '#16A34A', bg: '#DCFCE7' },
                        'Sap dien ra': { label: 'Sắp diễn ra', color: '#0284C7', bg: '#E0F2FE' },
                        'Het han': { label: 'Đã kết thúc', color: '#64748B', bg: '#F1F5F9' },
                        'Tam dung': { label: 'Tạm dừng', color: '#B45309', bg: '#FEF3C7' },
                      };
                      const st = stateMap[state] || stateMap['Dang dien ra'];

                      return (
                        <tr key={p.CTKMID}>
                          <td>
                            <div className="strong" style={{ fontSize: '13.5px' }}>{p.TenChuongTrinh}</div>
                            {p.MoTa && <div className="sub" style={{ maxWidth: '280px' }}>{p.MoTa}</div>}
                            <div className="sub" style={{ fontSize: '11px', color: '#94A3B8' }}>
                              Tạo bởi: {p.NhanVienTao?.HoTen || 'Admin'}
                            </div>
                          </td>
                          <td>
                            <span style={{ background: '#DC2626', color: '#FFF', fontWeight: 900, padding: '3px 8px', borderRadius: '6px', fontSize: '13px' }}>
                              -{Math.round(Number(p.PhanTramGiam))}%
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>
                              <div>Từ: <strong>{new Date(p.NgayBatDau).toLocaleString('vi-VN')}</strong></div>
                              <div>Đến: <strong>{new Date(p.NgayKetThuc).toLocaleString('vi-VN')}</strong></div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                              {p.ApDung && p.ApDung.length > 0 ? (
                                p.ApDung.map((a) => (
                                  <span
                                    key={a.Tour.TourID}
                                    style={{ background: '#F1F5F9', color: '#0F172A', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, border: '1px solid #E2E8F0' }}
                                    title={a.Tour.TenTour}
                                  >
                                    #{a.Tour.MaTour}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: '#94A3B8', fontSize: '12px' }}>Chưa gán tour</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span style={{ background: st.bg, color: st.color, padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                              {st.label}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: '#0F172A' }}>{p._count?.DonDatTour ?? 0}</strong> đơn
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleBroadcastPromo(p)}
                                disabled={broadcastingId === p.CTKMID || p.TrangThai !== 1}
                                title="Gửi email thông báo khuyến mãi tới toàn bộ khách hàng đăng ký nhận tin"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1D4ED8', borderColor: '#BFDBFE' }}
                              >
                                <Send size={12} />
                                <span>{broadcastingId === p.CTKMID ? 'Đang gửi...' : 'Gửi mail'}</span>
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => openEditPromo(p)} title="Chỉnh sửa">
                                <Edit2 size={12} />
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleTogglePromo(p)}
                                title={p.TrangThai ? 'Tạm dừng' : 'Kích hoạt lại'}
                              >
                                {p.TrangThai ? 'Tạm dừng' : 'Kích hoạt'}
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleDeletePromo(p)}
                                style={{ color: '#DC2626' }}
                                title="Xóa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyRow cols={7} loading={promoApi.loading} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MÃ GIẢM GIÁ (VOUCHER) */}
      {/* ========================================================================= */}
      {activeTab === 'VOUCHER' && (
        <>
          <div className="card">
            <div className="toolbar">
              <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }} />
                <input
                  className="input"
                  placeholder="Tìm theo mã voucher hoặc tên..."
                  value={searchVoucher}
                  onChange={(e) => setSearchVoucher(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '13px' }}
                />
              </div>
              <span className="count">{filteredVouchers.length} mã voucher</span>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã voucher</th>
                    <th>Tên chương trình</th>
                    <th>Mức giảm giá</th>
                    <th>Đơn tối thiểu</th>
                    <th>Hạn sử dụng</th>
                    <th>Lượt sử dụng</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.length ? (
                    filteredVouchers.map((v) => {
                      const isExpired = new Date() > new Date(v.NgayKetThuc);
                      const isFull = v.SoLuongToiDa ? (v._count?.DonDatTour || 0) >= v.SoLuongToiDa : false;

                      return (
                        <tr key={v.VoucherID}>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '14px', background: '#F8FAFC', padding: '3px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', color: '#005BAA' }}>
                              {v.MaVoucher}
                            </span>
                          </td>
                          <td>
                            <div className="strong" style={{ fontSize: '13px' }}>{v.TenChuongTrinh}</div>
                          </td>
                          <td>
                            <strong style={{ color: '#059669', fontSize: '13.5px' }}>
                              {Math.round(Number(v.PhanTramGiam))}%
                            </strong>
                            <div className="sub" style={{ fontSize: '11px' }}>
                              Tối đa: {vnd(v.GiamToiDa)}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{vnd(v.GiaTriDonToiThieu)}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>
                              <div>Từ: {date(v.NgayBatDau)}</div>
                              <div>Đến: <strong>{date(v.NgayKetThuc)}</strong></div>
                            </div>
                          </td>
                          <td>
                            <span>
                              <strong>{v._count?.DonDatTour || 0}</strong>
                              {v.SoLuongToiDa ? ` / ${v.SoLuongToiDa}` : ' (Vô hạn)'}
                            </span>
                          </td>
                          <td>
                            {!v.TrangThai ? (
                              <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                                Tạm dừng
                              </span>
                            ) : isExpired ? (
                              <span style={{ background: '#F1F5F9', color: '#64748B', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                                Hết hạn
                              </span>
                            ) : isFull ? (
                              <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                                Hết lượt
                              </span>
                            ) : (
                              <span style={{ background: '#DCFCE7', color: '#16A34A', padding: '3px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                                Hoạt động
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleBroadcastVoucher(v)}
                                disabled={broadcastingId === v.VoucherID || !v.TrangThai || isExpired}
                                title="Gửi mã voucher này qua email tới khách đăng ký nhận tin"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284C7', borderColor: '#BAE6FD' }}
                              >
                                <Send size={12} />
                                <span>{broadcastingId === v.VoucherID ? 'Đang gửi...' : 'Gửi mail'}</span>
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => openEditVoucher(v)} title="Sửa">
                                <Edit2 size={12} />
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => handleToggleVoucher(v)}>
                                {v.TrangThai ? 'Tắt' : 'Bật'}
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => handleDeleteVoucher(v)} style={{ color: '#DC2626' }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyRow cols={8} loading={voucherApi.loading} />
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUẢN LÝ NHẬN TIN & NHẬT KÝ GỬI EMAIL */}
      {/* ========================================================================= */}
      {activeTab === 'NEWSLETTER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* OVERVIEW STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ padding: '16px', background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase' }}>Khách đang nhận tin</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0284C7', margin: '4px 0' }}>
                {overviewApi.data?.subscribers.dangNhan ?? 0}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>Đã hủy: {overviewApi.data?.subscribers.daHuy ?? 0} khách</div>
            </div>

            <div className="card" style={{ padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>Mail gửi thành công (30 ngày)</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#16A34A', margin: '4px 0' }}>
                {overviewApi.data?.mail30Ngay.thanhCong ?? 0}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>Thất bại: {overviewApi.data?.mail30Ngay.thatBai ?? 0}</div>
            </div>

            <div className="card" style={{ padding: '16px', background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#7E22CE', textTransform: 'uppercase' }}>Luồng gửi mail tự động</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#9333EA', margin: '4px 0' }}>
                12 luồng
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B' }}>Giao dịch (Vé QR, Huỷ, Nhắc) & Marketing</div>
            </div>
          </div>

          {/* BẢNG 12 LUỒNG XỬ LÝ EMAIL THEO ĐỀ CƯƠNG */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
              <strong style={{ fontSize: '14px', color: '#0F172A' }}>
                Danh Mục 12 Luồng Xử Lý Gửi Mail Tự Động Về Gmail Khách Hàng (Đề tài CNTT)
              </strong>
            </div>
            <div className="table-wrap">
              <table className="table" style={{ fontSize: '12.5px' }}>
                <thead>
                  <tr>
                    <th>Mã luồng</th>
                    <th>Tên luồng email</th>
                    <th>Phân loại</th>
                    <th>Sự kiện kích hoạt</th>
                    <th>Người nhận</th>
                    <th>Cơ chế chống gửi trùng</th>
                    <th>Đã gửi (30 ngày)</th>
                  </tr>
                </thead>
                <tbody>
                  {(overviewApi.data?.flows || []).map((f) => (
                    <tr key={f.ma}>
                      <td><code style={{ fontWeight: 800 }}>{f.ma}</code></td>
                      <td><strong>{f.ten}</strong></td>
                      <td>
                        <span style={{
                          background: f.loai === 'Marketing' ? '#EFF6FF' : '#F1F5F9',
                          color: f.loai === 'Marketing' ? '#1D4ED8' : '#334155',
                          padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
                        }}>
                          {f.loai}
                        </span>
                      </td>
                      <td style={{ color: '#475569' }}>{f.suKien}</td>
                      <td>{f.nguoiNhan}</td>
                      <td style={{ color: '#64748B', fontSize: '11.5px' }}>{f.chongTrung}</td>
                      <td><strong>{f.daGui30Ngay}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DANH SÁCH NGƯỜI ĐĂNG KÝ VÀ NHẬT KÝ GỬI THỰC TẾ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* CỘT TRÁI: NGƯỜI ĐĂNG KÝ NHẬN TIN */}
            <div className="card">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13.5px' }}>Khách hàng đăng ký nhận tin ({subsApi.data?.length ?? 0})</strong>
              </div>
              <div className="table-wrap" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Nguồn</th>
                      <th>Ngày đăng ký</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsApi.data?.length ? (
                      subsApi.data.map((s) => (
                        <tr key={s.DangKyID}>
                          <td><strong>{s.Email}</strong></td>
                          <td><span className="sub">{s.NguonDangKy}</span></td>
                          <td>{date(s.NgayDangKy)}</td>
                          <td>
                            <span style={{
                              background: s.TrangThai ? '#DCFCE7' : '#F1F5F9',
                              color: s.TrangThai ? '#16A34A' : '#64748B',
                              padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
                            }}>
                              {s.TrangThai ? 'Đang nhận' : 'Đã hủy'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleToggleSubscriber(s)}>
                              {s.TrangThai ? 'Hủy' : 'Mở lại'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyRow cols={5} loading={subsApi.loading} />
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CỘT PHẢI: NHẬT KÝ GỬI MAIL (AUDIT LOGS) */}
            <div className="card">
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13.5px' }}>Nhật ký gửi Gmail gần nhất</strong>
                <button className="btn btn-outline btn-sm" onClick={() => logsApi.reload()}>Tải lại</button>
              </div>
              <div className="table-wrap" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Loại</th>
                      <th>Người nhận</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsApi.data?.length ? (
                      logsApi.data.map((l) => (
                        <tr key={l.NhatKyID}>
                          <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.NgayGui).toLocaleString('vi-VN')}</td>
                          <td><code style={{ fontSize: '11px' }}>{l.LoaiMail}</code></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{l.EmailNhan}</div>
                            <div className="sub" style={{ fontSize: '11px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.TieuDe}</div>
                          </td>
                          <td>
                            <span style={{
                              background: l.TrangThai === 'Thanh cong' ? '#DCFCE7' : l.TrangThai === 'That bai' ? '#FEE2E2' : '#F1F5F9',
                              color: l.TrangThai === 'Thanh cong' ? '#16A34A' : l.TrangThai === 'That bai' ? '#DC2626' : '#64748B',
                              padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800
                            }}>
                              {l.TrangThai}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyRow cols={4} loading={logsApi.loading} />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TẠO / SỬA KHUYẾN MÃI TOUR (CTKM) */}
      {/* ========================================================================= */}
      {showPromoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#FFF', borderRadius: '14px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                {editingPromo ? 'Chỉnh Sửa Khuyến Mãi Tour' : 'Tạo Chương Trình Khuyến Mãi Tour Mới'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPromoModal(false)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSavePromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label">Tên chương trình khuyến mãi *</label>
                <input
                  className="input"
                  placeholder="Ví dụ: MÙA HÈ RỰC RỠ 2026 — GIẢM 15% TẤT CẢ TOUR BIỂN"
                  value={promoForm.TenChuongTrinh}
                  onChange={(e) => setPromoForm({ ...promoForm, TenChuongTrinh: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Mô tả chi tiết chương trình</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Áp dụng cho du khách đăng ký sớm trong tháng..."
                  value={promoForm.MoTa}
                  onChange={(e) => setPromoForm({ ...promoForm, MoTa: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Mức giảm giá (% từ 1 đến 100) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={100}
                      value={promoForm.PhanTramGiam}
                      onChange={(e) => setPromoForm({ ...promoForm, PhanTramGiam: e.target.value })}
                      required
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '10px', fontWeight: 800, color: '#94A3B8' }}>%</span>
                  </div>
                </div>

                <div>
                  <label className="label">Trạng thái kích hoạt</label>
                  <select
                    className="select"
                    value={promoForm.TrangThai}
                    onChange={(e) => setPromoForm({ ...promoForm, TrangThai: Number(e.target.value) })}
                  >
                    <option value={1}>Bật (Có hiệu lực trong thời gian)</option>
                    <option value={0}>Tạm dừng áp dụng</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Thời điểm bắt đầu *</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={promoForm.NgayBatDau}
                    onChange={(e) => setPromoForm({ ...promoForm, NgayBatDau: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Thời điểm kết thúc *</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={promoForm.NgayKetThuc}
                    onChange={(e) => setPromoForm({ ...promoForm, NgayKetThuc: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* CHỌN CÁC TOUR ÁP DỤNG */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="label" style={{ margin: 0 }}>Gán Tour Áp Dụng Khuyến Mãi * ({promoForm.tourIds.length} tour đã chọn)</label>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const allIds = toursApi.data?.map((t) => t.TourID) || [];
                      setPromoForm({
                        ...promoForm,
                        tourIds: promoForm.tourIds.length === allIds.length ? [] : allIds,
                      });
                    }}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    {promoForm.tourIds.length === (toursApi.data?.length || 0) ? 'Bỏ chọn tất cả' : 'Chọn tất cả tour'}
                  </button>
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(toursApi.data || []).map((t) => {
                    const checked = promoForm.tourIds.includes(t.TourID);
                    return (
                      <label
                        key={t.TourID}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: checked ? '#F0F9FF' : '#FFF',
                          cursor: 'pointer',
                          fontSize: '12.5px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...promoForm.tourIds, t.TourID]
                              : promoForm.tourIds.filter((id) => id !== t.TourID);
                            setPromoForm({ ...promoForm, tourIds: next });
                          }}
                        />
                        <strong style={{ color: '#005BAA' }}>#{t.MaTour}</strong>
                        <span style={{ flex: 1 }}>{t.TenTour}</span>
                        <span style={{ color: '#64748B', fontSize: '11.5px' }}>{vnd(t.GiaNguoiLon)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#FAF8F5', border: '1px solid #E7E5E4', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#1C1917' }}>
                <input
                  type="checkbox"
                  checked={promoForm.guiThongBao}
                  onChange={(e) => setPromoForm({ ...promoForm, guiThongBao: e.target.checked })}
                />
                <span>Tự động gửi email thông báo khuyến mãi này đến toàn bộ khách hàng đăng ký nhận tin</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPromoModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingPromo ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TẠO / SỬA MÃ GIẢM GIÁ (VOUCHER) */}
      {/* ========================================================================= */}
      {showVoucherModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#FFF', borderRadius: '14px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                {editingVoucher ? 'Chỉnh Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá (Voucher) Mới'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowVoucherModal(false)}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Mã Voucher (Khách nhập) *</label>
                  <input
                    className="input"
                    placeholder="VIETTOUR2026, HEVUI2026..."
                    value={voucherForm.MaVoucher}
                    onChange={(e) => setVoucherForm({ ...voucherForm, MaVoucher: e.target.value.toUpperCase() })}
                    required
                    style={{ textTransform: 'uppercase', fontWeight: 800, fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label className="label">Tên chương trình voucher *</label>
                  <input
                    className="input"
                    placeholder="Chào mừng hè 2026"
                    value={voucherForm.TenChuongTrinh}
                    onChange={(e) => setVoucherForm({ ...voucherForm, TenChuongTrinh: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label className="label">Mức giảm (%) *</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={100}
                    value={voucherForm.PhanTramGiam}
                    onChange={(e) => setVoucherForm({ ...voucherForm, PhanTramGiam: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Giảm tối đa (VNĐ) *</label>
                  <input
                    className="input"
                    type="number"
                    step={100000}
                    value={voucherForm.GiamToiDa}
                    onChange={(e) => setVoucherForm({ ...voucherForm, GiamToiDa: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Đơn tối thiểu (VNĐ) *</label>
                  <input
                    className="input"
                    type="number"
                    step={500000}
                    value={voucherForm.GiaTriDonToiThieu}
                    onChange={(e) => setVoucherForm({ ...voucherForm, GiaTriDonToiThieu: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Số lượt dùng tối đa (để trống = vô hạn)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="Không giới hạn"
                    value={voucherForm.SoLuongToiDa}
                    onChange={(e) => setVoucherForm({ ...voucherForm, SoLuongToiDa: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Trạng thái</label>
                  <select
                    className="select"
                    value={voucherForm.TrangThai}
                    onChange={(e) => setVoucherForm({ ...voucherForm, TrangThai: Number(e.target.value) })}
                  >
                    <option value={1}>Hoạt động</option>
                    <option value={0}>Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="label">Ngày bắt đầu *</label>
                  <input
                    className="input"
                    type="date"
                    value={voucherForm.NgayBatDau}
                    onChange={(e) => setVoucherForm({ ...voucherForm, NgayBatDau: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Ngày kết thúc *</label>
                  <input
                    className="input"
                    type="date"
                    value={voucherForm.NgayKetThuc}
                    onChange={(e) => setVoucherForm({ ...voucherForm, NgayKetThuc: e.target.value })}
                    required
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#FAF8F5', border: '1px solid #E7E5E4', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#1C1917' }}>
                <input
                  type="checkbox"
                  checked={voucherForm.guiThongBao}
                  onChange={(e) => setVoucherForm({ ...voucherForm, guiThongBao: e.target.checked })}
                />
                <span>Tự động gửi email tặng mã giảm giá này đến toàn bộ khách hàng đăng ký nhận tin</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #E2E8F0' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowVoucherModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editingVoucher ? 'Cập nhật voucher' : 'Tạo voucher mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
