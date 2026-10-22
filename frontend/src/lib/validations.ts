import { z } from 'zod';

/** Số điện thoại Việt Nam: 10-11 chữ số, bắt đầu bằng 0. */
const phone = z.string().trim().regex(/^0\d{9,10}$/, 'Số điện thoại gồm 10-11 chữ số và bắt đầu bằng 0');
const email = z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không đúng định dạng');
const password = z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự');
const cccd = z.string().trim().regex(/^\d{12}$/, 'CCCD phải gồm đúng 12 chữ số');

/** Đăng ký khách hàng. */
export const registerSchema = z.object({
  hoTen: z.string().trim().min(2, 'Vui lòng nhập họ và tên'),
  email,
  phone,
  password,
  cccd: cccd.optional().or(z.literal('')),
});

/** Đổi mật khẩu. */
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu xác nhận không khớp' })
  .refine((v) => v.oldPassword !== v.newPassword, { path: ['newPassword'], message: 'Mật khẩu mới phải khác mật khẩu cũ' });

/** Form đặt tour: tối thiểu 1 người lớn, CCCD (nếu nhập) đúng 12 số. */
export const bookingSchema = z.object({
  soLuongNguoiLon: z.number().int().min(1, 'Cần ít nhất 1 người lớn'),
  soLuongTreEm: z.number().int().min(0, 'Số trẻ em không hợp lệ'),
  hanhKhach: z
    .array(
      z.object({
        hoTen: z.string().trim().optional(),
        cccd: cccd.optional().or(z.literal('')),
      }),
    )
    .optional(),
});

/** Trả về thông báo lỗi đầu tiên (hoặc null nếu hợp lệ) để hiển thị trong form. */
export function firstError<T>(schema: z.ZodType<T>, value: unknown): string | null {
  const r = schema.safeParse(value);
  return r.success ? null : (r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ');
}

export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
