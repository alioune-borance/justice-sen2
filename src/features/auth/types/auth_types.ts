export interface LoginRequest {
  username: string;
  password: string;
}

// Le refresh token n'est jamais renvoyé dans le corps : il est posé en cookie HttpOnly par le backend.
export interface AuthResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number | null;
}

export interface CsrfResponse {
  csrf_token: string;
}

// GET auth/me/ : identité, rôle, prison, périmètre et permissions effectives
export type { User as MeResponse } from "./user.types";
