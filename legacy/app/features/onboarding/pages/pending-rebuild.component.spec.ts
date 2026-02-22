import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { PendingOnboardingRebuildStore } from '../data/pending-onboarding-rebuild.store';
import { PendingRebuildComponent } from './pending-rebuild.component';

describe('PendingRebuildComponent', () => {
  let fixture: ComponentFixture<PendingRebuildComponent>;
  let component: PendingRebuildComponent;
  let storeMock: Pick<
    PendingOnboardingRebuildStore,
    | 'requests'
    | 'matchingOrganizations'
    | 'directoryOrganizations'
    | 'hubLoading'
    | 'directoryLoading'
    | 'joinSubmitting'
    | 'cancellingRequestId'
    | 'error'
    | 'loadHub'
    | 'loadDirectory'
    | 'createJoinRequest'
    | 'cancelJoinRequest'
    | 'clearError'
  >;
  let authMock: Pick<AuthSessionService, 'user' | 'signOut'>;

  beforeEach(async () => {
    storeMock = {
      requests: signal([]).asReadonly(),
      matchingOrganizations: signal([{ id: 'org-1', name: 'Aurum', domain: 'aurum.dev' }]).asReadonly(),
      directoryOrganizations: signal([{ id: 'org-1', name: 'Aurum', domain: 'aurum.dev' }]).asReadonly(),
      hubLoading: signal(false).asReadonly(),
      directoryLoading: signal(false).asReadonly(),
      joinSubmitting: signal(false).asReadonly(),
      cancellingRequestId: signal<string | null>(null).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadHub: vi.fn(async () => {}),
      loadDirectory: vi.fn(async () => {}),
      createJoinRequest: vi.fn(async () => true),
      cancelJoinRequest: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    authMock = {
      user: signal({ id: 'user-1', name: 'Amina', role: 'pending', email: 'amina@aurum.dev' }).asReadonly(),
      signOut: vi.fn(async () => {})
    };

    await TestBed.configureTestingModule({
      imports: [PendingRebuildComponent],
      providers: [
        provideRouter([]),
        { provide: PendingOnboardingRebuildStore, useValue: storeMock },
        { provide: AuthSessionService, useValue: authMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PendingRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads pending hub on init', () => {
    expect(storeMock.loadHub).toHaveBeenCalledTimes(1);
  });

  it('opens directory and preselects requested organization', async () => {
    await component.openDirectory('org-1');

    expect(storeMock.clearError).toHaveBeenCalledTimes(1);
    expect(component.isDirectoryOpen()).toBe(true);
    expect(component.selectedOrganizationId()).toBe('org-1');
  });

  it('loads directory when local cache is empty', async () => {
    const emptyDirectoryStore = storeMock as unknown as { directoryOrganizations: () => [] };
    emptyDirectoryStore.directoryOrganizations = () => [];

    await component.openDirectory();

    expect(storeMock.loadDirectory).toHaveBeenCalledTimes(1);
  });

  it('submits join request and closes directory modal on success', async () => {
    component.isDirectoryOpen.set(true);
    component.selectOrganization('org-1');
    component.requestNote.set('hello');

    await component.submitJoinRequest();

    expect(storeMock.createJoinRequest).toHaveBeenCalledWith('org-1', 'hello');
    expect(component.isDirectoryOpen()).toBe(false);
    expect(component.selectedOrganizationId()).toBeNull();
  });

  it('cancels selected request through the store', async () => {
    component.promptCancel({
      id: 'req-1',
      orgId: 'org-1',
      orgName: 'Aurum',
      status: 'pending',
      requestedAt: '2026-02-20T00:00:00.000Z'
    });

    await component.confirmCancel();

    expect(storeMock.cancelJoinRequest).toHaveBeenCalledWith('req-1');
  });

  it('computes recommendation and status helpers', () => {
    expect(component.isRecommended('aurum.dev')).toBe(true);
    expect(component.isRecommended('example.com')).toBe(false);
    expect(component.statusVariant('approved')).toBe('success');
    expect(component.statusVariant('rejected')).toBe('danger');
    expect(component.statusVariant('pending')).toBe('warning');
    expect(component.statusLabel('pending_review')).toBe('Pending Review');
  });

  it('signs out via auth session', async () => {
    await component.signOut();
    expect(authMock.signOut).toHaveBeenCalledTimes(1);
  });
});
