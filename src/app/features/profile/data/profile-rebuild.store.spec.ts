import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ProfileRebuildDataService } from './profile-rebuild.data.service';
import { ProfileRebuildStore } from './profile-rebuild.store';

describe('ProfileRebuildStore', () => {
  let store: ProfileRebuildStore;
  let data: {
    getMyProfile: ReturnType<typeof vi.fn>;
    updateMyProfile: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    data = {
      getMyProfile: vi.fn(async () => ({
        id: 'emp-1',
        firstName: 'Amina',
        lastName: 'Otieno',
        email: 'amina@aurum.dev',
        startDate: '2025-01-01',
        status: 'active',
        tenure: '1y',
        user: { name: 'Amina', email: 'amina@aurum.dev', role: 'employee' }
      })),
      updateMyProfile: vi.fn(async () => undefined)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ProfileRebuildDataService, useValue: data }]
    });

    store = TestBed.inject(ProfileRebuildStore);
  });

  it('loads profile data', async () => {
    await store.load();

    expect(store.profile()?.id).toBe('emp-1');
    expect(store.isLoading()).toBe(false);
  });

  it('saves profile and refreshes state', async () => {
    await store.load();
    const saved = await store.save({ phone: '+254700000000' });

    expect(saved).toBe(true);
    expect(data.updateMyProfile).toHaveBeenCalledWith({ phone: '+254700000000' });
    expect(data.getMyProfile).toHaveBeenCalledTimes(2);
  });

  it('guards save when profile is unavailable', async () => {
    data.getMyProfile.mockResolvedValueOnce(null);
    await store.load();

    const saved = await store.save({ phone: '+1' });

    expect(saved).toBe(false);
    expect(store.error()).toContain('unavailable');
  });
});
