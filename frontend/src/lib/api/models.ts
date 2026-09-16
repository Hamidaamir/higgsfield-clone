import { api } from "@/lib/api/client";
import type { GenerationType, ModelSpec } from "@/types/generation";

export const fetchModels = (type?: GenerationType) =>
  api.get<ModelSpec[]>(`/api/models${type ? `?type=${type}` : ""}`);
