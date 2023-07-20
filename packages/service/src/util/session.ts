import type { Context, Session, SessionActive, SessionPending } from "types";
import { SessionState } from "def";
import type { AuthProvider } from "routes/auth/types";

export const SESSION_DURATION = 300000; // 15 mins in seconds

function isExpired(session: Session): boolean {
  return Date.now() > (SESSION_DURATION * 1000 + session.createdAt);
}

export async function createSession(provider: AuthProvider, ctx: Context) {
  const { SESSIONS } = ctx.env;
  const id = crypto.randomUUID();

  // TODO: better keys
  const readKey = crypto.randomUUID();
  const writeKey = crypto.randomUUID();

  const session: SessionPending = {
    id,
    provider,
    createdAt: Date.now(),
    state: SessionState.Pending,
    readKey,
    writeKey
  };
  await SESSIONS.put(
    id,
    JSON.stringify(session),
    { expirationTtl: SESSION_DURATION }
  );
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
  const { SESSIONS } = ctx.env;
  await SESSIONS.delete(id);
}

export async function activateSession(session: Session, code: string, ctx: Context): Promise<void> {
  const { SESSIONS } = ctx.env;

  if (session.state !== 'pending') {
    throw Error('invalid state change');
  } else {
    const expirationTtl = SESSION_DURATION - ((Date.now() - session.createdAt) / 1000);
    const active: SessionActive = {
      ...session,
      state: SessionState.Active,
      code,
      writeKey: undefined
    };
    await SESSIONS.put(
      active.id,
      JSON.stringify(active),
      { expirationTtl }
    );
  }
}