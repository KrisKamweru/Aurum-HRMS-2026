import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ConvexClientService } from '../services/convex-client.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let convexClientServiceSpy: any;
  let routerSpy: any;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      onUpdate: vi.fn(),
      mutation: vi.fn(),
      query: vi.fn()
    };

    convexClientServiceSpy = {
      isAuthenticated: vi.fn().mockReturnValue(signal(false)),
      getClient: vi.fn().mockReturnValue(mockClient),
      isLoading: vi.fn().mockReturnValue(signal(false)),
      signIn: vi.fn(),
      signOut: vi.fn()
    };

    routerSpy = {
      navigate: vi.fn()
    };

    console.log('ConvexClientService:', ConvexClientService);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ConvexClientService, useValue: convexClientServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check login status', () => {
    expect(service.isLoggedIn()()).toBe(false);
    expect(convexClientServiceSpy.isAuthenticated).toHaveBeenCalled();
  });

  it('should call signOut and navigate on logout', async () => {
    await service.logout();
    expect(convexClientServiceSpy.signOut).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
