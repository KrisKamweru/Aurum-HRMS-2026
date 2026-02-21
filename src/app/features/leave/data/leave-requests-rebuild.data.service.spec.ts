import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { LeaveRequestsRebuildDataService } from './leave-requests-rebuild.data.service';

describe('LeaveRequestsRebuildDataService', () => {
  let service: LeaveRequestsRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => []);
    mutation = vi.fn(async () => undefined);

    TestBed.configureTestingModule({
      providers: [
        LeaveRequestsRebuildDataService,
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

    service = TestBed.inject(LeaveRequestsRebuildDataService);
  });

  it('maps leave requests and filters invalid rows', async () => {
    query.mockResolvedValueOnce([
      {
        _id: 'leave-1',
        employeeId: 'emp-1',
        employeeName: 'Amina Hassan',
        employeeDepartment: 'Finance',
        type: 'vacation',
        startDate: '2026-02-24',
        endDate: '2026-02-25',
        days: 2,
        status: 'pending'
      },
      { _id: 'leave-2' }
    ]);

    const rows = await service.listRequests();

    expect(rows).toEqual([
      {
        id: 'leave-1',
        employeeId: 'emp-1',
        employeeName: 'Amina Hassan',
        employeeDepartment: 'Finance',
        type: 'vacation',
        startDate: '2026-02-24',
        endDate: '2026-02-25',
        days: 2,
        status: 'pending',
        reason: '',
        rejectionReason: ''
      }
    ]);
  });

  it('loads employee options for manager create flow', async () => {
    query.mockResolvedValueOnce([
      { _id: 'emp-1', firstName: 'Amina', lastName: 'Hassan', email: 'amina@aurum.dev', status: 'active' },
      { _id: 'emp-2', firstName: 'Nia', lastName: 'Otieno', email: 'nia@aurum.dev', status: 'on-leave' }
    ]);

    const rows = await service.listEmployeeOptions();

    expect(rows).toEqual([
      { id: 'emp-1', label: 'Amina Hassan', meta: 'amina@aurum.dev' },
      { id: 'emp-2', label: 'Nia Otieno', meta: 'nia@aurum.dev' }
    ]);
    expect(query).toHaveBeenCalledWith(api.employees.list, {});
  });

  it('maps viewer context with role and employee id', async () => {
    query.mockResolvedValueOnce({ _id: 'user-1', role: 'employee', employeeId: 'emp-1' });

    const viewer = await service.getViewerContext();

    expect(viewer).toEqual({ role: 'employee', employeeId: 'emp-1' });
  });

  it('returns default viewer context when record is missing', async () => {
    query.mockResolvedValueOnce(null);

    const viewer = await service.getViewerContext();

    expect(viewer).toEqual({ role: 'pending' });
  });

  it('creates a leave request with normalized optional reason and derived days', async () => {
    await service.createRequest({
      employeeId: 'emp-1',
      type: 'vacation',
      startDate: '2026-02-24',
      endDate: '2026-02-25',
      reason: ' Family event '
    });

    expect(mutation).toHaveBeenCalledWith(api.leave_requests.create, {
      employeeId: 'emp-1',
      type: 'vacation',
      startDate: '2026-02-24',
      endDate: '2026-02-25',
      days: 2,
      reason: 'Family event'
    });
  });

  it('updates leave request status with optional rejection reason', async () => {
    await service.updateStatus({ id: 'leave-1', status: 'approved' });
    await service.updateStatus({ id: 'leave-2', status: 'rejected', rejectionReason: '  Overlapping schedule  ' });

    expect(mutation).toHaveBeenNthCalledWith(1, api.leave_requests.updateStatus, {
      id: 'leave-1',
      status: 'approved',
      rejectionReason: undefined
    });
    expect(mutation).toHaveBeenNthCalledWith(2, api.leave_requests.updateStatus, {
      id: 'leave-2',
      status: 'rejected',
      rejectionReason: 'Overlapping schedule'
    });
  });
});
