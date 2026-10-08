/** Danh sách menu dùng chung cho Sidebar và Breadcrumb. */
export type NavItem = { href: string; label: string; icon: string };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { title: 'Tổng quan', items: [{ href: '/', label: 'Dashboard', icon: 'grid' }] },
  {
    title: 'Kinh doanh',
    items: [
      { href: '/tours', label: 'Quản lý tour', icon: 'map' },
      { href: '/departures', label: 'Lịch khởi hành', icon: 'calendar' },
      { href: '/bookings', label: 'Booking & đặt cọc', icon: 'file' },
      { href: '/customers', label: 'Khách hàng', icon: 'users' },
    ],
  },
  {
    title: 'Điều hành',
    items: [
      { href: '/guides', label: 'Điều phối & HDV', icon: 'user-check' },
      { href: '/suppliers', label: 'Nhà cung cấp', icon: 'truck' },
      { href: '/settlements', label: 'Quyết toán tour', icon: 'wallet' },
    ],
  },
];

export const findLabel = (path: string) =>
  NAV.flatMap((g) => g.items).find((i) => (i.href === '/' ? path === '/' : path.startsWith(i.href)))?.label ?? '';
