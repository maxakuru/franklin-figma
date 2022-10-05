export type OAuthFlow = 'device_code' | 'access_code';

export type AuthProvider = 'microsoft' | 'google';

export interface AuthData {
  accessToken: string;
  expiresAt: Date;
  refreshToken: string;
  scope: string;
  tokenType: string;
}

export interface RefreshedTokenData {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface NewTokenData {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  refresh_token: string;
}

export interface DeviceCodeData {
  device_code: string;
  user_code: string;
  verification_url?: string; // google
  verification_uri?: string; // msft
  expires_in: number; // seconds from now
  interval: number; // seconds
}