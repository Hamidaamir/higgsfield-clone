/** Effects library: one-click prompt presets that open the video generator pre-filled. */

import { composerHref } from "@/lib/generation-links";

export type EffectCategory = "Camera" | "VFX" | "Viral" | "Action" | "Style";

export interface Effect {
  slug: string;
  name: string;
  category: EffectCategory;
  description: string;
  prompt: string;
  seed: string;
  aspect?: "16:9" | "9:16" | "1:1";
  badge?: "New" | "Free" | "TOP";
}

export const EFFECT_CATEGORIES: EffectCategory[] = ["Camera", "VFX", "Viral", "Action", "Style"];

export const EFFECTS: Effect[] = [
  { slug: "crash-zoom", name: "Crash Zoom", category: "Camera", description: "Aggressive push-in straight onto the subject.", prompt: "rapid crash zoom onto the subject's face, motion blur, dramatic, cinematic", seed: "fx-crash-zoom", badge: "TOP" },
  { slug: "dolly-in", name: "Dolly In", category: "Camera", description: "Smooth forward dolly with shallow depth of field.", prompt: "slow smooth dolly in, shallow depth of field, soft golden light, cinematic", seed: "fx-dolly" },
  { slug: "orbit", name: "360 Orbit", category: "Camera", description: "The camera circles the subject once.", prompt: "camera orbits 360 degrees around the subject, steady, cinematic lighting", seed: "fx-orbit" },
  { slug: "fpv-drone", name: "FPV Drone", category: "Camera", description: "Fast first-person drone dive.", prompt: "fpv drone shot diving fast through the scene, wide lens, dynamic motion", seed: "fx-fpv", badge: "New" },
  { slug: "explosion", name: "Explosion", category: "VFX", description: "A fireball erupts behind the subject.", prompt: "a massive explosion erupts behind the subject, debris and sparks, slow motion, cinematic", seed: "fx-explosion", badge: "Free" },
  { slug: "levitation", name: "Levitation", category: "VFX", description: "The subject lifts gently off the ground.", prompt: "the subject slowly levitates off the ground, hair and clothes floating, dreamy light", seed: "fx-levitation" },
  { slug: "disintegration", name: "Disintegration", category: "VFX", description: "Dissolve into drifting particles.", prompt: "the subject disintegrates into glowing particles drifting away in the wind", seed: "fx-disintegrate" },
  { slug: "thunder-god", name: "Thunder God", category: "VFX", description: "Lightning crackles around the subject.", prompt: "lightning crackles around the subject, electric arcs, stormy sky, dramatic", seed: "fx-thunder", badge: "TOP" },
  { slug: "flip-phone", name: "Flip Phone", category: "Viral", description: "Y2K flip-phone selfie energy.", prompt: "y2k flip phone selfie video, handheld, flash on, early 2000s aesthetic", seed: "fx-flip-phone", aspect: "9:16" },
  { slug: "eyes-in", name: "Eyes In", category: "Viral", description: "Zoom through the iris into a new world.", prompt: "camera zooms into the eye and through the iris into a new dreamlike world", seed: "fx-eyes", aspect: "9:16", badge: "New" },
  { slug: "car-surf", name: "Car Surf", category: "Action", description: "Riding on top of a moving car.", prompt: "subject rides on the roof of a moving car through city streets, wind, handheld action", seed: "fx-car-surf" },
  { slug: "building-jump", name: "Building Jump", category: "Action", description: "Leap between rooftops at dusk.", prompt: "subject leaps between rooftops at dusk, parkour, wide action shot", seed: "fx-jump" },
  { slug: "anime", name: "Anime", category: "Style", description: "Cel-shaded anime restyle.", prompt: "anime style, cel shading, vibrant colors, dynamic lines", seed: "fx-anime" },
  { slug: "film-noir", name: "Film Noir", category: "Style", description: "High-contrast black and white drama.", prompt: "black and white film noir, hard shadows, venetian blinds light, smoky room", seed: "fx-noir" },
  { slug: "claymation", name: "Claymation", category: "Style", description: "Stop-motion clay look.", prompt: "stop-motion claymation style, handmade textures, playful", seed: "fx-clay" },
];

export const effectHref = (effect: Effect): string =>
  composerHref({ type: "video", prompt: effect.prompt, model: "ltx-video", aspect: effect.aspect });
