import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OnboardingRebuildDataService } from './onboarding-rebuild.data.service';
import { OrganizationSetupRebuildStore } from './organization-setup-rebuild.store';

describe('OrganizationSetupRebuildStore', () => {
  let store: OrganizationSetupRebuildStore;
  let dataService: { createOrganizationWithSetup: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dataService = {
      createOrganizationWithSetup: vi.fn(async () => ({ orgId: 'org-1', employeeId: 'emp-1' }))
    };

    TestBed.configureTestingModule({
      providers: [OrganizationSetupRebuildStore, { provide: OnboardingRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(OrganizationSetupRebuildStore);
  });

  it('creates organization successfully', async () => {
    const created = await store.createOrganization({
      organization: { name: 'Aurum' },
      departments: [],
      designations: [],
      adminEmployee: { firstName: 'Ada', lastName: 'Lovelace' }
    });

    expect(created).toBe(true);
    expect(dataService.createOrganizationWithSetup).toHaveBeenCalledTimes(1);
    expect(store.isSaving()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('stores fallback error when create fails without message', async () => {
    dataService.createOrganizationWithSetup.mockRejectedValueOnce({});

    const created = await store.createOrganization({
      organization: { name: 'Aurum' },
      departments: [],
      designations: [],
      adminEmployee: { firstName: 'Ada', lastName: 'Lovelace' }
    });

    expect(created).toBe(false);
    expect(store.error()).toBe('Unable to create organization.');
    expect(store.isSaving()).toBe(false);
  });

  it('clears error manually', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
