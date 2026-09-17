"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchAsset } from "@/lib/api/assets";
import { queryKeys } from "@/lib/query-keys";

/** One of the signed-in user's assets by id (e.g. the reference behind an image edit). */
export function useAsset(assetId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.assets.detail(assetId ?? ""),
    queryFn: () => fetchAsset(assetId as string),
    enabled: Boolean(assetId),
    staleTime: Infinity,
  });
}
