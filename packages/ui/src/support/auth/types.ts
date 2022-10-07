/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

export type OAuthFlow = 'device_code' | 'access_code';

export type AuthProvider = 'microsoft' | 'google';

export interface AuthData {
  accessToken: string;
  expiresAt: Date;
  refreshToken: string;
  scope: string;
  tokenType: string;
  expiresIn: number;
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
