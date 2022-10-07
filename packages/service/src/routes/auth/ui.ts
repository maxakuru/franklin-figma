import type { Route } from "types";
import { fetchUpstream, redirect, SESSION_DURATION } from "util";
import { isValidProvider } from "./providers";


export const login: Route = async (req, ctx) => {
  const { p: provider, k: writeKey, redirectUrl } = req.query;
  const { env, url } = ctx;

  if (!writeKey || !isValidProvider(provider) || !redirectUrl) {
    return redirect(`/auth/failure${provider ? `?p=${provider}` : ''}`, ctx);
  }

  const upstreamUrl = `${env.UPSTREAM}${url.pathname}`;
  const res = await fetchUpstream(upstreamUrl, req, ctx);
  res.headers.set('set-cookie', `${provider}:writeKey=${writeKey};max-age=${SESSION_DURATION}`);

  return res;
}

export const logout: Route = (req, ctx) => {
  // TODO
  return new Response('Not implemented', { status: 501 });
}

export const success: Route = async (req, ctx) => {
  const { p: provider } = req.query;
  const { env, url } = ctx;

  const upstreamUrl = `${env.UPSTREAM}${url.pathname}${url.search}`;
  const res = await fetchUpstream(upstreamUrl, req, ctx);
  if (provider) {
    res.headers.set('set-cookie', `${provider}:writeKey=;max-age=-1`);
  }
  return res;
}

export const failure: Route = async (req, ctx) => {
  const { p: provider } = req.query;
  const { env, url } = ctx;

  const upstreamUrl = `${env.UPSTREAM}${url.pathname}${url.search}`;
  const res = await fetchUpstream(upstreamUrl, req, ctx);
  if (provider) {
    res.headers.set('set-cookie', `${provider}:writeKey=;max-age=-1`);
  }
  return res;
}
