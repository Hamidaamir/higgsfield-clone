import { z } from "zod";

export const PROMPT_MAX_LENGTH = 2000;

export const imagePromptSchema = z
  .string()
  .trim()
  .min(1, "Describe the scene you imagine first.")
  .max(PROMPT_MAX_LENGTH, `Prompts are limited to ${PROMPT_MAX_LENGTH} characters.`);

export const SCRIPT_MAX_LENGTH = 2000;
/** Mirrors NEGATIVE_PROMPT_MAX_LENGTH in the API schema. */
export const NEGATIVE_PROMPT_MAX_LENGTH = 500;

export const STYLE_PROMPT_MAX_LENGTH = 500;

export const scriptSchema = z
  .string()
  .trim()
  .min(1, "Write the script the voice should read first.")
  .max(SCRIPT_MAX_LENGTH, `Scripts are limited to ${SCRIPT_MAX_LENGTH} characters.`);
