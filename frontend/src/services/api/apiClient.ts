import { storageService } from '../storage/storageService';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

interface ApiErrorBody {
  detail?: string | Array<{ msg?: string }>;
}

export const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const isFormData = options.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(storageService.getAuthToken() ? { Authorization: `Bearer ${storageService.getAuthToken()}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Unable to connect to AutiCare. Please check that the server is running.');
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | T | null;
  if (!response.ok) {
    const detail = (body as ApiErrorBody | null)?.detail;
    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail) ? detail.map((error) => error.msg).filter(Boolean).join(', ') : `Request failed (${response.status})`;
    throw new Error(message || `Request failed (${response.status})`);
  }
  return body as T;
};
