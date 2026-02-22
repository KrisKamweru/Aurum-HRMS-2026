import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { SettingsRebuildStore } from '../data/settings-rebuild.store';
import { SettingsLeavePoliciesRebuildComponent } from './settings-leave-policies-rebuild.component';

describe('SettingsLeavePoliciesRebuildComponent', () => {
  let fixture: ComponentFixture<SettingsLeavePoliciesRebuildComponent>;
  let component: SettingsLeavePoliciesRebuildComponent;
  let storeMock: Pick<
    SettingsRebuildStore,
    'leavePolicies' | 'policiesLoading' | 'isSaving' | 'isSeeding' | 'error' | 'loadLeavePolicies' | 'createLeavePolicy' | 'updateLeavePolicy' | 'deleteLeavePolicy' | 'seedDefaults'
  >;

  beforeEach(async () => {
    storeMock = {
      leavePolicies: signal([
        {
          id: 'lp-1',
          name: 'Annual Leave',
          code: 'AL',
          type: 'vacation',
          daysPerYear: 21,
          accrualFrequency: 'annual',
          isActive: true
        }
      ]).asReadonly(),
      policiesLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      isSeeding: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadLeavePolicies: vi.fn(async () => {}),
      createLeavePolicy: vi.fn(async () => true),
      updateLeavePolicy: vi.fn(async () => true),
      deleteLeavePolicy: vi.fn(async () => true),
      seedDefaults: vi.fn(async () => true)
    };

    await TestBed.configureTestingModule({
      imports: [SettingsLeavePoliciesRebuildComponent],
      providers: [{ provide: SettingsRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsLeavePoliciesRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads leave policies on init', () => {
    expect(storeMock.loadLeavePolicies).toHaveBeenCalledTimes(1);
  });

  it('creates policy through store from form payload', async () => {
    component.openCreateModal();
    await component.submitPolicy({
      name: 'Sick Leave',
      code: 'SL',
      type: 'sick',
      daysPerYear: 10,
      accrualFrequency: 'annual',
      isActive: true
    });

    expect(storeMock.createLeavePolicy).toHaveBeenCalledWith({
      name: 'Sick Leave',
      code: 'SL',
      type: 'sick',
      daysPerYear: 10,
      accrualFrequency: 'annual',
      carryOverDays: undefined,
      description: undefined
    });
  });

  it('deletes selected policy after confirm action', async () => {
    component.onRowClick({ id: 'lp-1' });
    component.openDeleteConfirm();
    await component.handleConfirm();

    expect(storeMock.deleteLeavePolicy).toHaveBeenCalledWith('lp-1');
  });

  it('seeds defaults after confirm action', async () => {
    component.openSeedConfirm();
    await component.handleConfirm();

    expect(storeMock.seedDefaults).toHaveBeenCalledTimes(1);
  });
});
