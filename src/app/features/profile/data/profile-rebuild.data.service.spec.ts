import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { ProfileRebuildDataService } from './profile-rebuild.data.service';

describe('ProfileRebuildDataService', () => {
  let service: ProfileRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => undefined);

    TestBed.configureTestingModule({
      providers: [
        ProfileRebuildDataService,
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

    service = TestBed.inject(ProfileRebuildDataService);
  });

  it('maps current profile payload', async () => {
    query.mockResolvedValueOnce({
      _id: 'emp-1',
      firstName: 'Amina',
      lastName: 'Otieno',
      email: 'amina@aurum.dev',
      startDate: '2025-01-01',
      status: 'active',
      phone: '+254700000000',
      department: 'Finance',
      position: 'Analyst',
      tenure: '1y 1m',
      user: {
        name: 'Amina O.',
        email: 'amina@aurum.dev',
        role: 'employee'
      }
    });

    const profile = await service.getMyProfile();

    expect(profile?.id).toBe('emp-1');
    expect(profile?.user.role).toBe('employee');
    expect(profile?.department).toBe('Finance');
  });

  it('submits normalized profile update payload', async () => {
    await service.updateMyProfile({
      phone: ' +254700000000 ',
      address: ' ',
      gender: 'female',
      dob: ''
    });

    expect(mutation).toHaveBeenCalledWith(api.employees.updateMyProfile, {
      phone: '+254700000000',
      address: undefined,
      gender: 'female',
      dob: undefined
    });
  });
});
