import type { HttpClient, RequestOptions } from "../client";

export abstract class Resource {
  constructor(protected readonly http: HttpClient) {}

  protected get<T>(path: string, options?: RequestOptions) {
    return this.http.get<T>(path, options);
  }

  protected post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.http.post<T>(path, body, options);
  }

  protected put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.http.put<T>(path, body, options);
  }

  protected patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.http.patch<T>(path, body, options);
  }

  protected del<T>(path: string, options?: RequestOptions) {
    return this.http.delete<T>(path, options);
  }
}
