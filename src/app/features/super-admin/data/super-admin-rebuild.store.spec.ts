import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SuperAdminRebuildDataService } from './super-admin-rebuild.data.service';
import { SuperAdminRebuildStore } from './super-admin-rebuild.store';

describe('SuperAdminRebuildStore', () => {
  let store: SuperAdminRebuildStore;
  let dataService: {
    listOrganizations: ReturnType<typeof vi.fn>;
    getSystemStats: ReturnType<typeof vi.fn>;
    createOrganization: ReturnType<typeof vi.fn>;
    updateOrganization: ReturnType<typeof vi.fn>;
    updateOrganizationStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      listOrganizations: vi.fn(async () => [
        {
          id: 'org-1',
          name: 'Aurum Labs',
          domain: 'aurum.dev',
          subscriptionPlan: 'pro',
          status: 'active',
          userCount: 10,
          employeeCount: 8,
          pendingRequestCount: 1
        }
      ]),
      getSystemStats: vi.fn(async () => ({
        totalOrganizations: 1,
        activeOrganizations: 1,
        suspendedOrganizations: 0,
        totalUsers: 10,
        activeUsers: 9,
        pendingUsers: 1,
        totalEmployees: 8
      })),
      createOrganization: vi.fn(async () => 'org-2'),
      updateOrganization: vi.fn(async () => undefined),
      updateOrganizationStatus: vi.fn(async () => undefined)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SuperAdminRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(SuperAdminRebuildStore);
  });

  it('loads dashboard state', async () => {
    await store.loadDashboard();
    expect(store.organizations().length).toBe(1);
    expect(store.stats().totalOrganizations).toBe(1);
    expect(store.activeOrganizations()).toBe(1);
  });

  it('creates and updates organizations', async () => {
    await store.loadDashboard();
    const created = await store.createOrganization({
      name: 'Aurum Systems',
      domain: 'aurum.systems',
      subscriptionPlan: 'enterprise'
    });
    const updated = await store.updateOrganization({
      id: 'org-1',
      name: 'Aurum Labs',
      domain: 'aurum.dev',
      subscriptionPlan: 'pro'
    });

    expect(created).toBe(true);
    expect(updated).toBe(true);
    expect(dataService.createOrganization).toHaveBeenCalledTimes(1);
    expect(dataService.updateOrganization).toHaveBeenCalledTimes(1);
  });

  it('updates organization status', async () => {
    await store.loadDashboard();
    const success = await store.setOrganizationStatus('org-1', 'suspended');

    expect(success).toBe(true);
    expect(store.organizations()[0]?.status).toBe('suspended');
    expect(dataService.updateOrganizationStatus).toHaveBeenCalledWith('org-1', 'suspended');
  });
});
