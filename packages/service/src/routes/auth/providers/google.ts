import type { Context } from "types";
import type { ProviderFactory } from '../types';

const SCOPES_ = ['https://www.googleapis.com/auth/drive']; // drive.file to limit scope to files created by the plugin

const factory: ProviderFactory = (ctx: Context) => {
  return {
    clientId: ctx.env.GOOGLE_CLIENT_ID,
    scope: SCOPES_.join(' '),
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientSecret: ctx.env.GOOGLE_CLIENT_SECRET
  }
}

export default factory;