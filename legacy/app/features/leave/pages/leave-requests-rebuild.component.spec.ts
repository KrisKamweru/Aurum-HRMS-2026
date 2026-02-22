import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';
import {
  RebuildLeaveEmployeeOption,
  RebuildLeaveRequest,
  RebuildLeaveViewerContext
} from '../data/leave-requests-rebuild.models';
import { LeaveRequestsRebuildStore } from '../data/leave-requests-rebuild.store';
import { LeaveRequestsRebuildComponent } from './leave-requests-rebuild.component';

describe('LeaveRequestsRebuildComponent', () => {
  let fixture: ComponentFixture<LeaveRequestsRebuildComponent>;
  let component: LeaveRequestsRebuildComponent;
  let requestsState: ReturnType<typeof signal<RebuildLeaveRequest[]>>;
  let employeeOptionsState: ReturnType<typeof signal<RebuildLeaveEmployeeOption[]>>;
  let viewerState: ReturnType<typeof signal<RebuildLeaveViewerContext>>;
  let loadingState: ReturnType<typeof signal<boolean>>;
  let savingState: ReturnType<typeof signal<boolean>>;
  let errorState: ReturnType<typeof signal<string | null>>;
  let storeMock: Pick<
    LeaveRequestsRebuildStore,
    | 'requests'
    | 'employeeOptions'
    | 'viewer'
    | 'isLoading'
    | 'isSaving'
    | 'error'
    | 'canManage'
    | 'pendingRequestCount'
    | 'approvedRequestCount'
    | 'loadInitial'
    | 'createRequest'
    | 'updateRequestStatus'
    | 'clearError'
  >;

  beforeEach(async () => {
    requestsState = signal<RebuildLeaveRequest[]>([
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
    employeeOptionsState = signal<RebuildLeaveEmployeeOption[]>([{ id: 'emp-1', label: 'Amina Hassan', meta: 'amina@aurum.dev' }]);
    viewerState = signal<RebuildLeaveViewerContext>({ role: 'employee', employeeId: 'emp-1' });
    loadingState = signal(false);
    savingState = signal(false);
    errorState = signal<string | null>(null);

    storeMock = {
      requests: requestsState.asReadonly(),
      employeeOptions: employeeOptionsState.asReadonly(),
      viewer: viewerState.asReadonly(),
      isLoading: loadingState.asReadonly(),
      isSaving: savingState.asReadonly(),
      error: errorState.asReadonly(),
      canManage: computed(() => {
        const role = viewerState().role;
        return role === 'super_admin' || role === 'admin' || role === 'hr_manager' || role === 'manager';
      }),
      pendingRequestCount: computed(() => requestsState().filter((request) => request.status === 'pending').length),
      approvedRequestCount: computed(() => requestsState().filter((request) => request.status === 'approved').length),
      loadInitial: vi.fn(async () => {}),
      createRequest: vi.fn(async () => true),
      updateRequestStatus: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [LeaveRequestsRebuildComponent],
      providers: [{ provide: LeaveRequestsRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveRequestsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads leave data on init', () => {
    expect(storeMock.loadInitial).toHaveBeenCalledTimes(1);
  });

  it('creates leave request from form payload and closes modal', async () => {
    component.openCreateModal();

    await component.createRequestFromForm({
      leaveType: 'vacation',
      startDate: '2026-02-28',
      endDate: '2026-03-01',
      reason: 'Family travel'
    });

    expect(storeMock.createRequest).toHaveBeenCalledWith({
      employeeId: '',
      type: 'vacation',
      startDate: '2026-02-28',
      endDate: '2026-03-01',
      reason: 'Family travel'
    });
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('passes selected employee for manager create form', async () => {
    viewerState.set({ role: 'manager', employeeId: 'emp-manager' });
    fixture.detectChanges();
    component.openCreateModal();

    await component.createRequestFromForm({
      employeeId: 'emp-1',
      leaveType: 'sick',
      startDate: '2026-03-01',
      endDate: '2026-03-01',
      reason: ''
    });

    expect(storeMock.createRequest).toHaveBeenCalledWith({
      employeeId: 'emp-1',
      type: 'sick',
      startDate: '2026-03-01',
      endDate: '2026-03-01',
      reason: ''
    });
  });

  it('opens and confirms approve status update', async () => {
    component.requestStatusChange('leave-1', 'approved');

    expect(component.isStatusDialogOpen()).toBe(true);

    await component.confirmStatusUpdate('');

    expect(storeMock.updateRequestStatus).toHaveBeenCalledWith({
      id: 'leave-1',
      status: 'approved',
      rejectionReason: undefined
    });
    expect(component.isStatusDialogOpen()).toBe(false);
  });

  it('forwards rejection reason when rejecting request', async () => {
    component.requestStatusChange('leave-1', 'rejected');
    await component.confirmStatusUpdate('Insufficient remaining balance');

    expect(storeMock.updateRequestStatus).toHaveBeenCalledWith({
      id: 'leave-1',
      status: 'rejected',
      rejectionReason: 'Insufficient remaining balance'
    });
  });

  it('maps ownership and badge variants', () => {
    expect(component.isOwnRequest(requestsState()[0]!)).toBe(true);
    expect(component.statusVariant('approved')).toBe('success');
    expect(component.statusVariant('pending')).toBe('warning');
    expect(component.statusVariant('cancelled')).toBe('neutral');
    expect(component.statusVariant('rejected')).toBe('danger');
  });
});
