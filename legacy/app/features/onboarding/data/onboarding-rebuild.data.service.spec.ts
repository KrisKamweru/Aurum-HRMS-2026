import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { OnboardingRebuildDataService } from './onboarding-rebuild.data.service';

describe('OnboardingRebuildDataService', () => {
  let service: OnboardingRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => []);
    mutation = vi.fn(async () => ({}));

    TestBed.configureTestingModule({
      providers: [
        OnboardingRebuildDataService,
        {
          provide: ConvexClientService,
          useValue: {
            getHttpClient: () => ({ query, mutation })
          }
        }
      ]
    });

    service = TestBed.inject(OnboardingRebuildDataService);
  });

  it('maps and sorts organizations', async () => {
    query.mockResolvedValueOnce([
      { _id: 'org-2', name: 'Zulu Corp', domain: 'zulu.dev' },
      { _id: 'org-1', name: 'Aurum', domain: '' },
      { name: 'Invalid' }
    ]);

    const rows = await service.listOrganizations();

    expect(rows).toEqual([
      { id: 'org-1', name: 'Aurum', domain: undefined },
      { id: 'org-2', name: 'Zulu Corp', domain: 'zulu.dev' }
    ]);
    expect(query).toHaveBeenCalledWith(api.onboarding.listOrganizations, {});
  });

  it('maps join requests and ignores invalid rows', async () => {
    query.mockResolvedValueOnce([
      {
        _id: 'req-1',
        orgId: 'org-1',
        orgName: 'Aurum',
        status: 'pending',
        requestedAt: '2026-02-20T00:00:00.000Z'
      },
      {
        _id: 'req-2',
        orgId: 'org-2',
        orgName: 'Beta',
        status: 'approved',
        requestedAt: '2026-02-18T00:00:00.000Z',
        processedAt: '2026-02-19T00:00:00.000Z'
      },
      { _id: 'req-3', status: 'unknown' }
    ]);

    const rows = await service.getMyJoinRequests();

    expect(rows.map((row) => row.id)).toEqual(['req-1', 'req-2']);
    expect(rows[1]?.processedAt).toBe('2026-02-19T00:00:00.000Z');
  });

  it('submits join request with normalized note and typed org id', async () => {
    await service.createJoinRequest('org-9', '  hello  ');

    expect(mutation).toHaveBeenCalledWith(api.onboarding.createJoinRequest, {
      orgId: 'org-9',
      note: 'hello'
    });
  });

  it('cancels join request using typed request id', async () => {
    await service.cancelJoinRequest('req-9');

    expect(mutation).toHaveBeenCalledWith(api.onboarding.cancelJoinRequest, {
      requestId: 'req-9'
    });
  });

  it('normalizes organization setup payload and maps result ids', async () => {
    mutation.mockResolvedValueOnce({ orgId: 'org-10', employeeId: 'emp-10' });

    const result = await service.createOrganizationWithSetup({
      organization: { name: '  Aurum HQ  ', domain: ' aurum.dev ' },
      departments: [{ name: ' Engineering ', code: ' ENG ', description: ' Build ' }],
      designations: [{ title: ' Engineer ', code: ' EN1 ', level: 1, description: ' Core ' }],
      adminEmployee: {
        firstName: '  Ada ',
        lastName: ' Lovelace  ',
        phone: ' ',
        departmentIndex: 0,
        designationIndex: -1
      }
    });

    expect(result).toEqual({ orgId: 'org-10', employeeId: 'emp-10' });
    expect(mutation).toHaveBeenCalledWith(api.onboarding.createOrganizationWithSetup, {
      organization: { name: 'Aurum HQ', domain: 'aurum.dev' },
      departments: [{ name: 'Engineering', code: 'ENG', description: 'Build' }],
      designations: [{ title: 'Engineer', code: 'EN1', level: 1, description: 'Core' }],
      adminEmployee: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: undefined,
        departmentIndex: 0,
        designationIndex: undefined
      }
    });
  });

  it('returns empty arrays when queries return non-array payloads', async () => {
    query.mockResolvedValueOnce(null).mockResolvedValueOnce({}).mockResolvedValueOnce('bad');

    const directory = await service.listOrganizations();
    const matching = await service.getMatchingOrganizations();
    const requests = await service.getMyJoinRequests();

    expect(directory).toEqual([]);
    expect(matching).toEqual([]);
    expect(requests).toEqual([]);
  });

  it('handles malformed create organization result shape', async () => {
    mutation.mockResolvedValueOnce({ unexpected: true });

    const result = await service.createOrganizationWithSetup({
      organization: { name: 'Aurum' },
      departments: [],
      designations: [],
      adminEmployee: { firstName: 'A', lastName: 'B' }
    });

    expect(result).toEqual({ orgId: '', employeeId: '' });
  });
});
