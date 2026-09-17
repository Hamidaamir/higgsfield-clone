import { api } from "@/lib/api/client";
import type { Generation, GenerationList, GenerationStatus, GenerationType } from "@/types/generation";

export interface ImageGenerationInput {
  prompt: string;
  model_id: string;
  aspect_ratio: string;
  batch_size: number;
  negative_prompt?: string;
  /** Edit-capable models only (FLUX.2 Klein): an uploaded image asset owned by the caller. */
  reference_asset_id?: string;
}

export interface VideoGenerationInput {
  prompt: string;
  model_id: string;
  aspect_ratio: string;
  duration_s: number;
  negative_prompt?: string;
  reference_asset_id?: string;
}

export interface AudioGenerationInput {
  text: string;
  model_id: string;
  voice?: string;
  language?: string;
  style_prompt?: string;
  batch_size: number;
}

export interface ListGenerationsParams {
  type?: GenerationType;
  status?: GenerationStatus;
  q?: string;
  cursor?: string;
  limit?: number;
}

export const createImageGeneration = (input: ImageGenerationInput) =>
  api.post<Generation>("/api/generations/image", input, { retries: 0 });

export const createVideoGeneration = (input: VideoGenerationInput) =>
  api.post<Generation>("/api/generations/video", input, { retries: 0 });

export const createAudioGeneration = (input: AudioGenerationInput) =>
  api.post<Generation>("/api/generations/audio", input, { retries: 0 });

export const fetchGeneration = (id: string) => api.get<Generation>(`/api/generations/${id}`);

export const retryGeneration = (id: string) =>
  api.post<Generation>(`/api/generations/${id}/retry`, undefined, { retries: 0 });

export function fetchGenerations(params: ListGenerationsParams = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.size ? `?${query}` : "";
  return api.get<GenerationList>(`/api/generations${suffix}`);
}
