import { z } from "zod";

export const PROMPT_MAX_LENGTH = 2000;

export const imagePromptSchema = z
  .string()
  .trim()
  .min(1, "Describe the scene you imagine first.")
  .max(PROMPT_MAX_LENGTH, `Prompts are limited to ${PROMPT_MAX_LENGTH} characters.`);
