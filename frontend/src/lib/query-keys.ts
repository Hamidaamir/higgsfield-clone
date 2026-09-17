import type { ListGenerationsParams } from "@/lib/api/generations";
import type { GenerationType } from "@/types/generation";

export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  health: ["health"] as const,
  models: (type?: GenerationType) => ["models", type ?? "all"] as const,
  assets: { detail: (id: string) => ["assets", "detail", id] as const },
  generations: {
    all: ["generations"] as const,
    list: (params: ListGenerationsParams) => ["generations", "list", params] as const,
    infinite: (params: ListGenerationsParams) => ["generations", "infinite", params] as const,
    detail: (id: string) => ["generations", "detail", id] as const,
  },
};
