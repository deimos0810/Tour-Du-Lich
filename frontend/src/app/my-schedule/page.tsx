'use client';
import { useState, useRef, useEffect } from 'react';
import { api, useApi, getImageUrl } from '@/lib/api';
import { ApiNotice, Status, date, vnd, uiAlert, uiConfirm } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays,
  UserCheck,
  CheckCircle2,
  XCircle,
  QrCode,
  Users,
  MapPin,
  Clock,
  Car,
  Building2,
  Phone,
  FileText,
  DollarSign,
  Award,
  AlertCircle,
  RefreshCw,
  Search,
  Camera,
  Printer,
  CheckSquare,
  Ticket,
} from 'lucide-react';

type Passenger = {
  ChiTietID: number;
  HoTen: string;
  GioiTinh?: string;
  NgaySinh?: string | null;
  CCCD?: string | null;
  SoGiayTo?: string | null;
  LoaiKhach: string;
  SoGhe?: string | null;
  TrangThaiDiemDanh: number;
  MaQRVe?: string | null;
  GhiChu?: string | null;
  DonDatTour?: {
    MaDon: string;
    KhachHang?: {
      HoTen: string;
      SoDienThoai?: string;
    };
  };
};

type ItineraryDay = {
  day?: number;
  title?: string;
  desc?: string;
  image?: string | null;
  highlights?: string[];
  meals?: string[] | string | null;
};

type SupplierDetail = {
  ChiTietID: number;
  SoLuong: number;
  DonGia: number | string;
  ThanhTien: number | string;
  DichVu?: {
    TenDichVu: string;
    LoaiDichVu: string;
    DonViTinh: string;
  };
};

type SupplierOrder = {
  PhieuID: number;
  MaPhieu: string;
  TongTienDichVu: number | string;
  SoHoaDon?: string | null;
  NhaCungCap?: {
    TenNhaCungCap: string;
    LoaiDichVu: string;
    SoDienThoai?: string;
  };
  ChiTiet?: SupplierDetail[];
};

type Assignment = {
  DieuPhoiID: number;
  TrangThai: string;
  VaiTro?: string;
  tongKhach: number;
  daDiemDanh: number;
  LichKhoiHanh: {
    LichID: number;
    MaLich: string;
    NgayKhoiHanh: string;
    NgayKetThuc: string;
    TrangThai: string;
    Tour: {
      TourID: number;
      MaTour: string;
      TenTour: string;
      DiemKhoiHanh: string;
      DiemDen: string;
      ThoiGian: string;
      LichTrinh: string;
      PhuongTien: string;
      HinhAnhURL?: string;
      DichVuDiKem?: string;
    };
    DonDatTour: {
      MaDon: string;
      TrangThaiDon: string;
      KhachHang?: {
        HoTen: string;
        SoDienThoai?: string;
      };
      ChiTietHanhKhach: Passenger[];
    }[];
    PhieuDatDichVu?: SupplierOrder[];
  };
};

type GuideScheduleData = {
  isSupervisor?: boolean;
  allGuides?: {
    HDVID: number;
    HoTen: string;
    SoTheHDV: string;
    NgonNgu?: string;
    TrangThai: string;
    SoDienThoai?: string;
  }[];
  hdv: {
    HDVID: number;
    HoTen: string;
    SoTheHDV: string;
    NgonNgu?: string;
  };
  lich: Assignment[];
};

type PayrollTour = {
  DieuPhoiID: number;
  MaLich: string;
  TenTour: string;
  NgayKhoiHanh: string;
  NgayKetThuc: string;
  TrangThai: string;
  soNgay: number;
  tienCong: number;
  phuCap: number;
  daChot: boolean;
};

type PayrollGuide = {
  HDVID: number;
  HoTen: string;
  SoTheHDV: string;
  SoDienThoai?: string;
  soTour: number;
  soNgay: number;
  tienCong: number;
  phuCap: number;
  tongThuNhap: number;
  tours: PayrollTour[];
};

type PayrollResponse = {
  thang: string;
  donGiaNgay: number;
  quyDinh: {
    DON_GIA_NGAY: number;
    PHU_CAP_DOAN: number;
  };
  data: PayrollGuide[];
};

// Helper: Phân tích metadata trong GhiChu của hành khách
function parsePaxMeta(pax: Passenger) {
  const note = pax.GhiChu || '';
  const seatMatch = note.match(/Gh[ếe]:?\s*([0-9A-Za-z]+)/i);
  const genderMatch = note.match(/Gi[ớo]i t[íi]nh:?\s*([^\s|;]+)/i);
  const pickupMatch = note.match(/[ĐD][óo]n:?\s*([^|;]+)/i);
  const checkinTimeMatch = note.match(/[ĐD]i[ểe]m danh:?\s*([0-9/:\s-]+)/i);

  return {
    soGhe: seatMatch ? seatMatch[1] : (pax.SoGhe || null),
    gioiTinh: genderMatch ? genderMatch[1] : (pax.GioiTinh || 'N/A'),
    diemDon: pickupMatch ? pickupMatch[1].trim() : 'Cổng điểm tập trung',
    diemDanhLuc: checkinTimeMatch ? checkinTimeMatch[1].trim() : null,
    soGiayTo: pax.CCCD || pax.SoGiayTo || 'Chưa cập nhật',
  };
}

export default function GuideWorkspacePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'PAYROLL'>('SCHEDULE');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const primaryRole = user?.primaryRole || 'Guest';
  const isAdminOrCoordinator = primaryRole === 'Admin' || primaryRole === 'Dieu hanh';
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);

  // APIs
  const scheduleUrl = selectedGuideId ? `/guide/my-schedule?hdvId=${selectedGuideId}` : '/guide/my-schedule';
  const scheduleApi = useApi<GuideScheduleData>(scheduleUrl);
  const payrollApi = useApi<PayrollResponse>('/guide-payroll');

  // Modal State
  const [inspectingAssignment, setInspectingAssignment] = useState<Assignment | null>(null);
  const [inspectingItinerary, setInspectingItinerary] = useState<Assignment | null>(null);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [processingCheckin, setProcessingCheckin] = useState(false);
  const [passengerSearch, setPassengerSearch] = useState('');
  const [paxStatusFilter, setPaxStatusFilter] = useState<'ALL' | 'UNCHECKED' | 'CHECKED'>('ALL');

  // Camera QR Scanner Modal State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Boarding Pass / E-Ticket Modal State
  const [viewingTicketPax, setViewingTicketPax] = useState<Passenger | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Âm thanh Beep báo hiệu quét thành công
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  };

  // Quản lý Webcam Stream khi mở Camera Scanner
  useEffect(() => {
    if (!isCameraScannerOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    setCameraError(null);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Camera access not available:', err);
        setCameraError('Không thể mở camera thiết bị. Bạn có thể chọn vé mẫu bên dưới để kiểm tra quy trình điểm danh.');
      });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraScannerOpen]);

  // Xác nhận nhận tour hoặc từ chối
  const handleRespond = async (assignmentId: number, trangThai: 'Chap nhan' | 'Tu choi') => {
    const actionLabel = trangThai === 'Chap nhan' ? 'xác nhận nhận tour' : 'từ chối tour';
    const ok = await uiConfirm(`Bạn có chắc chắn muốn ${actionLabel} này không?`, {
      title: trangThai === 'Chap nhan' ? 'Xác nhận nhận đoàn' : 'Xác nhận từ chối đoàn',
      confirmText: trangThai === 'Chap nhan' ? 'Xác nhận nhận tour' : 'Từ chối tour',
      danger: trangThai === 'Tu choi',
    });
    if (!ok) return;

    try {
      await api(`/assignments/${assignmentId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ TrangThai: trangThai }),
      });
      showToast(`Đã ${actionLabel} thành công!`);
      void scheduleApi.reload();
    } catch (err: any) {
      uiAlert(err.message || 'Lỗi cập nhật trạng thái phân công', { type: 'error', title: 'Lỗi phân công' });
    }
  };

  // Điểm danh trực tiếp từng hành khách (đã điểm danh thì khóa không cho chỉnh lại chưa điểm danh)
  const handleToggleCheckin = async (paxId: number, currentStatus?: number) => {
    if (currentStatus === 1) {
      uiAlert('Hành khách này đã được điểm danh lên đoàn, không được phép chỉnh lại thành Chưa điểm danh!', {
        type: 'warning',
        title: 'Đã khóa điểm danh',
      });
      return;
    }
    try {
      await api(`/guide/checkin-toggle/${paxId}`, { method: 'PATCH' });
      playBeep();
      showToast('Đã xác nhận điểm danh hành khách lên đoàn thành công!');
      void scheduleApi.reload();

      // Cập nhật state modal nếu đang mở
      if (inspectingAssignment) {
        setInspectingAssignment((prev) => {
          if (!prev) return null;
          const updatedDons = prev.LichKhoiHanh.DonDatTour.map((d) => ({
            ...d,
            ChiTietHanhKhach: d.ChiTietHanhKhach.map((p) =>
              p.ChiTietID === paxId ? { ...p, TrangThaiDiemDanh: 1 } : p
            ),
          }));
          const allPax = updatedDons.flatMap((d) => d.ChiTietHanhKhach);
          return {
            ...prev,
            LichKhoiHanh: { ...prev.LichKhoiHanh, DonDatTour: updatedDons },
            daDiemDanh: allPax.filter((p) => p.TrangThaiDiemDanh === 1).length,
          };
        });
      }
    } catch (err: any) {
      uiAlert(err.message || 'Lỗi cập nhật điểm danh', { type: 'error', title: 'Không thể điểm danh' });
    }
  };

  // Điểm danh bằng nhập mã QR hoặc mã đơn
  const handleQrCheckin = async (customCode?: string) => {
    const targetCode = customCode || qrCodeInput.trim();
    if (!targetCode) return;
    setProcessingCheckin(true);
    try {
      const res: any = await api('/guide/checkin-qr', {
        method: 'POST',
        body: JSON.stringify({
          code: targetCode,
          lichId: inspectingAssignment?.LichKhoiHanh.LichID,
        }),
      });
      playBeep();
      showToast(res.message || 'Điểm danh qua mã vé QR thành công!');
      setQrCodeInput('');
      if (isCameraScannerOpen) setIsCameraScannerOpen(false);
      void scheduleApi.reload();

      if (inspectingAssignment) {
        setTimeout(async () => {
          const freshData = await api<GuideScheduleData>(scheduleUrl);
          const matched = freshData.lich.find((l) => l.DieuPhoiID === inspectingAssignment.DieuPhoiID);
          if (matched) setInspectingAssignment(matched);
        }, 300);
      }
    } catch (err: any) {
      uiAlert(err.message || 'Mã vé/QR không hợp lệ hoặc không thuộc chuyến này', { type: 'error', title: 'Lỗi quét vé QR' });
    } finally {
      setProcessingCheckin(false);
    }
  };

  // Điểm danh tất cả hành khách trong đoàn (khóa chiều hủy điểm danh)
  const handleBatchCheckin = async (status: number) => {
    if (!inspectingAssignment) return;
    if (status === 0) {
      uiAlert('Hành khách đã điểm danh không được phép chỉnh lại thành Chưa điểm danh!', {
        type: 'warning',
        title: 'Đã khóa điểm danh',
      });
      return;
    }
    const ok = await uiConfirm('Bạn có chắc chắn muốn điểm danh tất cả hành khách trong đoàn này không? (Sau khi điểm danh sẽ không thể hoàn tác về chưa điểm danh)', {
      title: 'Xác nhận điểm danh toàn đoàn',
      confirmText: 'Điểm danh tất cả',
    });
    if (!ok) return;

    try {
      const res: any = await api(`/guide/batch-checkin/${inspectingAssignment.LichKhoiHanh.LichID}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 1 }),
      });
      playBeep();
      showToast(res.message || 'Điểm danh toàn đoàn thành công!');
      void scheduleApi.reload();

      setTimeout(async () => {
        const freshData = await api<GuideScheduleData>(scheduleUrl);
        const matched = freshData.lich.find((l) => l.DieuPhoiID === inspectingAssignment.DieuPhoiID);
        if (matched) setInspectingAssignment(matched);
      }, 300);
    } catch (err: any) {
      uiAlert(err.message || 'Lỗi thực hiện thao tác hàng loạt', { type: 'error', title: 'Lỗi điểm danh hàng loạt' });
    }
  };

  // Phân tích lịch trình theo ngày (JSON hoặc text)
  const parseItinerary = (raw?: string): ItineraryDay[] => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => {
          let cleanTitle = String(item.title || item.tieuDe || `Ngày ${idx + 1}`).trim();
          cleanTitle = cleanTitle.replace(/^(?:Ngày|Day)\s*\d+[:\.\-]\s*/i, '').trim();
          if (!cleanTitle) cleanTitle = `Hành trình Ngày ${idx + 1}`;
          return {
            day: item.day || idx + 1,
            title: cleanTitle,
            desc: item.detail || item.desc || '',
            image: item.image || null,
            highlights: Array.isArray(item.highlights) ? item.highlights : [],
            meals: item.meals || null,
          };
        });
      }
    } catch {
      // plain text fallback
    }
    return raw.split(/\r?\n\r?\n/).filter(Boolean).map((block, idx) => ({
      day: idx + 1,
      title: `Ngày ${idx + 1}`,
      desc: block,
      image: null,
      highlights: [],
      meals: null,
    }));
  };

  // Lấy dữ liệu bảng lương HDV hiện tại
  const myPayroll = payrollApi.data?.data?.find(
    (g) => g.SoTheHDV === scheduleApi.data?.hdv?.SoTheHDV || g.HDVID === scheduleApi.data?.hdv?.HDVID
  );

  const filteredLich = (scheduleApi.data?.lich || []).filter((item) => {
    if (statusFilter === 'ACTIVE') {
      return ['Da phan cong', 'Chap nhan', 'Dang thuc hien'].includes(item.TrangThai);
    }
    if (statusFilter === 'COMPLETED') {
      return item.TrangThai === 'Hoan thanh';
    }
    return true;
  });

  return (
    <>
      {/* HEADER: GỌN GÀNG, CHUYÊN NGHIỆP, ENTERPRISE UI */}
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Lịch Dẫn Tour & Điều Phối Đoàn</h1>
          <p className="page-desc" style={{ marginTop: '4px' }}>
            Theo dõi lịch phân công hướng dẫn viên, danh sách đoàn và điểm danh khởi hành
          </p>
        </div>

        {/* KHU VỰC CHỌN HDV & THÔNG TIN HDV */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {(isAdminOrCoordinator || scheduleApi.data?.isSupervisor) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--zinc-600)', fontWeight: 600 }}>
                Hướng dẫn viên:
              </span>
              <select
                className="select"
                value={selectedGuideId || scheduleApi.data?.hdv?.HDVID || ''}
                onChange={(e) => setSelectedGuideId(Number(e.target.value))}
                style={{
                  minWidth: '230px',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                {(scheduleApi.data?.allGuides || []).map((g) => (
                  <option key={g.HDVID} value={g.HDVID}>
                    {g.HoTen} ({g.SoTheHDV})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BADGE THÔNG TIN HDV: NỀN TRẮNG, VIỀN MẢNH, CHUẨN DOANH NGHIỆP */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--zinc-100)',
                color: 'var(--zinc-800)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {scheduleApi.data?.hdv?.HoTen?.charAt(0) || 'H'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--zinc-900)' }}>
                {scheduleApi.data?.hdv?.HoTen || 'Lê Hoàng Nam'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--zinc-500)' }}>
                {scheduleApi.data?.hdv?.SoTheHDV || 'HDV-QUOCTE-8891'} • {scheduleApi.data?.hdv?.NgonNgu || 'Tiếng Anh, Tiếng Việt'}
              </div>
            </div>
          </div>
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

      <ApiNotice error={scheduleApi.error} />

      {/* TABS CHÍNH */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
        <button
          className={`btn ${activeTab === 'SCHEDULE' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('SCHEDULE')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
        >
          <CalendarDays size={14} />
          <span>Lịch Dẫn Tour ({scheduleApi.data?.lich?.length || 0})</span>
        </button>
        <button
          className={`btn ${activeTab === 'PAYROLL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => {
            setActiveTab('PAYROLL');
            payrollApi.reload();
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
        >
          <DollarSign size={14} />
          <span>Bảng Tính Công & Thù Lao</span>
        </button>
      </div>

      {/* =========================================================================
       * TAB 1: LỊCH DẪN TOUR & ĐIỂM DANH ĐOÀN
       * =======================================================================*/}
      {activeTab === 'SCHEDULE' && (
        <div>
          {/* FILTER SUB-TABS */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { key: 'ALL', label: `Tất cả chuyến (${scheduleApi.data?.lich?.length || 0})` },
              { key: 'ACTIVE', label: 'Chuyến sắp đi & đang dẫn' },
              { key: 'COMPLETED', label: 'Đã hoàn thành' },
            ].map((f) => (
              <button
                key={f.key}
                className={`btn btn-sm ${statusFilter === f.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusFilter(f.key as any)}
                style={{ fontSize: '12.5px', fontWeight: statusFilter === f.key ? 600 : 400 }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* DANH SÁCH TOUR ĐƯỢC PHÂN CÔNG */}
          {filteredLich.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
              <Users size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B' }}>
                Không có lịch dẫn tour nào trong danh mục này
              </div>
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>
                Khi bộ phận điều hành phân công tour, danh sách chuyến đi và hành khách sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '18px' }}>
              {filteredLich.map((item) => {
                const tour = item.LichKhoiHanh?.Tour;
                const dep = item.LichKhoiHanh;
                const checkinPct = item.tongKhach > 0 ? Math.round((item.daDiemDanh / item.tongKhach) * 100) : 0;

                return (
                  <div
                    key={item.DieuPhoiID}
                    className="card"
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {/* CARD HEADER */}
                    <div
                      style={{
                        padding: '14px 18px',
                        background: '#F8FAFC',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="code" style={{ fontSize: '11.5px', fontWeight: 700 }}>
                            {dep?.MaLich}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>• {tour?.MaTour}</span>
                        </div>
                        <h3 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                          {tour?.TenTour}
                        </h3>
                      </div>
                      <Status value={item.TrangThai} />
                    </div>

                    {/* CARD BODY */}
                    <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* THÔNG TIN KHỞI HÀNH */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <CalendarDays size={14} color="#475569" />
                          <span>
                            {date(dep?.NgayKhoiHanh)} - {date(dep?.NgayKetThuc)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <Clock size={14} color="#475569" />
                          <span>Thời lượng: <strong>{tour?.ThoiGian || 'N/A'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <MapPin size={14} color="#475569" />
                          <span>Tuyến: {tour?.DiemKhoiHanh} → {tour?.DiemDen}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <Car size={14} color="#475569" />
                          <span>Phương tiện: {tour?.PhuongTien || 'Xe du lịch'}</span>
                        </div>
                      </div>

                      {/* TIẾN ĐỘ ĐIỂM DANH ĐOÀN */}
                      <div
                        style={{
                          background: '#F8FAFC',
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <UserCheck size={13} /> Điểm danh khách:
                          </span>
                          <span style={{ fontWeight: 700, color: checkinPct === 100 ? '#059669' : '#0F172A' }}>
                            {item.daDiemDanh} / {item.tongKhach} khách ({checkinPct}%)
                          </span>
                        </div>
                        <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${checkinPct}%`,
                              background: checkinPct === 100 ? '#10B981' : '#0F172A',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>

                      {/* DỊCH VỤ NCC LIÊN KẾT */}
                      {dep?.PhieuDatDichVu && dep.PhieuDatDichVu.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={13} color="#475569" /> Dịch vụ nhà cung cấp tour:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {dep.PhieuDatDichVu.map((p) => (
                              <span
                                key={p.PhieuID}
                                style={{
                                  background: '#F1F5F9',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11.5px',
                                  color: '#334155',
                                }}
                              >
                                {p.NhaCungCap?.TenNhaCungCap} ({p.NhaCungCap?.LoaiDichVu})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CARD FOOTER ACTIONS */}
                    <div
                      style={{
                        padding: '12px 18px',
                        background: '#FAFAFA',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setInspectingItinerary(item)}
                          style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FileText size={13} />
                          <span>Lịch trình & Ảnh</span>
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setInspectingAssignment(item)}
                          style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <UserCheck size={13} />
                          <span>Danh sách đoàn & Soát vé QR</span>
                        </button>
                      </div>

                      {item.TrangThai === 'Da phan cong' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#10B981', color: '#FFF', fontSize: '12px', fontWeight: 600 }}
                            onClick={() => handleRespond(item.DieuPhoiID, 'Chap nhan')}
                          >
                            Xác nhận nhận tour
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: '#DC2626', borderColor: '#FCA5A5', fontSize: '12px' }}
                            onClick={() => handleRespond(item.DieuPhoiID, 'Tu choi')}
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
       * TAB 2: BẢNG TÍNH CÔNG & THÙ LAO
       * =======================================================================*/}
      {activeTab === 'PAYROLL' && (
        <div>
          {/* 4 THẺ TỔNG HỢP THU NHẬP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>TỔNG SỐ TOUR ĐÃ DẪN</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {myPayroll?.soTour || 0} <span style={{ fontSize: '14px', fontWeight: 500 }}>tour</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                Tổng {myPayroll?.soNgay || 0} ngày đi tour
              </div>
            </div>

            <div className="card" style={{ padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>TIỀN CÔNG DẪN TOUR</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {vnd(myPayroll?.tienCong || 0)}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                Đơn giá tiêu chuẩn: {vnd(payrollApi.data?.donGiaNgay || 600000)}/ngày
              </div>
            </div>

            <div className="card" style={{ padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>PHỤ CẤP ĐOÀN CÔNG TÁC</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {vnd(myPayroll?.phuCap || 0)}
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                Định mức: 300.000đ/chuyến
              </div>
            </div>

            <div className="card" style={{ padding: '16px', borderRadius: '8px', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>TỔNG THỰC LÃNH</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803D', marginTop: '4px' }}>
                {vnd(myPayroll?.tongThuNhap || 0)}
              </div>
              <div style={{ fontSize: '11.5px', color: '#166534', marginTop: '2px' }}>
                Kỳ tháng {payrollApi.data?.thang || '10/2026'}
              </div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT TỪNG CHUYẾN ĐI VÀ TIỀN CÔNG */}
          <div className="card">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="#475569" />
                <h2 className="card-title" style={{ margin: 0, fontSize: '14px' }}>
                  Bảng Chi Tiết Thù Lao Dẫn Tour Tháng {payrollApi.data?.thang || '10/2026'}
                </h2>
              </div>
            </div>

            <div className="table-wrap">
              <table className="table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>MÃ CHUYẾN & TÊN TOUR</th>
                    <th>THỜI GIAN ĐI</th>
                    <th style={{ textAlign: 'center' }}>SỐ NGÀY</th>
                    <th style={{ textAlign: 'right' }}>TIỀN CÔNG</th>
                    <th style={{ textAlign: 'right' }}>PHỤ CẤP ĐOÀN</th>
                    <th style={{ textAlign: 'right' }}>TỔNG CỘNG THỰC LÃNH</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {myPayroll?.tours && myPayroll.tours.length > 0 ? (
                    myPayroll.tours.map((t) => (
                      <tr key={t.DieuPhoiID}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0F172A' }}>{t.TenTour}</div>
                          <div className="code" style={{ fontSize: '11.5px', marginTop: '2px' }}>{t.MaLich}</div>
                        </td>
                        <td style={{ fontSize: '12.5px' }}>
                          {date(t.NgayKhoiHanh)} - {date(t.NgayKetThuc)}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.soNgay} ngày</td>
                        <td style={{ textAlign: 'right', fontWeight: 500 }}>{vnd(t.tienCong)}</td>
                        <td style={{ textAlign: 'right', color: '#475569' }}>{vnd(t.phuCap)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                          {vnd(t.tienCong + t.phuCap)}
                        </td>
                        <td>
                          <Status value={t.TrangThai} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                        Chưa có dữ liệu thù lao tour hoàn thành trong kỳ này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL 1: DANH SÁCH ĐOÀN & ĐIỂM DANH HÀNH KHÁCH
       * =======================================================================*/}
      {inspectingAssignment && (() => {
        const allPax = inspectingAssignment.LichKhoiHanh.DonDatTour.flatMap((don) =>
          don.ChiTietHanhKhach.map((p) => ({ ...p, DonDatTour: don }))
        );

        const checkedPaxList = allPax.filter((p) => p.TrangThaiDiemDanh === 1);
        const uncheckedPaxList = allPax.filter((p) => p.TrangThaiDiemDanh !== 1);
        const totalPaxCount = allPax.length;
        const checkedPaxCount = checkedPaxList.length;
        const attendancePct = totalPaxCount > 0 ? Math.round((checkedPaxCount / totalPaxCount) * 100) : 0;

        const filteredPax = allPax.filter((p) => {
          if (paxStatusFilter === 'UNCHECKED' && p.TrangThaiDiemDanh === 1) return false;
          if (paxStatusFilter === 'CHECKED' && p.TrangThaiDiemDanh !== 1) return false;

          if (!passengerSearch.trim()) return true;
          const q = passengerSearch.toLowerCase();
          const meta = parsePaxMeta(p);
          return (
            p.HoTen?.toLowerCase().includes(q) ||
            meta.soGiayTo.toLowerCase().includes(q) ||
            (meta.soGhe && meta.soGhe.toLowerCase().includes(q)) ||
            p.DonDatTour?.KhachHang?.HoTen?.toLowerCase().includes(q) ||
            p.DonDatTour?.KhachHang?.SoDienThoai?.includes(q) ||
            p.MaQRVe?.toLowerCase().includes(q) ||
            p.DonDatTour?.MaDon?.toLowerCase().includes(q)
          );
        });

        return (
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
                maxWidth: '980px',
                width: '100%',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              {/* MODAL HEADER */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  background: '#F8FAFC',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                    Danh Sách Hành Khách & Soát Vé Khởi Hành
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Chuyến: <strong>{inspectingAssignment.LichKhoiHanh?.Tour?.TenTour}</strong> | Mã lịch: <span className="code">{inspectingAssignment.LichKhoiHanh?.MaLich}</span> | Khởi hành: <strong>{date(inspectingAssignment.LichKhoiHanh?.NgayKhoiHanh)}</strong>
                  </div>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setInspectingAssignment(null)}
                  style={{ padding: '4px 8px' }}
                >
                  ✕
                </button>
              </div>

              {/* MODAL BODY */}
              <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
                {/* TIẾN ĐỘ ĐIỂM DANH */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                      Tiến độ có mặt: {checkedPaxCount}/{totalPaxCount} khách ({attendancePct}%)
                    </div>
                    {attendancePct === 100 ? (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                        Đã tập trung đủ 100% đoàn
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}>
                        Còn thiếu {uncheckedPaxList.length} khách
                      </span>
                    )}
                  </div>
                  <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${attendancePct}%`,
                        background: attendancePct === 100 ? '#16A34A' : '#2563EB',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>

                {/* THANH CÔNG CỤ SOÁT VÉ QR & CAMERA */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <QrCode size={20} color="#475569" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        Soát vé nhanh bằng mã QR / Mã vé / Mã đơn
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                        Quét qua camera thiết bị hoặc nhập chuỗi ký tự vé để đối soát tức thì
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setIsCameraScannerOpen(true)}
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Camera size={14} />
                      <span>Mở Camera Quét QR</span>
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Nhập mã QR vé hoặc mã đơn..."
                        value={qrCodeInput}
                        onChange={(e) => setQrCodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQrCheckin();
                        }}
                        style={{ width: '220px', fontSize: '12.5px' }}
                      />
                      <button
                        className="btn btn-outline"
                        onClick={() => handleQrCheckin()}
                        disabled={processingCheckin || !qrCodeInput.trim()}
                        style={{ fontSize: '12.5px', padding: '6px 12px' }}
                      >
                        {processingCheckin ? 'Đang soát...' : 'Điểm danh'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* THANH TÁC VỤ & BỘ LỌC TRẠNG THÁI */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  {/* BỘ LỌC TAB */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { key: 'ALL', label: `Tất cả (${totalPaxCount})` },
                      { key: 'UNCHECKED', label: `Chưa có mặt (${uncheckedPaxList.length})` },
                      { key: 'CHECKED', label: `Đã có mặt (${checkedPaxCount})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        className={`btn btn-sm ${paxStatusFilter === tab.key ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setPaxStatusFilter(tab.key as any)}
                        style={{ fontSize: '12px', fontWeight: paxStatusFilter === tab.key ? 600 : 400 }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* THAO TÁC HÀNG LOẠT & TÌM KIẾM */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleBatchCheckin(1)}
                      title="Điểm danh tất cả hành khách"
                      style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckSquare size={13} /> Điểm danh tất cả
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => window.print()}
                      title="In danh sách đón đoàn"
                      style={{ fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Printer size={13} /> In danh sách
                    </button>

                    <div style={{ position: 'relative', width: '200px' }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Tìm tên, ghế, CCCD..."
                        value={passengerSearch}
                        onChange={(e) => setPassengerSearch(e.target.value)}
                        style={{ width: '100%', fontSize: '12px', paddingRight: '26px' }}
                      />
                      <Search size={13} color="#94A3B8" style={{ position: 'absolute', right: '8px', top: '9px' }} />
                    </div>
                  </div>
                </div>

                {/* BẢNG DANH SÁCH CHI TIẾT HÀNH KHÁCH */}
                <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <table className="table" style={{ fontSize: '12.5px', margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        <th style={{ width: '4%', textAlign: 'center' }}>STT</th>
                        <th style={{ width: '22%' }}>HÀNH KHÁCH</th>
                        <th style={{ width: '14%' }}>CCCD / HỘ CHIẾU</th>
                        <th style={{ width: '14%', textAlign: 'center' }}>GHẾ & PHÂN LOẠI</th>
                        <th style={{ width: '20%' }}>NGƯỜI ĐẶT & SĐT</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>VÉ ĐIỆN TỬ</th>
                        <th style={{ width: '16%', textAlign: 'right' }}>TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPax.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#64748B' }}>
                            Không tìm thấy hành khách nào phù hợp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      ) : (
                        filteredPax.map((pax, idx) => {
                          const meta = parsePaxMeta(pax);
                          const isCheckedIn = pax.TrangThaiDiemDanh === 1;

                          return (
                            <tr key={pax.ChiTietID} style={{ background: isCheckedIn ? '#F0FDF4' : undefined }}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                              <td>
                                <div style={{ fontWeight: 600, color: '#0F172A' }}>{pax.HoTen}</div>
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                  Giới tính: {meta.gioiTinh} {pax.NgaySinh ? `• Sinh: ${date(pax.NgaySinh)}` : ''}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                                  Điểm đón: {meta.diemDon}
                                </div>
                              </td>
                              <td>
                                <span className="code" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                                  {meta.soGiayTo}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: pax.LoaiKhach === 'Tre em' ? '#FEF3C7' : '#F1F5F9',
                                    color: pax.LoaiKhach === 'Tre em' ? '#92400E' : '#334155',
                                    fontWeight: 500,
                                  }}
                                >
                                  {pax.LoaiKhach || 'Người lớn'}
                                </span>
                                {meta.soGhe && (
                                  <div style={{ fontSize: '11.5px', color: '#2563EB', fontWeight: 700, marginTop: '3px' }}>
                                    Ghế {meta.soGhe}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ fontWeight: 500 }}>{pax.DonDatTour?.KhachHang?.HoTen || 'Khách vãng lai'}</div>
                                {pax.DonDatTour?.KhachHang?.SoDienThoai && (
                                  <a
                                    href={`tel:${pax.DonDatTour.KhachHang.SoDienThoai}`}
                                    style={{
                                      fontSize: '11.5px',
                                      color: '#059669',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      marginTop: '2px',
                                      textDecoration: 'none',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Phone size={11} /> {pax.DonDatTour.KhachHang.SoDienThoai}
                                  </a>
                                )}
                                <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '2px' }}>
                                  Đơn: {pax.DonDatTour?.MaDon}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => setViewingTicketPax(pax)}
                                  title="Xem mã vé QR và Thẻ lên tour"
                                  style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Ticket size={12} color="#475569" /> Vé QR
                                </button>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className={`btn btn-sm ${isCheckedIn ? 'btn-outline' : 'btn-primary'}`}
                                  onClick={() => handleToggleCheckin(pax.ChiTietID, pax.TrangThaiDiemDanh)}
                                  disabled={isCheckedIn}
                                  title={
                                    isCheckedIn
                                      ? 'Đã điểm danh lên đoàn (Không thể chỉnh lại chưa điểm danh)'
                                      : 'Bấm để điểm danh hành khách này'
                                  }
                                  style={{
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    borderColor: isCheckedIn ? '#10B981' : undefined,
                                    color: isCheckedIn ? '#059669' : undefined,
                                    background: isCheckedIn ? '#ECFDF5' : undefined,
                                    fontWeight: 600,
                                    cursor: isCheckedIn ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {isCheckedIn ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={13} color="#059669" /> Đã điểm danh
                                    </span>
                                  ) : (
                                    'Điểm danh ngay'
                                  )}
                                </button>
                                {isCheckedIn && meta.diemDanhLuc && (
                                  <div style={{ fontSize: '10.5px', color: '#059669', marginTop: '3px' }}>
                                    Lúc {meta.diemDanhLuc}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border)',
                  background: '#F8FAFC',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Dữ liệu điểm danh được đồng bộ thời gian thực với trung tâm điều hành.
                </div>
                <button className="btn btn-outline" onClick={() => setInspectingAssignment(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
       * MODAL CON 1: WEBCAM / CAMERA QR SCANNER
       * =======================================================================*/}
      {isCameraScannerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              maxWidth: '500px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', color: '#0F172A' }}>
                <Camera size={16} />
                <span>Máy Quét Mã QR Vé</span>
              </div>
              <button
                onClick={() => setIsCameraScannerOpen(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '3px 7px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '18px', textAlign: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '260px',
                  background: '#0F172A',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <div
                  style={{
                    position: 'absolute',
                    width: '180px',
                    height: '180px',
                    border: '2px solid #FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {cameraError && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: '6px', textAlign: 'left' }}>
                  {cameraError}
                </div>
              )}

              <p style={{ fontSize: '12px', color: '#64748B', margin: '10px 0 14px' }}>
                Hướng camera vào mã QR vé điện tử trên điện thoại hoặc bản in của khách hàng.
              </p>

              {/* NÚT TEST NHANH VÉ MẪU */}
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600, marginBottom: '8px', textAlign: 'left' }}>
                  Chọn vé mẫu để thử nghiệm soát vé:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {inspectingAssignment?.LichKhoiHanh?.DonDatTour?.flatMap((d) => d.ChiTietHanhKhach)?.slice(0, 4)?.map((p, idx) => (
                    <button
                      key={p.ChiTietID}
                      className="btn btn-outline btn-sm"
                      onClick={() => handleQrCheckin(p.MaQRVe || undefined)}
                      style={{
                        fontSize: '11.5px',
                        background: '#FFFFFF',
                      }}
                    >
                      Vé {idx + 1}: {p.HoTen}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setIsCameraScannerOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL CON 2: XEM VÉ ĐIỆN TỬ / BOARDING PASS QR CODE
       * =======================================================================*/}
      {viewingTicketPax && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
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
              maxWidth: '420px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border)',
            }}
          >
            {/* THẺ LÊN TOUR HEADER */}
            <div
              style={{
                background: '#0F172A',
                color: '#FFF',
                padding: '16px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94A3B8' }}>
                VIETTOUR • THẺ THAM GIA TOUR DU LỊCH
              </div>
              <h3 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 700 }}>
                {inspectingAssignment?.LichKhoiHanh?.Tour?.TenTour}
              </h3>
            </div>

            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div
                style={{
                  width: '170px',
                  height: '170px',
                  margin: '0 auto 14px',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '8px',
                  background: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    viewingTicketPax.MaQRVe || 'VT-TICKET-DEMO'
                  )}`}
                  alt="Mã QR Vé"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              <div className="code" style={{ fontSize: '11.5px', fontWeight: 600, marginBottom: '12px' }}>
                {viewingTicketPax.MaQRVe}
              </div>

              {/* THÔNG TIN HÀNH KHÁCH */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  fontSize: '12.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>Hành khách:</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{viewingTicketPax.HoTen}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>CCCD / Hộ chiếu:</span>
                  <span style={{ fontWeight: 500 }}>{viewingTicketPax.CCCD || '079201001234'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>Số ghế:</span>
                  <span style={{ fontWeight: 700, color: '#2563EB' }}>
                    {parsePaxMeta(viewingTicketPax).soGhe || '01A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Khởi hành:</span>
                  <span style={{ fontWeight: 500 }}>{date(inspectingAssignment?.LichKhoiHanh?.NgayKhoiHanh)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {viewingTicketPax.TrangThaiDiemDanh === 1 ? (
                  <button
                    className="btn btn-outline"
                    disabled
                    style={{
                      flex: 1,
                      fontSize: '12.5px',
                      fontWeight: 700,
                      borderColor: '#10B981',
                      color: '#059669',
                      background: '#ECFDF5',
                      cursor: 'not-allowed',
                    }}
                  >
                    ✓ Đã điểm danh (Đã khóa)
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '12.5px', fontWeight: 600 }}
                    onClick={() => {
                      handleQrCheckin(viewingTicketPax.MaQRVe || undefined);
                      setViewingTicketPax(null);
                    }}
                  >
                    Xác Nhận Soát Vé Này
                  </button>
                )}
                <button
                  className="btn btn-outline"
                  onClick={() => setViewingTicketPax(null)}
                  style={{ fontSize: '12.5px' }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * MODAL 2: LỊCH TRÌNH TOUR TỪNG NGÀY
       * =======================================================================*/}
      {inspectingItinerary && (
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
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                background: '#F8FAFC',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Lịch Trình Chi Tiết Từng Ngày & Ảnh Điểm Đến
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                  {inspectingItinerary.LichKhoiHanh?.Tour?.TenTour} ({inspectingItinerary.LichKhoiHanh?.Tour?.ThoiGian})
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setInspectingItinerary(null)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {parseItinerary(inspectingItinerary.LichKhoiHanh?.Tour?.LichTrinh).map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: '#FFF',
                    }}
                  >
                    {day.image && (
                      <div style={{ height: '200px', width: '100%', overflow: 'hidden', background: '#F1F5F9' }}>
                        <img
                          src={getImageUrl(day.image)}
                          alt={day.title || `Ngày ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
                          }}
                        />
                      </div>
                    )}

                    <div style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span
                          style={{
                            background: '#0F172A',
                            color: '#FFF',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          NGÀY {day.day || idx + 1}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                          {day.title || `Ngày ${idx + 1}`}
                        </h4>
                      </div>

                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 10px' }}>
                        {day.desc}
                      </p>

                      {day.highlights && day.highlights.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                          {day.highlights.map((h, hIdx) => (
                            <span
                              key={hIdx}
                              style={{
                                background: '#F1F5F9',
                                color: '#334155',
                                fontSize: '11.5px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {day.meals && (
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          Bữa ăn: {Array.isArray(day.meals) ? day.meals.join(', ') : String(day.meals)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '10px 20px',
                borderTop: '1px solid var(--border)',
                background: '#F8FAFC',
              }}
            >
              <button className="btn btn-outline btn-sm" onClick={() => setInspectingItinerary(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
