import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ReportsRebuildStore } from '../data/reports-rebuild.store';
import { ReportsAnalyticsRebuildComponent } from './reports-analytics-rebuild.component';

describe('ReportsAnalyticsRebuildComponent', () => {
  let fixture: ComponentFixture<ReportsAnalyticsRebuildComponent>;
  let component: ReportsAnalyticsRebuildComponent;
  let storeMock: Pick<
    ReportsRebuildStore,
    'analytics' | 'analyticsLoading' | 'scheduleRunning' | 'error' | 'loadAnalytics' | 'runDueSchedules'
  >;

  beforeEach(async () => {
    storeMock = {
      analytics: signal({
        period: 'monthly',
        startDate: '2026-02-01',
        endDate: '2026-02-29',
        headcount: 10,
        attritionCount: 1,
        attritionRate: 0.1,
        leaveLiabilityDays: 3,
        payrollVarianceAmount: 1200,
        payrollVariancePercent: 0.05
      }).asReadonly(),
      analyticsLoading: signal(false).asReadonly(),
      scheduleRunning: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadAnalytics: vi.fn(async () => {}),
      runDueSchedules: vi.fn(async () => 2)
    };

    await TestBed.configureTestingModule({
      imports: [ReportsAnalyticsRebuildComponent],
      providers: [provideRouter([]), { provide: ReportsRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsAnalyticsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads analytics on init', () => {
    expect(storeMock.loadAnalytics).toHaveBeenCalledWith('monthly');
  });

  it('runs due schedules and reports processed count', async () => {
    await component.runDueSchedules();
    expect(storeMock.runDueSchedules).toHaveBeenCalledWith(25);
    expect(component.scheduleMessage()).toContain('Processed 2');
  });
});
