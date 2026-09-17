import { api } from "@/lib/api/client";
import type { Asset } from "@/types/generation";

export const REFERENCE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const REFERENCE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const fetchAsset = (id: string) => api.get<Asset>(`/api/assets/${id}`);

export function uploadReferenceImage(file: File): Promise<Asset> {
  const body = new FormData();
  body.append("file", file);
  return api.post<Asset>("/api/assets/upload", body, { retries: 0, timeoutMs: 120_000 });
}
