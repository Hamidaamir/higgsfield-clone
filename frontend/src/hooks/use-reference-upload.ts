"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { REFERENCE_IMAGE_MAX_BYTES, REFERENCE_IMAGE_TYPES, uploadReferenceImage } from "@/lib/api/assets";
import { ApiError } from "@/lib/api/client";
import type { Asset } from "@/types/generation";

export interface ReferenceState {
  asset: Asset | null;
  previewUrl: string | null;
  error: string | null;
  uploading: boolean;
  select: (file: File) => void;
  clear: () => void;
}

/** Client-side validation + upload of a reference image; the API re-validates the bytes. */
export function useReferenceUpload(): ReferenceState {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: uploadReferenceImage,
    onSuccess: (uploaded) => setAsset(uploaded),
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
      setPreviewUrl(null);
    },
  });

  const select = (file: File) => {
    setError(null);
    if (!REFERENCE_IMAGE_TYPES.includes(file.type)) {
      setError("Use a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > REFERENCE_IMAGE_MAX_BYTES) {
      setError("Images must be 10 MB or smaller.");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    upload.mutate(file);
  };

  const clear = () => {
    setAsset(null);
    setPreviewUrl(null);
    setError(null);
  };

  return { asset, previewUrl, error, uploading: upload.isPending, select, clear };
}
