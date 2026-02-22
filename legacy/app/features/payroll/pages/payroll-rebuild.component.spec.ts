import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { PayrollRebuildStore } from '../data/payroll-rebuild.store';
import { PayrollRebuildComponent } from './payroll-rebuild.component';

describe('PayrollRebuildComponent', () => {
  let fixture: ComponentFixture<PayrollRebuildComponent>;
  let component: PayrollRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    PayrollRebuildStore,
    | 'runs'
    | 'pendingChanges'
    | 'isListLoading'
    | 'isSaving'
    | 'error'
    | 'totalProcessedYtd'
    | 'employeesPaidYtd'
    | 'pendingRunCount'
    | 'loadPayrollHome'
    | 'createRun'
    | 'reviewSensitiveChange'
    | 'clearError'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      runs: signal([
        {
          id: 'run-1',
          month: 2,
          year: 2026,
          status: 'processing',
          runDate: '2026-02-25T00:00:00.000Z',
          employeeCount: 10,
          totalGrossPay: 300000,
          totalNetPay: 250000,
          processedBy: 'user-1'
        }
      ]).asReadonly(),
      pendingChanges: signal([
        {
          id: 'change-1',
          targetTable: 'payroll_runs',
          operation: 'update',
          reason: 'Finalize run',
          createdAt: '2026-02-25T10:00:00.000Z'
        }
      ]).asReadonly(),
      isListLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      totalProcessedYtd: computed(() => 250000),
      employeesPaidYtd: computed(() => 10),
      pendingRunCount: computed(() => 1),
      loadPayrollHome: vi.fn(async () => {}),
      createRun: vi.fn(async () => 'run-2'),
      reviewSensitiveChange: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [PayrollRebuildComponent],
      providers: [
        { provide: PayrollRebuildStore, useValue: storeMock },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PayrollRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads payroll home on init', () => {
    expect(storeMock.loadPayrollHome).toHaveBeenCalledTimes(1);
  });

  it('opens create modal and submits a new run', async () => {
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);

    await component.createRunFromForm({ month: 3, year: 2026, confirm: true });

    expect(storeMock.createRun).toHaveBeenCalledWith({ month: 3, year: 2026 });
    expect(navigate).toHaveBeenCalledWith(['/payroll', 'run-2']);
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('opens review dialog and forwards rejection reason', async () => {
    component.requestReviewChange('change-1', 'rejected');
    expect(component.isReviewDialogOpen()).toBe(true);

    await component.confirmReview('Missing supporting documents');

    expect(storeMock.reviewSensitiveChange).toHaveBeenCalledWith({
      changeRequestId: 'change-1',
      decision: 'rejected',
      rejectionReason: 'Missing supporting documents'
    });
    expect(component.isReviewDialogOpen()).toBe(false);
  });

  it('maps status and operation variants', () => {
    expect(component.runStatusVariant('completed')).toBe('success');
    expect(component.runStatusVariant('processing')).toBe('info');
    expect(component.runStatusVariant('draft')).toBe('neutral');

    expect(component.operationVariant('delete')).toBe('danger');
    expect(component.operationVariant('update')).toBe('warning');
    expect(component.operationVariant('create')).toBe('info');
  });
});
