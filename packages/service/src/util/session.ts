import type { Context, Session, SessionActive, SessionPending } from "types";
import { SessionState } from "types";
import { isType } from "util";

import { v4 as uuidv4 } from 'uuid';

const EXPIRATION_PENDING = 300000; // 15 mins in seconds

function getExpiration(sessionOrState: Session | SessionState): Date {
  if (isType(sessionOrState, 'string')) {
    const state = sessionOrState;

    if (state === SessionState.Pending) {
      return new Date(Date.now() + EXPIRATION_PENDING);
    }
  }

  if (isType<'object', Session>(sessionOrState, 'object')) {
    const session = sessionOrState;

    if (session.expiration) {
      return session.expiration;
    }
    if (session.state === SessionState.Pending) {
      return new Date(Date.now() + EXPIRATION_PENDING);
    }
  }

  throw Error('Invalid session');
}

function isExpired(session: Session): boolean {
  return +Date.now() > +session.expiration;
}

export async function createSession(provider: string, ctx: Context) {
  const { SESSIONS } = ctx.env;
  const id = uuidv4();

  // TODO: better keys
  const readKey = uuidv4();
  const writeKey = uuidv4();


  const session: SessionPending = {
    id,
    provider,
    state: SessionState.Pending,
    expiration: getExpiration(SessionState.Pending),
    readKey,
    writeKey
  };
  await SESSIONS.put(id, JSON.stringify(session));
  return session;
}

export async function getSession(id: string, ctx: Context): Promise<Session | undefined> {
  const { SESSIONS } = ctx.env;

  const session = await SESSIONS.get(id);
  if (!session) {
    return;
  }

  const parsed = JSON.parse(session);
  if (isExpired(parsed)) {
    await SESSIONS.delete(id);
    throw Error('session expired');
  }

  return parsed;
}

export async function removeSession(id: string, ctx: Context): Promise<void> {
  await ctx.env.SESSIONS.delete(id);
}

export async function activateSession(session: Session, code: string, ctx: Context): Promise<void> {
  const { SESSIONS } = ctx.env;

  if (session.state !== 'pending') {
    throw Error('Invalid state change.');
  } else {
    const active: SessionActive = {
      ...session,
      state: SessionState.Active,
      code,
      writeKey: undefined
    };
    await SESSIONS.put(active.id, JSON.stringify(active));
  }
}