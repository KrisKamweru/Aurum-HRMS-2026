import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ConvexClientService } from '../services/convex-client.service';
import { api } from '../../../../convex/_generated/api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = signal(false);
  private isLoading = signal(true);

  constructor(
    private convexService: ConvexClientService,
    private router: Router
  ) {
    this.checkAuthStatus();
  }

  async checkAuthStatus() {
    this.isLoading.set(true);
    try {
      // Check if the user is authenticated by querying the viewer
      const user = await this.convexService.getClient().query(api.users.viewer, {});
      this.isAuthenticated.set(!!user);
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated.set(false);
    } finally {
      this.isLoading.set(false);
    }
  }

  isLoggedIn() {
    return this.isAuthenticated;
  }

  isAuthLoading() {
    return this.isLoading;
  }

  async login(formData: any) {
    const { email, password } = formData;
    await this.convexService.getClient().action(api.auth.signIn, {
      provider: "password",
      params: { flow: "signIn", email, password }
    });

    await this.checkAuthStatus();

    if (this.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return true;
    }
    return false;
  }

  async register(formData: any) {
    const { email, password, name } = formData;
    await this.convexService.getClient().action(api.auth.signIn, {
      provider: "password",
      params: { flow: "signUp", email, password, name }
    });

    await this.checkAuthStatus();

    if (this.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return true;
    }
    return false;
  }

  async logout() {
    await this.convexService.getClient().action(api.auth.signOut, {});
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }
}
