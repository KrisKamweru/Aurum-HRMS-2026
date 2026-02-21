import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { CoreHrRebuildStore } from '../data/core-hr-rebuild.store';
import { CoreHrRebuildComponent } from './core-hr-rebuild.component';

describe('CoreHrRebuildComponent', () => {
  let fixture: ComponentFixture<CoreHrRebuildComponent>;
  let component: CoreHrRebuildComponent;
  let navigate: ReturnType<typeof vi.fn>;
  let storeMock: Pick<
    CoreHrRebuildStore,
    'employees' | 'isLoading' | 'error' | 'pendingResignations' | 'recordCounts' | 'loadOverview'
  >;

  beforeEach(async () => {
    navigate = vi.fn(async () => true);

    storeMock = {
      employees: signal([
        {
          id: 'emp-1',
          fullName: 'Jane Doe',
          email: 'jane@aurum.test',
          status: 'active'
        }
      ]).asReadonly(),
      isLoading: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      pendingResignations: computed(() => 2),
      recordCounts: computed(() => ({
        promotions: 1,
        transfers: 2,
        awards: 3,
        warnings: 4,
        resignations: 5,
        terminations: 1,
        complaints: 0,
        travel: 2
      })),
      loadOverview: vi.fn(async () => {})
    };

    await TestBed.configureTestingModule({
      imports: [CoreHrRebuildComponent],
      providers: [
        { provide: CoreHrRebuildStore, useValue: storeMock },
        { provide: Router, useValue: { navigate } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CoreHrRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads overview on init', () => {
    expect(storeMock.loadOverview).toHaveBeenCalledTimes(1);
  });

  it('navigates to selected module', () => {
    component.openModule('/core-hr/promotions');
    expect(navigate).toHaveBeenCalledWith(['/core-hr/promotions']);
  });

  it('returns count for each module card', () => {
    expect(component.count('warnings')).toBe(4);
    expect(component.count('complaints')).toBe(0);
  });
});
