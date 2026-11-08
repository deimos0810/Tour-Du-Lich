'use client';
import { useState } from 'react';
import { api, useApi } from '@/lib/api';
import { ApiNotice, EmptyRow, Status, vnd } from '@/lib/ui';
import { Search, AlertTriangle, X, Check, Clock, CreditCard, Banknote } from 'lucide-react';

type PaymentItem = {
  ThanhToanID: number;
  MaGiaoDich?: string | null;
  SoTien: string | number;
  HinhThucTT: string;
  NgayThanhToan: string;
  TrangThai: string;
  GhiChu?: string | null;
};

type Booking = {
  DonHangID: number;
  MaDon: string;
  NgayDat: string;
  SoLuongNguoiLon: number;
  SoLuongTreEm: number;
  TongTien: string;
  GiamGia?: string;
  TienCoc: string;
  TienConLai: string;
  TrangThaiDon: string;
  PhuongThucTT?: string | null;
  KhachHang: { HoTen: string; SoDienThoai: string; Email: string };
  LichKhoiHanh: { MaLich: string; NgayKhoiHanh?: string; Tour: { TenTour: string } };
  GhiChu?: string | null;
  ThanhToan?: PaymentItem[];
};

const FILTERS = [
  ['', 'Tất cả'],
  ['Cho thanh toan', 'Chờ xác nhận / Thu tiền'],
  ['Da dat coc', 'Đã đặt cọc'],
  ['Da thanh toan', 'Đã thanh toán'],
  ['Da huy', 'Đã hủy'],
] as const;

const QUICK_REASONS = [
  'Khách yêu cầu hủy qua điện thoại',
  'Quá hạn thanh toán tiền cọc theo quy định',
  'Tour tạm hoãn do thời tiết xấu hoặc bất khả kháng',
  'Khách muốn chuyển đổi sang tour khác',
  'Không liên lạc được với khách hàng sau nhiều lần',
];

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const day = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} · ${day}`;
}

export default function BookingsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { data, error, loading, reload } = useApi<Booking[]>(
    `/bookings?trangThai=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`,
  );

  // State Modal Thu tiền / Xác nhận thanh toán trực tuyến
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectMethod, setCollectMethod] = useState<'VNPay' | 'Chuyen khoan'>('VNPay');
  const [collectNote, setCollectNote] = useState<string>('');
  const [collectError, setCollectError] = useState<string>('');
  const [submittingCollect, setSubmittingCollect] = useState(false);

  // State Modal Hủy đơn kèm lý do bắt buộc
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const getRemainingAmount = (b: Booking) => {
    const netTotal = Math.max(0, Number(b.TongTien) - Number(b.GiamGia || 0));
    const paid = Number(b.TienCoc || 0);
    const remaining = Number(b.TienConLai ?? Math.max(0, netTotal - paid));
    return remaining > 0 ? remaining : Math.max(0, netTotal - paid);
  };

  const openCollectModal = (b: Booking) => {
    const remaining = getRemainingAmount(b);
    setCollectingBooking(b);
    setCollectAmount(String(Math.round(remaining)));
    setCollectMethod(b.PhuongThucTT === 'Chuyen khoan' ? 'Chuyen khoan' : 'VNPay');
    setCollectNote(`Xác nhận thu tiền thanh toán đơn ${b.MaDon}`);
    setCollectError('');
  };

  const handleConfirmCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingBooking) return;
    const amountNum = Number(String(collectAmount).replace(/[^0-9]/g, ''));
    const remaining = getRemainingAmount(collectingBooking);

    if (!amountNum || amountNum <= 0) {
      setCollectError('Vui lòng nhập số tiền thu hợp lệ (lớn hơn 0 đ).');
      return;
    }
    if (amountNum > remaining) {
      setCollectError(`Số tiền thu không được vượt quá số tiền còn phải thu (${vnd(remaining)}).`);
      return;
    }

    setSubmittingCollect(true);
    setCollectError('');
    try {
      await api(`/bookings/${collectingBooking.DonHangID}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          SoTien: amountNum,
          HinhThucTT: collectMethod,
          GhiChu: collectNote.trim() || undefined,
        }),
      });
      const isFull = amountNum >= remaining;
      showToast(
        isFull
          ? `Đã xác nhận thu đủ ${vnd(amountNum)} cho đơn ${collectingBooking.MaDon}! Trạng thái đã chuyển sang "Đã thanh toán" & kích hoạt Vé điện tử QR.`
          : `Đã ghi nhận thu cọc ${vnd(amountNum)} cho đơn ${collectingBooking.MaDon}! Trạng thái đã chuyển sang "Đã đặt cọc".`,
      );
      setCollectingBooking(null);
      void reload();
    } catch (err: unknown) {
      setCollectError(err instanceof Error ? err.message : 'Không thể xác nhận thu tiền');
    } finally {
      setSubmittingCollect(false);
    }
  };

  const openCancelModal = (b: Booking) => {
    setCancellingBooking(b);
    setCancelReason('');
    setCancelError('');
  };

  const [cancelShakeKey, setCancelShakeKey] = useState(0);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    const reason = cancelReason.trim();
    if (!reason || reason.length < 5) {
      setCancelError('Vui lòng nhập lý do hủy cụ thể (tối thiểu 5 ký tự) để gửi thông báo cho khách hàng.');
      setCancelShakeKey((prev) => prev + 1);
      const el = document.getElementById('admin-cancel-reason-input');
      if (el) el.focus();
      return;
    }

    setSubmittingCancel(true);
    setCancelError('');
    try {
      await api(`/bookings/${cancellingBooking.DonHangID}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ lyDoHuy: reason }),
      });
      showToast(`Đã hủy đơn ${cancellingBooking.MaDon} thành công và hoàn lại chỗ trống cho chuyến đi.`);
      setCancellingBooking(null);
      void reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hủy đơn đặt tour';
      setCancelError(msg);
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Booking & Đặt Cọc</h1>
          <p className="page-desc">
            Quản lý giao dịch đặt tour theo thời gian thực (Timestamp) và đối soát thanh toán qua Cổng VNPAY
          </p>
        </div>
      </div>

      {toastMsg && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} strokeWidth={2.2} />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <ApiNotice error={error} />

      <div className="card">
        {/* TOOLBAR */}
        <div className="toolbar">
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FILTERS.map(([v, l]) => (
              <button
                key={v}
                className={`btn btn-sm ${status === v ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatus(v)}
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', marginLeft: 'auto', width: '280px' }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--zinc-400)',
              }}
            />
            <input
              className="input"
              id="booking-search"
              placeholder="Mã booking, tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>
        </div>

        {/* HIGH-DENSITY DATA TABLE */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>MÃ BOOKING & THỜI GIAN ĐẶT</th>
                <th>KHÁCH HÀNG</th>
                <th>CHUYẾN ĐI</th>
                <th>SỐ VÉ</th>
                <th>TỔNG TIỀN</th>
                <th>ĐÃ THU & PHƯƠNG THỨC</th>
                <th>TRẠNG THÁI</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {data?.length ? (
                data.map((b) => {
                  const netPayable = Math.max(0, Number(b.TongTien) - Number(b.GiamGia || 0));
                  const lastPayment = b.ThanhToan?.[0];

                  return (
                    <tr key={b.DonHangID}>
                      <td>
                        <span className="code">{b.MaDon}</span>
                        <div
                          className="sub"
                          style={{
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            color: '#475569',
                            fontWeight: 500,
                          }}
                          title="Thời điểm khách tạo đơn đặt tour trên hệ thống"
                        >
                          <Clock size={11} strokeWidth={1.8} />
                          <span>{formatDateTime(b.NgayDat)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="strong">{b.KhachHang.HoTen}</div>
                        <div className="sub">
                          {b.KhachHang.SoDienThoai} · {b.KhachHang.Email}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--zinc-900)' }}>{b.LichKhoiHanh.Tour.TenTour}</div>
                        <div className="sub" style={{ fontFamily: 'monospace' }}>
                          {b.LichKhoiHanh.MaLich}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: 'var(--zinc-700)' }}>
                          {b.SoLuongNguoiLon} NL{b.SoLuongTreEm > 0 ? `, ${b.SoLuongTreEm} TE` : ''}
                        </span>
                      </td>
                      <td>
                        <span className="strong">{vnd(netPayable)}</span>
                        {Number(b.GiamGia || 0) > 0 && (
                          <div className="sub" style={{ fontSize: '11px', color: '#64748B' }}>
                            Gốc: {vnd(b.TongTien)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: 'var(--emerald-600)', fontWeight: 700 }}>{vnd(b.TienCoc)}</span>
                        <div style={{ marginTop: '3px' }}>
                          {b.TrangThaiDon === 'Da thanh toan' ? (
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                padding: '1px 7px',
                                borderRadius: '4px',
                                background: '#F1F5F9',
                                color: '#0F172A',
                                fontWeight: 600,
                                border: '1px solid #CBD5E1',
                              }}
                            >
                              {b.PhuongThucTT === 'VNPay' ? 'Cổng VNPAY' : b.PhuongThucTT || 'Cổng VNPAY'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Chưa thanh toán</span>
                          )}
                        </div>
                        {lastPayment?.NgayThanhToan && (
                          <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '2px' }}>
                            Thu lúc: {formatDateTime(lastPayment.NgayThanhToan)}
                          </div>
                        )}
                      </td>
                      <td>
                        <Status value={b.TrangThaiDon} />
                        {b.TrangThaiDon === 'Da huy' && b.GhiChu && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#b91c1c',
                              marginTop: '4px',
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={b.GhiChu}
                          >
                            {b.GhiChu.includes('[QUẢN TRỊ VIÊN HỦY]')
                              ? 'Lý do: ' + (b.GhiChu.split('Lý do:')[1]?.trim() || b.GhiChu)
                              : b.GhiChu}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {b.TrangThaiDon !== 'Da huy' && b.TrangThaiDon !== 'Da thanh toan' && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openCollectModal(b)}
                              style={{ fontWeight: 600 }}
                            >
                              Xác nhận thu
                            </button>
                            <button
                              className="btn btn-danger-outline btn-sm"
                              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                              onClick={() => openCancelModal(b)}
                            >
                              Hủy đơn
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow cols={8} loading={loading} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN THU TIỀN / THANH TOÁN TẠI QUẦY (THAY CHO PROMPT) */}
      {/* ========================================================================= */}
      {collectingBooking && (() => {
        const netTotal = Math.max(0, Number(collectingBooking.TongTien) - Number(collectingBooking.GiamGia || 0));
        const alreadyPaid = Number(collectingBooking.TienCoc || 0);
        const remaining = getRemainingAmount(collectingBooking);
        const halfDeposit = Math.round(remaining * 0.5);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
            onClick={() => setCollectingBooking(null)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                maxWidth: '560px',
                width: '100%',
                border: '1px solid #CBD5E1',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Banknote size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                      Xác nhận thu tiền đơn #{collectingBooking.MaDon}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                      Đặt lúc: {formatDateTime(collectingBooking.NgayDat)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCollectingBooking(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmCollect}>
                <div style={{ padding: '20px 24px' }}>
                  {/* Tóm tắt thông tin đơn & khách hàng */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '16px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <span style={{ color: '#64748B' }}>Khách hàng: </span>
                        <strong style={{ color: '#0F172A' }}>{collectingBooking.KhachHang.HoTen}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>SĐT: </span>
                        <strong style={{ color: '#0F172A' }}>{collectingBooking.KhachHang.SoDienThoai}</strong>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#64748B' }}>Chuyến đi: </span>
                        <strong style={{ color: '#0F172A' }}>
                          {collectingBooking.LichKhoiHanh.Tour.TenTour} ({collectingBooking.LichKhoiHanh.MaLich})
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Tổng thanh toán: </span>
                        <strong style={{ color: '#0F172A' }}>{vnd(netTotal)}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Đã thu trước đó: </span>
                        <strong style={{ color: '#15803D' }}>{vnd(alreadyPaid)}</strong>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px dashed #CBD5E1',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>Số tiền còn phải thu:</span>
                      <strong style={{ fontSize: '17px', fontWeight: 800, color: '#B45309' }}>
                        {vnd(remaining)}
                      </strong>
                    </div>
                  </div>

                  {/* Chọn hình thức thu tiền */}
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#0F172A',
                        marginBottom: '6px',
                      }}
                    >
                      Phương thức thu tiền thực tế:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setCollectMethod('VNPay')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: collectMethod === 'VNPay' ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                          background: collectMethod === 'VNPay' ? '#0F172A' : '#FFFFFF',
                          color: collectMethod === 'VNPay' ? '#FFFFFF' : '#334155',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <CreditCard size={15} />
                        Cổng thanh toán VNPAY
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollectMethod('Chuyen khoan')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: collectMethod === 'Chuyen khoan' ? '1.5px solid #0F172A' : '1px solid #CBD5E1',
                          background: collectMethod === 'Chuyen khoan' ? '#0F172A' : '#FFFFFF',
                          color: collectMethod === 'Chuyen khoan' ? '#FFFFFF' : '#334155',
                          fontWeight: 700,
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Banknote size={15} />
                        Chuyển khoản ngân hàng
                      </button>
                    </div>
                  </div>

                  {/* Chọn nhanh mức tiền thu */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                        Số tiền thực thu (VNĐ) <span style={{ color: '#E11D48' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setCollectAmount(String(Math.round(remaining)))}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: Number(collectAmount) === Math.round(remaining) ? '1px solid #0F172A' : '1px solid #CBD5E1',
                            background: Number(collectAmount) === Math.round(remaining) ? '#0F172A' : '#F8FAFC',
                            color: Number(collectAmount) === Math.round(remaining) ? '#FFFFFF' : '#334155',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Thu đủ 100% ({vnd(remaining)})
                        </button>
                        {alreadyPaid === 0 && halfDeposit > 0 && (
                          <button
                            type="button"
                            onClick={() => setCollectAmount(String(halfDeposit))}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: Number(collectAmount) === halfDeposit ? '1px solid #0F172A' : '1px solid #CBD5E1',
                              background: Number(collectAmount) === halfDeposit ? '#0F172A' : '#F8FAFC',
                              color: Number(collectAmount) === halfDeposit ? '#FFFFFF' : '#334155',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Thu cọc 50% ({vnd(halfDeposit)})
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      type="number"
                      className="input"
                      required
                      min={1000}
                      max={Math.round(remaining)}
                      value={collectAmount}
                      onChange={(e) => {
                        setCollectAmount(e.target.value);
                        if (collectError) setCollectError('');
                      }}
                      style={{
                        width: '100%',
                        fontSize: '15px',
                        fontWeight: 800,
                        padding: '10px 12px',
                        color: '#0F172A',
                      }}
                    />
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
                      {Number(collectAmount) >= Math.round(remaining)
                        ? '✓ Thu đủ 100%: Đơn hàng sẽ chuyển ngay sang trạng thái "Đã thanh toán" và cấp Vé điện tử QR cho khách.'
                        : '• Thu một phần: Đơn hàng sẽ chuyển sang trạng thái "Đã đặt cọc".'}
                    </div>
                  </div>

                  {/* Ghi chú phiếu thu */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                      Ghi chú chứng từ thu ngân:
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={collectNote}
                      onChange={(e) => setCollectNote(e.target.value)}
                      placeholder="VD: Đối soát giao dịch thanh toán VNPay / Ủy nhiệm chi..."
                      style={{ width: '100%', fontSize: '13px', padding: '8px 12px' }}
                    />
                  </div>

                  {collectError && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: '#FFF1F2',
                        border: '1px solid #FECDD3',
                        color: '#BE123C',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {collectError}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '14px 24px',
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={submittingCollect}
                    onClick={() => setCollectingBooking(null)}
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingCollect}
                    style={{
                      background: '#0F172A',
                      borderColor: '#0F172A',
                      fontWeight: 700,
                      padding: '8px 18px',
                    }}
                  >
                    {submittingCollect ? 'Đang ghi nhận...' : 'Xác nhận đã thu tiền & Cập nhật trạng thái'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL XÁC NHẬN HỦY ĐƠN & NHẬP LÝ DO BẮT BUỘC */}
      {cancellingBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.2s ease-out',
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #fee2e2',
                background: '#fff1f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#fecdd3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#e11d48',
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#9f1239' }}>
                    Xác nhận hủy đơn #{cancellingBooking.MaDon}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#be123c', marginTop: '2px' }}>
                    Yêu cầu nhập lý do hủy để thông báo cho khách hàng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9f1239',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nội dung Modal */}
            <div style={{ padding: '24px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Khách hàng: </span>
                    <strong style={{ color: '#1e293b' }}>{cancellingBooking.KhachHang.HoTen}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Số điện thoại: </span>
                    <strong style={{ color: '#1e293b' }}>{cancellingBooking.KhachHang.SoDienThoai}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b' }}>Tour: </span>
                    <strong style={{ color: '#1e293b' }}>{cancellingBooking.LichKhoiHanh.Tour.TenTour}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tổng tiền: </span>
                    <strong style={{ color: '#0284c7' }}>{vnd(cancellingBooking.TongTien)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Đã thu: </span>
                    <strong style={{ color: '#16a34a' }}>{vnd(cancellingBooking.TienCoc)}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  color: '#b45309',
                  fontSize: '12.5px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Hành động hủy đơn sẽ <strong>hoàn lại {cancellingBooking.SoLuongNguoiLon + cancellingBooking.SoLuongTreEm} chỗ trống</strong> cho lịch khởi hành.
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <style>{`
                  @keyframes adminCancelFlashShake {
                    0%, 100% { transform: translateX(0); box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.22); }
                    15%, 45%, 75% { transform: translateX(-6px); box-shadow: 0 0 0 6px rgba(225, 29, 72, 0.38); background-color: #fee2e2; }
                    30%, 60%, 90% { transform: translateX(6px); box-shadow: 0 0 0 6px rgba(225, 29, 72, 0.38); background-color: #fef2f2; }
                  }
                `}</style>
                <label
                  htmlFor="admin-cancel-reason-input"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: cancelError ? '#e11d48' : '#0f172a',
                    marginBottom: '6px',
                  }}
                >
                  Lý do hủy đơn (Bắt buộc) <span style={{ color: '#e11d48', fontWeight: 800 }}>*</span>
                </label>
                <textarea
                  id="admin-cancel-reason-input"
                  key={cancelShakeKey}
                  className="input"
                  rows={4}
                  style={{
                    width: '100%',
                    fontFamily: 'inherit',
                    fontSize: '13.5px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    borderColor: cancelError ? '#e11d48' : '#cbd5e1',
                    borderWidth: cancelError ? '2px' : '1px',
                    backgroundColor: cancelError ? '#fef2f2' : undefined,
                    boxShadow: cancelError ? '0 0 0 3px rgba(225, 29, 72, 0.2)' : undefined,
                    animation: cancelError ? 'adminCancelFlashShake 0.55s ease-in-out' : undefined,
                    resize: 'vertical',
                  }}
                  placeholder="Nhập lý do chi tiết để giải thích cho khách hàng (ví dụ: Khách gọi điện yêu cầu hủy, Quá hạn đóng tiền cọc...)"
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (cancelError) setCancelError('');
                  }}
                />
                {cancelError && (
                  <p style={{ margin: 0, marginTop: '6px', fontSize: '12px', fontWeight: 600, color: '#e11d48' }}>
                    * {cancelError}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
                  Gợi ý lý do phổ biến (nhấp để chọn nhanh):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {QUICK_REASONS.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCancelReason(r);
                        if (cancelError) setCancelError('');
                      }}
                      style={{
                        background: cancelReason === r ? '#eff6ff' : '#f1f5f9',
                        color: cancelReason === r ? '#1d4ed8' : '#475569',
                        border: cancelReason === r ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                        borderRadius: '20px',
                        padding: '5px 12px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cancelReason === r && '✓ '}
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                disabled={submittingCancel}
                onClick={() => setCancellingBooking(null)}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={submittingCancel}
                onClick={handleConfirmCancel}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: '#e11d48',
                  borderColor: '#e11d48',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {submittingCancel ? 'Đang hủy đơn...' : 'Xác nhận hủy đơn & Gửi thông báo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
