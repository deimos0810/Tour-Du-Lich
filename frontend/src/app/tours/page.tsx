'use client';
import { useMemo, useRef, useState } from 'react';
import { api, getImageUrl, uploadTourImage, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, vnd, uiAlert, uiConfirm } from '@/lib/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  MapPin,
  Calendar,
  Package,
  UploadCloud,
  RefreshCw,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Utensils,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';

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

export type FormItineraryDay = {
  day: number;
  title: string;
  detail: string;
  image?: string;
  meals?: string;
  highlights?: string[];
};

export function parseLichTrinhToDays(raw: string | null | undefined): FormItineraryDay[] {
  if (!raw || !raw.trim()) {
    return [
      {
        day: 1,
        title: 'Ngày 1: Khởi hành - Điểm đến',
        detail: 'Xe và hướng dẫn viên đón đoàn tại điểm hẹn, khởi hành đi tham quan các thắng cảnh đặc sắc...',
        image: '',
        meals: 'Ăn trưa, Ăn tối',
        highlights: ['Khởi hành đúng giờ', 'Check-in khách sạn'],
      },
    ];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        day: Number(item.day || idx + 1),
        title: item.title || `Ngày ${idx + 1}`,
        detail: item.detail || item.desc || '',
        image: item.image || '',
        meals: Array.isArray(item.meals) ? item.meals.join(', ') : item.meals || '',
        highlights: Array.isArray(item.highlights)
          ? item.highlights
          : typeof item.highlights === 'string'
          ? item.highlights.split(',').map((s: string) => s.trim())
          : [],
      }));
    }
  } catch {
    // plain text
  }

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return [
      {
        day: 1,
        title: 'Ngày 1: Khởi hành',
        detail: '',
        image: '',
        meals: '',
        highlights: [],
      },
    ];
  }

  return lines.map((l, idx) => {
    const parts = l.split(':');
    if (parts.length >= 2) {
      return {
        day: idx + 1,
        title: parts[0].trim(),
        detail: parts.slice(1).join(':').trim(),
        image: '',
        meals: '',
        highlights: [],
      };
    }
    return {
      day: idx + 1,
      title: `Ngày ${idx + 1}`,
      detail: l,
      image: '',
      meals: '',
      highlights: [],
    };
  });
}

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

  // Day-by-Day itinerary state
  const [itineraryDays, setItineraryDays] = useState<FormItineraryDay[]>([]);
  const [itineraryMode, setItineraryMode] = useState<'visual' | 'raw'>('visual');
  const [uploadingDayIndex, setUploadingDayIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Upload/Replace main banner image states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const initialDays = parseLichTrinhToDays(INITIAL_FORM.LichTrinh);
    setItineraryDays(initialDays);
    setFormData({
      ...INITIAL_FORM,
      DanhMucID: cats.data && cats.data.length > 0 ? String(cats.data[0].DanhMucID) : '1',
      LichTrinh: JSON.stringify(initialDays, null, 2),
    });
    setItineraryMode('visual');
    setValidationErrors({});
    setUploadingImage(false);
    setUploadErrorMsg('');
    setUploadSuccessMsg('');
    setShowUrlInput(false);
    setShowModal(true);
  };

  const openEditModal = (t: Tour) => {
    setEditingTour(t);
    const parsedDays = parseLichTrinhToDays(t.LichTrinh);
    setItineraryDays(parsedDays);
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
      LichTrinh: t.LichTrinh || JSON.stringify(parsedDays, null, 2),
      DichVuDiKem: t.DichVuDiKem || '',
      TrangThaiDuyet: t.TrangThaiDuyet,
    });
    setItineraryMode('visual');
    setValidationErrors({});
    setUploadingImage(false);
    setUploadErrorMsg('');
    setUploadSuccessMsg('');
    setShowUrlInput(false);
    setShowModal(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadErrorMsg('Kích thước ảnh tối đa 10MB!');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadErrorMsg('Vui lòng chọn file định dạng ảnh (PNG, JPG, WEBP, GIF, SVG)!');
      return;
    }

    setUploadingImage(true);
    setUploadErrorMsg('');
    setUploadSuccessMsg('');
    try {
      const res = await uploadTourImage(file);
      setFormData((prev) => ({ ...prev, HinhAnhURL: res.url }));
      setUploadSuccessMsg('✓ Đã tải ảnh lên và tự động lưu vào folder project (/uploads/tours) thành công!');
    } catch (err) {
      setUploadErrorMsg(err instanceof Error ? err.message : 'Tải ảnh thất bại!');
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload photo for specific itinerary day
  const handleUploadDayImage = async (dayIndex: number, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      uiAlert('Kích thước ảnh ngày tối đa 10MB!', { type: 'warning', title: 'File quá lớn' });
      return;
    }
    setUploadingDayIndex(dayIndex);
    try {
      const res = await uploadTourImage(file);
      setItineraryDays((prev) => {
        const next = [...prev];
        next[dayIndex] = { ...next[dayIndex], image: res.url };
        setFormData((f) => ({ ...f, LichTrinh: JSON.stringify(next, null, 2) }));
        return next;
      });
    } catch (err: any) {
      uiAlert('Lỗi tải ảnh ngày: ' + (err?.message || 'Thất bại'), { type: 'error', title: 'Lỗi tải ảnh' });
    } finally {
      setUploadingDayIndex(null);
    }
  };

  const handleUpdateDay = (index: number, patch: Partial<FormItineraryDay>) => {
    setItineraryDays((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      setFormData((f) => ({ ...f, LichTrinh: JSON.stringify(next, null, 2) }));
      return next;
    });
  };

  const handleAddDay = () => {
    setItineraryDays((prev) => {
      const nextDayNum = prev.length + 1;
      const next = [
        ...prev,
        {
          day: nextDayNum,
          title: `Ngày ${nextDayNum}: Tiếp tục hành trình`,
          detail: 'Khám phá các điểm đến tiếp theo, dùng bữa và nghỉ ngơi...',
          image: '',
          meals: 'Ăn sáng, Ăn trưa, Ăn tối',
          highlights: [],
        },
      ];
      setFormData((f) => ({ ...f, LichTrinh: JSON.stringify(next, null, 2) }));
      return next;
    });
  };

  const handleRemoveDay = async (index: number) => {
    if (itineraryDays.length <= 1) {
      uiAlert('Lịch trình phải có ít nhất 1 ngày hành trình.', { type: 'warning' });
      return;
    }
    const ok = await uiConfirm(`Bạn có chắc chắn muốn xóa Ngày ${index + 1}?`, {
      title: 'Xác nhận xóa ngày hành trình',
      confirmText: 'Xóa ngày này',
      danger: true,
    });
    if (!ok) return;
    setItineraryDays((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      const reindexed = filtered.map((d, i) => ({ ...d, day: i + 1 }));
      setFormData((f) => ({ ...f, LichTrinh: JSON.stringify(reindexed, null, 2) }));
      return reindexed;
    });
  };

  const validateBusinessRules = () => {
    const errors: Record<string, string> = {};

    if (!formData.TenTour.trim()) {
      errors.TenTour = 'Tên chương trình tour không được để trống (Bắt buộc).';
    } else if (formData.TenTour.trim().length < 5) {
      errors.TenTour = 'Tên tour phải có độ dài tối thiểu 5 ký tự để đủ thông tin nhận diện.';
    }

    if (!formData.DanhMucID) {
      errors.DanhMucID = 'Vui lòng chọn danh mục phân loại tour.';
    }

    if (!formData.ThoiGian.trim()) {
      errors.ThoiGian = 'Thời gian tour không được để trống (VD: 3 ngày 2 đêm, 4 ngày 3 đêm).';
    }

    if (!formData.DiemKhoiHanh.trim()) {
      errors.DiemKhoiHanh = 'Điểm khởi hành tour không được để trống.';
    }

    if (!formData.DiemDen.trim()) {
      errors.DiemDen = 'Điểm đến tour không được để trống.';
    }

    const adultPrice = Number(formData.GiaNguoiLon);
    if (!formData.GiaNguoiLon || isNaN(adultPrice) || adultPrice <= 0) {
      errors.GiaNguoiLon = 'Giá vé người lớn phải là số nguyên dương lớn hơn 0.';
    }

    const childPrice = Number(formData.GiaTreEm || 0);
    if (isNaN(childPrice) || childPrice < 0) {
      errors.GiaTreEm = 'Giá vé trẻ em không được là số âm.';
    } else if (adultPrice > 0 && childPrice > adultPrice) {
      errors.GiaTreEm = 'Quy tắc nghiệp vụ: Giá vé trẻ em không được vượt quá giá vé người lớn!';
    }

    const singleRoom = Number(formData.PhuThuPhongDon || 0);
    if (isNaN(singleRoom) || singleRoom < 0) {
      errors.PhuThuPhongDon = 'Phụ thu phòng đơn không được là số âm.';
    }

    if (!formData.MoTaChiTiet.trim()) {
      errors.MoTaChiTiet = 'Mô tả tổng quan tour không được để trống (Bắt buộc giới thiệu tóm tắt tour).';
    } else if (formData.MoTaChiTiet.trim().length < 10) {
      errors.MoTaChiTiet = 'Mô tả tổng quan tour tối thiểu 10 ký tự.';
    }

    if (!formData.DichVuDiKem.trim()) {
      errors.DichVuDiKem = 'Vui lòng liệt kê dịch vụ đi kèm bao gồm trong giá tour để đảm bảo quyền lợi khách hàng.';
    }

    if (itineraryMode === 'visual') {
      if (itineraryDays.length === 0) {
        errors.LichTrinh = 'Hành trình phải có ít nhất 1 ngày tham quan.';
      } else {
        const emptyDay = itineraryDays.find((d) => !d.title.trim() && !d.detail.trim());
        if (emptyDay) {
          errors.LichTrinh = 'Các ngày trong lịch trình không được để trống hoàn toàn tiêu đề và nội dung.';
        }
      }
    } else {
      if (!formData.LichTrinh.trim()) {
        errors.LichTrinh = 'Lịch trình chi tiết từng ngày không được để trống.';
      }
    }

    return errors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateBusinessRules();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errList = Object.values(errors).join('\n• ');
      uiAlert(`Ràng buộc dữ liệu chưa đạt chuẩn quy trình nghiệp vụ:\n\n• ${errList}`, {
        type: 'warning',
        title: 'Kiểm tra thông tin Tour',
      });
      return;
    }

    setSubmitting(true);
    try {
      const finalLichTrinh =
        itineraryMode === 'visual' ? JSON.stringify(itineraryDays, null, 2) : formData.LichTrinh?.trim() || null;

      const payload = {
        TenTour: formData.TenTour.trim(),
        MaTour: formData.MaTour?.trim() || undefined,
        DanhMucID: Number(formData.DanhMucID),
        ThoiGian: formData.ThoiGian.trim(),
        DiemKhoiHanh: formData.DiemKhoiHanh.trim(),
        DiemDen: formData.DiemDen.trim(),
        GiaNguoiLon: Number(formData.GiaNguoiLon),
        GiaTreEm: Number(formData.GiaTreEm || 0),
        PhuThuPhongDon: Number(formData.PhuThuPhongDon || 0),
        PhuongTien: formData.PhuongTien?.trim() || null,
        PhongCachTour: formData.PhongCachTour?.trim() || null,
        HinhAnhURL: formData.HinhAnhURL?.trim() || null,
        MoTaChiTiet: formData.MoTaChiTiet.trim(),
        LichTrinh: finalLichTrinh,
        DichVuDiKem: formData.DichVuDiKem.trim(),
        TrangThaiDuyet: formData.TrangThaiDuyet || 'Dang mo ban',
        NhanVienTaoID: user?.employeeId || 1,
      };

      if (editingTour) {
        await api(`/tours/${editingTour.TourID}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        uiAlert('Cập nhật thông tin tour thành công!', { type: 'success', title: 'Cập nhật thành công' });
      } else {
        await api('/tours', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        uiAlert('Tạo tour du lịch mới thành công!', { type: 'success', title: 'Tạo tour thành công' });
      }

      setShowModal(false);
      void tours.reload();
    } catch (err: any) {
      uiAlert('Lỗi: ' + (err?.message || 'Không thể lưu thông tin tour'), { type: 'error', title: 'Không thể lưu Tour' });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (t: Tour) => {
    const ok = await uiConfirm(`Bạn có chắc chắn muốn xóa tour "${t.TenTour}" (Mã: ${t.MaTour})?`, {
      title: 'Xác nhận xóa Tour du lịch',
      confirmText: 'Xóa Tour',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await api<{ ok?: boolean; mode?: string; message?: string }>(`/tours/${t.TourID}`, { method: 'DELETE' });
      uiAlert(res?.message || 'Đã xóa tour thành công!', {
        type: 'success',
        title: res?.mode === 'ARCHIVE_PROTECTED' ? 'Đã xóa & bảo toàn dữ liệu đơn cũ' : 'Đã xóa Tour thành công',
      });
      void tours.reload();
    } catch (err: any) {
      uiAlert(err?.message || 'Không thể xóa tour này.', { type: 'error', title: 'Không thể xóa Tour' });
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
                            src={getImageUrl(t.HinhAnhURL)}
                            style={{ width: "56px", height: "56px", minWidth: "56px", maxWidth: "56px", minHeight: "56px", maxHeight: "56px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
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
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              maxWidth: '1100px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingTour ? `✏️ Cập nhật Tour du lịch #${editingTour.MaTour}` : '✨ Thêm Tour du lịch mới vào hệ thống'}
                </h2>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                  Thiết lập thông tin hành trình, hình ảnh minh họa từng ngày và các ràng buộc nghiệp vụ lữ hành chuẩn
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowModal(false)}
                style={{ padding: '6px 10px', borderRadius: '8px' }}
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              {/* Cảnh báo ràng buộc nghiệp vụ nếu có lỗi */}
              {Object.keys(validationErrors).length > 0 && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '13px', color: '#991B1B', display: 'block', marginBottom: '4px' }}>
                      Vui lòng hoàn thiện đúng quy chuẩn nghiệp vụ trước khi lưu:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#B91C1C', lineHeight: 1.6 }}>
                      {Object.values(validationErrors).map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* KHỐI 1: THÔNG TIN CHUNG & TUYẾN ĐƯỜNG */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0D6EFD', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>1</span>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Thông tin chương trình tour &amp; Tuyến đường
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#1E293B' }}>
                      Tên chương trình tour <span style={{ color: '#DC2626' }}>* (Bắt buộc, tối thiểu 5 ký tự)</span>
                    </label>
                    <input
                      className="input"
                      style={{ width: '100%', borderColor: validationErrors.TenTour ? '#DC2626' : undefined }}
                      required
                      placeholder="VD: Tour Đà Nẵng - Bà Nà Hills - Cầu Vàng - Phố Cổ Hội An 4N3Đ"
                      value={formData.TenTour}
                      onChange={(e) => {
                        setFormData({ ...formData, TenTour: e.target.value });
                        if (validationErrors.TenTour) setValidationErrors({ ...validationErrors, TenTour: '' });
                      }}
                    />
                    {validationErrors.TenTour && (
                      <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                        {validationErrors.TenTour}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#64748B' }}>
                      Mã tour <span style={{ fontSize: '11px', fontWeight: 400 }}>(Tùy chọn - Tự sinh nếu để trống)</span>
                    </label>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="VD: TOUR-DN-01"
                      value={formData.MaTour}
                      onChange={(e) => setFormData({ ...formData, MaTour: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                      Danh mục tour <span style={{ color: '#DC2626' }}>*</span>
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
                      Thời gian tour <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      className="input"
                      style={{ width: '100%', borderColor: validationErrors.ThoiGian ? '#DC2626' : undefined }}
                      placeholder="VD: 4 ngày 3 đêm"
                      value={formData.ThoiGian}
                      onChange={(e) => {
                        setFormData({ ...formData, ThoiGian: e.target.value });
                        if (validationErrors.ThoiGian) setValidationErrors({ ...validationErrors, ThoiGian: '' });
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                      Điểm khởi hành <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="VD: TP. Hồ Chí Minh"
                      value={formData.DiemKhoiHanh}
                      onChange={(e) => setFormData({ ...formData, DiemKhoiHanh: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                      Điểm đến chính <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      className="input"
                      style={{ width: '100%', borderColor: validationErrors.DiemDen ? '#DC2626' : undefined }}
                      required
                      placeholder="VD: Đà Nẵng, Quảng Nam"
                      value={formData.DiemDen}
                      onChange={(e) => {
                        setFormData({ ...formData, DiemDen: e.target.value });
                        if (validationErrors.DiemDen) setValidationErrors({ ...validationErrors, DiemDen: '' });
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                      Phương tiện di chuyển
                    </label>
                    <input
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="VD: Máy bay Vietnam Airlines & Xe 45 chỗ đời mới"
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
                      placeholder="VD: Nghỉ dưỡng cao cấp, Khám phá di sản..."
                      value={formData.PhongCachTour}
                      onChange={(e) => setFormData({ ...formData, PhongCachTour: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
                      Trạng thái phát hành
                    </label>
                    <select
                      className="select"
                      style={{ width: '100%' }}
                      value={formData.TrangThaiDuyet}
                      onChange={(e) => setFormData({ ...formData, TrangThaiDuyet: e.target.value })}
                    >
                      <option value="Dang mo ban">Đang mở bán (Hiển thị portal &amp; nhận booking)</option>
                      <option value="Dong ban">Tạm dừng (Đóng bán)</option>
                      <option value="Cho duyet">Chờ phê duyệt</option>
                      <option value="Nhap">Bản nháp</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: BẢNG GIÁ VÉ & RÀNG BUỘC TÀI CHÍNH */}
              <div
                style={{
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0284C7', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>2</span>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0369A1', margin: 0, textTransform: 'uppercase' }}>
                    Biểu giá niêm yết &amp; Quy tắc nghiệp vụ vé
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: '#0369A1' }}>
                      Giá người lớn (VNĐ) <span style={{ color: '#DC2626' }}>* (Bắt buộc &gt; 0)</span>
                    </label>
                    <input
                      type="number"
                      className="input"
                      style={{ width: '100%', fontWeight: 800, fontSize: '14px', borderColor: validationErrors.GiaNguoiLon ? '#DC2626' : undefined }}
                      required
                      min="0"
                      placeholder="VD: 5890000"
                      value={formData.GiaNguoiLon}
                      onChange={(e) => {
                        setFormData({ ...formData, GiaNguoiLon: e.target.value });
                        if (validationErrors.GiaNguoiLon) setValidationErrors({ ...validationErrors, GiaNguoiLon: '' });
                      }}
                    />
                    {validationErrors.GiaNguoiLon && (
                      <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                        {validationErrors.GiaNguoiLon}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: '#0F172A' }}>
                      Giá trẻ em 2-11 tuổi (VNĐ) <span style={{ color: '#0284C7', fontSize: '11px' }}>(≤ Giá người lớn)</span>
                    </label>
                    <input
                      type="number"
                      className="input"
                      style={{ width: '100%', fontWeight: 700, fontSize: '14px', borderColor: validationErrors.GiaTreEm ? '#DC2626' : undefined }}
                      min="0"
                      placeholder="VD: 3200000"
                      value={formData.GiaTreEm}
                      onChange={(e) => {
                        setFormData({ ...formData, GiaTreEm: e.target.value });
                        if (validationErrors.GiaTreEm) setValidationErrors({ ...validationErrors, GiaTreEm: '' });
                      }}
                    />
                    {validationErrors.GiaTreEm && (
                      <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                        {validationErrors.GiaTreEm}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>
                      Phụ thu phòng đơn (VNĐ)
                    </label>
                    <input
                      type="number"
                      className="input"
                      style={{ width: '100%', fontSize: '14px' }}
                      min="0"
                      placeholder="VD: 1200000"
                      value={formData.PhuThuPhongDon}
                      onChange={(e) => setFormData({ ...formData, PhuThuPhongDon: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: '#0284C7', background: '#E0F2FE', padding: '6px 12px', borderRadius: '6px' }}>
                  ℹ️ <strong>Ràng buộc nghiệp vụ:</strong> Giá vé trẻ em được áp dụng cho trẻ em từ 2 đến 11 tuổi, hưởng đầy đủ dịch vụ ghế ngồi riêng &amp; suất ăn. Giá vé trẻ em không được vượt quá giá vé người lớn.
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <ImageIcon size={16} style={{ color: '#0D6EFD' }} />
                    Ảnh đại diện Tour
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                    Tự động lưu vào folder project (/uploads/tours)
                  </span>
                </div>

                {/* Input file ẩn để chọn ảnh từ máy tính */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                  }}
                />

                {/* Thông báo lỗi nếu có */}
                {uploadErrorMsg && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '12.5px',
                      marginBottom: '10px',
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{uploadErrorMsg}</span>
                  </div>
                )}

                {/* Thông báo thành công nếu có */}
                {uploadSuccessMsg && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      color: '#15803d',
                      fontSize: '12.5px',
                      marginBottom: '10px',
                    }}
                  >
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}

                {/* Đã có ảnh: Hiển thị Preview và các nút Replace / Xóa */}
                {formData.HinhAnhURL ? (
                  <div
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ position: 'relative', height: '190px', background: '#0F172A' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(formData.HinhAnhURL)}
                        alt="Preview tour"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600';
                        }}
                      />

                      {/* Badge thông tin nguồn ảnh */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {formData.HinhAnhURL.startsWith('/uploads/') ? (
                          <>📁 Lưu trong folder project: {formData.HinhAnhURL.split('/').pop()}</>
                        ) : (
                          <>🌐 Link trực tuyến (Online URL)</>
                        )}
                      </div>

                      {/* Lớp phủ loading khi đang upload/replace */}
                      {uploadingImage && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(255, 255, 255, 0.88)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <RefreshCw size={26} className="spin" style={{ color: '#0D6EFD' }} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0D6EFD' }}>
                            Đang tải và thay thế ảnh trong project...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Toolbar thao tác */}
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#ffffff',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: '180px',
                        }}
                        title={formData.HinhAnhURL}
                      >
                        <span style={{ fontWeight: 600, color: '#334155' }}>Đường dẫn: </span>
                        {formData.HinhAnhURL}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={uploadingImage}
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <UploadCloud size={14} />
                          Thay thế ảnh khác (Upload)
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={uploadingImage}
                          onClick={() => {
                            setFormData({ ...formData, HinhAnhURL: '' });
                            setUploadSuccessMsg('');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: '#dc2626',
                            borderColor: '#fca5a5',
                          }}
                          title="Xóa ảnh này"
                        >
                          <Trash2 size={14} />
                          Bỏ ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Chưa có ảnh: Khung Kéo thả Dropzone */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: dragOver ? '2px dashed #0D6EFD' : '2px dashed #cbd5e1',
                      borderRadius: '10px',
                      padding: '28px 16px',
                      textAlign: 'center',
                      background: dragOver ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {uploadingImage ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={26} className="spin" style={{ color: '#0D6EFD' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0D6EFD' }}>
                          Đang tải ảnh lên và lưu vào folder project...
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px',
                          }}
                        >
                          <UploadCloud size={24} style={{ color: '#0D6EFD' }} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                          Nhấp để tải ảnh lên từ máy tính hoặc kéo thả file vào đây
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                          Hỗ trợ định dạng PNG, JPG, JPEG, WEBP (Tối đa 10MB) • Tự động lưu vào project
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Tùy chọn chuyển sang nhập link URL trực tiếp nếu muốn */}
                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#64748b',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <LinkIcon size={12} />
                    {showUrlInput ? 'Thu gọn ô dán URL' : 'Hoặc nhập/dán URL ảnh trực tiếp'}
                  </button>
                </div>

                {showUrlInput && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      className="input"
                      style={{ width: '100%', fontSize: '12px' }}
                      placeholder="Dán link ảnh tại đây (ví dụ: https://images.unsplash.com/...)"
                      value={formData.HinhAnhURL}
                      onChange={(e) => setFormData({ ...formData, HinhAnhURL: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* KHỐI 4: LỊCH TRÌNH CHI TIẾT TỪNG NGÀY & HÌNH ẢNH MINH HỌA */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '22px',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0D6EFD', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>4</span>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase' }}>
                        Lịch trình chi tiết từng ngày &amp; Quản lý hình ảnh thực tế <span style={{ color: '#DC2626' }}>*</span>
                      </h3>
                      <p style={{ fontSize: '11.5px', color: '#64748B', margin: '2px 0 0' }}>
                        Admin &amp; Điều hành có toàn quyền thêm ngày, nhập hoạt động và tải ảnh minh họa cho từng ngày
                      </p>
                    </div>
                  </div>

                  {/* Chuyển đổi chế độ Trực quan theo ngày vs Văn bản thuần */}
                  <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (itineraryMode !== 'visual') {
                          setItineraryDays(parseLichTrinhToDays(formData.LichTrinh));
                          setItineraryMode('visual');
                        }
                      }}
                      style={{
                        padding: '6px 14px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: itineraryMode === 'visual' ? '#0D6EFD' : 'transparent',
                        color: itineraryMode === 'visual' ? '#FFF' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Camera size={13} /> Trực quan theo ngày ({itineraryDays.length} ngày)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (itineraryMode !== 'raw') {
                          setFormData({ ...formData, LichTrinh: JSON.stringify(itineraryDays, null, 2) });
                          setItineraryMode('raw');
                        }
                      }}
                      style={{
                        padding: '6px 14px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: itineraryMode === 'raw' ? '#0D6EFD' : 'transparent',
                        color: itineraryMode === 'raw' ? '#FFF' : '#475569',
                      }}
                    >
                      📝 Soạn thảo thô / JSON
                    </button>
                  </div>
                </div>

                {validationErrors.LichTrinh && (
                  <div style={{ fontSize: '11.5px', color: '#DC2626', marginBottom: '12px', fontWeight: 600 }}>
                    ⚠️ {validationErrors.LichTrinh}
                  </div>
                )}

                {itineraryMode === 'visual' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {itineraryDays.map((day, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#F8FAFC',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        {/* Day Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span
                              style={{
                                background: '#0D6EFD',
                                color: '#FFF',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              NGÀY {day.day || idx + 1}
                            </span>
                            <input
                              className="input"
                              style={{ width: '100%', fontWeight: 700, fontSize: '13.5px' }}
                              placeholder={`VD: Ngày ${idx + 1}: TP.HCM - Đà Nẵng - Bán Đảo Sơn Trà`}
                              value={day.title}
                              onChange={(e) => handleUpdateDay(idx, { title: e.target.value })}
                            />
                          </div>

                          {itineraryDays.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDay(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#DC2626',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                              }}
                            >
                              <Trash2 size={14} /> Xóa ngày
                            </button>
                          )}
                        </div>

                        {/* 2 Cột: Bên trái nhập nội dung, bên phải quản lý ảnh ngày */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>
                          {/* Cột trái: Hoạt động & Bữa ăn */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                Hoạt động chi tiết trong ngày:
                              </label>
                              <textarea
                                className="input"
                                rows={3}
                                style={{ width: '100%', fontSize: '12.5px', fontFamily: 'inherit', resize: 'vertical' }}
                                placeholder="Mô tả các mốc thời gian, điểm tham quan, hoạt động trải nghiệm..."
                                value={day.detail}
                                onChange={(e) => handleUpdateDay(idx, { detail: e.target.value })}
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                  Bữa ăn trong ngày:
                                </label>
                                <input
                                  className="input"
                                  style={{ width: '100%', fontSize: '12px' }}
                                  placeholder="VD: Ăn sáng buffet, Ăn trưa, Ăn tối"
                                  value={day.meals || ''}
                                  onChange={(e) => handleUpdateDay(idx, { meals: e.target.value })}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                                  Điểm nhấn tham quan:
                                </label>
                                <input
                                  className="input"
                                  style={{ width: '100%', fontSize: '12px' }}
                                  placeholder="VD: Bà Nà Hills, Cầu Vàng (phân cách bởi dấu phẩy)"
                                  value={Array.isArray(day.highlights) ? day.highlights.join(', ') : ''}
                                  onChange={(e) =>
                                    handleUpdateDay(idx, {
                                      highlights: e.target.value
                                        .split(',')
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>

                          {/* Cột phải: Quản lý ảnh ngày */}
                          <div
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '10px',
                              background: '#FFFFFF',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                              📸 Ảnh chụp thực tế Ngày {day.day || idx + 1}:
                            </label>

                            {/* Hidden file input for this day */}
                            <input
                              id={`day-img-input-${idx}`}
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadDayImage(idx, file);
                              }}
                            />

                            {day.image ? (
                              <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', height: '110px', background: '#0F172A' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getImageUrl(day.image)}
                                  alt={day.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{ position: 'absolute', bottom: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`day-img-input-${idx}`)?.click()}
                                    style={{
                                      background: 'rgba(15, 23, 42, 0.85)',
                                      color: '#FFF',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      padding: '3px 8px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Đổi ảnh
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDay(idx, { image: '' })}
                                    style={{
                                      background: 'rgba(220, 38, 38, 0.9)',
                                      color: '#FFF',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      padding: '3px 8px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => document.getElementById(`day-img-input-${idx}`)?.click()}
                                style={{
                                  border: '1px dashed #CBD5E1',
                                  borderRadius: '6px',
                                  height: '110px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  background: '#F8FAFC',
                                }}
                              >
                                {uploadingDayIndex === idx ? (
                                  <>
                                    <RefreshCw size={20} className="spin" style={{ color: '#0D6EFD' }} />
                                    <span style={{ fontSize: '11px', color: '#0D6EFD', fontWeight: 600 }}>Đang tải ảnh...</span>
                                  </>
                                ) : (
                                  <>
                                    <Camera size={22} style={{ color: '#64748B' }} />
                                    <span style={{ fontSize: '11.5px', color: '#0D6EFD', fontWeight: 700 }}>Tải ảnh từ máy tính</span>
                                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>hoặc dán URL ảnh bên dưới</span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Direct URL input for day photo */}
                            <input
                              className="input"
                              style={{ width: '100%', fontSize: '11px', marginTop: '6px', padding: '4px 8px' }}
                              placeholder="Hoặc dán URL ảnh (https://...)"
                              value={day.image || ''}
                              onChange={(e) => handleUpdateDay(idx, { image: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddDay}
                      style={{
                        padding: '12px',
                        border: '2px dashed #93C5FD',
                        borderRadius: '10px',
                        background: '#EFF6FF',
                        color: '#0284C7',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.2s',
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} /> Thêm ngày hành trình tiếp theo (Ngày {itineraryDays.length + 1})
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      className="input"
                      rows={10}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: '12.5px', resize: 'vertical' }}
                      placeholder="Dán nội dung lịch trình hoặc cấu trúc JSON tại đây..."
                      value={formData.LichTrinh}
                      onChange={(e) => setFormData({ ...formData, LichTrinh: e.target.value })}
                    />
                    <span style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                      Mẹo: Có thể nhập dạng plain text: &quot;Ngày 1: Tiêu đề: Nội dung&quot; hoặc mảng JSON với thuộc tính day, title, detail, image, meals.
                    </span>
                  </div>
                )}
              </div>

              {/* KHỐI 5: MÔ TẢ TỔNG QUAN TOUR & DỊCH VỤ ĐI KÈM (LÀM RỘNG RA THEO YÊU CẦU) */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0D6EFD', color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>5</span>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: 0, textTransform: 'uppercase' }}>
                    Mô tả tổng quan tour &amp; Dịch vụ đi kèm
                  </h3>
                </div>

                {/* Mô tả tổng quan tour - Ô làm rộng ra để dễ quan sát khi nhập liệu */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
                    Mô tả tổng quan tour <span style={{ color: '#DC2626' }}>* (Bắt buộc tối thiểu 10 ký tự)</span>
                  </label>
                  <textarea
                    className="textarea"
                    rows={6}
                    style={{
                      width: '100%',
                      minHeight: '160px',
                      height: '160px',
                      padding: '12px 14px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      resize: 'vertical',
                      borderColor: validationErrors.MoTaChiTiet ? '#DC2626' : undefined,
                    }}
                    placeholder="Giới thiệu sức hút độc đáo của tour: cảnh quan thiên nhiên, di sản văn hóa, trải nghiệm ẩm thực đặc sắc và lý do du khách nên lựa chọn chuyến đi này..."
                    value={formData.MoTaChiTiet}
                    onChange={(e) => {
                      setFormData({ ...formData, MoTaChiTiet: e.target.value });
                      if (validationErrors.MoTaChiTiet) setValidationErrors({ ...validationErrors, MoTaChiTiet: '' });
                    }}
                  />
                  {validationErrors.MoTaChiTiet && (
                    <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                      {validationErrors.MoTaChiTiet}
                    </span>
                  )}
                </div>

                {/* Dịch vụ đi kèm - Ô làm rộng ra để dễ quan sát */}
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
                    Dịch vụ đi kèm (Bao gồm trong tour) <span style={{ color: '#DC2626' }}>* (Bắt buộc để bảo vệ quyền lợi du khách)</span>
                  </label>
                  <textarea
                    className="textarea"
                    rows={8}
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      height: '200px',
                      padding: '12px 14px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      resize: 'vertical',
                      borderColor: validationErrors.DichVuDiKem ? '#DC2626' : undefined,
                    }}
                    placeholder={`• Vé máy bay khứ hồi (20kg ký gửi + 7kg xách tay)\n• Khách sạn tiêu chuẩn 4 - 5 sao (2 khách/phòng)\n• Các bữa ăn chính tiêu chuẩn cao cấp theo lịch trình\n• Vé tham quan tất cả các điểm đến theo chương trình\n• Bảo hiểm du lịch trách nhiệm cao tới 100.000.000đ/vụ\n• Hướng dẫn viên suốt tuyến tận tâm, nhiệt tình`}
                    value={formData.DichVuDiKem}
                    onChange={(e) => {
                      setFormData({ ...formData, DichVuDiKem: e.target.value });
                      if (validationErrors.DichVuDiKem) setValidationErrors({ ...validationErrors, DichVuDiKem: '' });
                    }}
                  />
                  {validationErrors.DichVuDiKem && (
                    <span style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px', display: 'block' }}>
                      {validationErrors.DichVuDiKem}
                    </span>
                  )}
                </div>
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
              borderRadius: '16px',
              border: '1px solid var(--border)',
              maxWidth: '920px',
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
                  src={getImageUrl(viewingTour.HinhAnhURL)}
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
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--zinc-900)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Lịch trình chi tiết từng ngày &amp; Hình ảnh minh họa:
                </h3>
                {(() => {
                  let items: any[] = [];
                  try {
                    const parsed = JSON.parse(viewingTour.LichTrinh);
                    if (Array.isArray(parsed)) items = parsed;
                  } catch {}

                  if (items.length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((it: any, i: number) => (
                          <div key={i} style={{ display: 'flex', gap: '14px', background: 'var(--zinc-50)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', alignItems: 'flex-start' }}>
                            {it.image && (
                              <img src={getImageUrl(it.image)} alt={it.title} style={{ width: '130px', height: '90px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A', marginBottom: '4px' }}>{it.title || `Ngày ${i + 1}`}</div>
                              <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.6 }}>{it.detail || it.desc}</div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
                                {it.meals && (
                                  <span style={{ fontSize: '10.5px', background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>🍽️ {Array.isArray(it.meals) ? it.meals.join(', ') : it.meals}</span>
                                )}
                                {it.highlights && (Array.isArray(it.highlights) ? it.highlights : [it.highlights]).map((h: string, hi: number) => (
                                  <span key={hi} style={{ fontSize: '10.5px', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>📍 {h}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div style={{ fontSize: '12.5px', color: 'var(--zinc-700)', whiteSpace: 'pre-line', background: 'var(--zinc-50)', padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      {viewingTour.LichTrinh}
                    </div>
                  );
                })()}
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
