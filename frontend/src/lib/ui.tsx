'use client';
import React, { useEffect, useState } from 'react';

export const vnd = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v ?? 0));

export const date = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const STATUS: Record<string, [string, Tone]> = {
  // Tour.TrangThaiDuyet
  'Nhap': ['Nháp', 'muted'],
  'Cho duyet': ['Chờ duyệt', 'warning'],
  'Chờ duyệt': ['Chờ duyệt', 'warning'],
  'Da duyet': ['Đã duyệt', 'info'],
  'Đã duyệt': ['Đã duyệt', 'info'],
  'Dang mo ban': ['Đang mở bán', 'success'],
  'Đang mở bán': ['Đang mở bán', 'success'],
  'Dong ban': ['Tạm dừng', 'warning'],
  'Huy': ['Đã hủy', 'danger'],
  'Đã hủy': ['Đã hủy', 'danger'],
  'Da xoa': ['Đã lưu trữ', 'muted'],

  // LichKhoiHanh.TrangThai
  'Cho khoi hanh': ['Chờ khởi hành', 'success'],
  'Chờ khởi hành': ['Chờ khởi hành', 'success'],
  'Dang di': ['Đang diễn ra', 'info'],
  'Đang đi': ['Đang diễn ra', 'info'],
  'Hoan thanh': ['Hoàn thành', 'muted'],
  'Hoàn thành': ['Hoàn thành', 'muted'],
  'Dong': ['Đã đóng', 'danger'],
  'Đóng': ['Đã đóng', 'danger'],

  // DonDatTour.TrangThaiDon
  'Cho thanh toan': ['Chờ thanh toán', 'warning'],
  'Chờ thanh toán': ['Chờ thanh toán', 'warning'],
  'Da dat coc': ['Đã đặt cọc', 'info'],
  'Đã đặt cọc': ['Đã đặt cọc', 'info'],
  'Da thanh toan': ['Đã thanh toán', 'success'],
  'Đã thanh toán': ['Đã thanh toán', 'success'],
  'Da xac nhan': ['Đã xác nhận', 'info'],
  'Đã xác nhận': ['Đã xác nhận', 'info'],
  'Dang thuc hien': ['Đang thực hiện', 'info'],
  'Đang thực hiện': ['Đang thực hiện', 'info'],
  'Da huy': ['Đã hủy', 'danger'],

  // HuongDanVien.TrangThai
  'San sang': ['Sẵn sàng', 'success'],
  'Sẵn sàng': ['Sẵn sàng', 'success'],
  'Dang di tour': ['Đang đi tour', 'info'],
  'Dang ban': ['Đang bận', 'info'],
  'Nghi phep': ['Nghỉ phép', 'warning'],
  'Nghi viec': ['Nghỉ việc', 'muted'],

  // DieuPhoiTour.TrangThai (Phân công HDV)
  'Da phan cong': ['Đã phân công', 'warning'],
  'Đã phân công': ['Đã phân công', 'warning'],
  'Cho xac nhan': ['Chờ xác nhận', 'warning'],
  'Chờ xác nhận': ['Chờ xác nhận', 'warning'],
  'Chap nhan': ['Đã chấp nhận', 'success'],
  'Đã chấp nhận': ['Đã chấp nhận', 'success'],
  'Da xac nhan ': ['Đã xác nhận', 'success'],
  'Tu choi': ['Đã từ chối', 'danger'],
  'Đã từ chối': ['Đã từ chối', 'danger'],

  // PhieuDatDichVu.TrangThai (Nhà cung cấp NCC)
  'NCC xac nhan': ['NCC đã xác nhận', 'success'],
  'NCC đã xác nhận': ['NCC đã xác nhận', 'success'],
  'NCC tu choi': ['NCC từ chối', 'danger'],
  'NCC từ chối': ['NCC từ chối', 'danger'],
  'Cho NCC xac nhan': ['Chờ NCC xác nhận', 'warning'],
  'Da thanh toan toan bo': ['Đã thanh toán', 'success'],

  // BaoCaoQuyetToan.TrangThaiDuyet
  'Da trinh duyet': ['Chờ duyệt', 'warning'],
  'Da phe duyet': ['Đã phê duyệt', 'success'],
  'Đã phê duyệt': ['Đã phê duyệt', 'success'],
  'Yeu cau chinh sua': ['Yêu cầu sửa', 'danger'],
};

export function Status(props: { value?: string; status?: string }) {
  const raw = String(props.value ?? props.status ?? '').trim();
  if (!raw) return <span className="badge badge-muted">—</span>;

  let match = STATUS[raw];
  if (!match) {
    const lower = raw.toLowerCase();
    for (const [key, val] of Object.entries(STATUS)) {
      if (key.toLowerCase() === lower) {
        match = val;
        break;
      }
    }
  }

  const [label, tone] = match ?? [raw, 'muted'];
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function ApiNotice({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="notice">Không kết nối được dịch vụ API ({error}). Vui lòng kiểm tra kết nối hệ thống.</div>;
}

export function EmptyRow({ cols, loading }: { cols: number; loading: boolean }) {
  return <tr><td className="empty" colSpan={cols}>{loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu'}</td></tr>;
}

/* =============================================================================
 * HỆ THỐNG UI MODAL THÔNG BÁO / XÁC NHẬN / NHẬP LIỆU TOÀN CỤC (THAY NATIVE DIALOG)
 * ===========================================================================*/
type DialogKind = 'alert' | 'confirm' | 'prompt';
type DialogTone = 'success' | 'warning' | 'danger' | 'info';

type DialogRequest = {
  id: number;
  kind: DialogKind;
  message: string;
  title?: string;
  tone: DialogTone;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  resolve: (val: any) => void;
};

export type UiAlertOptions =
  | string
  | {
      title?: string;
      type?: 'success' | 'warning' | 'danger' | 'error' | 'info';
      confirmText?: string;
    };

export type UiConfirmOptions =
  | string
  | {
      title?: string;
      confirmText?: string;
      danger?: boolean;
      type?: 'success' | 'warning' | 'danger' | 'error' | 'info';
    };

export type UiPromptOptions =
  | string
  | {
      title?: string;
      defaultValue?: string;
      placeholder?: string;
      confirmText?: string;
    };

let enqueueDialog: ((req: Omit<DialogRequest, 'id'>) => void) | null = null;

function detectTone(msg: string, kind: DialogKind): DialogTone {
  const lower = msg.toLowerCase();
  if (kind === 'confirm') {
    if (lower.includes('xóa') || lower.includes('hủy') || lower.includes('từ chối') || lower.includes('khóa')) {
      return 'danger';
    }
    return 'info';
  }
  if (
    lower.includes('lỗi') ||
    lower.includes('không thể') ||
    lower.includes('thất bại') ||
    lower.includes('không hợp lệ') ||
    lower.includes('vượt quá') ||
    lower.includes('kín chỗ') ||
    lower.includes('đã qua ngày')
  ) {
    return 'danger';
  }
  if (
    lower.includes('vui lòng') ||
    lower.includes('ràng buộc') ||
    lower.includes('⚠️') ||
    lower.includes('ít nhất') ||
    lower.includes('tối đa') ||
    lower.includes('chưa')
  ) {
    return 'warning';
  }
  if (
    lower.includes('thành công') ||
    lower.includes('đã gửi') ||
    lower.includes('đã xóa') ||
    lower.includes('đã cập nhật') ||
    lower.includes('đã gỡ') ||
    lower.includes('đã đặt lại') ||
    lower.includes('đã kích hoạt') ||
    lower.includes('đã xuất') ||
    lower.includes('xin chào')
  ) {
    return 'success';
  }
  return 'info';
}

function defaultTitle(tone: DialogTone, kind: DialogKind): string {
  if (kind === 'confirm') return tone === 'danger' ? 'Xác nhận thao tác quan trọng' : 'Xác nhận thực hiện';
  if (kind === 'prompt') return 'Nhập thông tin xác nhận';
  if (tone === 'success') return 'Thao tác thành công';
  if (tone === 'danger') return 'Thông báo lỗi';
  if (tone === 'warning') return 'Lưu ý kiểm tra thông tin';
  return 'Thông báo hệ thống';
}

export function uiAlert(message: string, opts?: UiAlertOptions): Promise<void> {
  const cleanMsg = String(message ?? '').replace(/^⚠️\s*/, '').trim();
  const titleOpt = typeof opts === 'string' ? opts : opts?.title;
  const rawType = typeof opts === 'object' && opts ? opts.type : undefined;
  const confirmText = typeof opts === 'object' && opts ? opts.confirmText : undefined;
  const mappedTone: DialogTone | undefined =
    rawType === 'error' ? 'danger' : rawType;
  const tone = mappedTone || detectTone(cleanMsg, 'alert');
  if (!enqueueDialog) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    enqueueDialog!({
      kind: 'alert',
      message: cleanMsg,
      title: titleOpt || defaultTitle(tone, 'alert'),
      tone,
      confirmText,
      resolve: () => resolve(),
    });
  });
}

export function uiConfirm(message: string, opts?: UiConfirmOptions): Promise<boolean> {
  const cleanMsg = String(message ?? '').trim();
  const titleOpt = typeof opts === 'string' ? opts : opts?.title;
  const confirmText = typeof opts === 'object' && opts ? opts.confirmText : undefined;
  const isDanger = typeof opts === 'object' && opts ? opts.danger : undefined;
  const rawType = typeof opts === 'object' && opts ? opts.type : undefined;
  const mappedTone: DialogTone | undefined =
    isDanger ? 'danger' : rawType === 'error' ? 'danger' : rawType;
  const tone = mappedTone || detectTone(cleanMsg, 'confirm');
  if (!enqueueDialog) {
    return Promise.resolve(true);
  }
  return new Promise<boolean>((resolve) => {
    enqueueDialog!({
      kind: 'confirm',
      message: cleanMsg,
      title: titleOpt || defaultTitle(tone, 'confirm'),
      tone,
      confirmText,
      resolve: (ok: boolean) => resolve(Boolean(ok)),
    });
  });
}

export function uiPrompt(message: string, opts?: UiPromptOptions, maybeTitle?: string): Promise<string | null> {
  const cleanMsg = String(message ?? '').trim();
  const defaultValue = typeof opts === 'string' ? opts : opts?.defaultValue || '';
  const titleOpt = typeof opts === 'string' ? maybeTitle : opts?.title;
  const placeholder = typeof opts === 'object' && opts ? opts.placeholder : undefined;
  const confirmText = typeof opts === 'object' && opts ? opts.confirmText : undefined;
  if (!enqueueDialog) {
    return Promise.resolve(defaultValue);
  }
  return new Promise<string | null>((resolve) => {
    enqueueDialog!({
      kind: 'prompt',
      message: cleanMsg,
      defaultValue,
      placeholder,
      confirmText,
      title: titleOpt || defaultTitle('info', 'prompt'),
      tone: 'info',
      resolve: (val: string | null) => resolve(val),
    });
  });
}

export function UiFeedbackRoot() {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const [promptVal, setPromptVal] = useState('');
  const [promptError, setPromptError] = useState(false);
  const [promptShakeKey, setPromptShakeKey] = useState(0);

  useEffect(() => {
    enqueueDialog = (req) => {
      setQueue((prev) => [...prev, { ...req, id: Date.now() + Math.random() }]);
    };
    if (typeof window !== 'undefined') {
      window.alert = (msg?: any) => {
        void uiAlert(String(msg ?? ''));
      };
    }
    return () => {
      enqueueDialog = null;
    };
  }, []);

  const current = queue[0] || null;

  useEffect(() => {
    if (current?.kind === 'prompt') {
      setPromptVal(current.defaultValue || '');
      setPromptError(false);
    }
  }, [current]);

  if (!current) return null;

  const closeWith = (val: any) => {
    const fn = current.resolve;
    setQueue((prev) => prev.slice(1));
    fn(val);
  };

  const palette = {
    success: {
      accent: '#059669',
      bgSoft: '#ECFDF5',
      borderSoft: '#A7F3D0',
      btnBg: '#059669',
      icon: '✓',
    },
    warning: {
      accent: '#D97706',
      bgSoft: '#FFFBEB',
      borderSoft: '#FDE68A',
      btnBg: '#D97706',
      icon: '!',
    },
    danger: {
      accent: '#DC2626',
      bgSoft: '#FEF2F2',
      borderSoft: '#FECACA',
      btnBg: '#DC2626',
      icon: '✕',
    },
    info: {
      accent: '#0F172A',
      bgSoft: '#F1F5F9',
      borderSoft: '#CBD5E1',
      btnBg: '#0F172A',
      icon: 'i',
    },
  }[current.tone];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={() => {
        if (current.kind === 'alert') closeWith(undefined);
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.28)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 22px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: palette.bgSoft,
              border: `1px solid ${palette.borderSoft}`,
              color: palette.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            {palette.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '15.5px',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '6px',
                lineHeight: 1.35,
              }}
            >
              {current.title}
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: '#334155',
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
              }}
            >
              {current.message}
              {current.kind === 'prompt' && (
                <span style={{ color: '#DC2626', fontWeight: 800, marginLeft: '4px' }}>*</span>
              )}
            </div>
            {current.kind === 'prompt' && (
              <div>
                <style>{`
                  @keyframes uiPromptFlashShake {
                    0%, 100% { transform: translateX(0); box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.22); }
                    15%, 45%, 75% { transform: translateX(-6px); box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.38); background-color: #FEE2E2; }
                    30%, 60%, 90% { transform: translateX(6px); box-shadow: 0 0 0 6px rgba(220, 38, 38, 0.38); background-color: #FEF2F2; }
                  }
                `}</style>
                <input
                  key={promptShakeKey}
                  type="text"
                  className="input"
                  autoFocus
                  value={promptVal}
                  onChange={(e) => {
                    setPromptVal(e.target.value);
                    if (promptError && e.target.value.trim()) setPromptError(false);
                  }}
                  placeholder={current.placeholder || 'Nhập nội dung bắt buộc tại đây...'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!promptVal.trim()) {
                        setPromptError(true);
                        setPromptShakeKey((k) => k + 1);
                      } else {
                        closeWith(promptVal.trim());
                      }
                    }
                    if (e.key === 'Escape') closeWith(null);
                  }}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    fontSize: '13.5px',
                    borderColor: promptError ? '#DC2626' : undefined,
                    borderWidth: promptError ? '2px' : undefined,
                    backgroundColor: promptError ? '#FEF2F2' : undefined,
                    boxShadow: promptError ? '0 0 0 3px rgba(220, 38, 38, 0.2)' : undefined,
                    animation: promptError ? 'uiPromptFlashShake 0.55s ease-in-out' : undefined,
                  }}
                />
                {promptError && (
                  <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>
                    * Vui lòng nhập nội dung bắt buộc trước khi xác nhận!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '12px 22px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {current.kind === 'alert' ? (
            <button
              type="button"
              autoFocus
              onClick={() => closeWith(undefined)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: palette.btnBg,
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {current.confirmText || 'Đã hiểu'}
            </button>
          ) : current.kind === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={() => closeWith(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeWith(true)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: palette.btnBg,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {current.confirmText || 'Xác nhận'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => closeWith(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!promptVal.trim()) {
                    setPromptError(true);
                    setPromptShakeKey((k) => k + 1);
                    return;
                  }
                  closeWith(promptVal.trim());
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {current.confirmText || 'Xác nhận'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
