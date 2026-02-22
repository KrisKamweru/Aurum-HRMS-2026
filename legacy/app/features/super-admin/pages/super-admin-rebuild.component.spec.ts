import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';
import { SuperAdminOrganization } from '../data/super-admin-rebuild.models';
import { SuperAdminRebuildStore } from '../data/super-admin-rebuild.store';
import { SuperAdminRebuildComponent } from './super-admin-rebuild.component';

describe('SuperAdminRebuildComponent', () => {
  let fixture: ComponentFixture<SuperAdminRebuildComponent>;
  let component: SuperAdminRebuildComponent;
  let organizationsState: ReturnType<typeof signal<SuperAdminOrganization[]>>;
  let storeMock: Pick<
    SuperAdminRebuildStore,
    | 'organizations'
    | 'stats'
    | 'loading'
    | 'isSaving'
    | 'error'
    | 'activeOrganizations'
    | 'suspendedOrganizations'
    | 'loadDashboard'
    | 'createOrganization'
    | 'updateOrganization'
    | 'setOrganizationStatus'
    | 'clearError'
  >;

  beforeEach(async () => {
    organizationsState = signal([
      {
        id: 'org-1',
        name: 'Aurum Labs',
        domain: 'aurum.dev',
        subscriptionPlan: 'pro',
        status: 'active',
        userCount: 10,
        employeeCount: 8,
        pendingRequestCount: 1
      }
    ]);

    storeMock = {
      organizations: organizationsState.asReadonly(),
      stats: signal({
        totalOrganizations: 1,
        activeOrganizations: 1,
        suspendedOrganizations: 0,
        totalUsers: 10,
        activeUsers: 9,
        pendingUsers: 1,
        totalEmployees: 8
      }).asReadonly(),
      loading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      activeOrganizations: computed(() => organizationsState().filter((org) => org.status === 'active').length),
      suspendedOrganizations: computed(() => organizationsState().filter((org) => org.status === 'suspended').length),
      loadDashboard: vi.fn(async () => {}),
      createOrganization: vi.fn(async () => true),
      updateOrganization: vi.fn(async () => true),
      setOrganizationStatus: vi.fn(async (id: string, status: 'active' | 'suspended') => {
        organizationsState.update((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
        return true;
      }),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [SuperAdminRebuildComponent],
      providers: [{ provide: SuperAdminRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(SuperAdminRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads dashboard state on init', () => {
    expect(storeMock.loadDashboard).toHaveBeenCalledTimes(1);
  });

  it('creates organizations from form payload', async () => {
    component.openCreateModal();

    await component.saveOrganization({
      name: 'Aurum Systems',
      domain: 'aurum.systems',
      subscriptionPlan: 'enterprise'
    });

    expect(storeMock.createOrganization).toHaveBeenCalledWith({
      name: 'Aurum Systems',
      domain: 'aurum.systems',
      subscriptionPlan: 'enterprise'
    });
    expect(component.isModalOpen()).toBe(false);
  });

  it('updates organizations from edit flow', async () => {
    component.openEditModal(organizationsState()[0]);

    await component.saveOrganization({
      name: 'Aurum Labs',
      domain: 'aurum.dev',
      subscriptionPlan: 'pro'
    });

    expect(storeMock.updateOrganization).toHaveBeenCalledWith({
      id: 'org-1',
      name: 'Aurum Labs',
      domain: 'aurum.dev',
      subscriptionPlan: 'pro'
    });
  });

  it('confirms status changes for target organization', async () => {
    component.requestStatusChange(organizationsState()[0]);
    await component.confirmStatusChange();

    expect(storeMock.setOrganizationStatus).toHaveBeenCalledWith('org-1', 'suspended');
  });
});
