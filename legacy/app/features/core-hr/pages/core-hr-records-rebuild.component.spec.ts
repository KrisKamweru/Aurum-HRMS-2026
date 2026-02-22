import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { EMPTY_CORE_HR_RECORD_MAP } from '../data/core-hr-rebuild.models';
import { CoreHrRebuildStore } from '../data/core-hr-rebuild.store';
import { CoreHrRecordsRebuildComponent } from './core-hr-records-rebuild.component';

describe('CoreHrRecordsRebuildComponent', () => {
  let fixture: ComponentFixture<CoreHrRecordsRebuildComponent>;
  let component: CoreHrRecordsRebuildComponent;
  let storeMock: Pick<
    CoreHrRebuildStore,
    | 'isLoading'
    | 'isSaving'
    | 'error'
    | 'canManage'
    | 'employees'
    | 'departments'
    | 'designations'
    | 'locations'
    | 'records'
    | 'loadRecordType'
    | 'submitRecord'
    | 'reviewResignation'
    | 'clearError'
  >;

  beforeEach(async () => {
    storeMock = {
      isLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      canManage: computed(() => true),
      employees: signal([
        {
          id: 'emp-1',
          fullName: 'Jane Doe',
          email: 'jane@aurum.test',
          status: 'active',
          departmentId: 'dept-1',
          designationId: 'des-1',
          locationId: 'loc-1'
        }
      ]).asReadonly(),
      departments: signal([{ id: 'dept-1', label: 'Finance' }]).asReadonly(),
      designations: signal([
        { id: 'des-1', label: 'Analyst' },
        { id: 'des-2', label: 'Senior Analyst' }
      ]).asReadonly(),
      locations: signal([{ id: 'loc-1', label: 'Nairobi HQ' }]).asReadonly(),
      records: signal({
        ...EMPTY_CORE_HR_RECORD_MAP,
        promotions: [
          {
            id: 'prom-1',
            employeeId: 'emp-1',
            fromDesignationId: 'des-1',
            toDesignationId: 'des-2',
            promotionDate: '2026-02-01',
            salaryIncrement: 1000,
            remarks: ''
          }
        ],
        resignations: [
          {
            id: 'res-1',
            employeeId: 'emp-1',
            noticeDate: '2026-02-01',
            lastWorkingDay: '2026-03-01',
            reason: 'Relocation',
            status: 'pending'
          }
        ]
      }).asReadonly(),
      loadRecordType: vi.fn(async () => {}),
      submitRecord: vi.fn(async () => true),
      reviewResignation: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [CoreHrRecordsRebuildComponent],
      providers: [
        { provide: CoreHrRebuildStore, useValue: storeMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { recordType: 'promotions' }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CoreHrRecordsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads route-scoped records on init', () => {
    expect(component.recordType()).toBe('promotions');
    expect(storeMock.loadRecordType).toHaveBeenCalledWith('promotions');
  });

  it('opens modal with route-specific defaults and submits form payload', async () => {
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);
    expect(component.initialValues()['promotionDate']).toBeTypeOf('string');

    await component.submitFromForm({
      employeeId: 'emp-1',
      toDesignationId: 'des-2',
      promotionDate: '2026-02-01'
    });

    expect(storeMock.submitRecord).toHaveBeenCalledWith('promotions', {
      employeeId: 'emp-1',
      toDesignationId: 'des-2',
      promotionDate: '2026-02-01'
    });
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('forwards resignation approval decisions', async () => {
    component.recordType.set('resignations');
    component.requestResignationDecision('res-1', 'approved');

    expect(component.isDecisionDialogOpen()).toBe(true);

    await component.confirmResignationDecision();

    expect(storeMock.reviewResignation).toHaveBeenCalledWith('res-1', 'approved');
    expect(component.isDecisionDialogOpen()).toBe(false);
  });
});
