/** Error envelope returned by the FastAPI backend for every non-2xx response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface HealthResponse {
  status: "ok";
  version: string;
  database: "ok" | "unavailable";
}
