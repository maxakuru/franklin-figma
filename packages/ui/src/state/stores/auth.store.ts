
import {
  AuthData,
  authenticate,
  AuthProvider,
  refreshAccessToken,
  revokeAccessToken,
} from '../../support/auth';
import {
  makeObservable,
  observable,
  action,
  computed,
  runInAction,
} from 'mobx';
import type { RootStore } from './root.store';
import { retrieve, setOrRemove } from '../../support/figma';
import { capitalize, makePublicError } from '../../util';
import { ErrorWithMessage, ProgressContext } from '../../types';
import { BaseStore } from './BaseStore';


function restoreAuthData(authData: AuthData): AuthData {
  if (authData && authData.expiresAt) {
    authData.expiresAt = new Date(authData.expiresAt);
  }
  return authData;
}

export class AuthStore extends BaseStore {
  authData: Record<AuthProvider, AuthData> = {
    microsoft: undefined,
    google: undefined,
  };

  constructor(root: RootStore) {
    super(root);
    makeObservable(this, {
      authData: observable,

      isMicrosoftAuthenticated: computed,
      isGoogleAuthenticated: computed,
      microsoftAccessToken: computed,
      microsoftRefreshToken: computed,
      googleAccessToken: computed,
      googleRefreshToken: computed,

      authenticate: action,
      logout: action,
      getAccessToken: action,
      setAuthData: action,
      refreshToken: action,
      clearAuthData: action,
      getMicrosoftToken: action,
      getGoogleToken: action,
    });
  }

  get microsoftAccessToken(): string | undefined {
    return this.authData.microsoft?.accessToken;
  }

  get microsoftRefreshToken(): string | undefined {
    return this.authData.microsoft?.refreshToken;
  }

  get microsoftExpiresAt(): Date | undefined {
    return this.authData.microsoft?.expiresAt;
  }

  get isMicrosoftAuthenticated(): boolean {
    const authData = this.authData.microsoft;
    return authData && !!authData.accessToken && !!authData.refreshToken;
  }

  get googleAccessToken(): string | undefined {
    return this.authData.google?.accessToken;
  }

  get googleRefreshToken(): string | undefined {
    return this.authData.google?.refreshToken;
  }

  get googleExpiresAt(): Date | undefined {
    return this.authData.google?.expiresAt;
  }

  get isGoogleAuthenticated(): boolean {
    const authData = this.authData.google;
    return !!authData && !!authData.accessToken && !!authData.refreshToken;
  }

  async onInit(): Promise<void> {
    let data: AuthData = await retrieve('google_auth_data');
    if (data && data.refreshToken) {
      runInAction(() => {
        this.authData.google = restoreAuthData(data);
      });
    }

    data = await retrieve('microsoft_auth_data');
    if (data && data.refreshToken) {
      runInAction(() => {
        this.authData.microsoft = restoreAuthData(data);
      });
    }
  }

  onReset() {
    this.authData = {
      microsoft: undefined,
      google: undefined,
    };
  }

  getAuthData(provider: AuthProvider): AuthData | undefined {
    return this.authData[provider];
  }

  async setAuthData(provider: AuthProvider, data: Partial<AuthData>): Promise<AuthData> {
    this.authData[provider] = {
      ...(this.authData[provider] ?? {}),
      ...data,
    } as AuthData;
    await setOrRemove(`${provider}_auth_data`, this.authData[provider]);
    return this.authData[provider];
  }

  async clearAuthData(provider: AuthProvider): Promise<void> {
    this.authData[provider] = undefined;
    await setOrRemove(`${provider}_auth_data`, undefined);
  }

  isTokenValid(provider: AuthProvider): boolean {
    const authData = this.getAuthData(provider);
    if (!authData) {
      return false;
    }

    const { expiresAt } = authData;
    if (!expiresAt) {
      return false;
    }

    return +expiresAt > Date.now();
  }

  isAuthenticated(provider: AuthProvider): boolean {
    return provider === 'google' ? this.isGoogleAuthenticated : this.isMicrosoftAuthenticated;
  }

  assertAuthenticated(provider: AuthProvider): void {
    if (!this.isAuthenticated(provider)) {
      throw makePublicError(`Not authenticated with ${capitalize(provider)}`);
    }
  }

  async refreshToken(provider: AuthProvider): Promise<AuthData> {
    this.assertAuthenticated(provider);

    const refreshToken = provider === 'google' ? this.googleRefreshToken : this.microsoftRefreshToken;
    if (!refreshToken) {
      throw makePublicError('No refresh token.');
    }

    const data = await refreshAccessToken(provider, refreshToken);
    return this.setAuthData(provider, data);
  }

  async getAccessToken(provider: AuthProvider): Promise<string | undefined> {
    this.assertAuthenticated(provider);
    let { accessToken } = this.authData[provider];

    if (this.isTokenValid(provider)) {
      return accessToken;
    }

    try {
      ({ accessToken } = await this.refreshToken(provider));
    } catch (e) {
      if ((e as ErrorWithMessage).publicMessage.startsWith('Invalid credentials')) {
        try {
          await this.logout(provider);
        } catch (_) {
          // noop
        }
      }
      throw e;
    }
    return accessToken;
  }

  async authenticate(provider: AuthProvider, ctx: ProgressContext): Promise<AuthData> {
    const data = await authenticate(provider, ctx);
    await this.setAuthData(provider, data);

    return data;
  }

  async logout(provider: AuthProvider): Promise<void> {
    const authData = this.authData[provider];
    if (authData) {
      const token = authData.refreshToken ?? authData.accessToken;
      await revokeAccessToken(provider, token);
    }
    await this.clearAuthData(provider);
  }

  async getMicrosoftToken(): Promise<string | undefined> {
    return this.getAccessToken('microsoft');
  }

  async getGoogleToken(): Promise<string | undefined> {
    return this.getAccessToken('google');
  }
}
