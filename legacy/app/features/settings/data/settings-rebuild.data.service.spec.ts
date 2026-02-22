import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { SettingsRebuildDataService } from './settings-rebuild.data.service';

describe('SettingsRebuildDataService', () => {
  let service: SettingsRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => undefined);

    TestBed.configureTestingModule({
      providers: [
        SettingsRebuildDataService,
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

    service = TestBed.inject(SettingsRebuildDataService);
  });

  it('maps general settings and leave policies', async () => {
    query.mockResolvedValueOnce({
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      workDays: [1, 2, 3, 4, 5]
    });
    query.mockResolvedValueOnce([
      {
        _id: 'lp-1',
        name: 'Annual Leave',
        code: 'AL',
        type: 'vacation',
        daysPerYear: 21,
        accrualFrequency: 'annual',
        isActive: true
      }
    ]);

    const settings = await service.getGeneralSettings();
    const policies = await service.listLeavePolicies();

    expect(settings.currency).toBe('KES');
    expect(policies[0]?.id).toBe('lp-1');
    expect(policies[0]?.type).toBe('vacation');
  });

  it('submits settings and leave-policy mutations', async () => {
    await service.updateGeneralSettings({
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      workDays: [1, 2, 3, 4, 5]
    });
    await service.createLeavePolicy({
      name: 'Personal Leave',
      code: 'PL',
      type: 'personal',
      daysPerYear: 5,
      accrualFrequency: 'annual',
      description: '  Optional  '
    });
    await service.updateLeavePolicy({
      id: 'lp-1',
      name: 'Personal Leave',
      daysPerYear: 6,
      accrualFrequency: 'monthly',
      isActive: false
    });
    await service.deleteLeavePolicy('lp-1');
    await service.seedDefaultPolicies();

    expect(mutation).toHaveBeenNthCalledWith(1, api.settings.updateSettings, {
      currency: 'USD',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      workDays: [1, 2, 3, 4, 5]
    });
    expect(mutation).toHaveBeenNthCalledWith(2, api.settings.createLeavePolicy, {
      name: 'Personal Leave',
      code: 'PL',
      type: 'personal',
      daysPerYear: 5,
      accrualFrequency: 'annual',
      carryOverDays: undefined,
      description: 'Optional'
    });
    expect(mutation).toHaveBeenNthCalledWith(5, api.settings.seedDefaultPolicies, {});
  });
});
