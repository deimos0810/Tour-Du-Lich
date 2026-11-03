'use client';
import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, date, vnd } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Receipt,
  Plus,
  Eye,
  CheckCircle2,
  FileText,
  Calendar,
  DollarSign,
  Hotel,
  Car,
  Utensils,
  Ticket,
  X,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

type Supplier = {
  NhaCungCapID: number;
  TenNCC: string;
  LoaiNCC: string;
  MaSoThue?: string | null;
  TrangThai?: number;
  NguoiLienHe: string | null;
  SoDienThoai: string;
  Email: string | null;
  DiaChi: string | null;
  DanhGia: string | null;
  thongKe?: { soPhieu: number; tongChiPhi: number; daThanhToan: number; congNo: number };
  DichVu: {
    DichVuNCCID: number;
    TenDichVu: string;
    LoaiDichVu?: string | null;
    DonGia: string;
    DonViTinh: string;
    MoTa?: string | null;
  }[];
};

type ServiceOrderDetail = {
  ChiTietPhieuID: number;
  DichVuNCCID: number;
  SoLuong: number;
  DonGia: string | number;
  ThanhTien: string | number;
  NgaySuDung: string;
  DichVu: {
    TenDichVu: string;
    LoaiDichVu?: string | null;
    DonViTinh: string;
  };
};

type ServiceOrder = {
  PhieuDatID: number;
  MaPhieu: string;
  LichID: number;
  NhaCungCapID: number;
  NgayDat: string;
  HanThanhToan?: string | null;
  SoHoaDonNCC?: string | null;
  TongTienDichVu: string | number;
  TienDaCoc: string | number;
  TrangThai: string;
  LyDoTuChoi?: string | null;
  GhiChu?: string | null;
  NhaCungCap: {
    NhaCungCapID: number;
    TenNCC: string;
    LoaiNCC: string;
    MaSoThue?: string | null;
    SoDienThoai: string;
    Email?: string | null;
    DiaChi?: string | null;
    NguoiLienHe?: string | null;
  };
  NhanVien?: {
    HoTen: string;
  };
  LichKhoiHanh?: {
    LichID: number;
    MaLich: string;
    NgayKhoiHanh: string;
    NgayKetThuc?: string;
    Tour?: {
      TenTour: string;
      MaTour?: string;
    };
  };
  ChiTiet: ServiceOrderDetail[];
};

type DepartureOption = {
  LichID: number;
  MaLich: string;
  NgayKhoiHanh: string;
  Tour: { TenTour: string };
};

const LOAI: Record<string, string> = {
  'Khach san': 'Khách sạn / Lưu trú',
  'Nha hang': 'Nhà hàng / Bữa ăn',
  'Xe van chuyen': 'Xe vận chuyển / Xe du lịch',
  'Cong ty bay': 'Hàng không',
  'Khu du lich': 'Khu du lịch / Thắng cảnh',
  'Khac': 'Dịch vụ khác',
};

const getServiceIcon = (loaiNCC?: string) => {
  switch (loaiNCC) {
    case 'Khach san':
      return <Hotel size={15} color="#0284C7" />;
    case 'Xe van chuyen':
      return <Car size={15} color="#16A34A" />;
    case 'Nha hang':
      return <Utensils size={15} color="#EA580C" />;
    default:
      return <Ticket size={15} color="#9333EA" />;
  }
};

export default function SuppliersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PARTNERS' | 'ORDERS'>('ORDERS');
  const [loaiFilter, setLoaiFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

  // APIs
  const suppliersApi = useApi<Supplier[]>(`/suppliers${loaiFilter ? `?loai=${encodeURIComponent(loaiFilter)}` : ''}`);
  const ordersApi = useApi<ServiceOrder[]>('/service-orders/list');
  const departuresApi = useApi<DepartureOption[]>('/departures');

  // Modal tạo phiếu đặt mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLichId, setSelectedLichId] = useState<number | ''>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | ''>('');
  const [tienCoc, setTienCoc] = useState<number>(0);
  const [orderNote, setOrderNote] = useState('');
  const [orderItems, setOrderItems] = useState<{ DichVuNCCID: number; SoLuong: number; NgaySuDung: string }[]>([]);
  const [creating, setCreating] = useState(false);

  // Thao tác đổi trạng thái hợp tác NCC
  const handleToggleSupplier = async (s: Supplier) => {
    const action = s.TrangThai === 0 ? 'mở lại hợp tác với' : 'tạm dừng hợp tác với';
    if (!confirm(`Bạn có chắc muốn ${action} nhà cung cấp "${s.TenNCC}"?`)) return;
    try {
      await api(`/suppliers/${s.NhaCungCapID}/toggle`, { method: 'PATCH' });
      void suppliersApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Không thể thay đổi trạng thái nhà cung cấp');
    }
  };

  // Thao tác chuyển trạng thái phiếu đặt dịch vụ NCC
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    let lyDoTuChoi: string | undefined = undefined;
    if (nextStatus === 'NCC tu choi') {
      const reason = prompt('Nhập lý do NCC từ chối (hết phòng, xe bảo dưỡng...):');
      if (!reason) return;
      lyDoTuChoi = reason;
    } else if (nextStatus === 'Da huy') {
      if (!confirm('Xác nhận hủy phiếu đặt dịch vụ này? Chi phí sẽ không còn tính vào quyết toán chuyến.')) return;
    }
    try {
      await api(`/service-orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ trangThai: nextStatus, lyDoTuChoi }),
      });
      alert(`Đã cập nhật trạng thái phiếu thành "${nextStatus}"`);
      setSelectedOrder(null);
      void ordersApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Lỗi cập nhật trạng thái phiếu');
    }
  };

  // Selected supplier for new order
  const currentSupplier = suppliersApi.data?.find((s) => s.NhaCungCapID === Number(selectedSupplierId));

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    setSelectedLichId(departuresApi.data && departuresApi.data.length > 0 ? departuresApi.data[0].LichID : '');
    setSelectedSupplierId(suppliersApi.data && suppliersApi.data.length > 0 ? suppliersApi.data[0].NhaCungCapID : '');
    setTienCoc(0);
    setOrderNote('');
    setOrderItems([]);
  };

  const handleAddOrderItem = (dvId: number) => {
    setOrderItems((prev) => {
      const exists = prev.find((item) => item.DichVuNCCID === dvId);
      if (exists) {
        return prev.map((item) => (item.DichVuNCCID === dvId ? { ...item, SoLuong: item.SoLuong + 1 } : item));
      }
      return [...prev, { DichVuNCCID: dvId, SoLuong: 1, NgaySuDung: new Date().toISOString().slice(0, 10) }];
    });
  };

  const handleUpdateItemQty = (dvId: number, qty: number) => {
    if (qty <= 0) {
      setOrderItems((prev) => prev.filter((i) => i.DichVuNCCID !== dvId));
    } else {
      setOrderItems((prev) => prev.map((i) => (i.DichVuNCCID === dvId ? { ...i, SoLuong: qty } : i)));
    }
  };

  const handleSaveOrder = async () => {
    if (!selectedLichId || !selectedSupplierId) {
      alert('Vui lòng chọn chuyến đi và nhà cung cấp!');
      return;
    }
    if (orderItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 dịch vụ / loại phòng!');
      return;
    }

    setCreating(true);
    try {
      await api('/service-orders', {
        method: 'POST',
        body: JSON.stringify({
          LichID: Number(selectedLichId),
          NhaCungCapID: Number(selectedSupplierId),
          NhanVienID: user?.employeeId || 2,
          TienDaCoc: Number(tienCoc),
          GhiChu: orderNote.trim() || undefined,
          items: orderItems,
        }),
      });

      alert('Tạo phiếu đặt dịch vụ nhà cung cấp thành công!');
      setIsCreateModalOpen(false);
      void ordersApi.reload();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi tạo phiếu đặt dịch vụ');
    } finally {
      setCreating(false);
    }
  };

  const calculateNewOrderTotal = () => {
    if (!currentSupplier) return 0;
    return orderItems.reduce((sum, item) => {
      const dv = currentSupplier.DichVu.find((d) => d.DichVuNCCID === item.DichVuNCCID);
      return sum + (dv ? Number(dv.DonGia) * item.SoLuong : 0);
    }, 0);
  };

  return (
    <>
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Nhà Cung Cấp & Chi Phí Dịch Vụ Tour</h1>
          <p className="page-desc">Quản lý đối tác khách sạn, phòng nghỉ, xe vận chuyển, hóa đơn và chi phí chi tiết từng chuyến</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'ORDERS' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('ORDERS')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Receipt size={14} />
            <span>Chi phí & Phiếu đặt Tour</span>
          </button>
          <button
            className={`btn ${activeTab === 'PARTNERS' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('PARTNERS')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <Building2 size={14} />
            <span>Danh bạ & Bảng giá NCC</span>
          </button>
        </div>
      </div>

      <ApiNotice error={activeTab === 'ORDERS' ? ordersApi.error : suppliersApi.error} />

      {activeTab === 'ORDERS' ? (
        /* TAB 2: QUẢN LÝ PHIẾU ĐẶT DỊCH VỤ & CHI PHÍ TOUR */
        <div className="card">
          <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="strong">Danh sách Phiếu Chi & Đặt Dịch Vụ Nhà Cung Cấp</span>
              <span className="count">{ordersApi.data?.length ?? 0} phiếu đặt</span>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenCreateModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Plus size={14} />
              <span>Lập phiếu đặt dịch vụ NCC</span>
            </button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>MÃ PHIẾU / NGÀY LẬP</th>
                  <th>CHUYẾN ĐI & TOUR</th>
                  <th>NHÀ CUNG CẤP & LOẠI</th>
                  <th>MỤC DỊCH VỤ (PHÒNG, XE...)</th>
                  <th>TỔNG CHI PHÍ NCC</th>
                  <th>TIỀN ĐÃ CỌC</th>
                  <th>TRẠNG THÁI</th>
                  <th style={{ textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {ordersApi.data?.length ? (
                  ordersApi.data.map((order) => {
                    const totalCost = Number(order.TongTienDichVu);
                    const deposit = Number(order.TienDaCoc);
                    const remaining = Math.max(0, totalCost - deposit);

                    return (
                      <tr key={order.PhieuDatID}>
                        <td>
                          <div className="code" style={{ fontWeight: 800 }}>{order.MaPhieu}</div>
                          <div className="sub">{date(order.NgayDat)}</div>
                          {order.HanThanhToan && (
                            <div className="sub" style={{ fontSize: '11px', color: '#B45309', fontWeight: 600 }}>
                              Hạn TT: {date(order.HanThanhToan)}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="strong" style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {order.LichKhoiHanh?.Tour?.TenTour || 'Tour trọn gói'}
                          </div>
                          <div className="code" style={{ fontSize: '11px', marginTop: '2px', display: 'inline-block' }}>
                            {order.LichKhoiHanh?.MaLich}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getServiceIcon(order.NhaCungCap?.LoaiNCC)}
                            <strong style={{ color: '#0F172A' }}>{order.NhaCungCap?.TenNCC}</strong>
                          </div>
                          <div className="sub">{LOAI[order.NhaCungCap?.LoaiNCC] || order.NhaCungCap?.LoaiNCC}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#005BAA' }}>
                            {order.ChiTiet?.length || 0} mục dịch vụ
                          </div>
                          <div className="sub" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {order.ChiTiet?.map((c) => c.DichVu?.TenDichVu).join(', ') || order.GhiChu || '—'}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, color: '#DC2626', fontSize: '13.5px' }}>
                            {vnd(order.TongTienDichVu)}
                          </span>
                        </td>
                        <td>
                          <div style={{ color: '#16A34A', fontWeight: 700, fontSize: '12.5px' }}>
                            {vnd(order.TienDaCoc)}
                          </div>
                          {remaining > 0 && (
                            <div style={{ fontSize: '10.5px', color: '#B45309' }}>
                              Còn nợ: {vnd(remaining)}
                            </div>
                          )}
                        </td>
                        <td>
                          <Status value={order.TrangThai} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setSelectedOrder(order)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '12px' }}
                          >
                            <Eye size={13} />
                            <span>Chi tiết & Hóa đơn</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <EmptyRow cols={8} loading={ordersApi.loading} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 1: DANH BẠ ĐỐI TÁC VÀ BẢNG GIÁ DỊCH VỤ */
        <div className="card">
          <div className="toolbar">
            <select className="select" id="supplier-type" value={loaiFilter} onChange={(e) => setLoaiFilter(e.target.value)}>
              <option value="">Tất cả loại dịch vụ</option>
              {Object.entries(LOAI).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <span className="count">{suppliersApi.data?.length ?? 0} đối tác dịch vụ</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nhà cung cấp & MST</th>
                  <th>Loại</th>
                  <th>Người liên hệ</th>
                  <th>Bảng giá phòng & Dịch vụ chi tiết</th>
                  <th>Trạng thái & Đánh giá</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {suppliersApi.data?.length ? (
                  suppliersApi.data.map((s) => (
                    <tr key={s.NhaCungCapID}>
                      <td>
                        <div className="strong" style={{ fontSize: '13.5px' }}>{s.TenNCC}</div>
                        <div className="sub">{s.DiaChi ?? '—'}</div>
                        {s.MaSoThue && (
                          <div className="sub" style={{ fontSize: '11px', color: '#64748B' }}>
                            MST: <span className="code">{s.MaSoThue}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {getServiceIcon(s.LoaiNCC)}
                          <span>{LOAI[s.LoaiNCC] ?? s.LoaiNCC}</span>
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.NguoiLienHe ?? '—'}</div>
                        <div className="sub" style={{ color: '#0284C7', fontWeight: 600 }}>{s.SoDienThoai}</div>
                      </td>
                      <td>
                        {s.DichVu.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {s.DichVu.map((d) => (
                              <div key={d.DichVuNCCID} style={{ fontSize: '12px', background: '#F8FAFC', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                                <strong style={{ color: '#0F172A' }}>{d.TenDichVu}</strong>
                                {d.LoaiDichVu && <span style={{ color: '#64748B', marginLeft: '4px' }}>({d.LoaiDichVu})</span>}:{' '}
                                <span style={{ color: '#DC2626', fontWeight: 700 }}>{vnd(d.DonGia)}</span>/{d.DonViTinh}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="sub">—</span>
                        )}
                      </td>
                      <td>
                        <div>
                          {s.TrangThai === 0 ? (
                            <span className="badge badge-danger">Tạm ngừng</span>
                          ) : (
                            <span className="badge badge-success">Đang hợp tác</span>
                          )}
                        </div>
                        <div className="sub" style={{ marginTop: '4px' }}>
                          {s.DanhGia ? `⭐ ${Number(s.DanhGia).toFixed(1)} / 5` : '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleSupplier(s)}
                          style={{ fontSize: '11.5px', padding: '4px 8px' }}
                        >
                          {s.TrangThai === 0 ? 'Kích hoạt' : 'Tạm dừng'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow cols={6} loading={suppliersApi.loading} />
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT CHI PHÍ & HÓA ĐƠN NHÀ CUNG CẤP */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#EFF6FF', color: '#005BAA', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Chứng từ thanh toán chi phí tour
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: '6px 0 2px' }}>
                  Chi Tiết Chi Phí Dịch Vụ NCC #{selectedOrder.MaPhieu}
                </h2>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  Chuyến đi: <strong style={{ color: '#0F172A' }}>{selectedOrder.LichKhoiHanh?.Tour?.TenTour}</strong> ({selectedOrder.LichKhoiHanh?.MaLich})
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* THÔNG TIN NHÀ CUNG CẤP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>ĐỐI TÁC CUNG CẤP DỊCH VỤ</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                  {selectedOrder.NhaCungCap?.TenNCC}
                </div>
                <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                  Phân loại: <strong>{LOAI[selectedOrder.NhaCungCap?.LoaiNCC] || selectedOrder.NhaCungCap?.LoaiNCC}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Địa chỉ: {selectedOrder.NhaCungCap?.DiaChi || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>LIÊN HỆ & ĐỐI SOÁT</div>
                <div style={{ fontSize: '13px', color: '#0F172A', marginTop: '2px' }}>
                  Đại diện: <strong>{selectedOrder.NhaCungCap?.NguoiLienHe || 'Trưởng bộ phận đặt chỗ'}</strong>
                </div>
                <div style={{ fontSize: '13px', color: '#0284C7', fontWeight: 700, marginTop: '2px' }}>
                  Hotline NCC: {selectedOrder.NhaCungCap?.SoDienThoai}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Email: {selectedOrder.NhaCungCap?.Email || 'cskh@doitac.vn'}</div>
              </div>
            </div>

            {/* BẢNG KÊ CHI TIẾT TỪNG MỤC DỊCH VỤ */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Bảng Kê Chi Tiết Từng Hạng Mục (Loại phòng, Xe, Suất ăn...)
              </h3>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>STT</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>DỊCH VỤ / LOẠI PHÒNG</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>NGÀY DÙNG</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>SỐ LƯỢNG</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>ĐƠN GIÁ</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>THÀNH TIỀN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.ChiTiet && selectedOrder.ChiTiet.length > 0 ? (
                      selectedOrder.ChiTiet.map((item, idx) => (
                        <tr key={item.ChiTietPhieuID} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <strong style={{ color: '#0F172A' }}>{item.DichVu?.TenDichVu}</strong>
                            {item.DichVu?.LoaiDichVu && (
                              <div style={{ fontSize: '11px', color: '#0284C7', fontWeight: 600 }}>
                                Phân loại: {item.DichVu.LoaiDichVu}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748B' }}>
                            {date(item.NgaySuDung)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                            {item.SoLuong} {item.DichVu?.DonViTinh || 'lượt'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748B' }}>
                            {vnd(item.DonGia)}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#DC2626' }}>
                            {vnd(item.ThanhTien)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '14px', textAlign: 'center', color: '#64748B' }}>
                          Chi tiết các dịch vụ được tổng hợp theo hợp đồng nguyên tắc ({selectedOrder.GhiChu})
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                    <tr>
                      <td colSpan={5} style={{ padding: '12px', textAlign: 'right', fontWeight: 800, fontSize: '13.5px' }}>
                        TỔNG CỘNG CHI PHÍ NCC:
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, fontSize: '16px', color: '#DC2626' }}>
                        {vnd(selectedOrder.TongTienDichVu)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* THAO TÁC TRẠNG THÁI PHIẾU ĐẶT DỊCH VỤ */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Trạng thái phiếu hiện tại:</span>
                <div style={{ marginTop: '2px' }}><Status value={selectedOrder.TrangThai} /></div>
                {selectedOrder.LyDoTuChoi && (
                  <div style={{ fontSize: '11.5px', color: '#DC2626', marginTop: '4px' }}>
                    Lý do: {selectedOrder.LyDoTuChoi}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {selectedOrder.TrangThai === 'Moi tao' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.PhieuDatID, 'Da gui NCC')}
                  >
                    Gửi NCC
                  </button>
                )}
                {selectedOrder.TrangThai === 'Da gui NCC' && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.PhieuDatID, 'NCC xac nhan')}
                      style={{ background: '#16A34A', borderColor: '#16A34A' }}
                    >
                      NCC xác nhận
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleUpdateOrderStatus(selectedOrder.PhieuDatID, 'NCC tu choi')}
                      style={{ color: '#DC2626', borderColor: '#DC2626' }}
                    >
                      NCC từ chối
                    </button>
                  </>
                )}
                {selectedOrder.TrangThai !== 'Da huy' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleUpdateOrderStatus(selectedOrder.PhieuDatID, 'Da huy')}
                    style={{ color: '#64748B' }}
                  >
                    Hủy phiếu
                  </button>
                )}
              </div>
            </div>

            {/* PHẦN HÓA ĐƠN GTGT & CHỨNG TỪ THANH TOÁN */}
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} color="#16A34A" />
                <strong style={{ fontSize: '13.5px', color: '#166534', textTransform: 'uppercase' }}>
                  Hóa Đơn Tài Chính & Chứng Từ Thanh Toán Hợp Lệ
                </strong>
              </div>
              {(() => {
                const totalCost = Number(selectedOrder.TongTienDichVu);
                const deposit = Number(selectedOrder.TienDaCoc);
                const rem = Math.max(0, totalCost - deposit);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#4B5563' }}>Số hóa đơn VAT:</span>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {selectedOrder.SoHoaDonNCC || `HD-${selectedOrder.MaPhieu}`}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#4B5563' }}>MST Nhà cung cấp:</span>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {selectedOrder.NhaCungCap?.MaSoThue || '0102345678'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#4B5563' }}>Hạn thanh toán:</span>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {selectedOrder.HanThanhToan ? date(selectedOrder.HanThanhToan) : 'Theo chu kỳ chuyến'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#4B5563' }}>Tình trạng công nợ:</span>
                      <div style={{ fontWeight: 800, color: rem > 0 ? '#DC2626' : '#16A34A', marginTop: '2px' }}>
                        {rem > 0 ? `Còn nợ: ${vnd(rem)}` : 'Đã thanh toán đủ'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setSelectedOrder(null)}>
                Đóng lại
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert(`Đã xuất phiếu chi & bảng kê dịch vụ ${selectedOrder.MaPhieu} thành công!`);
                  setSelectedOrder(null);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileSpreadsheet size={14} /> In Bảng Kê Chi Tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LẬP PHIẾU ĐẶT DỊCH VỤ NCC MỚI */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '16px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  Lập Phiếu Đặt Dịch Vụ Nhà Cung Cấp Mới
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0' }}>
                  Gán dịch vụ phòng khách sạn, xe vận chuyển hoặc ăn uống vào chuyến đi
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  Chọn Chuyến đi / Đợt khởi hành: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  className="select"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={selectedLichId}
                  onChange={(e) => setSelectedLichId(Number(e.target.value))}
                >
                  {departuresApi.data?.map((d) => (
                    <option key={d.LichID} value={d.LichID}>
                      {d.MaLich} — {d.Tour.TenTour} ({new Date(d.NgayKhoiHanh).toLocaleDateString('vi-VN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '4px' }}>
                  Chọn Nhà Cung Cấp: <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  className="select"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(Number(e.target.value));
                    setOrderItems([]);
                  }}
                >
                  {suppliersApi.data?.map((s) => (
                    <option key={s.NhaCungCapID} value={s.NhaCungCapID}>
                      {s.TenNCC} ({LOAI[s.LoaiNCC] || s.LoaiNCC})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CHỌN CÁC DỊCH VỤ TỪ BẢNG GIÁ CỦA NCC NÀY */}
            {currentSupplier && (
              <div style={{ marginBottom: '16px', background: '#F8FAFC', padding: '14px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: '8px' }}>
                  Chọn mục dịch vụ / loại phòng từ {currentSupplier.TenNCC}:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentSupplier.DichVu?.map((dv) => {
                    const isAdded = orderItems.some((i) => i.DichVuNCCID === dv.DichVuNCCID);
                    return (
                      <button
                        key={dv.DichVuNCCID}
                        type="button"
                        onClick={() => handleAddOrderItem(dv.DichVuNCCID)}
                        style={{
                          background: isAdded ? '#EFF6FF' : '#FFFFFF',
                          border: isAdded ? '1.5px solid #0284C7' : '1px solid #CBD5E1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{isAdded ? '✓' : '+'}</span>
                        <span>{dv.TenDichVu}</span>
                        <strong style={{ color: '#DC2626' }}>{vnd(dv.DonGia)}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BẢNG CÁC MỤC DỊCH VỤ ĐÃ CHỌN VÀ NHẬP SỐ LƯỢNG */}
            {orderItems.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
                  Các dịch vụ đã chọn trong phiếu ({orderItems.length} mục):
                </div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ background: '#F1F5F9' }}>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Dịch vụ / Phòng</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Số lượng</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => {
                        const dv = currentSupplier?.DichVu.find((d) => d.DichVuNCCID === item.DichVuNCCID);
                        const rowTotal = dv ? Number(dv.DonGia) * item.SoLuong : 0;
                        return (
                          <tr key={item.DichVuNCCID} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600 }}>{dv?.TenDichVu}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min={1}
                                value={item.SoLuong}
                                onChange={(e) => handleUpdateItemQty(item.DichVuNCCID, Number(e.target.value))}
                                style={{ width: '55px', padding: '3px 6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #CBD5E1', fontWeight: 700 }}
                              />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{vnd(dv?.DonGia || 0)}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>
                              {vnd(rowTotal)}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.DichVuNCCID, 0)}
                                style={{ border: 'none', background: 'transparent', color: '#DC2626', cursor: 'pointer', fontWeight: 800 }}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ background: '#F8FAFC', fontWeight: 800 }}>
                      <tr>
                        <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right' }}>Tổng chi phí tính toán:</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#DC2626', fontSize: '14px' }}>
                          {vnd(calculateNewOrderTotal())}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                  Tiền đã đặt cọc cho NCC:
                </label>
                <input
                  type="number"
                  className="input"
                  style={{ width: '100%', fontSize: '13px', fontWeight: 700 }}
                  value={tienCoc}
                  onChange={(e) => setTienCoc(Number(e.target.value))}
                  placeholder="0 đ"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                  Ghi chú điều hành / Số hợp đồng:
                </label>
                <input
                  className="input"
                  style={{ width: '100%', fontSize: '13px' }}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="VD: HĐ-2026/NOVOTEL-DN..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setIsCreateModalOpen(false)}>
                Hủy bỏ
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveOrder}
                disabled={creating || orderItems.length === 0}
                style={{ fontWeight: 800 }}
              >
                {creating ? 'Đang lưu...' : 'Xác nhận tạo phiếu đặt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
