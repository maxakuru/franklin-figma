/// <reference types="@cloudflare/workers-types" />

import type { Request as IttyRequest } from 'itty-router';

export * from './util';
export * from './session';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'DELETE';

export interface Invocation {
  requestId: string;
}

export interface Env {
  UPSTREAM: string;
  ENDPOINT: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_API_KEY: string;
  GOOGLE_DEVICECODE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  CACHE_GEN: string;

  // KV namespaces
  SESSIONS: KVNamespace<string>;
}

export interface Context {
  log: typeof console;
  env: Env;
  invocation: Invocation;
  url: URL;
}

export type Route = (
  req: Request & { params: Record<string, string>; query: Record<string, string>; },
  ctx: Context
) => Promise<Response | undefined | void> | Response | undefined | void;
