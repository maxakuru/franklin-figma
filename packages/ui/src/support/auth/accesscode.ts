/* eslint-disable camelcase */

/**
 * Uses OAuth2 access code grant flow to authenticate against providers.
 *
 * Requires use of the auth service (packages/auth) to function inside XD,
 * since the redirect from OAuth can't be handled by XD/XD plugins.
 *
 * Exactly one endpoint used for both providers, the auth service.
 */

import {
  makePublicError,
  setErrorMessage,
  cancelableFetch,
  CancelablePromise,
  poll,
  capitalize,
  isStrictlyObject
} from '../../util';
import { openBrowser } from '../../support/figma';

import type { ProgressContext, AnyOk } from '../../types';
import type { AuthData, AuthProvider } from './types';

// eslint-disable-next-line prefer-destructuring
const ENDPOINT = process.env.AUTH_ENDPOINT;

function doFetch(
  provider: AuthProvider,
  path: string,
  query: Record<string, string> = {},
  init: RequestInit = {},
): CancelablePromise<Response> {
  const params = new URLSearchParams(query);
  const paramStr = params.toString();
  const url = `${ENDPOINT}/api/auth/${provider}${path}${paramStr ? `?${paramStr}` : ''}`;
  console.debug('[auth] doFetch() url: ', url);
  return cancelableFetch(url, init);
}

async function pollForCode(
  provider: AuthProvider,
  id: string,
  ctx: ProgressContext,
): Promise<string> {
  const resp = await poll(`${ENDPOINT}/api/auth/${provider}/poll?id=${id}`, ctx);
  const { code } = await resp.json();
  return code;
}

/**
 * Authenticate with auth service using browser oauth2 flow
 */
export async function authenticate(
  provider: AuthProvider,
  ctx: ProgressContext,
): Promise<AuthData> {
  let code: string;
  try {
    console.log('trace 1');
    const resp = await doFetch(provider, '/session');
    console.log('trace 2');

    const { url, id } = await resp.json();
    console.log('trace 3');

    openBrowser(url);
    console.log('trace 4');

    code = await pollForCode(provider, id, ctx);
    console.log('trace 5');
  } catch (e) {
    throw setErrorMessage(e, 'Failed to authenticate.');
  }

  if (!code) {
    throw makePublicError('Invalid code');
  }

  return newAccessToken(provider, code);
}

async function newAccessToken(
  provider: AuthProvider,
  code: string,
): Promise<AuthData> {
  try {
    const grant_type = 'authorization_code';
    const resp = await doFetch(provider, '/token', { code, grant_type });
    const data = await resp.json();

    data.accessToken = data.access_token;
    data.expiresIn = data.expires_in;
    data.expiresAt = new Date(+Date.now() + (data.expiresIn * 1000));
    data.refreshToken = data.refresh_token;
    data.tokenType = data.token_type;
    return data;
  } catch (e) {
    throw setErrorMessage(e, 'Failed to fetch access token.');
  }
}

export async function revokeAccessToken(provider: AuthProvider, token: string): Promise<void> {
  if (typeof token !== 'string') {
    return;
  }

  if (provider === 'microsoft') {
    // doesn't seem like msft has a revoke endpoint
    return;
  }

  try {
    await cancelableFetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
  } catch (e) {
    console.error('[auth] Failed to revoke access token: ', e);
  }
}

export async function refreshAccessToken(
  provider: AuthProvider,
  refreshToken: string,
): Promise<Omit<AuthData, 'refreshToken'>> {
  try {
    const grant_type = 'refresh_token';
    let data: AnyOk;
    try {
      const resp = await doFetch(provider, '/token', { refresh_token: refreshToken, grant_type });
      data = await resp.json();
    } catch (e: AnyOk) {
      if (isStrictlyObject(e.response) && e.response.status === 400) {
        throw setErrorMessage(e, `Invalid credentials. Try reconnecting ${capitalize(provider)} account.`);
      }
      throw e;
    }

    data.accessToken = data.access_token;
    data.expiresIn = data.expires_in;
    data.expiresAt = new Date(Date.now() + (data.expiresIn * 1000));
    if (data.refresh_token) {
      data.refreshToken = data.refresh_token;
    }
    data.tokenType = data.token_type;
    return data;
  } catch (e) {
    throw setErrorMessage(e, 'Failed to refresh access token.');
  }
}
