import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OnboardingRebuildDataService } from './onboarding-rebuild.data.service';
import { PendingOnboardingRebuildStore } from './pending-onboarding-rebuild.store';

describe('PendingOnboardingRebuildStore', () => {
  let store: PendingOnboardingRebuildStore;
  let dataService: {
    getMyJoinRequests: ReturnType<typeof vi.fn>;
    getMatchingOrganizations: ReturnType<typeof vi.fn>;
    listOrganizations: ReturnType<typeof vi.fn>;
    createJoinRequest: ReturnType<typeof vi.fn>;
    cancelJoinRequest: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getMyJoinRequests: vi.fn(async () => []),
      getMatchingOrganizations: vi.fn(async () => []),
      listOrganizations: vi.fn(async () => []),
      createJoinRequest: vi.fn(async () => undefined),
      cancelJoinRequest: vi.fn(async () => undefined)
    };

    TestBed.configureTestingModule({
      providers: [PendingOnboardingRebuildStore, { provide: OnboardingRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(PendingOnboardingRebuildStore);
  });

  it('loads pending hub state', async () => {
    dataService.getMyJoinRequests.mockResolvedValueOnce([
      {
        id: 'req-1',
        orgId: 'org-1',
        orgName: 'Aurum',
        status: 'pending',
        requestedAt: '2026-02-20T00:00:00.000Z'
      }
    ]);
    dataService.getMatchingOrganizations.mockResolvedValueOnce([{ id: 'org-2', name: 'Match Co', domain: 'match.dev' }]);

    await store.loadHub();

    expect(store.requests()).toHaveLength(1);
    expect(store.matchingOrganizations()).toHaveLength(1);
    expect(store.error()).toBeNull();
    expect(store.hubLoading()).toBe(false);
  });

  it('stores fallback error when hub load fails', async () => {
    dataService.getMyJoinRequests.mockRejectedValueOnce({});

    await store.loadHub();

    expect(store.requests()).toEqual([]);
    expect(store.matchingOrganizations()).toEqual([]);
    expect(store.error()).toBe('Unable to load onboarding requests.');
  });

  it('loads organization directory', async () => {
    dataService.listOrganizations.mockResolvedValueOnce([{ id: 'org-1', name: 'Aurum' }]);

    await store.loadDirectory();

    expect(store.directoryOrganizations()).toEqual([{ id: 'org-1', name: 'Aurum' }]);
    expect(store.directoryLoading()).toBe(false);
  });

  it('stores directory load error message', async () => {
    dataService.listOrganizations.mockRejectedValueOnce(new Error('Directory down'));

    await store.loadDirectory();

    expect(store.directoryOrganizations()).toEqual([]);
    expect(store.error()).toBe('Directory down');
  });

  it('submits join request and reloads hub on success', async () => {
    const loadHubSpy = vi.spyOn(store, 'loadHub').mockResolvedValueOnce();

    const result = await store.createJoinRequest('org-1', 'hi');

    expect(result).toBe(true);
    expect(dataService.createJoinRequest).toHaveBeenCalledWith('org-1', 'hi');
    expect(loadHubSpy).toHaveBeenCalledTimes(1);
    expect(store.joinSubmitting()).toBe(false);
  });

  it('stores join request error without reloading hub', async () => {
    dataService.createJoinRequest.mockRejectedValueOnce(new Error('Rejected'));
    const loadHubSpy = vi.spyOn(store, 'loadHub');

    const result = await store.createJoinRequest('org-1');

    expect(result).toBe(false);
    expect(store.error()).toBe('Rejected');
    expect(loadHubSpy).not.toHaveBeenCalled();
  });

  it('cancels join request and clears cancelling state', async () => {
    const loadHubSpy = vi.spyOn(store, 'loadHub').mockResolvedValueOnce();

    const result = await store.cancelJoinRequest('req-1');

    expect(result).toBe(true);
    expect(dataService.cancelJoinRequest).toHaveBeenCalledWith('req-1');
    expect(loadHubSpy).toHaveBeenCalledTimes(1);
    expect(store.cancellingRequestId()).toBeNull();
  });

  it('stores cancel error and resets cancelling state', async () => {
    dataService.cancelJoinRequest.mockRejectedValueOnce({});

    const result = await store.cancelJoinRequest('req-1');

    expect(result).toBe(false);
    expect(store.error()).toBe('Unable to cancel join request.');
    expect(store.cancellingRequestId()).toBeNull();
  });

  it('clears error manually', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
