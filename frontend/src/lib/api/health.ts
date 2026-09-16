import { api } from "@/lib/api/client";
import type { HealthResponse } from "@/types/api";

export const getHealth = () => api.get<HealthResponse>("/api/health", { timeoutMs: 90_000 });
