import { makePublicError, cancelableFetch } from '../../util';
import * as AccessCode from './accesscode';
import * as DeviceCode from './devicecode';

import type { AuthProvider, OAuthFlow } from './types';

export * from './types';

export const OAUTH_FLOWS: OAuthFlow[] = ['device_code', 'access_code'];

const flow: OAuthFlow = (process.env.OAUTH_FLOW ?? 'access_code') as OAuthFlow;

if (!OAUTH_FLOWS.includes(flow)) {
  throw makePublicError(`Build Error! Invalid OAuth flow: ${flow}. Supported types: ${OAUTH_FLOWS.join(', ')}.`);
}

export const authenticate = flow === 'access_code' ? AccessCode.authenticate : DeviceCode.authenticate;
export const refreshAccessToken = flow === 'access_code' ? AccessCode.refreshAccessToken : DeviceCode.refreshAccessToken;
export const shareFile = flow === 'access_code' ? () => Promise.resolve() : DeviceCode.shareFile;

export async function revokeAccessToken(provider: AuthProvider, token: string): Promise<void> {
  if (typeof token !== 'string') {
    return;
  }

  if (provider === 'microsoft') {
    // msft does not have a revoke endpoint
    return;
  }

  try {
    await cancelableFetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
  } catch (e) {
    console.warn('[auth] Failed to revoke access token: ', e);
  }
}
