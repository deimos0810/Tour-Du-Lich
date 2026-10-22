'use client';
import { useCallback, useEffect, useState } from 'react';

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
  const res = await fetch(`${API_URL}${path}`, {
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
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), cache: 'no-store' });
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
