import type { Generation, ModelSpec } from "@/types/generation";

const GENERATOR_ROUTES: Record<Generation["type"], string> = {
  image: "/generate/image",
  video: "/generate/video",
  audio: "/generate/audio",
};

/**
 * Deep link back into the matching generator with the prompt and the settings
 * the current model registry still supports. Nothing provider-specific goes in the URL.
 */
export function reuseHref(generation: Generation, models: ModelSpec[] | undefined): string {
  const params = new URLSearchParams({ prompt: generation.prompt });
  const model = models?.find((m) => m.id === generation.model_id);
  if (model) {
    params.set("model", model.id);
    const aspect = generation.settings.aspect_ratio;
    if (aspect && model.aspect_ratios.includes(aspect)) params.set("aspect", aspect);
    const batch = generation.settings.batch_size;
    if (batch && batch <= model.max_batch) params.set("batch", String(batch));
    const duration = generation.settings.duration_s;
    if (duration && model.durations_s.includes(duration)) params.set("duration", String(duration));
    const voice = generation.settings.voice;
    if (voice && model.voices.some((v) => v.id === voice)) params.set("voice", voice);
    const language = generation.settings.language;
    if (language && model.languages.some((l) => l.code === language)) params.set("language", language);
  }
  return `${GENERATOR_ROUTES[generation.type]}?${params}`;
}

export function generatorHref(type: Generation["type"]): string {
  return GENERATOR_ROUTES[type];
}
