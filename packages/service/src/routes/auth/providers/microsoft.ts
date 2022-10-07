import type { Context } from "types";
import type { ProviderFactory } from '../types';

const SCOPES_ = ['files.readwrite', 'offline_access'];

const factory: ProviderFactory = (ctx: Context) => {
  return {
    clientId: ctx.env.MICROSOFT_CLIENT_ID,
    scope: SCOPES_.join(' '),
    authUrl: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
    clientSecret: ctx.env.MICROSOFT_CLIENT_SECRET
  }
}

export default factory;