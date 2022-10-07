import { SessionState } from "def";
import { AuthProvider } from "routes/auth/types";


export interface SessionBase {
  id: string;
  createdAt: number; // ms since epoch
  provider: AuthProvider;
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