import type { Route } from "../../types";
import { activateSession, createSession, getSession } from "util/session";
import { errorResponse, isType, redirect, removeSession, validateCookie } from "util";
import { createState, parseState } from "util/state";
import { ContentType, SessionState } from "def";
import { exchangeCodeForTokens, isValidProvider, makeAuthUrl } from "./providers";

export const create: Route = async (req, ctx) => {
  const { provider } = req.query;
  const { ENDPOINT } = ctx.env;
  if (!isValidProvider(provider)) {
    return errorResponse(400, 'invalid or missing provider');
  }

  const { id, readKey, writeKey } = await createSession(provider, ctx);
  const url = makeAuthUrl(provider, createState({ id, writeKey, provider }), ctx);

  return new Response(JSON.stringify({
    id,
    readKey,
    writeKey
  }), {
    status: 201,
    headers: {
      'content-type': ContentType.JSON,
      location: `${ENDPOINT}/api/auth/session/${id}?k=${readKey}`, // poll url
      'x-open-url': `${ENDPOINT}/auth/login?redirectUrl=${encodeURIComponent(url)}&p=${provider}&k=${writeKey}`
    }
  });
}


export const activate: Route = async (req, ctx) => {
  const { state, code } = req.query;
  if (!state || !code) {
    return redirect('/auth/failure', ctx);
  }

  const { id, writeKey, provider } = parseState(state);
  const session = await getSession(id, ctx);

  if (!session || provider !== session.provider) {
    return redirect(`/auth/failure?p=${provider}`, ctx);
  }

  const allowed = session.writeKey === writeKey && validateCookie(`${provider}:writeKey`, writeKey, req);
  if (!allowed) {
    return redirect(`/auth/failure?p=${provider}`, ctx);
  }

  await activateSession(session, code, ctx);
  return redirect(`/auth/success?p=${provider}`, ctx);
}

export const poll: Route = async (req, ctx) => {
  const { id, k: readKey } = req.params;
  const { log } = ctx;

  try {
    const session = await getSession(id, ctx);
    if (!session || !session.readKey) {
      return new Response(null, { status: 404 });
    }

    const allowed = session.readKey === readKey;
    if (!allowed) {
      return new Response(null, { status: 404 });
    }

    const pending = session.state === SessionState.Pending;
    if (pending) {
      return new Response(null, {
        status: 204,
        headers: {
          'retry-after': '60'
        }
      });
    }

    const data = await exchangeCodeForTokens(session.provider, session.code, ctx);

    // delete session before returning data
    await removeSession(id, ctx);

    return new Response(JSON.stringify({
      refresh_token: '',
      access_token: '',
      expires_in: 0
    }), {
      headers: {
        'content-type': ContentType.JSON
      }
    });

  } catch (e) {
    if (isType(e, 'object')) {
      const error = e.message;
      if (error === 'session expired') {
        return errorResponse(400, error);
      }
    }

    log.error('[auth/session] poll() error: ', e);
    return new Response(null, { status: 404 });
  }
}