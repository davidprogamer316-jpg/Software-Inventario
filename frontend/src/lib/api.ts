const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

if (process.env.NODE_ENV === 'production' && API_URL.startsWith('http://')) {
  console.error('⚠️ NEXT_PUBLIC_API_URL debe usar HTTPS en producción')
}

let redirecting = false

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && !redirecting && !endpoint.startsWith('/auth/')) {
    redirecting = true
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

async function requestBlob(endpoint: string): Promise<Blob> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
  })

  if (res.status === 401 && !redirecting && !endpoint.startsWith('/auth/')) {
    redirecting = true
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
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  getBlob: (endpoint: string) =>
    requestBlob(endpoint),

  postBlob: (endpoint: string, body: unknown) => {
    return fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    }).then(async res => {
      if (res.status === 401 && !redirecting && !endpoint.startsWith('/auth/')) {
        redirecting = true
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
