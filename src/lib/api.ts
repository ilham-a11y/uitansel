// Pintu masuk data untuk seluruh halaman. Data disimpan di browser (localStorage);
// hanya klasifikasi dan ringkasan model yang diambil dari server (/api/predict, /api/model).
import { ApiError } from './errors'
import { getToken, setToken } from './session'
import { localRequest } from './local-api'

export { ApiError, getToken, setToken }

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  try {
    return await localRequest<T>(method, path, body, getToken())
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && path !== '/auth/login' && onUnauthorized) {
      onUnauthorized()
    }
    throw err
  }
}

export const api = {
  get: <T,>(path: string) => request<T>('GET', path),
  post: <T,>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T,>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T,>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T,>(path: string) => request<T>('DELETE', path),
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError && err.fields) {
    const first = Object.values(err.fields)[0]
    if (first) return first
  }
  return err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.'
}
