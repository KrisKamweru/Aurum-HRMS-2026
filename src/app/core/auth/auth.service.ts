import { Injectable, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { ConvexClientService } from '../services/convex-client.service';
import { api } from '../../../../convex/_generated/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<any>(null);

  constructor(
    private convexService: ConvexClientService,
    private router: Router
  ) {
    // Subscribe to user data when authenticated
    this.setupUserSubscription();
  }

  private setupUserSubscription() {
    // Watch auth state and subscribe to user when authenticated
    effect(() => {
      const isAuthenticated = this.convexService.isAuthenticated()();
      if (isAuthenticated) {
        this.subscribeToUser();
      } else {
        this.currentUser.set(null);
      }
    });
  }

  private subscribeToUser() {
    const client = this.convexService.getClient();
    client.onUpdate(api.users.viewer, {}, (user) => {
      this.currentUser.set(user);
    });
  }

  isLoggedIn() {
    return this.convexService.isAuthenticated();
  }

  isAuthLoading() {
    return this.convexService.isLoading();
  }

  getUser() {
    return this.currentUser;
  }

  async login(formData: any) {
    const { email, password } = formData;

    const result = await this.convexService.signIn("password", {
      flow: "signIn",
      email,
      password
    });

    if (result.success) {
      // Wait a bit for the user subscription to update
      await this.waitForUser();
      this.router.navigate(['/dashboard']);
      return true;
    }

    throw new Error('Login failed');
  }

  async register(formData: any) {
    const { email, password, name } = formData;

    const result = await this.convexService.signIn("password", {
      flow: "signUp",
      email,
      password,
      name
    });

    if (result.success) {
      // Wait a bit for the user subscription to update
      await this.waitForUser();
      this.router.navigate(['/dashboard']);
      return true;
    }

    throw new Error('Registration failed');
  }

  async signInWithGoogle() {
    // OAuth will redirect, so no need to handle success here
    const redirectTo = window.location.origin + '/auth/login';
    await this.convexService.signIn("google", { redirectTo });
  }

  async signInWithMicrosoft() {
    // OAuth will redirect, so no need to handle success here
    const redirectTo = window.location.origin + '/auth/login';
    await this.convexService.signIn("microsoft-entra-id", { redirectTo });
  }

  async logout() {
    await this.convexService.signOut();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    // Use the password provider with reset-password flow
    await this.convexService.signIn("password", {
      flow: "reset",
      email,
    });
  }

  private waitForUser(): Promise<void> {
    return new Promise((resolve) => {
      const checkUser = () => {
        if (this.currentUser() !== null) {
          resolve();
        } else {
          setTimeout(checkUser, 100);
        }
      };
      // Set a timeout to avoid infinite wait
      setTimeout(() => resolve(), 2000);
      checkUser();
    });
  }
}
