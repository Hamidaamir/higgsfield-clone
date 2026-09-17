import { api } from "@/lib/api/client";
import type { LoginInput, SignupInput } from "@/lib/schemas/auth";
import type { AuthProviders, AuthResponse, SessionResponse, User } from "@/types/auth";

/** Resolves to null for anonymous visitors (the API answers 200 with a null user). */
export async function fetchCurrentUser(): Promise<User | null> {
  const { user } = await api.get<SessionResponse>("/api/auth/me");
  return user;
}

export const signup = (input: SignupInput) =>
  api.post<AuthResponse>("/api/auth/signup", {
    name: input.name,
    email: input.email,
    password: input.password,
    accept_terms: input.acceptTerms,
  });

export const login = (input: LoginInput) => api.post<AuthResponse>("/api/auth/login", input);

export const logout = () => api.post<void>("/api/auth/logout");

/** Which sign-in methods this deployment offers (Google needs an OAuth client configured). */
export const fetchAuthProviders = () => api.get<AuthProviders>("/api/auth/providers");

/** Entry point of the Google OpenID Connect flow; the API validates `next` again on its side. */
export const googleStartHref = (next?: string) =>
  `/api/auth/google/start${next ? `?next=${encodeURIComponent(next)}` : ""}`;
