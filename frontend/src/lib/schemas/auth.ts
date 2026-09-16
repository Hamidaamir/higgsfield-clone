import { z } from "zod";

// Mirrors backend/app/schemas/auth.py so users get instant feedback; the API remains authoritative.
export const PASSWORD_MIN_LENGTH = 8;

const email = z.string().trim().min(1, "Email is required.").email("Enter a valid email address.");

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(128, "Password must be at most 128 characters.")
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Use at least one letter and one number.");

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  email,
  password,
  acceptTerms: z.literal(true, { message: "Please accept the Terms of Use to continue." }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
