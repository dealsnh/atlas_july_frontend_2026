export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  token?: string;
  user?: AuthUser;
  session?: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    expires_at?: number;
    user?: AuthUser;
  };
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface OkMessageResponse {
  ok: boolean;
  message?: string;
}
