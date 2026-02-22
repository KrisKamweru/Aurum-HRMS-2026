import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { SuperAdminRebuildDataService } from './super-admin-rebuild.data.service';

describe('SuperAdminRebuildDataService', () => {
  let service: SuperAdminRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => null);

    TestBed.configureTestingModule({
      providers: [
        SuperAdminRebuildDataService,
        {
          provide: ConvexClientService,
          useValue: {
            getHttpClient: () => ({
              query,
              mutation
            })
          }
        }
      ]
    });

    service = TestBed.inject(SuperAdminRebuildDataService);
  });

  it('maps organizations and system stats', async () => {
    query.mockResolvedValueOnce([
      {
        _id: 'org-1',
        name: 'Aurum Labs',
        domain: 'aurum.dev',
        subscriptionPlan: 'pro',
        status: 'active',
        userCount: 10,
        employeeCount: 8,
        pendingRequestCount: 1
      }
    ]);
    query.mockResolvedValueOnce({
      totalOrganizations: 1,
      activeOrganizations: 1,
      suspendedOrganizations: 0,
      totalUsers: 10,
      activeUsers: 9,
      pendingUsers: 1,
      totalEmployees: 8
    });

    const organizations = await service.listOrganizations();
    const stats = await service.getSystemStats();

    expect(organizations[0]?.name).toBe('Aurum Labs');
    expect(organizations[0]?.subscriptionPlan).toBe('pro');
    expect(stats.totalUsers).toBe(10);
  });

  it('submits create/update/status payloads', async () => {
    mutation.mockResolvedValueOnce('org-2');
    mutation.mockResolvedValueOnce(undefined);
    mutation.mockResolvedValueOnce(undefined);

    const id = await service.createOrganization({
      name: 'Aurum Systems',
      domain: 'aurum.systems',
      subscriptionPlan: 'enterprise'
    });
    await service.updateOrganization({
      id: 'org-2',
      name: 'Aurum Systems Ltd',
      domain: 'aurum.systems',
      subscriptionPlan: 'enterprise'
    });
    await service.updateOrganizationStatus('org-2', 'suspended');

    expect(id).toBe('org-2');
    expect(mutation).toHaveBeenNthCalledWith(1, api.super_admin.createOrganization, {
      name: 'Aurum Systems',
      domain: 'aurum.systems',
      subscriptionPlan: 'enterprise'
    });
    expect(mutation).toHaveBeenNthCalledWith(3, api.super_admin.updateOrganizationStatus, {
      orgId: 'org-2',
      status: 'suspended'
    });
  });
});
