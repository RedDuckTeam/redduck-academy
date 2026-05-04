import { env } from '@/env'
import { ApiError, parseApiError } from './errors'
import { getAuthToken } from './auth-token'

export class Fetcher {
  private readonly _baseURL: URL
  private readonly _headers: Record<string, string>

  constructor(baseURL: URL, headers: Record<string, string>) {
    this._baseURL = baseURL
    this._headers = headers
  }

  private async _fetchOptions(init: RequestInit = {}): Promise<RequestInit> {
    const token = await getAuthToken()
    const headers: Record<string, string> = { ...this._headers }
    if (token) headers.Authorization = `Bearer ${token}`
    return { ...init, headers }
  }

  public async get<T>(url: string): Promise<T> {
    const opts = await this._fetchOptions()
    return this._processResponse<T>(fetch(new URL(url, this._baseURL), opts))
  }

  public async post<T>(url: string, body?: unknown): Promise<T> {
    const opts = await this._fetchOptions({
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
    return this._processResponse<T>(fetch(new URL(url, this._baseURL), opts))
  }

  public async put<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const opts = await this._fetchOptions({
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
    return this._processResponse<T>(fetch(new URL(url, this._baseURL), opts))
  }

  public async delete<T>(url: string): Promise<T> {
    const opts = await this._fetchOptions({ method: 'DELETE' })
    return this._processResponse<T>(fetch(new URL(url, this._baseURL), opts))
  }

  public async patch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const opts = await this._fetchOptions({
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
    return this._processResponse<T>(fetch(new URL(url, this._baseURL), opts))
  }

  private async _processResponse<T>(responsePromise: Promise<Response>): Promise<T> {
    let response: Response
    try {
      response = await responsePromise
    } catch (cause) {
      throw new ApiError(cause instanceof Error ? cause.message : 'Network request failed', 0)
    }

    const text = await response.text().catch(() => '')

    if (!response.ok) {
      throw parseApiError(response.status, response.statusText, text)
    }

    if (!text) return null as T
    try {
      return JSON.parse(text) as T
    } catch {
      return null as T
    }
  }
}

interface ApiClientOptions {
  headers?: Record<string, string>
}

export const api = (options?: ApiClientOptions) => {
  const url = env.VITE_API_URL

  return new Fetcher(new URL(url + '/api'), {
    'Content-Type': 'application/json',
    ...options?.headers,
  })
}
