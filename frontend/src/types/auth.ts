export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AuthResponse {
  user: User;
}

export interface SessionResponse {
  user: User | null;
}
