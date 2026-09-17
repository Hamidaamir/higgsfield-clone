import type { ApiErrorBody } from "@/types/api";

/**
 * Free-tier hosting sleeps after inactivity, so the first request after a
 * quiet period can take a while. Requests get a generous timeout and one
 * automatic retry on network/timeout failures.
 */
const DEFAULT_TIMEOUT_MS = 70_000;
const RETRY_DELAY_MS = 1_500;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when the backend was unreachable or timed out (likely cold start). */
  get isNetwork(): boolean {
    return this.status === 0;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  /** Set to 0 to disable the automatic retry on network failures. */
  retries?: number;
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    if (body.error?.code) {
      return new ApiError(response.status, body.error.code, body.error.message, body.error.details);
    }
  } catch {
    /* non-JSON error body */
  }
  // A non-JSON 5xx means the proxy could not reach the API (down, restarting or cold-starting),
  // so it is treated like a network failure: retried once, then explained in plain words.
  if (response.status >= 500) {
    return new ApiError(0, "unreachable", "The server isn't reachable right now. Please try again in a moment.");
  }
  return new ApiError(response.status, "http_error", `Something went wrong (${response.status}). Please try again.`);
}

async function attempt<T>(path: string, options: RequestOptions): Promise<T> {
  // `retries` is consumed by apiRequest; strip it so it never reaches fetch().
  const { body, timeoutMs = DEFAULT_TIMEOUT_MS, retries, headers, ...init } = options;
  void retries;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
    if (!response.ok) throw await parseError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError(0, aborted ? "timeout" : "network_error", aborted ? "The server took too long to respond." : "Could not reach the server.");
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const retries = options.retries ?? 1;
  let lastError: ApiError | undefined;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await attempt<T>(path, options);
    } catch (error) {
      lastError = error as ApiError;
      if (!lastError.isNetwork || i === retries) throw lastError;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw lastError;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};
