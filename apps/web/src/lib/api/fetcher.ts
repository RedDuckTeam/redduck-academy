import { env } from '@/env'

export interface FetcherResponse<T> {
  data: T | null
  status: number
  statusText: string
  error?: string
  errorData?: Record<string, unknown>
}

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

  public async get<T>(url: string) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), this._fetchOptions()),
    )
  }

  public async post<T>(url: string, body?: unknown) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        ...this._fetchOptions(),
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
  }

  public async put<T>(url: string, body?: Record<string, unknown>) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        ...this._fetchOptions(),
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
  }

  public async delete<T>(url: string) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), this._fetchOptions({ method: 'DELETE' })),
    )
  }

  public async patch<T>(url: string, body?: Record<string, unknown>) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        ...this._fetchOptions(),
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
  }

  private async _processResponse<T>(
    responsePromise: Promise<Response>,
  ): Promise<FetcherResponse<T>> {
    const response = await responsePromise

    let data: T | null = null
    let error = ''
    let responseText = ''
    let errorData: Record<string, unknown> | undefined

    try {
      responseText = await response.text()
      if (response.ok) {
        try {
          data = JSON.parse(responseText)
        } catch {
          data = null
        }
      } else {
        try {
          const parsed = JSON.parse(responseText)
          errorData = parsed
          error =
            parsed?.message ||
            parsed?.description ||
            parsed?.error ||
            response.statusText
        } catch {
          error = responseText || response.statusText
        }
      }
    } catch {
      //
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      error,
      errorData,
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
