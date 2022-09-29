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

/* eslint-disable camelcase, prefer-destructuring */

import {
  cancelableFetch,
  CancelablePromise,
  ENCODED_FORM_CONTENT_TYPE,
  makeEncodedFormData,
  poll,
  makePublicError,
  setErrorMessage,
  capitalize,
  isStrictlyObject
} from '../../util';


import type {
  AuthData,
  AuthProvider,
  DeviceCodeData,
  RefreshedTokenData,
} from './types';
import { openBrowser } from '../figma';
import { AnyOk, ProgressContext } from '../../types';

const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID;
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const GOOGLE_DEVICECODE_CLIENT_ID = process.env.GOOGLE_DEVICECODE_CLIENT_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GRANTTYPE_DEVICE_CODE = 'urn:ietf:params:oauth:grant-type:device_code';
const AUTH_ENDPOINT = process.env.AUTH_ENDPOINT;
const UI_ENDPOINT = process.env.UI_ENDPOINT;
const MIN_POLL_INTERVAL = 5; // seconds

if (!MICROSOFT_TENANT_ID) {
  throw makePublicError(
    'Build Error: Missing Microsoft OAuth tenant ID. Set using env variable `MICROSOFT_TENANT_ID`.',
  );
}

if (!MICROSOFT_CLIENT_ID) {
  throw makePublicError(
    'Build Error: Missing Microsoft OAuth client ID. Set using env variable `MICROSOFT_CLIENT_ID`.',
  );
}

interface AuthProviderConfig {
  baseUrl: string;
  client_id: string;
  device_client_id?: string;
  scopes: string[];
}

const config: Record<AuthProvider, AuthProviderConfig> = {
  microsoft: {
    client_id: MICROSOFT_CLIENT_ID,
    baseUrl: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0`,
    scopes: ['files.readwrite', 'offline_access', 'openid', 'profile'],
  },
  google: {
    device_client_id: GOOGLE_DEVICECODE_CLIENT_ID,
    client_id: GOOGLE_CLIENT_ID,
    baseUrl: 'https://oauth2.googleapis.com',
    scopes: ['https://www.googleapis.com/auth/drive.file', 'openid', 'profile'],
  },
};

function doFetch(
  provider: AuthProvider,
  pathOrUrl: string,
  init?: RequestInit,
  query?: Record<string, string>,
): CancelablePromise<Response> {
  const { baseUrl } = config[provider];

  let url: URL;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    url = new URL(pathOrUrl);
  } else {
    url = new URL(`${baseUrl}${pathOrUrl}`);
  }

  if (query) {
    const params = new URLSearchParams(query);
    url.search = params.toString();
  }

  console.debug('[auth] doFetch() url: ', url.toString());
  return cancelableFetch(url.toString(), init);
}

async function pollForAuthData(
  provider: AuthProvider,
  device_code: string,
  ctx: ProgressContext,
  interval?: number,
): Promise<AuthData> {
  const { client_id, device_client_id, baseUrl } = config[provider];

  // NOTE: Google requires client secret to poll for device code flow
  // so using the auth service is still required for this one case.

  let url = `${baseUrl}/token`;
  if (provider === 'google') {
    if (!AUTH_ENDPOINT) {
      throw makePublicError('Auth endpoint not set, this build does not support Google accounts.');
    }
    url = `${AUTH_ENDPOINT}/api/auth/google/devicecode/token`;
  }

  const resp = await poll(
    url,
    ctx,
    {
      method: 'POST',
      headers: {
        'content-type': ENCODED_FORM_CONTENT_TYPE,
        'x-poll-interval': `${interval}`,
      },
      body: makeEncodedFormData({
        grant_type: GRANTTYPE_DEVICE_CODE,
        device_code,
        client_id: device_client_id ?? client_id,
      }),
    },
    Math.max(interval, MIN_POLL_INTERVAL),
  );

  if (ctx.canceled || !resp) {
    return;
  }

  const body = await resp.json();
  const {
    token_type: tokenType,
    scope,
    expires_in: expiresIn,
    access_token: accessToken,
    refresh_token: refreshToken,
    // id_token,
  } = body;

  const expiresAt = new Date(+Date.now() + expiresIn * 1000);

  return {
    accessToken,
    expiresAt,
    refreshToken,
    scope,
    tokenType,
  };
}

export async function shareFile(
  provider: AuthProvider,
  fileId: string,
  token?: string,
): Promise<void> {
  if (provider !== 'google') {
    return;
  }
  openBrowser(`${UI_ENDPOINT}/auth/google/picker?f=${fileId}${token ? `#t=${token}` : ''}`);

  // TODO: show dialog with next button, check that required access is granted
}

/**
 * Authenticate with auth service using browser oauth2 flow
 */
export async function authenticate(
  provider: AuthProvider,
  ctx: ProgressContext,
): Promise<AuthData> {
  try {
    const { client_id, device_client_id, scopes } = config[provider];
    const path = provider === 'google' ? '/device/code' : '/devicecode';

    const resp = await doFetch(provider, path, {
      method: 'POST',
      headers: {
        'content-type': ENCODED_FORM_CONTENT_TYPE,
      },
      body: makeEncodedFormData({
        client_id: device_client_id ?? client_id,
        scope: scopes.join(' '),
      }),
    });

    const codeData: DeviceCodeData = await resp.json();
    if (ctx.canceled || !resp) {
      return;
    }

    const { device_code: deviceCode, user_code: userCode, interval } = codeData;
    const url = codeData.verification_uri ? codeData.verification_uri : codeData.verification_url;

    ctx.setMessage('todo');
    openBrowser(url);

    const data = await pollForAuthData(provider, deviceCode, ctx, interval);
    ctx.setMessage('');
    return data;
  } catch (e) {
    throw setErrorMessage(e, 'Failed to authenticate.');
  }
}

export async function refreshAccessToken(
  provider: AuthProvider,
  refresh_token: string,
): Promise<Omit<AuthData, 'refreshToken'>> {
  try {
    let { client_id } = config[provider];

    let url = '/token';
    if (provider === 'google') {
      if (!AUTH_ENDPOINT) {
        throw makePublicError(
          'Auth endpoint not set, this build does not support Google accounts.',
        );
      }
      url = `${AUTH_ENDPOINT}/api/auth/google/devicecode/token`;
      client_id = config[provider].device_client_id;
    }

    const resp = await doFetch(provider, url, {
      method: 'POST',
      headers: {
        'content-type': ENCODED_FORM_CONTENT_TYPE,
      },
      body: makeEncodedFormData({
        refresh_token,
        client_id,
        grant_type: 'refresh_token',
      }),
    });

    const data: RefreshedTokenData = await resp.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    return {
      accessToken: data.access_token,
      scope: data.scope,
      tokenType: data.token_type,
      expiresAt,
    };
  } catch (e: AnyOk) {
    if (isStrictlyObject(e.response) && e.response.status === 400) {
      throw setErrorMessage(
        e,
        `Invalid credentials. Try reconnecting ${capitalize(provider)} account.`,
      );
    }
    throw setErrorMessage(e, 'Failed to refresh access token.');
  }
}
