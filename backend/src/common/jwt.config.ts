/** Cấu hình JWT dùng chung cho toàn hệ thống (đọc từ biến môi trường JWT_SECRET). */
export const JWT_SECRET = process.env.JWT_SECRET || 'viettour-secret-key-2026';
export const JWT_EXPIRES_IN = '7d';

export type JwtPayload = {
  sub: number;
  email: string;
  roles: string[];
  primaryRole: string;
  customerId: number | null;
  employeeId: number | null;
};
