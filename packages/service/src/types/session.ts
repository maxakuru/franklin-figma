export const enum SessionState {
  Pending = 'pending',
  Active = 'active'
}

export interface SessionBase {
  id: string;
  provider: string;
  expiration: Date;
  state: SessionState;
}

export interface SessionPending extends SessionBase {
  state: SessionState.Pending;
  code?: undefined;
  readKey: string;
  writeKey: string;
}

export interface SessionActive extends SessionBase {
  state: SessionState.Active;
  code: string;
  readKey: string;
  writeKey?: undefined;
}

export type Session = SessionPending | SessionActive;