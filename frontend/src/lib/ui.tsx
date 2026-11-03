import React from 'react';

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
