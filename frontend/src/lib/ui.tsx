import React from 'react';

export const vnd = (v: number | string | null | undefined) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v ?? 0));

export const date = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const STATUS: Record<string, [string, Tone]> = {
  // Tour.TrangThaiDuyet
  'Nhap': ['Nháp', 'muted'], 'Cho duyet': ['Chờ duyệt', 'warning'], 'Da duyet': ['Đã duyệt', 'info'],
  'Dang mo ban': ['Đang mở bán', 'success'], 'Dong ban': ['Tạm dừng', 'warning'], 'Huy': ['Đã hủy', 'danger'],
  // LichKhoiHanh.TrangThai
  'Cho khoi hanh': ['Mở bán', 'success'], 'Dang di': ['Đã khởi hành', 'info'], 'Hoan thanh': ['Hoàn thành', 'muted'],
  // DonDatTour.TrangThaiDon
  'Cho thanh toan': ['Chờ thanh toán', 'warning'], 'Da dat coc': ['Đã xác nhận', 'info'], 'Da thanh toan': ['Đã hoàn thành', 'success'],
  'Da xac nhan': ['Đã xác nhận', 'info'], 'Dang thuc hien': ['Đang thực hiện', 'info'], 'Da huy': ['Đã hủy', 'danger'],
  // HuongDanVien.TrangThai
  'San sang': ['Sẵn sàng', 'success'], 'Dang di tour': ['Đang đi tour', 'info'], 'Nghi phep': ['Nghỉ phép', 'warning'], 'Nghi viec': ['Nghỉ việc', 'muted'],
  // BaoCaoQuyetToan.TrangThaiDuyet
  'Da trinh duyet': ['Chờ duyệt', 'warning'], 'Da phe duyet': ['Đã phê duyệt', 'success'], 'Yeu cau chinh sua': ['Yêu cầu sửa', 'danger'],
};

export function Status({ value }: { value: string }) {
  const [label, tone] = STATUS[value] ?? [value, 'muted'];
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

export function ApiNotice({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="notice">Không kết nối được dịch vụ API ({error}). Vui lòng kiểm tra kết nối hệ thống.</div>;
}

export function EmptyRow({ cols, loading }: { cols: number; loading: boolean }) {
  return <tr><td className="empty" colSpan={cols}>{loading ? 'Đang tải dữ liệu...' : 'Chưa có dữ liệu'}</td></tr>;
}
