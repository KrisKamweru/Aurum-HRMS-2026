import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { RebuildUnlinkedEmployee, RebuildUnlinkedUser } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';
import { UserLinkingRebuildComponent } from './user-linking-rebuild.component';

describe('UserLinkingRebuildComponent', () => {
  let fixture: ComponentFixture<UserLinkingRebuildComponent>;
  let component: UserLinkingRebuildComponent;
  let pendingUsers: ReturnType<typeof signal<RebuildUnlinkedUser[]>>;
  let unlinkedEmployees: ReturnType<typeof signal<RebuildUnlinkedEmployee[]>>;
  let linkedCount: ReturnType<typeof signal<number>>;
  let selectionMap: Record<string, string>;
  let storeMock: Pick<
    OrganizationRebuildStore,
    | 'pendingUserLinks'
    | 'unlinkedEmployees'
    | 'linkedCount'
    | 'userLinkingLoading'
    | 'isSaving'
    | 'error'
    | 'loadUserLinkingData'
    | 'selectedEmployeeForUser'
    | 'setSelectedEmployeeForUser'
    | 'linkUserToEmployee'
  >;

  beforeEach(async () => {
    pendingUsers = signal<RebuildUnlinkedUser[]>([
      { id: 'user-a', name: 'Amina Hassan', email: 'amina.hassan@aurum.dev', role: 'employee' },
      { id: 'user-b', name: 'James Doe', email: 'james.doe@aurum.dev', role: 'employee' }
    ]);
    unlinkedEmployees = signal<RebuildUnlinkedEmployee[]>([
      { id: 'emp-a', firstName: 'Amina', lastName: 'Hassan', email: 'amina.hassan@aurum.dev', status: 'active' },
      { id: 'emp-b', firstName: 'James', lastName: 'Doe', email: 'james.doe@aurum.dev', status: 'active' }
    ]);
    linkedCount = signal(0);
    selectionMap = {
      'user-a': 'emp-a'
    };
    const loading = signal(false);
    const saving = signal(false);
    const error = signal<string | null>(null);

    storeMock = {
      pendingUserLinks: pendingUsers.asReadonly(),
      unlinkedEmployees: unlinkedEmployees.asReadonly(),
      linkedCount: linkedCount.asReadonly(),
      userLinkingLoading: loading.asReadonly(),
      isSaving: saving.asReadonly(),
      error: error.asReadonly(),
      loadUserLinkingData: vi.fn(async () => {}),
      selectedEmployeeForUser: vi.fn((userId) => selectionMap[userId]),
      setSelectedEmployeeForUser: vi.fn((userId, employeeId) => {
        selectionMap[userId] = employeeId;
      }),
      linkUserToEmployee: vi.fn(async (userId) => {
        pendingUsers.update((rows) => rows.filter((row) => row.id !== userId));
        linkedCount.update((count) => count + 1);
        return true;
      })
    };

    await TestBed.configureTestingModule({
      imports: [UserLinkingRebuildComponent],
      providers: [{ provide: OrganizationRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(UserLinkingRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads pending links on init', () => {
    expect(storeMock.loadUserLinkingData).toHaveBeenCalledTimes(1);
  });

  it('starts with pending links', () => {
    expect(component.pendingLinks().length).toBe(2);
    expect(component.linkedCount()).toBe(0);
  });

  it('links a pending candidate', () => {
    const target = component.pendingLinks()[0];
    component.linkCandidate(target.id);

    expect(storeMock.linkUserToEmployee).toHaveBeenCalledWith(target.id);
    expect(component.pendingLinks().some((row) => row.id === target.id)).toBe(false);
    expect(component.linkedCount()).toBe(1);
  });

  it('updates selection through DOM events', () => {
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'emp-b';
    select.appendChild(option);
    select.value = 'emp-b';
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: select });

    component.onEmployeeSelectionChange('user-b', event);

    expect(storeMock.setSelectedEmployeeForUser).toHaveBeenCalledWith('user-b', 'emp-b');
  });
});
