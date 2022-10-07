import type { Route } from "../../types";
import { activateSession, createSession, getSession } from "util/session";
import { errorResponse, isType, notFound, redirect, removeSession, validateCookie } from "util";
import { createState, parseState } from "util/state";
import { ContentType, SessionState } from "def";
import { exchangeCodeForTokens, isValidProvider, makeAuthUrl } from "./providers";

export const create: Route = async (req, ctx) => {
  const { provider } = req.query;
  const { ENDPOINT, UI_ENDPOINT } = ctx.env;
  if (!isValidProvider(provider)) {
    return errorResponse(400, 'invalid or missing provider', ctx);
  }

  const { id, readKey, writeKey } = await createSession(provider, ctx);
  const redirectUrl = makeAuthUrl(provider, createState({ id, writeKey, provider }), ctx);
  const url = `${UI_ENDPOINT}/auth/login?redirectUrl=${encodeURIComponent(redirectUrl)}&p=${provider}&k=${writeKey}`;

  return new Response(JSON.stringify({
    id,
    readKey,
    writeKey,
    url
  }), {
    status: 201,
    headers: {
      'access-control-allow-origin': UI_ENDPOINT,
      'access-control-expose-headers': 'location',
      'content-type': ContentType.JSON,
      location: `${ENDPOINT}/api/auth/session/${id}?k=${readKey}` // poll url
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
  const { id } = req.params;
  const { k: readKey } = req.query;
  const { log, env: { UI_ENDPOINT } } = ctx;

  try {
    const session = await getSession(id, ctx);
    if (!session || !session.readKey) {
      return notFound(ctx);
    }

    const allowed = session.readKey === readKey;
    if (!allowed) {
      return notFound(ctx);
    }

    const pending = session.state === SessionState.Pending;
    if (pending) {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': UI_ENDPOINT,
          'retry-after': '60'
        }
      });
    }

    const data = await exchangeCodeForTokens(session.provider, session.code, ctx);

    // delete session before returning data
    await removeSession(id, ctx);

    return new Response(JSON.stringify(data), {
      headers: {
        'content-type': ContentType.JSON,
        'access-control-allow-origin': UI_ENDPOINT
      }
    });

  } catch (e) {
    if (isType(e, 'object')) {
      const error = e.message;
      if (error === 'session expired') {
        return errorResponse(400, error, ctx);
      }
    }

    log.error('[auth/session] poll() error: ', e);
    return notFound(ctx);
  }
}