export type GenerationType = "image" | "video" | "audio";
export type GenerationStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";
export type MediaType = "image" | "video" | "audio";

export interface ModelSpec {
  id: string;
  name: string;
  description: string;
  type: GenerationType;
  provider: string;
  aspect_ratios: string[];
  max_batch: number;
  supports_negative_prompt: boolean;
  supports_reference_image: boolean;
  badge: string | null;
  credit_cost: number;
  tags: string[];
}

export interface Asset {
  id: string;
  media_type: MediaType;
  url: string;
  thumbnail_url: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  created_at: string;
}

export interface ImageGenerationSettings {
  aspect_ratio?: string;
  batch_size?: number;
  negative_prompt?: string;
  seed?: number;
}

export interface Generation {
  id: string;
  type: GenerationType;
  status: GenerationStatus;
  provider: string;
  model_id: string;
  prompt: string;
  settings: ImageGenerationSettings & Record<string, unknown>;
  error_code: string | null;
  error_message: string | null;
  credit_cost: number;
  parent_generation_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  assets: Asset[];
}

export interface GenerationList {
  items: Generation[];
  next_cursor: string | null;
}

export const ACTIVE_STATUSES: GenerationStatus[] = ["queued", "processing"];

export function isActive(generation: Generation): boolean {
  return ACTIVE_STATUSES.includes(generation.status);
}
