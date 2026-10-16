import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Băm mật khẩu bằng scrypt (có salt ngẫu nhiên) — định dạng lưu: scrypt$<salt>$<hash>.
 * Hỗ trợ tương thích ngược: tài khoản seed cũ lưu plaintext vẫn đăng nhập được
 * và sẽ được nâng cấp sang dạng băm ngay lần đăng nhập thành công đầu tiên.
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith('scrypt$');
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!isHashed(stored)) return plain === stored;
  const [, salt, hash] = stored.split('$');
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(plain, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function validatePasswordStrength(pw: string) {
  if (!pw || pw.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return null;
}
