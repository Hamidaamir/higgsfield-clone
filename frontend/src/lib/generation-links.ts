import type { Generation, ModelSpec } from "@/types/generation";

const GENERATOR_ROUTES: Record<Generation["type"], string> = {
  image: "/generate/image",
  video: "/generate/video",
  audio: "/generate/audio",
};

/**
 * Deep link back into the matching generator with the prompt and the settings the current
 * model registry still supports. Only known generator fields are serialised — never a blob
 * of settings — and each one is dropped unless the target model can actually honour it.
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
    // Optional free text is carried too, so History reuse restores the same settings as
    // in-studio reuse. URLSearchParams encodes it, so &, = and quotes survive the round trip.
    const negative = generation.settings.negative_prompt;
    if (negative && model.supports_negative_prompt) params.set("negative", negative);
    const style = generation.settings.style_prompt;
    if (style && model.supports_style_prompt) params.set("style", style);
  }
  return `${GENERATOR_ROUTES[generation.type]}?${params}`;
}

export function generatorHref(type: Generation["type"]): string {
  return GENERATOR_ROUTES[type];
}

/**
 * Link into a generator from a composition surface (Cinema Studio, Marketing Studio,
 * Effects). Those surfaces only ever *compose* a prompt — generation happens in the studio
 * this points at — so the serialisation lives here rather than being rebuilt in each one.
 */
export function composerHref(input: {
  type: Generation["type"];
  prompt: string;
  model?: string;
  aspect?: string;
}): string {
  const params = new URLSearchParams({ prompt: input.prompt });
  if (input.model) params.set("model", input.model);
  if (input.aspect) params.set("aspect", input.aspect);
  return `${GENERATOR_ROUTES[input.type]}?${params}`;
}
