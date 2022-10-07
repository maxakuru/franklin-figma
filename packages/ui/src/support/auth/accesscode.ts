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
import type { AuthData, AuthProvider, NewTokenData } from './types';

// eslint-disable-next-line prefer-destructuring
const ENDPOINT = process.env.AUTH_ENDPOINT;

function doFetch(
  provider: AuthProvider,
  path: string,
  init: RequestInit = {},
  query: Record<string, string> = {},
): CancelablePromise<Response> {
  query['provider'] = provider;
  const params = new URLSearchParams(query);
  const url = `${ENDPOINT}/api/auth${path}?${params.toString()}`;
  return cancelableFetch(url, init);
}

async function pollForAuthData(
  location: string,
  ctx: ProgressContext,
): Promise<NewTokenData> {
  const resp = await poll(location, ctx);
  const data = await resp.json();
  return data.access_token;
}

/**
 * Authenticate with auth service using browser oauth2 flow
 */
export async function authenticate(
  provider: AuthProvider,
  ctx: ProgressContext,
): Promise<AuthData> {
  let data: NewTokenData;
  try {
    const resp = await doFetch(provider, '/session', { method: 'POST' });
    if (!resp.ok) {
      throw makePublicError(`Failed to authenticate: ${resp.status}`);
    }

    const session = await resp.json();
    const { url } = session;
    const pollUrl = resp.headers.get('location');
    openBrowser(url);
    data = await pollForAuthData(pollUrl, ctx);
  } catch (e) {
    throw setErrorMessage(e, 'Failed to authenticate.');
  }

  if (!data) {
    throw makePublicError('Invalid code');
  }

  return makeAuthData(data);
}

function makeAuthData(
  data: NewTokenData
): AuthData {
  const authData: AuthData = {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    scope: data.scope
  }
  return authData;
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
    console.error('[auth/accesstoken] Failed to revoke access token: ', e);
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
      const resp = await doFetch(provider, '/token', undefined, { refresh_token: refreshToken, grant_type });
      data = await resp.json();
    } catch (e: AnyOk) {
      if (isStrictlyObject(e.response) && e.response.status === 400) {
        throw setErrorMessage(e, `Invalid credentials. Try reconnecting ${capitalize(provider)} account.`);
      }
      throw e;
    }

    return makeAuthData(data);
  } catch (e) {
    throw setErrorMessage(e, 'Failed to refresh access token.');
  }
}
