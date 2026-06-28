export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly body: string;
  readonly data: unknown;

  constructor(status: number, statusText: string, body: string) {
    const parsed = ApiError.parseBody(body);
    super(typeof parsed === "string" ? parsed : `${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.data = typeof parsed === "string" ? undefined : parsed;
  }

  private static parseBody(body: string): string | Record<string, unknown> | null {
    try {
      const json = JSON.parse(body);
      if (typeof json.error === "string") return json.error;
      if (typeof json.message === "string") return json.message;

      return json;
    } catch {
      return body || null;
    }
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isValidation() {
    return this.status === 400 || this.status === 422;
  }
  get isServerError() {
    return this.status >= 500;
  }
}
