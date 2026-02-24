import { env } from '@/env'

export interface FetcherResponse<T> {
  data: T | null
  status: number
  statusText: string
  error?: string
}

export class Fetcher {
  private readonly _baseURL: URL
  private readonly _headers: Record<string, string>

  constructor(baseURL: URL, headers: Record<string, string>) {
    this._baseURL = baseURL
    this._headers = headers
  }

  public async get<T>(url: string) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        headers: this._headers,
      }),
    )
  }

  public async post<T>(url: string, body?: Record<string, unknown>) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        method: 'POST',
        headers: this._headers,
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
  }

  public async put<T>(url: string, body?: Record<string, unknown>) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        method: 'PUT',
        headers: this._headers,
        body: body ? JSON.stringify(body) : undefined,
      }),
    )
  }

  public async delete<T>(url: string) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        method: 'DELETE',
        headers: this._headers,
      }),
    )
  }

  public async patch<T>(url: string, body?: Record<string, unknown>) {
    return this._processResponse<T>(
      fetch(new URL(url, this._baseURL), {
        method: 'PATCH',
        headers: this._headers,
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
          const errorData = JSON.parse(responseText)

          error =
            errorData?.message ||
            errorData?.description ||
            errorData?.error ||
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
