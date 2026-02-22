import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AttendanceRebuildStore } from '../data/attendance-rebuild.store';
import { TeamAttendanceRebuildComponent } from './team-attendance-rebuild.component';

describe('TeamAttendanceRebuildComponent', () => {
  let fixture: ComponentFixture<TeamAttendanceRebuildComponent>;
  let component: TeamAttendanceRebuildComponent;
  let storeMock: Pick<
    AttendanceRebuildStore,
    | 'teamRows'
    | 'heldTrustEvents'
    | 'isTeamLoading'
    | 'isSaving'
    | 'error'
    | 'presentTeamCount'
    | 'lateTeamCount'
    | 'absentTeamCount'
    | 'onLeaveTeamCount'
    | 'loadTeamDashboard'
    | 'saveManualEntry'
    | 'reviewHeldEvent'
    | 'clearError'
  >;

  beforeEach(async () => {
    storeMock = {
      teamRows: signal([
        {
          employeeId: 'emp-1',
          employeeName: 'Amina Hassan',
          employeeEmail: 'amina@aurum.dev',
          employeeDepartmentId: 'dept-1',
          employeeDesignationId: 'desig-1',
          attendance: {
            id: 'att-1',
            date: '2026-02-21',
            clockIn: '2026-02-21T08:00:00.000Z',
            clockOut: '2026-02-21T17:00:00.000Z',
            status: 'present',
            workMinutes: 480,
            breakMinutes: 60,
            notes: ''
          }
        }
      ]).asReadonly(),
      heldTrustEvents: signal([
        {
          id: 'event-1',
          employeeId: 'emp-1',
          employeeName: 'Amina Hassan',
          eventType: 'clock_in',
          riskLevel: 'high',
          riskScore: 78,
          capturedAt: '2026-02-21T08:10:00.000Z'
        }
      ]).asReadonly(),
      isTeamLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      presentTeamCount: signal(1).asReadonly(),
      lateTeamCount: signal(0).asReadonly(),
      absentTeamCount: signal(0).asReadonly(),
      onLeaveTeamCount: signal(0).asReadonly(),
      loadTeamDashboard: vi.fn(async () => {}),
      saveManualEntry: vi.fn(async () => true),
      reviewHeldEvent: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [TeamAttendanceRebuildComponent],
      providers: [{ provide: AttendanceRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(TeamAttendanceRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads team dashboard on init', () => {
    expect(storeMock.loadTeamDashboard).toHaveBeenCalledTimes(1);
  });

  it('opens manual entry modal from selected team row', () => {
    component.openManualEntryModal(component.teamRows()[0]!);

    expect(component.isManualEntryModalOpen()).toBe(true);
    expect(component.selectedEmployeeId()).toBe('emp-1');
  });

  it('submits manual entry from form payload and closes modal on success', async () => {
    component.openManualEntryModal(component.teamRows()[0]!);

    await component.submitManualEntryFromForm({
      clockIn: '08:30',
      clockOut: '17:30',
      status: 'present',
      breakMinutes: 45,
      notes: 'Adjusted after review'
    });

    expect(storeMock.saveManualEntry).toHaveBeenCalledTimes(1);
    expect(component.isManualEntryModalOpen()).toBe(false);
  });

  it('opens held-event decision dialog and forwards rejection reason', async () => {
    component.requestHeldEventDecision('event-1', 'rejected');
    expect(component.isHeldDecisionDialogOpen()).toBe(true);

    await component.confirmHeldEventDecision('Outside geofence with no prior notice');

    expect(storeMock.reviewHeldEvent).toHaveBeenCalledWith({
      eventId: 'event-1',
      decision: 'rejected',
      reviewNote: 'Outside geofence with no prior notice'
    });
  });

  it('maps team row status badge variants', () => {
    expect(component.statusVariant('present')).toBe('success');
    expect(component.statusVariant('late')).toBe('warning');
    expect(component.statusVariant('absent')).toBe('danger');
    expect(component.statusVariant('on-leave')).toBe('info');
  });
});
