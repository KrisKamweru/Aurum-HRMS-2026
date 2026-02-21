import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { api } from '../../../../../convex/_generated/api';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { AttendanceRebuildDataService } from './attendance-rebuild.data.service';

describe('AttendanceRebuildDataService', () => {
  let service: AttendanceRebuildDataService;
  let query: ReturnType<typeof vi.fn>;
  let mutation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    query = vi.fn(async () => null);
    mutation = vi.fn(async () => null);

    TestBed.configureTestingModule({
      providers: [
        AttendanceRebuildDataService,
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

    service = TestBed.inject(AttendanceRebuildDataService);
  });

  it('maps today status and history rows', async () => {
    query.mockResolvedValueOnce({
      _id: 'att-1',
      date: '2026-02-21',
      clockIn: '2026-02-21T08:00:00.000Z',
      clockOut: '2026-02-21T17:00:00.000Z',
      status: 'present',
      workMinutes: 540,
      breakMinutes: 60
    });
    query.mockResolvedValueOnce([
      {
        _id: 'att-2',
        date: '2026-02-20',
        status: 'late',
        workMinutes: 480
      },
      { _id: 'broken' }
    ]);

    const today = await service.getTodayStatus();
    const history = await service.listMyAttendance('2026-02-01', '2026-02-21');

    expect(today?.id).toBe('att-1');
    expect(today?.status).toBe('present');
    expect(history).toEqual([
      {
        id: 'att-2',
        date: '2026-02-20',
        clockIn: undefined,
        clockOut: undefined,
        status: 'late',
        workMinutes: 480,
        breakMinutes: 0,
        notes: ''
      }
    ]);
  });

  it('maps attendance summary with safe defaults', async () => {
    query.mockResolvedValueOnce({
      presentDays: 18,
      absentDays: 2,
      lateDays: 3,
      totalWorkMinutes: 8100,
      avgWorkMinutes: 450
    });

    const summary = await service.getAttendanceSummary('2026-02');

    expect(summary).toEqual({
      presentDays: 18,
      absentDays: 2,
      lateDays: 3,
      totalWorkMinutes: 8100,
      avgWorkMinutes: 450
    });
  });

  it('maps team attendance and held trust events', async () => {
    query.mockResolvedValueOnce([
      {
        employee: {
          id: 'emp-1',
          name: 'Amina Hassan',
          email: 'amina@aurum.dev',
          departmentId: 'dept-1',
          designationId: 'desig-1'
        },
        attendance: {
          _id: 'att-1',
          date: '2026-02-21',
          status: 'present',
          workMinutes: 480
        }
      }
    ]);
    query.mockResolvedValueOnce([
      {
        _id: 'event-1',
        employeeId: 'emp-1',
        employeeName: 'Amina Hassan',
        eventType: 'clock_in',
        riskLevel: 'medium',
        riskScore: 62,
        capturedAt: '2026-02-21T08:10:00.000Z',
        decision: 'held'
      }
    ]);

    const team = await service.listTeamAttendance('2026-02-21');
    const held = await service.listHeldTrustEvents(20);

    expect(team[0]?.employeeName).toBe('Amina Hassan');
    expect(team[0]?.attendance?.status).toBe('present');
    expect(held).toEqual([
      {
        id: 'event-1',
        employeeId: 'emp-1',
        employeeName: 'Amina Hassan',
        eventType: 'clock_in',
        riskLevel: 'medium',
        riskScore: 62,
        capturedAt: '2026-02-21T08:10:00.000Z'
      }
    ]);
  });

  it('maps viewer context from users.viewer', async () => {
    query.mockResolvedValueOnce({ _id: 'user-1', role: 'manager', employeeId: 'emp-manager' });

    const viewer = await service.getViewerContext();

    expect(viewer).toEqual({ role: 'manager', employeeId: 'emp-manager' });
  });

  it('submits clock and manual entry mutations with trust signal payloads', async () => {
    await service.clockIn();
    await service.clockOut('Working from client site');
    await service.createManualEntry({
      employeeId: 'emp-1',
      date: '2026-02-21',
      status: 'present',
      clockIn: '2026-02-21T08:00:00.000Z',
      clockOut: '2026-02-21T17:00:00.000Z',
      breakMinutes: 60,
      notes: 'Shift correction'
    });
    await service.reviewHeldTrustEvent({
      eventId: 'event-1',
      decision: 'approved'
    });

    expect(mutation).toHaveBeenNthCalledWith(1, api.attendance.clockIn, {
      trustSignals: {
        reasonCode: 'clock_in_ui',
        reasonText: undefined
      }
    });
    expect(mutation).toHaveBeenNthCalledWith(2, api.attendance.clockOut, {
      trustSignals: {
        reasonCode: 'clock_out_ui',
        reasonText: 'Working from client site'
      }
    });
    expect(mutation).toHaveBeenNthCalledWith(3, api.attendance.manualEntry, {
      employeeId: 'emp-1',
      date: '2026-02-21',
      clockIn: '2026-02-21T08:00:00.000Z',
      clockOut: '2026-02-21T17:00:00.000Z',
      status: 'present',
      breakMinutes: 60,
      notes: 'Shift correction',
      trustSignals: {
        reasonCode: 'manual_entry_ui',
        reasonText: 'Shift correction'
      }
    });
    expect(mutation).toHaveBeenNthCalledWith(4, api.attendance.reviewHeldTrustEvent, {
      eventId: 'event-1',
      decision: 'approved',
      reviewNote: undefined
    });
  });
});
