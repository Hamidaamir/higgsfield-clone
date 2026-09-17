export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  /** False for accounts created through Google sign-in. */
  has_password: boolean;
}

export interface AuthProviders {
  google: boolean;
  /** Dev-only: the in-process stand-in for Google is active (USE_FAKE_PROVIDERS). */
  fake_google: boolean;
}

export interface AuthResponse {
  user: User;
}

export interface SessionResponse {
  user: User | null;
}
