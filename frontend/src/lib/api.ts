const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

if (process.env.NODE_ENV === 'production' && API_URL.startsWith('http://')) {
  console.error('⚠️ NEXT_PUBLIC_API_URL debe usar HTTPS en producción')
}

let redirecting = false

interface FetchOptions extends RequestInit {
  token?: string
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (res.status === 401 && !redirecting && !endpoint.startsWith('/auth/')) {
    redirecting = true
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new HttpError(401, 'Sesión expirada')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new HttpError(res.status, error.message || 'Request failed')
  }

  return res.json()
}

async function requestBlob(endpoint: string, token?: string): Promise<Blob> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${endpoint}`, { headers })

  if (res.status === 401 && !redirecting && !endpoint.startsWith('/auth/')) {
    redirecting = true
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new HttpError(401, 'Sesión expirada')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new HttpError(res.status, error.message || 'Request failed')
  }

  return res.blob()
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export const api = {
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'GET', token }),

  post: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token }),

  put: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), token }),

  patch: <T>(endpoint: string, body: unknown, token?: string) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'DELETE', token }),

  getBlob: (endpoint: string, token?: string) =>
    requestBlob(endpoint, token),

  postBlob: (endpoint: string, body: unknown, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }).then(async res => {
      if (res.status === 401 && !redirecting && !endpoint.startsWith('/auth/')) {
        redirecting = true
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        throw new HttpError(401, 'Sesión expirada')
      }
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Request failed' }))
        throw new HttpError(res.status, error.message || 'Request failed')
      }
      return res.blob()
    })
  },
}
