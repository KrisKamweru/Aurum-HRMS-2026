import { Injectable, Signal, signal } from '@angular/core';
import { ConvexClient, ConvexHttpClient } from 'convex/browser';
import { environment } from '../../../environments/environment';

const JWT_STORAGE_KEY = '__convexAuthJWT';
const REFRESH_TOKEN_STORAGE_KEY = '__convexAuthRefreshToken';
const VERIFIER_STORAGE_KEY = '__convexAuthOAuthVerifier';

interface AuthTokens {
  token: string;
  refreshToken: string;
}

interface AuthActionResult {
  tokens?: AuthTokens | null;
  redirect?: string;
  verifier?: string;
}

@Injectable({ providedIn: 'root' })
export class ConvexClientService {
  private readonly client = new ConvexClient(environment.convexUrl);
  private readonly httpClient = new ConvexHttpClient(environment.convexUrl);
  private readonly storageNamespace = environment.convexUrl.replace(/[^a-zA-Z0-9]/g, '');

  private readonly authenticatedState = signal(false);
  private readonly loadingState = signal(true);
  private readonly tokenState = signal<string | null>(null);

  readonly isAuthenticated: Signal<boolean> = this.authenticatedState.asReadonly();
  readonly isLoading: Signal<boolean> = this.loadingState.asReadonly();
  readonly token: Signal<string | null> = this.tokenState.asReadonly();

  constructor() {
    if (!environment.production && typeof window !== 'undefined') {
      (window as unknown as { __aurumConvexClient?: unknown }).__aurumConvexClient = this.client;
    }
    void this.initializeAuth();
  }

  getClient(): ConvexClient {
    return this.client;
  }

  getHttpClient(): ConvexHttpClient {
    return this.httpClient;
  }

  async signIn(provider: string, params: Record<string, unknown> = {}): Promise<{ success: boolean; redirect?: URL }> {
    const verifier = this.getStoredVerifier();
    this.setStoredVerifier(null);

    const payload: Record<string, unknown> = {
      provider,
      params
    };
    if (verifier) {
      payload['verifier'] = verifier;
    }

    const result = (await this.httpClient.action('auth:signIn' as never, payload as never)) as AuthActionResult;
    if (result.redirect) {
      this.setStoredVerifier(result.verifier ?? null);
      const redirectUrl = new URL(result.redirect);
      window.location.href = redirectUrl.toString();
      return { success: false, redirect: redirectUrl };
    }

    if (result.tokens) {
      this.applyTokens(result.tokens);
      return { success: true };
    }

    return { success: false };
  }

  async signOut(): Promise<void> {
    try {
      await this.client.action('auth:signOut' as never, {} as never);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const result = (await this.httpClient.action('auth:signIn' as never, { refreshToken } as never)) as AuthActionResult;
      if (result.tokens) {
        this.applyTokens(result.tokens);
        return true;
      }
    } catch {
      this.clearTokens();
    }

    return false;
  }

  private async initializeAuth(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          await this.handleOAuthCallback(code);
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.pathname + url.search + url.hash);
          return;
        }
      }

      const storedToken = this.getStoredToken();
      if (storedToken) {
        this.applyTokenOnly(storedToken);
      } else {
        this.clearTokens();
      }
    } catch {
      this.clearTokens();
    } finally {
      this.loadingState.set(false);
    }
  }

  private async handleOAuthCallback(code: string): Promise<void> {
    const verifier = this.getStoredVerifier();
    this.setStoredVerifier(null);

    const payload: Record<string, unknown> = { params: { code } };
    if (verifier) {
      payload['verifier'] = verifier;
    }

    const result = (await this.httpClient.action('auth:signIn' as never, payload as never)) as AuthActionResult;
    if (result.tokens) {
      this.applyTokens(result.tokens);
    } else {
      this.clearTokens();
    }
  }

  private applyTokens(tokens: AuthTokens): void {
    this.setStoredTokens(tokens);
    this.applyTokenOnly(tokens.token);
  }

  private applyTokenOnly(token: string): void {
    this.tokenState.set(token);
    this.authenticatedState.set(true);
    this.client.setAuth(async () => token);
    this.httpClient.setAuth(token);
  }

  private clearTokens(): void {
    this.setStoredTokens(null);
    this.setStoredVerifier(null);
    this.tokenState.set(null);
    this.authenticatedState.set(false);
    this.client.setAuth(async () => null);
    this.httpClient.clearAuth();
  }

  private storageKey(key: string): string {
    return `${key}_${this.storageNamespace}`;
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.storageKey(JWT_STORAGE_KEY));
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.storageKey(REFRESH_TOKEN_STORAGE_KEY));
  }

  private setStoredTokens(tokens: AuthTokens | null): void {
    if (tokens) {
      localStorage.setItem(this.storageKey(JWT_STORAGE_KEY), tokens.token);
      localStorage.setItem(this.storageKey(REFRESH_TOKEN_STORAGE_KEY), tokens.refreshToken);
      return;
    }
    localStorage.removeItem(this.storageKey(JWT_STORAGE_KEY));
    localStorage.removeItem(this.storageKey(REFRESH_TOKEN_STORAGE_KEY));
  }

  private getStoredVerifier(): string | null {
    return localStorage.getItem(this.storageKey(VERIFIER_STORAGE_KEY));
  }

  private setStoredVerifier(verifier: string | null): void {
    if (verifier) {
      localStorage.setItem(this.storageKey(VERIFIER_STORAGE_KEY), verifier);
      return;
    }
    localStorage.removeItem(this.storageKey(VERIFIER_STORAGE_KEY));
  }
}
