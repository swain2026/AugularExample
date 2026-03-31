export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface TokenRefresh {
  refresh_token: string;
}

export interface JwtPayload {
  sub: string;
  exp: number;
  roles?: string[];
}
