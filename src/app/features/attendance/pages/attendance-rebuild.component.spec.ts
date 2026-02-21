import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';
import { AttendanceRebuildStore } from '../data/attendance-rebuild.store';
import { AttendanceRebuildComponent } from './attendance-rebuild.component';

describe('AttendanceRebuildComponent', () => {
  let fixture: ComponentFixture<AttendanceRebuildComponent>;
  let component: AttendanceRebuildComponent;
  let storeMock: Pick<
    AttendanceRebuildStore,
    | 'viewer'
    | 'todayStatus'
    | 'summary'
    | 'history'
    | 'isPersonalLoading'
    | 'isActionLoading'
    | 'error'
    | 'attendanceState'
    | 'canManage'
    | 'loadPersonalDashboard'
    | 'clockIn'
    | 'clockOut'
    | 'clearError'
  >;
  let attendanceStateSignal: ReturnType<typeof signal<'unlinked' | 'not-clocked-in' | 'working' | 'clocked-out'>>;

  beforeEach(async () => {
    attendanceStateSignal = signal<'unlinked' | 'not-clocked-in' | 'working' | 'clocked-out'>('not-clocked-in');

    storeMock = {
      viewer: signal({ role: 'employee', employeeId: 'emp-1' }).asReadonly(),
      todayStatus: signal(null).asReadonly(),
      summary: signal({
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        totalWorkMinutes: 0,
        avgWorkMinutes: 0
      }).asReadonly(),
      history: signal([]).asReadonly(),
      isPersonalLoading: signal(false).asReadonly(),
      isActionLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      attendanceState: attendanceStateSignal.asReadonly(),
      canManage: computed(() => false),
      loadPersonalDashboard: vi.fn(async () => {}),
      clockIn: vi.fn(async () => ({ success: true, code: 'ok', message: '' })),
      clockOut: vi.fn(async () => ({ success: true, code: 'ok', message: '' })),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [AttendanceRebuildComponent],
      providers: [{ provide: AttendanceRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads personal dashboard on init', () => {
    expect(storeMock.loadPersonalDashboard).toHaveBeenCalledTimes(1);
  });

  it('forwards clock-in action to the store', async () => {
    await component.handleClockIn();

    expect(storeMock.clockIn).toHaveBeenCalledTimes(1);
  });

  it('opens reason dialog for reason-required responses and retries with reason', async () => {
    storeMock.clockIn = vi
      .fn()
      .mockResolvedValueOnce({ success: false, code: 'reason_required', message: 'Reason required' })
      .mockResolvedValueOnce({ success: true, code: 'ok', message: '' });

    await component.handleClockIn();
    expect(component.isReasonDialogOpen()).toBe(true);

    await component.confirmReasonAction('Working offsite');

    expect(storeMock.clockIn).toHaveBeenNthCalledWith(2, 'Working offsite');
    expect(component.isReasonDialogOpen()).toBe(false);
  });

  it('forwards clock-out action to the store', async () => {
    await component.handleClockOut();

    expect(storeMock.clockOut).toHaveBeenCalledTimes(1);
  });

  it('maps attendance labels and status badge variants', () => {
    attendanceStateSignal.set('working');
    fixture.detectChanges();

    expect(component.attendanceStateLabel()).toBe('Currently Working');
    expect(component.statusVariant('present')).toBe('success');
    expect(component.statusVariant('late')).toBe('warning');
    expect(component.statusVariant('absent')).toBe('danger');
    expect(component.statusVariant('holiday')).toBe('neutral');
  });
});
