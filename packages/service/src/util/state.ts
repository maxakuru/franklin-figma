export interface OAuthRedirectState {
  id: string;
  writeKey: string;
  provider: string;
}

export function createState(state: OAuthRedirectState) {
  return encodeURIComponent(`${state.provider};${state.id};${state.writeKey}`);
}

export function parseState(stateStr: string): OAuthRedirectState {
  const decoded = decodeURIComponent(stateStr);
  const [provider, id, writeKey] = decoded.split(';');
  return {
    id,
    provider,
    writeKey
  }
}