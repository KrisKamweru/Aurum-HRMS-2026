import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SettingsRebuildDataService } from './settings-rebuild.data.service';
import { SettingsRebuildStore } from './settings-rebuild.store';

describe('SettingsRebuildStore', () => {
  let store: SettingsRebuildStore;
  let data: {
    getGeneralSettings: ReturnType<typeof vi.fn>;
    updateGeneralSettings: ReturnType<typeof vi.fn>;
    listLeavePolicies: ReturnType<typeof vi.fn>;
    createLeavePolicy: ReturnType<typeof vi.fn>;
    updateLeavePolicy: ReturnType<typeof vi.fn>;
    deleteLeavePolicy: ReturnType<typeof vi.fn>;
    seedDefaultPolicies: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    data = {
      getGeneralSettings: vi.fn(async () => ({
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        workDays: [1, 2, 3, 4, 5]
      })),
      updateGeneralSettings: vi.fn(async () => undefined),
      listLeavePolicies: vi.fn(async () => [
        {
          id: 'lp-1',
          name: 'Annual Leave',
          code: 'AL',
          type: 'vacation',
          daysPerYear: 21,
          accrualFrequency: 'annual',
          isActive: true
        }
      ]),
      createLeavePolicy: vi.fn(async () => undefined),
      updateLeavePolicy: vi.fn(async () => undefined),
      deleteLeavePolicy: vi.fn(async () => undefined),
      seedDefaultPolicies: vi.fn(async () => undefined)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SettingsRebuildDataService, useValue: data }]
    });

    store = TestBed.inject(SettingsRebuildStore);
  });

  it('loads and saves general settings', async () => {
    await store.loadGeneralSettings();
    const saved = await store.saveGeneralSettings({
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      workDays: [1, 2, 3, 4, 5]
    });

    expect(store.generalSettings().currency).toBe('KES');
    expect(saved).toBe(true);
  });

  it('loads and mutates leave policies', async () => {
    await store.loadLeavePolicies();
    const created = await store.createLeavePolicy({
      name: 'Sick Leave',
      code: 'SL',
      type: 'sick',
      daysPerYear: 10,
      accrualFrequency: 'annual'
    });
    const updated = await store.updateLeavePolicy({
      id: 'lp-1',
      name: 'Annual Leave',
      daysPerYear: 22,
      accrualFrequency: 'monthly',
      isActive: true
    });
    const deleted = await store.deleteLeavePolicy('lp-1');
    const seeded = await store.seedDefaults();

    expect(created).toBe(true);
    expect(updated).toBe(true);
    expect(deleted).toBe(true);
    expect(seeded).toBe(true);
  });

  it('validates duplicate leave-policy code before create', async () => {
    await store.loadLeavePolicies();
    const created = await store.createLeavePolicy({
      name: 'Another Annual Leave',
      code: 'al',
      type: 'vacation',
      daysPerYear: 15,
      accrualFrequency: 'annual'
    });

    expect(created).toBe(false);
    expect(store.error()).toContain('unique');
  });
});
