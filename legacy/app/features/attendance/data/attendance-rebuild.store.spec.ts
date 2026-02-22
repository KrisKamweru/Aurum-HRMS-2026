import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AttendanceRebuildDataService } from './attendance-rebuild.data.service';
import { AttendanceRebuildStore } from './attendance-rebuild.store';

describe('AttendanceRebuildStore', () => {
  let store: AttendanceRebuildStore;
  let dataService: {
    getViewerContext: ReturnType<typeof vi.fn>;
    getTodayStatus: ReturnType<typeof vi.fn>;
    listMyAttendance: ReturnType<typeof vi.fn>;
    getAttendanceSummary: ReturnType<typeof vi.fn>;
    clockIn: ReturnType<typeof vi.fn>;
    clockOut: ReturnType<typeof vi.fn>;
    listTeamAttendance: ReturnType<typeof vi.fn>;
    listHeldTrustEvents: ReturnType<typeof vi.fn>;
    createManualEntry: ReturnType<typeof vi.fn>;
    reviewHeldTrustEvent: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    dataService = {
      getViewerContext: vi.fn(async () => ({ role: 'employee', employeeId: 'emp-1' })),
      getTodayStatus: vi.fn(async () => ({
        id: 'att-1',
        date: '2026-02-21',
        clockIn: '2026-02-21T08:00:00.000Z',
        clockOut: undefined,
        status: 'present',
        workMinutes: 0,
        breakMinutes: 0,
        notes: ''
      })),
      listMyAttendance: vi.fn(async () => [
        {
          id: 'att-1',
          date: '2026-02-21',
          clockIn: '2026-02-21T08:00:00.000Z',
          clockOut: undefined,
          status: 'present',
          workMinutes: 0,
          breakMinutes: 0,
          notes: ''
        }
      ]),
      getAttendanceSummary: vi.fn(async () => ({
        presentDays: 16,
        absentDays: 1,
        lateDays: 2,
        totalWorkMinutes: 7200,
        avgWorkMinutes: 450
      })),
      clockIn: vi.fn(async () => ({
        id: 'att-2',
        date: '2026-02-21',
        status: 'present',
        workMinutes: 0,
        breakMinutes: 0,
        notes: ''
      })),
      clockOut: vi.fn(async () => ({
        id: 'att-2',
        date: '2026-02-21',
        status: 'present',
        workMinutes: 480,
        breakMinutes: 0,
        notes: ''
      })),
      listTeamAttendance: vi.fn(async () => [
        {
          employeeId: 'emp-1',
          employeeName: 'Amina Hassan',
          employeeEmail: 'amina@aurum.dev',
          employeeDepartmentId: 'dept-1',
          employeeDesignationId: 'desig-1',
          attendance: {
            id: 'att-1',
            date: '2026-02-21',
            status: 'present',
            workMinutes: 480,
            breakMinutes: 0,
            notes: '',
            clockIn: '2026-02-21T08:00:00.000Z',
            clockOut: '2026-02-21T17:00:00.000Z'
          }
        }
      ]),
      listHeldTrustEvents: vi.fn(async () => [
        {
          id: 'event-1',
          employeeId: 'emp-1',
          employeeName: 'Amina Hassan',
          eventType: 'clock_in',
          riskLevel: 'medium',
          riskScore: 65,
          capturedAt: '2026-02-21T08:10:00.000Z'
        }
      ]),
      createManualEntry: vi.fn(async () => undefined),
      reviewHeldTrustEvent: vi.fn(async () => undefined)
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AttendanceRebuildDataService, useValue: dataService }]
    });

    store = TestBed.inject(AttendanceRebuildStore);
  });

  it('loads personal dashboard state', async () => {
    await store.loadPersonalDashboard(new Date('2026-02-21T10:00:00.000Z'));

    expect(store.viewer().employeeId).toBe('emp-1');
    expect(store.todayStatus()?.id).toBe('att-1');
    expect(store.history().length).toBe(1);
    expect(store.summary().presentDays).toBe(16);
    expect(store.attendanceState()).toBe('working');
  });

  it('returns unlinked state when viewer has no employee profile', async () => {
    dataService.getViewerContext.mockResolvedValueOnce({ role: 'employee' });

    await store.loadPersonalDashboard(new Date('2026-02-21T10:00:00.000Z'));

    expect(store.attendanceState()).toBe('unlinked');
    expect(dataService.getTodayStatus).not.toHaveBeenCalled();
  });

  it('handles clock in success and refreshes dashboard', async () => {
    await store.loadPersonalDashboard(new Date('2026-02-21T10:00:00.000Z'));

    const result = await store.clockIn();

    expect(result).toEqual({ success: true, code: 'ok', message: '' });
    expect(dataService.clockIn).toHaveBeenCalledTimes(1);
  });

  it('maps attendance reason-required and held errors', async () => {
    dataService.clockIn.mockRejectedValueOnce(new Error('ATTENDANCE_REASON_REQUIRED:Provide reason'));
    dataService.clockOut.mockRejectedValueOnce(new Error('ATTENDANCE_PUNCH_HELD:Pending review'));

    const clockInResult = await store.clockIn();
    const clockOutResult = await store.clockOut();

    expect(clockInResult).toEqual({
      success: false,
      code: 'reason_required',
      message: 'Provide reason'
    });
    expect(clockOutResult).toEqual({
      success: false,
      code: 'held',
      message: 'Pending review'
    });
  });

  it('loads team dashboard and held trust events', async () => {
    await store.loadTeamDashboard('2026-02-21');

    expect(store.teamRows().length).toBe(1);
    expect(store.heldTrustEvents().length).toBe(1);
    expect(store.presentTeamCount()).toBe(1);
  });

  it('saves manual entry and refreshes team data', async () => {
    await store.saveManualEntry({
      employeeId: 'emp-1',
      date: '2026-02-21',
      status: 'present',
      clockIn: '2026-02-21T08:00:00.000Z',
      clockOut: '2026-02-21T17:00:00.000Z',
      breakMinutes: 60,
      notes: 'Correction'
    });

    expect(dataService.createManualEntry).toHaveBeenCalledTimes(1);
    expect(dataService.listTeamAttendance).toHaveBeenCalledTimes(1);
  });

  it('reviews held events and refreshes held queue', async () => {
    await store.reviewHeldEvent({
      eventId: 'event-1',
      decision: 'approved'
    });

    expect(dataService.reviewHeldTrustEvent).toHaveBeenCalledWith({
      eventId: 'event-1',
      decision: 'approved',
      reviewNote: undefined
    });
    expect(dataService.listHeldTrustEvents).toHaveBeenCalledTimes(1);
  });

  it('exposes manager capability from viewer role', async () => {
    dataService.getViewerContext.mockResolvedValueOnce({ role: 'manager', employeeId: 'emp-manager' });

    await store.loadPersonalDashboard(new Date('2026-02-21T10:00:00.000Z'));

    expect(store.canManage()).toBe(true);
  });
});
