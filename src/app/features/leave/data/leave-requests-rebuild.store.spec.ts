import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  LeaveRequestStatusMutationInput,
  RebuildLeaveRequest,
  RebuildLeaveViewerContext
} from './leave-requests-rebuild.models';
import { LeaveRequestsRebuildDataService } from './leave-requests-rebuild.data.service';
import { LeaveRequestsRebuildStore } from './leave-requests-rebuild.store';

describe('LeaveRequestsRebuildStore', () => {
  let store: LeaveRequestsRebuildStore;
  let requests: RebuildLeaveRequest[];
  let viewer: RebuildLeaveViewerContext;
  let dataService: {
    listRequests: ReturnType<typeof vi.fn>;
    listEmployeeOptions: ReturnType<typeof vi.fn>;
    getViewerContext: ReturnType<typeof vi.fn>;
    createRequest: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    requests = [
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
      },
      {
        id: 'leave-2',
        employeeId: 'emp-2',
        employeeName: 'Nia Otieno',
        employeeDepartment: 'Engineering',
        type: 'sick',
        startDate: '2026-02-10',
        endDate: '2026-02-10',
        days: 1,
        status: 'pending',
        reason: '',
        rejectionReason: ''
      },
      {
        id: 'leave-3',
        employeeId: 'emp-2',
        employeeName: 'Nia Otieno',
        employeeDepartment: 'Engineering',
        type: 'sick',
        startDate: '2026-02-10',
        endDate: '2026-02-10',
        days: 1,
        status: 'approved',
        reason: '',
        rejectionReason: ''
      }
    ];
    viewer = { role: 'employee', employeeId: 'emp-1' };

    dataService = {
      listRequests: vi.fn(async () => [...requests]),
      listEmployeeOptions: vi.fn(async () => [{ id: 'emp-1', label: 'Amina Hassan', meta: 'amina@aurum.dev' }]),
      getViewerContext: vi.fn(async () => ({ ...viewer })),
      createRequest: vi.fn(async (payload) => {
        requests = [
          ...requests,
          {
            id: `leave-${requests.length + 1}`,
            employeeId: payload.employeeId,
            employeeName: payload.employeeId === 'emp-1' ? 'Amina Hassan' : 'Unknown Employee',
            employeeDepartment: 'Finance',
            type: payload.type,
            startDate: payload.startDate,
            endDate: payload.endDate,
            days: 1,
            status: 'pending',
            reason: payload.reason ?? '',
            rejectionReason: ''
          }
        ];
      }),
      updateStatus: vi.fn(async (payload: LeaveRequestStatusMutationInput) => {
        requests = requests.map((request) =>
          request.id === payload.id
            ? {
                ...request,
                status: payload.status,
                rejectionReason: payload.rejectionReason ?? request.rejectionReason
              }
            : request
        );
      })
    };

    TestBed.configureTestingModule({
      providers: [{ provide: LeaveRequestsRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(LeaveRequestsRebuildStore);
  });

  it('loads viewer context, requests, and manager employee options', async () => {
    viewer = { role: 'manager', employeeId: 'emp-1' };

    await store.loadInitial();

    expect(store.viewer().role).toBe('manager');
    expect(store.requests().length).toBe(3);
    expect(store.employeeOptions().length).toBe(1);
    expect(store.canManage()).toBe(true);
    expect(dataService.listEmployeeOptions).toHaveBeenCalledTimes(1);
  });

  it('creates request for own employee profile when viewer is non-manager', async () => {
    await store.loadInitial();

    const result = await store.createRequest({
      type: 'vacation',
      startDate: '2026-02-26',
      endDate: '2026-02-26',
      reason: 'Family event'
    });

    expect(result).toBe(true);
    expect(dataService.createRequest).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      type: 'vacation',
      startDate: '2026-02-26',
      endDate: '2026-02-26',
      reason: 'Family event'
    });
    expect(store.pendingRequestCount()).toBe(3);
  });

  it('requires linked employee profile for non-manager create', async () => {
    viewer = { role: 'employee' };
    await store.loadInitial();

    const result = await store.createRequest({
      type: 'vacation',
      startDate: '2026-02-26',
      endDate: '2026-02-26',
      reason: ''
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Your account is not linked to an employee profile.');
    expect(dataService.createRequest).not.toHaveBeenCalled();
  });

  it('requires selected employee for manager create', async () => {
    viewer = { role: 'manager', employeeId: 'emp-1' };
    await store.loadInitial();

    const result = await store.createRequest({
      type: 'sick',
      startDate: '2026-02-26',
      endDate: '2026-02-26'
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('Select an employee before submitting this request.');
  });

  it('rejects invalid date ranges', async () => {
    await store.loadInitial();

    const result = await store.createRequest({
      type: 'vacation',
      startDate: '2026-03-01',
      endDate: '2026-02-26'
    });

    expect(result).toBe(false);
    expect(store.error()).toBe('End date must be on or after the start date.');
  });

  it('approves pending requests and blocks status updates for non-pending records', async () => {
    viewer = { role: 'manager', employeeId: 'emp-manager' };
    await store.loadInitial();

    expect(await store.updateRequestStatus({ id: 'leave-1', status: 'approved' })).toBe(true);
    expect(await store.updateRequestStatus({ id: 'leave-3', status: 'cancelled' })).toBe(false);
    expect(store.error()).toBe('Only pending requests can be updated.');
  });

  it('requires rejection reason when rejecting requests', async () => {
    viewer = { role: 'manager', employeeId: 'emp-manager' };
    await store.loadInitial();

    const result = await store.updateRequestStatus({ id: 'leave-1', status: 'rejected' });

    expect(result).toBe(false);
    expect(store.error()).toBe('Provide a rejection reason.');
  });

  it('allows cancelling own request but blocks cancelling someone else request', async () => {
    await store.loadInitial();

    expect(await store.updateRequestStatus({ id: 'leave-1', status: 'cancelled' })).toBe(true);
    expect(await store.updateRequestStatus({ id: 'leave-2', status: 'cancelled' })).toBe(false);
    expect(store.error()).toBe('You can only cancel your own leave requests.');
  });

  it('clears error state explicitly', () => {
    store.createRequest({
      type: 'vacation',
      startDate: '2026-03-01',
      endDate: '2026-02-26'
    });

    store.clearError();

    expect(store.error()).toBeNull();
  });
});
