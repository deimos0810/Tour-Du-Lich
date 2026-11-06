'use client';
import { useCallback, useEffect, useState } from 'react';

export function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api-proxy';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getToken(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem('viettour_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function errorMessage(res: Response): Promise<string> {
  let msg = `${res.status} ${res.statusText}`;
  try {
    const errData = await res.json();
    if (errData?.message) {
      msg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
    }
  } catch {}
  return msg;
}

/** Phiên hết hạn / token không hợp lệ: xóa phiên và quay về trang đăng nhập. */
function handleUnauthorized() {
  if (typeof window === 'undefined' || !getToken()) return;
  localStorage.removeItem('viettour_user');
  localStorage.removeItem('viettour_token');
  if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
    cache: 'no-store',
  });

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new Error(await errorMessage(res));
  }

  return res.json() as Promise<T>;
}

/** Tải file (xlsx/pdf) từ API có yêu cầu JWT: gọi fetch kèm Bearer token rồi kích hoạt tải xuống. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${getApiUrl()}${path}`, { headers: authHeaders(), cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new Error(await errorMessage(res));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Hook tải dữ liệu đơn giản: trả về data, lỗi, trạng thái loading và hàm reload. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, reload: load };
}

/** Chuyển đổi URL ảnh thành URL đầy đủ nếu là ảnh lưu cục bộ trong project (/uploads/...) */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    if (process.env.NEXT_PUBLIC_API_URL) {
      const origin = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
      return `${origin}${trimmed}`;
    }
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${host}:4000${trimmed}`;
  }
  return trimmed;
}

/** Tải lên ảnh Tour vào thư mục uploads/tours của project */
export async function uploadTourImage(
  file: File,
): Promise<{ success: boolean; url: string; fullUrl: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${getApiUrl()}/upload/tour-image`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) handleUnauthorized();
    throw new Error(await errorMessage(res));
  }

  return res.json();
}

