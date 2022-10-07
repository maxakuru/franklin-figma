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
  init: RequestInit = {},
  query: Record<string, string> = {},
): CancelablePromise<Response> {
  query['provider'] = provider;
  const params = new URLSearchParams(query);
  const paramStr = params.toString();
  const url = `${ENDPOINT}/api/auth${path}?${paramStr}`;
  console.debug('[auth] doFetch() url: ', url);
  return cancelableFetch(url, init);
}

async function pollForCode(
  location: string,
  ctx: ProgressContext,
): Promise<string> {
  const resp = await poll(location, ctx);
  const data = await resp.json();
  console.log('polled for data: ', data);
  return data.access_token;
}

/**
 * Authenticate with auth service using browser oauth2 flow
 */
export async function authenticate(
  provider: AuthProvider,
  ctx: ProgressContext,
): Promise<AuthData> {
  let data: any;
  try {
    const resp = await doFetch(provider, '/session', { method: 'POST' });
    if (!resp.ok) {
      throw makePublicError(`Failed to authenticate: ${resp.status}`);
    }

    const { url } = await resp.json();
    const pollUrl = resp.headers.get('location');
    openBrowser(url);
    data = await pollForCode(pollUrl, ctx);
  } catch (e) {
    throw setErrorMessage(e, 'Failed to authenticate.');
  }

  if (!data) {
    throw makePublicError('Invalid code');
  }

  return makeAuthData(data);
}

function makeAuthData(
  data: any
): AuthData {
  data.accessToken = data.access_token;
  data.expiresIn = data.expires_in;
  data.expiresAt = new Date(Date.now() + (data.expiresIn * 1000));
  data.refreshToken = data.refresh_token;
  data.tokenType = data.token_type;
  return data;
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
