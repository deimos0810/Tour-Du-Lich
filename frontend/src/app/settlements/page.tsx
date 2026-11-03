'use client';
import { useState } from 'react';
import { api, downloadFile, useApi } from '@/lib/api';
import { ApiNotice, Status, date, vnd } from '@/lib/ui';
import {
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Plus,
  Download,
  RefreshCw,
  TrendingUp,
  DollarSign,
  X,
  AlertCircle,
  Receipt,
  Building2,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type SupplierBookingDetail = {
  ChiTietID?: number;
  ChiTietPhieuID?: number;
  DichVuID?: number;
  DichVuNCCID?: number;
  SoLuong: number;
  DonGia: string | number;
  ThanhTien: string | number;
  NgaySuDung?: string | null;
  GhiChu?: string | null;
  DichVu?: {
    TenDichVu: string;
    LoaiDichVu?: string | null;
    DonViTinh: string;
    DonGia?: string | number;
    GiaThamKhao?: string | number;
    MoTa?: string | null;
  };
};

type SupplierOrder = {
  PhieuID?: number;
  PhieuDatID?: number;
  MaPhieu: string;
  TongTienDichVu: string | number;
  TienDatCoc?: string | number;
  TienDaCoc?: string | number;
  TrangThai: string;
  SoHoaDon?: string | null;
  SoHoaDonNCC?: string | null;
  NgayLap?: string;
  NgayDat?: string;
  GhiChu?: string | null;
  NhaCungCap?: {
    NhaCungCapID: number;
    TenNhaCungCap?: string;
    TenNCC?: string;
    LoaiDichVu?: string;
    LoaiNCC?: string;
    SoDienThoai?: string;
    MaSoThue?: string | null;
    DiaChi?: string | null;
    NguoiLienHe?: string | null;
  };
  ChiTiet?: SupplierBookingDetail[];
};

type Settlement = {
  QuyetToanID: number;
  TongThu: string | number;
  ThucThu?: string | number;
  CongNoPhaiThu?: string | number;
  TongChi: string | number;
  ChiPhiNCC?: string | number;
  ChiPhiHDV?: string | number;
  ChiPhiKhac?: string | number;
  CongNoPhaiTra?: string | number;
  LoiNhuan: string | number;
  TySuatLoiNhuan?: string | number;
  NgayLap: string;
  TrangThaiDuyet: string;
  LyDoTraLai?: string | null;
  GhiChu?: string | null;
  LichKhoiHanh: {
    LichID: number;
    MaLich: string;
    NgayKhoiHanh: string;
    NgayKetThuc?: string;
    Tour: { TenTour: string; MaTour?: string; ThoiGian?: string };
    PhieuDatDichVu?: SupplierOrder[];
  };
  NhanVienLap: { HoTen: string };
};

type Departure = {
  LichID: number;
  MaLich: string;
  NgayKhoiHanh: string;
  NgayKetThuc: string;
  TrangThai: string;
  Tour: { TenTour: string; MaTour: string };
};

type SettlementPreview = {
  lichId: number;
  maLich: string;
  tenTour: string;
  ngayKhoiHanh: string;
  ngayKetThuc: string;
  soDon: number;
  soPhieuChi: number;
  tongThu: number;
  tongChi: number;
  loiNhuan: number;
  tySuat: number;
  chiTietChiPhi?: SupplierOrder[];
  chiTiet?: {
    donHang?: any[];
    phieuNCC?: any[];
    hdv?: any[];
    chiPhiKhac?: any[];
  };
  canhBao?: string[];
};

function formatSupplierType(raw?: string | null): string {
  switch (raw) {
    case 'Khach san':
      return 'Khách sạn / Lưu trú';
    case 'Nha hang':
      return 'Nhà hàng / Ẩm thực';
    case 'Xe van chuyen':
      return 'Xe vận chuyển';
    case 'Cong ty bay':
      return 'Hàng không / Vé máy bay';
    case 'Khu du lich':
      return 'Khu du lịch / Vé tham quan';
    case 'Khac':
      return 'Vé thắng cảnh & Dịch vụ';
    default:
      return raw || 'Dịch vụ tour';
  }
}

export default function SettlementsPage() {
  const { data, error, loading, reload } = useApi<Settlement[]>('/settlements');
  const departuresApi = useApi<Departure[]>('/departures');

  const [filterTab, setFilterTab] = useState<'ALL' | 'CHO_DUYET' | 'DA_DUYET'>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Record<number, boolean>>({});

  // State Modal Chi tiết chi phí NCC & Hóa đơn
  const [inspectingSettlement, setInspectingSettlement] = useState<Settlement | null>(null);

  // State Modal Lập quyết toán mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLichId, setSelectedLichId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<SettlementPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [creatingSettlement, setCreatingSettlement] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toggleExpand = (id: number) => {
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const approve = async (s: Settlement) => {
    if (!confirm(`Xác nhận phê duyệt báo cáo quyết toán tài chính chuyến ${s.LichKhoiHanh.MaLich}?`)) return;
    try {
      await api(`/settlements/${s.QuyetToanID}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ TrangThaiDuyet: 'Da phe duyet' }),
      });
      showToast(`Đã phê duyệt quyết toán chuyến ${s.LichKhoiHanh.MaLich} thành công!`);
      void reload();
    } catch (err: any) {
      alert(err.message || 'Lỗi phê duyệt quyết toán');
    }
  };

  const exportFile = async (s: Settlement, kind: 'pdf' | 'excel') => {
    const key = `${s.QuyetToanID}-${kind}`;
    setDownloadingId(key);
    try {
      await downloadFile(
        `/export/settlement/${kind}/${s.QuyetToanID}`,
        `quyet-toan-${s.LichKhoiHanh.MaLich}.${kind === 'pdf' ? 'pdf' : 'xlsx'}`,
      );
      showToast(`Tải xuống file ${kind === 'pdf' ? 'PDF' : 'Excel'} quyết toán ${s.LichKhoiHanh.MaLich} thành công!`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể xuất file');
    } finally {
      setDownloadingId(null);
    }
  };

  const exportFinancialReport = async () => {
    setDownloadingId('all-excel');
    try {
      await downloadFile('/export/reports/excel', 'bao-cao-tai-chinh-tong-hop.xlsx');
      showToast('Đã xuất thành công Báo cáo tài chính tổng hợp toàn bộ các chuyến đi!');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Không thể xuất file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSelectLich = async (lichId: number) => {
    setSelectedLichId(lichId);
    setLoadingPreview(true);
    setPreviewData(null);
    try {
      const res = await api<SettlementPreview>(`/settlements/preview/${lichId}`);
      setPreviewData(res);
    } catch (err: any) {
      alert(err.message || 'Không thể tính toán số liệu quyết toán');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmCreateSettlement = async () => {
    if (!selectedLichId) return;
    setCreatingSettlement(true);
    try {
      await api('/settlements', {
        method: 'POST',
        body: JSON.stringify({ LichID: selectedLichId }),
      });
      showToast('Lập bảng quyết toán tài chính thành công!');
      setIsCreateModalOpen(false);
      setSelectedLichId(null);
      setPreviewData(null);
      void reload();
    } catch (err: any) {
      alert(err.message || 'Lỗi lập bảng quyết toán');
    } finally {
      setCreatingSettlement(false);
    }
  };

  const filteredData = (data || []).filter((s) => {
    if (filterTab === 'CHO_DUYET') return s.TrangThaiDuyet === 'Da trinh duyet';
    if (filterTab === 'DA_DUYET') return s.TrangThaiDuyet === 'Da phe duyet';
    return true;
  });

  return (
    <>
      <div
        className="page-head"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="page-title">Quyết Toán Tài Chính & Dịch Vụ Nhà Cung Cấp Theo Tour</h1>
          <p className="page-desc">
            Đối soát chi tiết từng hạng mục dịch vụ nhà cung cấp (Khách sạn, Xe, Vé tham quan, Hàng không), doanh thu thực thu và lợi nhuận ròng từng chuyến đi
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={exportFinancialReport}
            disabled={downloadingId === 'all-excel'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}
          >
            <Download size={14} />
            {downloadingId === 'all-excel' ? 'Đang xuất...' : 'Xuất Excel tổng hợp'}
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              setIsCreateModalOpen(true);
              departuresApi.reload();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}
          >
            <Plus size={15} />
            Lập quyết toán mới
          </button>
        </div>
      </div>

      {toastMsg && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1px solid #10B981',
            color: '#065F46',
            padding: '10px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} /> {toastMsg}
        </div>
      )}

      <ApiNotice error={error} />

      {/* TABS LỌC TRẠNG THÁI */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'ALL', label: `Tất cả (${data?.length || 0})` },
          {
            key: 'DA_DUYET',
            label: `Đã phê duyệt (${data?.filter((s) => s.TrangThaiDuyet === 'Da phe duyet').length || 0})`,
          },
          {
            key: 'CHO_DUYET',
            label: `Chờ duyệt (${data?.filter((s) => s.TrangThaiDuyet === 'Da trinh duyet').length || 0})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`btn btn-sm ${filterTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterTab(tab.key as any)}
            style={{ fontWeight: filterTab === tab.key ? 600 : 400, fontSize: '13px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DANH SÁCH HỒ SƠ QUYẾT TOÁN KÈM BẢNG KÊ CHI TIẾT DỊCH VỤ NHÀ CUNG CẤP */}
      {loading ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
          Đang tải dữ liệu quyết toán tài chính & bảng kê dịch vụ nhà cung cấp...
        </div>
      ) : !filteredData.length ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
          Chưa có báo cáo quyết toán nào trong mục này.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {filteredData.map((s) => {
            const profit = Number(s.LoiNhuan ?? Number(s.TongThu) - Number(s.TongChi));
            const orders = s.LichKhoiHanh?.PhieuDatDichVu || [];
            const isCollapsed = Boolean(collapsedIds[s.QuyetToanID]);

            // Trải phẳng toàn bộ các hạng mục dịch vụ chi tiết trong các phiếu đặt dịch vụ của chuyến đi
            const serviceRows = orders.flatMap((po) => {
              const supplierName = po.NhaCungCap?.TenNhaCungCap || po.NhaCungCap?.TenNCC || 'Nhà cung cấp đối tác';
              const supplierType = formatSupplierType(po.NhaCungCap?.LoaiDichVu || po.NhaCungCap?.LoaiNCC);
              const paid = Number(po.TienDatCoc ?? po.TienDaCoc ?? 0);
              const total = Number(po.TongTienDichVu || 0);
              const debt = Math.max(0, total - paid);

              if (po.ChiTiet && po.ChiTiet.length > 0) {
                return po.ChiTiet.map((ct, idx) => ({
                  key: `${po.MaPhieu}-${ct.ChiTietID || ct.ChiTietPhieuID || idx}`,
                  maPhieu: po.MaPhieu,
                  soHoaDon: po.SoHoaDon || po.SoHoaDonNCC || null,
                  supplierName,
                  supplierType,
                  phone: po.NhaCungCap?.SoDienThoai || null,
                  tenDichVu: ct.DichVu?.TenDichVu || po.GhiChu || 'Hạng mục dịch vụ tour',
                  loaiHangMuc: ct.DichVu?.LoaiDichVu || supplierType,
                  donViTinh: ct.DichVu?.DonViTinh || 'Gói',
                  soLuong: ct.SoLuong,
                  donGia: Number(ct.DonGia || 0),
                  thanhTien: Number(ct.ThanhTien || 0),
                  ngaySuDung: ct.NgaySuDung || po.NgayLap || po.NgayDat || null,
                  trangThaiPhieu: po.TrangThai,
                  conNoPhieu: debt,
                }));
              }

              return [
                {
                  key: `${po.MaPhieu}-0`,
                  maPhieu: po.MaPhieu,
                  soHoaDon: po.SoHoaDon || po.SoHoaDonNCC || null,
                  supplierName,
                  supplierType,
                  phone: po.NhaCungCap?.SoDienThoai || null,
                  tenDichVu: po.GhiChu || `Dịch vụ trọn gói từ ${supplierName}`,
                  loaiHangMuc: supplierType,
                  donViTinh: 'Trọn gói',
                  soLuong: 1,
                  donGia: total,
                  thanhTien: total,
                  ngaySuDung: po.NgayLap || po.NgayDat || null,
                  trangThaiPhieu: po.TrangThai,
                  conNoPhieu: debt,
                },
              ];
            });

            return (
              <div
                key={s.QuyetToanID}
                className="card"
                style={{
                  border: '1px solid #CBD5E1',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                }}
              >
                {/* PHẦN 1: HEADER TỔNG HỢP CHUYẾN ĐI & CHỈ SỐ QUYẾT TOÁN */}
                <div
                  style={{
                    padding: '16px 20px',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(240px, 1.6fr) repeat(4, minmax(120px, 1fr)) auto',
                    gap: '16px',
                    alignItems: 'center',
                  }}
                >
                  {/* Chuyến đi */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="code" style={{ fontWeight: 700 }}>
                        {s.LichKhoiHanh?.MaLich}
                      </span>
                      <Status value={s.TrangThaiDuyet} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A', marginTop: '4px' }}>
                      {s.LichKhoiHanh?.Tour?.TenTour}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Khởi hành: <strong>{date(s.LichKhoiHanh?.NgayKhoiHanh)}</strong> • Người lập:{' '}
                      <strong>{s.NhanVienLap?.HoTen || 'Kế toán'}</strong> ({date(s.NgayLap)})
                    </div>
                  </div>

                  {/* Tổng thu */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Tổng thu Booking
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                      {vnd(s.TongThu)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#15803D', fontWeight: 600 }}>
                      Thực thu: {vnd(s.ThucThu ?? s.TongThu)}
                    </div>
                  </div>

                  {/* Tổng chi phí NCC & HDV */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Tổng chi phí Tour
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#BE123C', marginTop: '2px' }}>
                      {vnd(s.TongChi)}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      {orders.length} phiếu NCC ({serviceRows.length} dịch vụ)
                    </div>
                  </div>

                  {/* Lợi nhuận ròng */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Lợi nhuận ròng
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: profit >= 0 ? '#15803D' : '#BE123C',
                        marginTop: '2px',
                      }}
                    >
                      {vnd(profit)}
                    </div>
                    {s.TySuatLoiNhuan !== undefined && (
                      <div style={{ fontSize: '11.5px', color: '#0F172A', fontWeight: 600 }}>
                        Tỷ suất LN: {s.TySuatLoiNhuan}%
                      </div>
                    )}
                  </div>

                  {/* Công nợ NCC */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Thanh toán NCC
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: Number(s.CongNoPhaiTra || 0) > 0 ? '#B45309' : '#15803D',
                        marginTop: '3px',
                      }}
                    >
                      {Number(s.CongNoPhaiTra || 0) > 0
                        ? `Còn nợ: ${vnd(s.CongNoPhaiTra)}`
                        : 'Đã tất toán 100%'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Thù lao HDV: {vnd(s.ChiPhiHDV || 0)}
                    </div>
                  </div>

                  {/* Thao tác */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setInspectingSettlement(s)}
                      title="Xem hồ sơ phiếu đặt dịch vụ & hóa đơn nhà cung cấp"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={13} strokeWidth={1.6} />
                      <span>Hồ sơ Hóa đơn</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => exportFile(s, 'pdf')}
                      disabled={downloadingId === `${s.QuyetToanID}-pdf`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileText size={13} strokeWidth={1.5} />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => exportFile(s, 'excel')}
                      disabled={downloadingId === `${s.QuyetToanID}-excel`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileSpreadsheet size={13} strokeWidth={1.5} />
                      <span>Excel</span>
                    </button>
                    {s.TrangThaiDuyet === 'Da trinh duyet' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => approve(s)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: '#0F172A',
                          borderColor: '#0F172A',
                        }}
                      >
                        <CheckCircle2 size={13} strokeWidth={1.6} />
                        <span>Phê duyệt</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => toggleExpand(s.QuyetToanID)}
                      title={isCollapsed ? 'Mở bảng kê dịch vụ NCC' : 'Thu gọn bảng kê'}
                      style={{ padding: '5px 8px' }}
                    >
                      {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                  </div>
                </div>

                {/* PHẦN 2: BẢNG KÊ CHI TIẾT CÁC DỊCH VỤ CỦA NHÀ CUNG CẤP TRONG TOUR */}
                {!isCollapsed && (
                  <div style={{ padding: '14px 20px 18px', background: '#FFFFFF' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} color="#0F172A" />
                        <span>
                          Bảng kê chi tiết dịch vụ Nhà cung cấp cấu thành chi phí chuyến đi ({serviceRows.length} hạng mục dịch vụ):
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#475569' }}>
                        Tổng chi dịch vụ NCC: <strong style={{ color: '#BE123C' }}>{vnd(s.ChiPhiNCC ?? s.TongChi)}</strong>
                      </span>
                    </div>

                    {serviceRows.length === 0 ? (
                      <div
                        style={{
                          padding: '16px',
                          background: '#F8FAFC',
                          borderRadius: '6px',
                          border: '1px dashed #CBD5E1',
                          color: '#64748B',
                          fontSize: '12.5px',
                          textAlign: 'center',
                        }}
                      >
                        Chưa có phiếu đặt dịch vụ nhà cung cấp nào cho chuyến đi này.
                      </div>
                    ) : (
                      <div className="table-wrap" style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                        <table className="table" style={{ margin: 0, fontSize: '12.5px' }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC' }}>
                              <th style={{ width: '110px' }}>MÃ PHIẾU</th>
                              <th style={{ width: '24%' }}>NHÀ CUNG CẤP ĐỐI TÁC</th>
                              <th style={{ width: '14%' }}>NHÓM DỊCH VỤ</th>
                              <th>CHI TIẾT HẠNG MỤC DỊCH VỤ TRONG TOUR</th>
                              <th style={{ width: '110px', textAlign: 'center' }}>SỐ LƯỢNG</th>
                              <th style={{ width: '120px', textAlign: 'right' }}>ĐƠN GIÁ</th>
                              <th style={{ width: '130px', textAlign: 'right' }}>THÀNH TIỀN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {serviceRows.map((row) => (
                              <tr key={row.key}>
                                <td>
                                  <span className="code" style={{ fontSize: '11.5px' }}>
                                    {row.maPhieu}
                                  </span>
                                  {row.soHoaDon && (
                                    <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                                      HĐ: {row.soHoaDon}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{row.supplierName}</div>
                                  {row.phone && (
                                    <div style={{ fontSize: '11px', color: '#64748B' }}>SĐT: {row.phone}</div>
                                  )}
                                </td>
                                <td>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      fontSize: '11px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: '#F1F5F9',
                                      color: '#334155',
                                      border: '1px solid #CBD5E1',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {row.supplierType}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600, color: '#0F172A' }}>{row.tenDichVu}</div>
                                  <div style={{ fontSize: '11px', color: '#64748B' }}>
                                    Phân loại: {row.loaiHangMuc}
                                    {row.ngaySuDung ? ` • Ngày sử dụng: ${date(row.ngaySuDung)}` : ''}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 600, color: '#0F172A' }}>
                                  {row.soLuong} {row.donViTinh}
                                </td>
                                <td style={{ textAlign: 'right', color: '#475569' }}>{vnd(row.donGia)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                                  {vnd(row.thanhTien)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL LẬP QUYẾT TOÁN TOUR MỚI */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '10px',
              maxWidth: '720px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--zinc-50)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Lập Bảng Quyết Toán Tour Du Lịch
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B' }}>
                  Tính toán doanh thu thực thu từ booking và tổng hợp chi tiết các dịch vụ nhà cung cấp
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSelectedLichId(null);
                  setPreviewData(null);
                }}
                style={{ padding: '4px 8px' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Chọn đợt khởi hành cần lập quyết toán:
                </label>
                <select
                  className="input"
                  value={selectedLichId ?? ''}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    if (id) handleSelectLich(id);
                    else {
                      setSelectedLichId(null);
                      setPreviewData(null);
                    }
                  }}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13.5px' }}
                >
                  <option value="">-- Chọn chuyến tour / mã lịch khởi hành --</option>
                  {(departuresApi.data || []).map((dep) => (
                    <option key={dep.LichID} value={dep.LichID}>
                      {dep.MaLich} — {dep.Tour.TenTour} ({date(dep.NgayKhoiHanh)} - {date(dep.NgayKetThuc)})
                    </option>
                  ))}
                </select>
              </div>

              {loadingPreview && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                  <RefreshCw size={20} className="spin" style={{ display: 'inline-block', marginBottom: '8px' }} />
                  <div>Đang tổng hợp dữ liệu doanh thu & bảng kê dịch vụ nhà cung cấp...</div>
                </div>
              )}

              {previewData && !loadingPreview && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>{previewData.tenTour}</div>
                    <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                      Mã lịch: <span className="code">{previewData.maLich}</span> | Khởi hành: {date(previewData.ngayKhoiHanh)} - {date(previewData.ngayKetThuc)}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ background: '#FFF', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign size={13} color="var(--emerald-600)" /> TỔNG DOANH THU
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--emerald-700)', marginTop: '4px' }}>
                        {vnd(previewData.tongThu)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{previewData.soDon} đơn đặt chỗ</div>
                    </div>

                    <div style={{ background: '#FFF', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign size={13} color="var(--rose-600)" /> TỔNG CHI NCC
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--rose-600)', marginTop: '4px' }}>
                        {vnd(previewData.tongChi)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{previewData.soPhieuChi} phiếu dịch vụ</div>
                    </div>

                    <div style={{ background: '#FFF', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={13} color="#2563EB" /> LỢI NHUẬN RÒNG
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: previewData.loiNhuan >= 0 ? '#16A34A' : '#DC2626', marginTop: '4px' }}>
                        {vnd(previewData.loiNhuan)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>Tỷ suất: {previewData.tySuat}%</div>
                    </div>
                  </div>

                  {/* 1. BẢNG KÊ CHI TIẾT CHI PHÍ DỊCH VỤ NCC */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>1. Chi tiết dịch vụ NCC cấu thành tour ({previewData.chiTietChiPhi?.length || 0} phiếu đặt)</span>
                      <span style={{ fontSize: '12px', color: 'var(--rose-600)', fontWeight: 700 }}>
                        Tổng chi NCC: {vnd(previewData.tongChi)}
                      </span>
                    </div>
                    {previewData.chiTietChiPhi && previewData.chiTietChiPhi.length > 0 ? (
                      <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                        <table className="table" style={{ fontSize: '12px', margin: 0 }}>
                          <thead>
                            <tr style={{ background: '#F1F5F9' }}>
                              <th>NHÀ CUNG CẤP</th>
                              <th>MÃ PHIẾU / HÓA ĐƠN</th>
                              <th>HẠNG MỤC DỊCH VỤ CHI TIẾT</th>
                              <th style={{ textAlign: 'right' }}>TIỀN CỌC</th>
                              <th style={{ textAlign: 'right' }}>THÀNH TIỀN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.chiTietChiPhi.map((p, idx) => (
                              <tr key={p.PhieuID || p.PhieuDatID || idx}>
                                <td style={{ fontWeight: 600 }}>
                                  {p.NhaCungCap?.TenNhaCungCap || p.NhaCungCap?.TenNCC || 'NCC'}
                                </td>
                                <td>
                                  <span className="code" style={{ fontSize: '11px' }}>
                                    {p.SoHoaDon || p.SoHoaDonNCC || p.MaPhieu}
                                  </span>
                                </td>
                                <td>
                                  {p.ChiTiet && p.ChiTiet.length > 0
                                    ? p.ChiTiet.map(
                                        (ct) =>
                                          `${ct.DichVu?.TenDichVu || 'Dịch vụ'} (${ct.SoLuong} ${ct.DichVu?.DonViTinh || ''} × ${vnd(ct.DonGia)})`,
                                      ).join('; ')
                                    : p.GhiChu || formatSupplierType(p.NhaCungCap?.LoaiDichVu || p.NhaCungCap?.LoaiNCC)}
                                </td>
                                <td style={{ textAlign: 'right', color: '#64748B' }}>
                                  {vnd(p.TienDaCoc || 0)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--rose-600)' }}>
                                  {vnd(p.TongTienDichVu)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '12px', background: '#FFF', border: '1px dashed #CBD5E1', borderRadius: '6px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                        ℹ️ Chưa phát sinh phiếu đặt dịch vụ NCC nào cho đợt này.
                      </div>
                    )}
                  </div>

                  {/* 2. BẢNG KÊ DOANH THU & BOOKING KHÁCH HÀNG */}
                  <div style={{ marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>2. Doanh thu & Danh sách Booking khách hàng ({previewData.chiTiet?.donHang?.length || 0} đơn đặt)</span>
                      <span style={{ fontSize: '12px', color: 'var(--emerald-700)', fontWeight: 700 }}>
                        Tổng thực thu: {vnd(previewData.tongThu)}
                      </span>
                    </div>
                    {previewData.chiTiet?.donHang && previewData.chiTiet.donHang.length > 0 ? (
                      <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                        <table className="table" style={{ fontSize: '12px', margin: 0 }}>
                          <thead>
                            <tr style={{ background: '#F1F5F9' }}>
                              <th>MÃ ĐƠN</th>
                              <th>KHÁCH HÀNG</th>
                              <th>SỐ KHÁCH</th>
                              <th style={{ textAlign: 'right' }}>TỔNG TIỀN</th>
                              <th style={{ textAlign: 'right' }}>ĐÃ THU</th>
                              <th style={{ textAlign: 'right' }}>CÔNG NỢ</th>
                              <th>TRẠNG THÁI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.chiTiet.donHang.map((d: any) => (
                              <tr key={d.DonHangID}>
                                <td><span className="code" style={{ fontSize: '11px' }}>{d.MaDon}</span></td>
                                <td style={{ fontWeight: 600 }}>{d.KhachHang}</td>
                                <td>{d.soKhach} khách</td>
                                <td style={{ textAlign: 'right' }}>{vnd(d.tongTien)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--emerald-600)' }}>{vnd(d.daThu)}</td>
                                <td style={{ textAlign: 'right', color: d.congNo > 0 ? 'var(--rose-600)' : '#64748B' }}>
                                  {d.congNo > 0 ? vnd(d.congNo) : '0 đ'}
                                </td>
                                <td><Status value={d.TrangThaiDon} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '12px', background: '#FFF', border: '1px dashed #CBD5E1', borderRadius: '6px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
                        ℹ️ Chưa ghi nhận đơn đặt tour nào từ khách hàng cho đợt khởi hành này.
                      </div>
                    )}
                  </div>

                  {/* 3. CHI PHÍ HƯỚNG DẪN VIÊN & PHỤ CẤP NẾU CÓ */}
                  {previewData.chiTiet?.hdv && previewData.chiTiet.hdv.length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                        3. Chi phí công tác & thù lao Hướng dẫn viên ({previewData.chiTiet.hdv.length} nhân sự):
                      </div>
                      <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                        <table className="table" style={{ fontSize: '12px', margin: 0 }}>
                          <thead>
                            <tr style={{ background: '#F1F5F9' }}>
                              <th>HƯỚNG DẪN VIÊN</th>
                              <th>SỐ THẺ HDV</th>
                              <th>SỐ NGÀY</th>
                              <th style={{ textAlign: 'right' }}>TIỀN CÔNG</th>
                              <th style={{ textAlign: 'right' }}>PHỤ CẤP</th>
                              <th style={{ textAlign: 'right' }}>TỔNG CỘNG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.chiTiet.hdv.map((h: any, idx: number) => (
                              <tr key={h.DieuPhoiID || idx}>
                                <td style={{ fontWeight: 600 }}>{h.HoTen || h.TenHDV}</td>
                                <td><span className="code" style={{ fontSize: '11px' }}>{h.SoTheHDV || h.TrangThai || 'HDV'}</span></td>
                                <td>{h.soNgay} ngày</td>
                                <td style={{ textAlign: 'right' }}>{vnd(h.tienCong)}</td>
                                <td style={{ textAlign: 'right' }}>{vnd(h.phuCap)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>{vnd(h.tong || h.tongCong)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 4. CẢNH BÁO KIỂM TOÁN TÀI CHÍNH NẾU CÓ */}
                  {previewData.canhBao && previewData.canhBao.length > 0 && (
                    <div style={{ marginTop: '14px', padding: '10px 14px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', fontSize: '12px', color: '#92400E' }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={15} color="#D97706" /> Cảnh báo kiểm toán trước khi lập quyết toán:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.5 }}>
                        {previewData.canhBao.map((cb: string, idx: number) => (
                          <li key={idx}>{cb}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                    <AlertCircle size={14} color="#3B82F6" />
                    Báo cáo sau khi lập sẽ được gửi ở trạng thái <strong>Chờ duyệt</strong> để Kế toán trưởng hoặc Admin ký duyệt.
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '12px 20px',
                borderTop: '1px solid var(--border)',
                background: 'var(--zinc-50)',
              }}
            >
              <button
                className="btn btn-outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setSelectedLichId(null);
                  setPreviewData(null);
                }}
                disabled={creatingSettlement}
              >
                Hủy bỏ
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmCreateSettlement}
                disabled={!selectedLichId || loadingPreview || creatingSettlement}
              >
                {creatingSettlement ? 'Đang lập quyết toán...' : 'Xác nhận lập quyết toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT HỒ SƠ PHIẾU ĐẶT DỊCH VỤ & HÓA ĐƠN NHÀ CUNG CẤP */}
      {inspectingSettlement && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setInspectingSettlement(null)}
        >
          <div
            style={{
              background: '#FFF',
              borderRadius: '12px',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid var(--border)',
                background: '#F8FAFC',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="#0F172A" />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                    Hồ Sơ Chi Phí Dịch Vụ Nhà Cung Cấp & Hóa Đơn Theo Tour
                  </h3>
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
                  Chuyến: <strong>{inspectingSettlement.LichKhoiHanh?.Tour?.TenTour}</strong> | Mã lịch:{' '}
                  <span className="code">{inspectingSettlement.LichKhoiHanh?.MaLich}</span> (Khởi hành:{' '}
                  {date(inspectingSettlement.LichKhoiHanh?.NgayKhoiHanh)})
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setInspectingSettlement(null)}
                style={{ padding: '6px 10px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* TỔNG QUAN TÀI CHÍNH CHUYẾN ĐI */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>DOANH THU GHI NHẬN</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                    {vnd(inspectingSettlement.TongThu)}
                  </div>
                  {inspectingSettlement.ThucThu !== undefined && (
                    <div style={{ fontSize: '11px', color: '#15803D', marginTop: '4px', fontWeight: 600 }}>
                      Thực thu: <strong>{vnd(inspectingSettlement.ThucThu)}</strong>
                    </div>
                  )}
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>TỔNG CHI PHÍ TOUR</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#BE123C', marginTop: '2px' }}>
                    {vnd(inspectingSettlement.TongChi)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                    NCC: {vnd(inspectingSettlement.ChiPhiNCC ?? inspectingSettlement.TongChi)} | HDV: {vnd(inspectingSettlement.ChiPhiHDV || 0)}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>LỢI NHUẬN RÒNG</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803D', marginTop: '2px' }}>
                    {vnd(inspectingSettlement.LoiNhuan)}
                  </div>
                  {inspectingSettlement.TySuatLoiNhuan !== undefined && (
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                      Tỷ suất: <strong>{inspectingSettlement.TySuatLoiNhuan}%</strong>
                    </div>
                  )}
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>CÔNG NỢ THEO DÕI</div>
                  <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '3px' }}>
                    Phải thu khách:{' '}
                    <strong style={{ color: Number(inspectingSettlement.CongNoPhaiThu || 0) > 0 ? '#DC2626' : '#16A34A' }}>
                      {vnd(inspectingSettlement.CongNoPhaiThu || 0)}
                    </strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '2px' }}>
                    Phải trả NCC:{' '}
                    <strong style={{ color: Number(inspectingSettlement.CongNoPhaiTra || 0) > 0 ? '#DC2626' : '#16A34A' }}>
                      {vnd(inspectingSettlement.CongNoPhaiTra || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* DANH SÁCH CHI TIẾT TỪNG PHIẾU NCC */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!inspectingSettlement.LichKhoiHanh?.PhieuDatDichVu ||
                inspectingSettlement.LichKhoiHanh.PhieuDatDichVu.length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      color: '#64748B',
                    }}
                  >
                    Chưa có phiếu đặt dịch vụ nhà cung cấp nào được liên kết với chuyến đi này.
                  </div>
                ) : (
                  inspectingSettlement.LichKhoiHanh.PhieuDatDichVu.map((po, idx) => {
                    const totalCost = Number(po.TongTienDichVu || 0);
                    const deposit = Number(po.TienDatCoc ?? po.TienDaCoc ?? 0);
                    const remaining = Math.max(0, totalCost - deposit);
                    const supplierName =
                      po.NhaCungCap?.TenNhaCungCap || po.NhaCungCap?.TenNCC || 'Nhà cung cấp';
                    const supplierType = formatSupplierType(
                      po.NhaCungCap?.LoaiDichVu || po.NhaCungCap?.LoaiNCC,
                    );

                    return (
                      <div
                        key={po.PhieuID || po.PhieuDatID || idx}
                        style={{
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#FFF',
                        }}
                      >
                        {/* HEADER PHIẾU */}
                        <div
                          style={{
                            background: '#F8FAFC',
                            padding: '12px 16px',
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Building2 size={16} color="#0F172A" />
                              <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>
                                {supplierName}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: '#F1F5F9',
                                  color: '#0F172A',
                                  border: '1px solid #CBD5E1',
                                  fontWeight: 600,
                                }}
                              >
                                {supplierType}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '3px' }}>
                              Mã phiếu: <span className="code">{po.MaPhieu}</span>
                              {(po.SoHoaDon || po.SoHoaDonNCC) && (
                                <>
                                  {' '}| Số HĐ VAT:{' '}
                                  <strong style={{ color: '#0F172A' }}>{po.SoHoaDon || po.SoHoaDonNCC}</strong>
                                </>
                              )}
                              {po.NhaCungCap?.MaSoThue && <> | MST: {po.NhaCungCap.MaSoThue}</>}
                              {po.NhaCungCap?.SoDienThoai && <> | SĐT: {po.NhaCungCap.SoDienThoai}</>}
                              {po.NhaCungCap?.DiaChi && <> | Đ/c: {po.NhaCungCap.DiaChi}</>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Status value={po.TrangThai} />
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                              Ngày đặt: {date(po.NgayLap || po.NgayDat)}
                            </div>
                          </div>
                        </div>

                        {/* BẢNG CHI TIẾT TỪNG DỊCH VỤ */}
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table" style={{ fontSize: '12.5px', margin: 0 }}>
                            <thead>
                              <tr style={{ background: '#FAFAFA' }}>
                                <th style={{ width: '38%' }}>HẠNG MỤC DỊCH VỤ CHI TIẾT</th>
                                <th style={{ width: '18%' }}>PHÂN LOẠI</th>
                                <th style={{ width: '12%', textAlign: 'center' }}>SỐ LƯỢNG</th>
                                <th style={{ width: '16%', textAlign: 'right' }}>ĐƠN GIÁ</th>
                                <th style={{ width: '16%', textAlign: 'right' }}>THÀNH TIỀN</th>
                              </tr>
                            </thead>
                            <tbody>
                              {po.ChiTiet && po.ChiTiet.length > 0 ? (
                                po.ChiTiet.map((ct, cIdx) => (
                                  <tr key={ct.ChiTietID || ct.ChiTietPhieuID || cIdx}>
                                    <td>
                                      <div style={{ fontWeight: 700, color: '#0F172A' }}>
                                        {ct.DichVu?.TenDichVu || `Dịch vụ #${ct.DichVuID || ct.DichVuNCCID}`}
                                      </div>
                                      {ct.DichVu?.MoTa && (
                                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                          {ct.DichVu.MoTa}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <span style={{ color: '#475569' }}>
                                        {ct.DichVu?.LoaiDichVu || supplierType}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                                      {ct.SoLuong} {ct.DichVu?.DonViTinh || 'Gói'}
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#475569' }}>{vnd(ct.DonGia)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                                      {vnd(ct.ThanhTien)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} style={{ color: '#475569' }}>
                                    {po.GhiChu || `Chi phí dịch vụ trọn gói theo hợp đồng (${supplierType})`}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                                    {vnd(po.TongTienDichVu)}
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* FOOTER PHIẾU */}
                        <div
                          style={{
                            background: '#F8FAFC',
                            padding: '10px 16px',
                            borderTop: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '24px',
                            fontSize: '12.5px',
                          }}
                        >
                          <div>
                            <span style={{ color: '#64748B' }}>Đã thanh toán / Đặt cọc NCC: </span>
                            <strong style={{ color: '#15803D' }}>{vnd(deposit)}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B' }}>Công nợ còn lại: </span>
                            <strong style={{ color: remaining > 0 ? '#DC2626' : '#475569' }}>{vnd(remaining)}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B' }}>Tổng cộng phiếu: </span>
                            <strong style={{ color: '#BE123C', fontSize: '13.5px' }}>{vnd(totalCost)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid var(--border)',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Người lập quyết toán: <strong>{inspectingSettlement.NhanVienLap?.HoTen || 'Kế toán viên'}</strong> | Ngày lập:{' '}
                {date(inspectingSettlement.NgayLap)}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => exportFile(inspectingSettlement, 'pdf')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <FileText size={13} /> Xuất PDF Quyết toán
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setInspectingSettlement(null)}>
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
