import { ContentType, GrantType } from "def";
import { Context } from "types";
import { logErrorBody } from "util";
import { AuthProvider, NewTokenData, ProviderFactory } from "../types";
import Google from './google';
import Microsoft from './microsoft';

type CodeOrToken =
  | {
    refresh_token: string;
    code?: string;
  }
  | {
    code: string;
    refresh_token?: string;
  };

const factories: Record<AuthProvider, ProviderFactory> = {
  'google': Google,
  'microsoft': Microsoft
};

export function isValidProvider(providerType: string): providerType is AuthProvider {
  return Object.keys(factories).includes(providerType);
}

export function makeAuthUrl(
  providerType: AuthProvider,
  state: string,
  ctx: Context,
): string {
  const { ENDPOINT } = ctx.env;
  const provider = factories[providerType](ctx);

  const opts: Record<string, string | string[]> = {
    response_type: 'code',
    client_id: provider.clientId,
    redirect_uri: `${ENDPOINT}/api/auth/callback`,
    state,
    scope: provider.scope,
    access_type: 'offline',
  };

  const params = new URLSearchParams(opts as Record<string, string>);
  return `${provider.authUrl}?${params}`;
}

export function makeTokenRequest(
  providerType: AuthProvider,
  grant_type: GrantType,
  codeOrToken: CodeOrToken,
  ctx: Context,
): [url: string, body: URLSearchParams] {
  const { ENDPOINT } = ctx.env;
  const provider = factories[providerType](ctx);

  const opts: Record<string, string | string[]> = {
    grant_type,
    client_id: provider.clientId,
    redirect_uri: `${ENDPOINT}/api/auth/google/callback`,
    client_secret: provider.clientSecret,
    scope: provider.scope,
  };
  if (grant_type === GrantType.AuthCode) {
    opts.code = codeOrToken.code!;
  }
  if (grant_type === GrantType.RefreshToken) {
    opts.refresh_token = codeOrToken.refresh_token!;
  }

  const params = new URLSearchParams(opts as Record<string, string>);
  return [provider.tokenUrl, params];
}

export async function exchangeCodeForTokens(providerType: AuthProvider, code: string, ctx: Context) {
  const { log } = ctx;

  const [url, body] = makeTokenRequest(
    providerType,
    GrantType.AuthCode,
    { code },
    ctx,
  );
  log.info(`[auth/${providerType}] Fetch token url=${url} body=${body}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': ContentType.URLForm,
    },
    body,
  });
  if (!response.ok) {
    log.error(`[auth/${providerType}] Error exchanging code. status=${response.status}`);
    await logErrorBody(response, providerType, ctx);
    throw Error(`error exchanging code: ${response.status}`);
  }

  try {
    return await response.json<NewTokenData>();
  } catch (e) {
    log.error(`[auth/${providerType}] Failed to parse: `, e, await response.text());
    throw Error('failed to parse new token response');
  }
}