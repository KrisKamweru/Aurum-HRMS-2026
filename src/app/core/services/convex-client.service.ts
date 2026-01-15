import { Injectable, signal } from '@angular/core';
import { ConvexClient, ConvexHttpClient } from 'convex/browser';
import { environment } from '../../../environments/environment';

const JWT_STORAGE_KEY = '__convexAuthJWT';
const REFRESH_TOKEN_STORAGE_KEY = '__convexAuthRefreshToken';
const VERIFIER_STORAGE_KEY = '__convexAuthOAuthVerifier';

interface AuthTokens {
  token: string;
  refreshToken: string;
}

interface SignInResult {
  tokens?: AuthTokens | null;
  redirect?: string;
  verifier?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConvexClientService {
  private client: ConvexClient;
  private httpClient: ConvexHttpClient;
  private storageNamespace: string;

  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal(true);
  private _token = signal<string | null>(null);

  constructor() {
    this.client = new ConvexClient(environment.convexUrl);
    this.httpClient = new ConvexHttpClient(environment.convexUrl);
    this.storageNamespace = environment.convexUrl.replace(/[^a-zA-Z0-9]/g, '');

    // Initialize auth state from storage
    this.initializeAuth();
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
    } else {
      localStorage.removeItem(this.storageKey(JWT_STORAGE_KEY));
      localStorage.removeItem(this.storageKey(REFRESH_TOKEN_STORAGE_KEY));
    }
  }

  private getStoredVerifier(): string | null {
    return localStorage.getItem(this.storageKey(VERIFIER_STORAGE_KEY));
  }

  private setStoredVerifier(verifier: string | null): void {
    if (verifier) {
      localStorage.setItem(this.storageKey(VERIFIER_STORAGE_KEY), verifier);
    } else {
      localStorage.removeItem(this.storageKey(VERIFIER_STORAGE_KEY));
    }
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check for OAuth callback code in URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        // Handle OAuth callback
        await this.handleOAuthCallback(code);
        // Remove code from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      } else {
        // Restore token from storage
        const token = this.getStoredToken();
        if (token) {
          this._token.set(token);
          this._isAuthenticated.set(true);
          this.setClientAuth(token);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      this._isAuthenticated.set(false);
    } finally {
      this._isLoading.set(false);
    }
  }

  private async handleOAuthCallback(code: string): Promise<void> {
    const verifier = this.getStoredVerifier();
    this.setStoredVerifier(null);

    const result = await this.httpClient.action('auth:signIn' as any, {
      params: { code },
      verifier
    }) as SignInResult;

    if (result.tokens) {
      this.setStoredTokens(result.tokens);
      this._token.set(result.tokens.token);
      this._isAuthenticated.set(true);
      this.setClientAuth(result.tokens.token);
    }
  }

  private setClientAuth(token: string | null): void {
    if (token) {
      this.client.setAuth(async () => token);
    } else {
      this.client.setAuth(async () => null);
    }
  }

  getClient(): ConvexClient {
    return this.client;
  }

  isAuthenticated() {
    return this._isAuthenticated;
  }

  isLoading() {
    return this._isLoading;
  }

  async signIn(provider: string, params: Record<string, any> = {}): Promise<{ success: boolean; redirect?: URL }> {
    const verifier = this.getStoredVerifier();
    this.setStoredVerifier(null);

    try {
      // Only include verifier if it exists (OAuth callback flow)
      const payload: Record<string, any> = {
        provider,
        params,
      };
      if (verifier) {
        payload['verifier'] = verifier;
      }

      const result = await this.httpClient.action('auth:signIn' as any, payload) as SignInResult;

      if (result.redirect) {
        // OAuth redirect
        this.setStoredVerifier(result.verifier || null);
        const redirectUrl = new URL(result.redirect);
        window.location.href = redirectUrl.toString();
        return { success: false, redirect: redirectUrl };
      } else if (result.tokens) {
        // Direct sign in successful
        this.setStoredTokens(result.tokens);
        this._token.set(result.tokens.token);
        this._isAuthenticated.set(true);
        this.setClientAuth(result.tokens.token);
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      // Call signOut action
      await this.client.action('auth:signOut' as any, {});
    } catch (error) {
      // Ignore errors - user might already be signed out
      console.warn('Sign out error (ignored):', error);
    } finally {
      this.setStoredTokens(null);
      this._token.set(null);
      this._isAuthenticated.set(false);
      this.setClientAuth(null);
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const result = await this.httpClient.action('auth:signIn' as any, {
        refreshToken
      }) as SignInResult;

      if (result.tokens) {
        this.setStoredTokens(result.tokens);
        this._token.set(result.tokens.token);
        this._isAuthenticated.set(true);
        this.setClientAuth(result.tokens.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  }
}
