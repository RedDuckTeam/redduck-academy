import { env } from '@/env'
import { ApiError, parseApiError } from './errors'

export class Fetcher {
  private readonly _baseURL: URL
  private readonly _headers: Record<string, string>
  private readonly _credentials: RequestCredentials

  constructor(
    baseURL: URL,
    headers: Record<string, string>,
    credentials: RequestCredentials = 'omit',
  ) {
    this._baseURL = baseURL
    this._headers = headers
    this._credentials = credentials
  }

  private _fetchOptions(init: RequestInit = {}): RequestInit {
    return {
      ...init,
      headers: this._headers,
      credentials: this._credentials,
    }
  }

  public get<T>(url: string): Promise<T> {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), this._fetchOptions()),
    )
  }

  public post<T>(url: string, body?: unknown): Promise<T> {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        ...this._fetchOptions(),
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
  }

  public put<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        ...this._fetchOptions(),
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
  }

  public delete<T>(url: string): Promise<T> {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), this._fetchOptions({ method: 'DELETE' })),
    )
  }

  public patch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        ...this._fetchOptions(),
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
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
  /** Use 'include' to send cookies (e.g. for authenticated requests) */
  credentials?: RequestCredentials
}

export const api = (options?: ApiClientOptions) => {
  const url = env.VITE_API_URL

  return new Fetcher(
    new URL(url + '/api'),
    {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    options?.credentials ?? 'omit',
  )
}
