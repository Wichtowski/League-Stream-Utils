import { ApiError } from "./errors";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ClientContext {
  onUnauthorized?: () => void;
  getHeaders?: () => Record<string, string>;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return path;
  const filtered = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  );
  if (filtered.length === 0) return path;
  const qs = new URLSearchParams(filtered.map(([k, v]) => [k, String(v)]));

  return `${path}?${qs.toString()}`;
}

export class HttpClient {
  private ctx: ClientContext;

  constructor(ctx: ClientContext = {}) {
    this.ctx = ctx;
  }

  protected async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = buildUrl(path, options?.params);
    const contextHeaders = this.ctx.getHeaders?.() ?? {};
    const headers: Record<string, string> = { ...contextHeaders, ...options?.headers };

    const isForm = body instanceof URLSearchParams;
    if (body !== undefined && !isForm && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
      signal: options?.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      const error = new ApiError(res.status, res.statusText, text);
      if (error.isUnauthorized) this.ctx.onUnauthorized?.();
      throw error;
    }

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return res.json() as Promise<T>;
    }

    return undefined as T;
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>("GET", path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("POST", path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PUT", path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>("PATCH", path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>("DELETE", path, undefined, options);
  }
}

/** Default client instance for server/non-React usage */
export const http = new HttpClient();
