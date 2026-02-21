import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { OrganizationListShellComponent } from '../components/organization-list-shell.component';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { OrganizationTableHeaderRowComponent } from '../components/organization-table-header-row.component';
import { OrganizationTableMetadataComponent } from '../components/organization-table-metadata.component';
import { RebuildDesignation } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';
import { DesignationsRebuildComponent } from './designations-rebuild.component';

describe('DesignationsRebuildComponent', () => {
  let fixture: ComponentFixture<DesignationsRebuildComponent>;
  let component: DesignationsRebuildComponent;
  let designations: ReturnType<typeof signal<RebuildDesignation[]>>;
  let storeMock: Pick<
    OrganizationRebuildStore,
    'designations' | 'designationsLoading' | 'isSaving' | 'error' | 'loadDesignations' | 'addDesignation' | 'updateDesignation' | 'removeDesignation' | 'clearError'
  >;

  beforeEach(async () => {
    designations = signal<RebuildDesignation[]>([
      { id: 'desig-hrg', title: 'HR Generalist', code: 'HRG', level: 2, description: 'Generalist track' },
      { id: 'desig-se', title: 'Software Engineer', code: 'SE', level: 2, description: 'Engineering IC' }
    ]);
    const loading = signal(false);
    const saving = signal(false);
    const error = signal<string | null>(null);

    storeMock = {
      designations: designations.asReadonly(),
      designationsLoading: loading.asReadonly(),
      isSaving: saving.asReadonly(),
      error: error.asReadonly(),
      loadDesignations: vi.fn(async () => {}),
      addDesignation: vi.fn(async (payload) => {
        designations.update((rows) => [
          ...rows,
          {
            id: `desig-${rows.length + 1}`,
            title: payload.title,
            code: payload.code ?? 'NEW',
            level: payload.level ?? null,
            description: payload.description ?? ''
          }
        ]);
        return true;
      }),
      updateDesignation: vi.fn(async (payload) => {
        designations.update((rows) =>
          rows.map((row) =>
            row.id === payload.id
              ? { ...row, title: payload.title, code: payload.code ?? row.code, level: payload.level ?? row.level }
              : row
          )
        );
        return true;
      }),
      removeDesignation: vi.fn(async (id) => {
        designations.update((rows) => rows.filter((row) => row.id !== id));
        return true;
      }),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [DesignationsRebuildComponent],
      providers: [{ provide: OrganizationRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(DesignationsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads designations on init', () => {
    expect(storeMock.loadDesignations).toHaveBeenCalledTimes(1);
  });

  it('starts with provided designations', () => {
    expect(component.designations().length).toBe(2);
    expect(component.designations().map((d) => d.title)).toEqual(['HR Generalist', 'Software Engineer']);
  });

  it('adds a new designation', async () => {
    component.openCreateModal();
    await component.createDesignationFromForm({
      title: 'Finance Manager',
      code: 'FIN_MGR',
      level: 3
    });

    expect(storeMock.addDesignation).toHaveBeenCalledTimes(1);
    expect(component.designations().some((d) => d.title === 'Finance Manager')).toBe(true);
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('renders shared table action controls for each designation row', () => {
    const host = fixture.nativeElement as HTMLElement;
    const actionCells = host.querySelectorAll('app-organization-table-actions');
    expect(actionCells.length).toBe(component.designations().length);
  });

  it('renders shared organization list shell with configured heading copy', () => {
    const shell = fixture.debugElement.query(By.directive(OrganizationListShellComponent));
    expect(shell).not.toBeNull();

    const shellComponent = shell.componentInstance as OrganizationListShellComponent;
    expect(shellComponent.title).toBe('Designations');
  });

  it('retries designation loading when page-state retry is requested', () => {
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;

    state.retryRequested.emit();

    expect(storeMock.loadDesignations).toHaveBeenCalledTimes(2);
  });

  it('wires empty-state primary and secondary actions to create and refresh', () => {
    designations.set([]);
    fixture.detectChanges();
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;

    expect(state.showEmptyActions).toBe(true);
    expect(state.emptyPrimaryLabel).toBe('Add Designation');

    state.emptyPrimaryRequested.emit();
    expect(component.isCreateModalOpen()).toBe(true);

    state.emptySecondaryRequested.emit();
    expect(storeMock.loadDesignations).toHaveBeenCalledTimes(2);
  });

  it('uses table loading skeleton variant', () => {
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;
    expect(state.loadingVariant).toBe('table');
  });

  it('renders shared table metadata with count and refresh timestamp', () => {
    const metadata = fixture.debugElement.query(By.directive(OrganizationTableMetadataComponent));
    expect(metadata).not.toBeNull();

    const metadataComponent = metadata.componentInstance as OrganizationTableMetadataComponent;
    expect(metadataComponent.itemLabel).toBe('Designations');
    expect(metadataComponent.count).toBe(component.designations().length);
    expect(metadataComponent.lastRefreshedAt).not.toBeNull();
  });

  it('uses shared table-header helper with designation column definitions', () => {
    const header = fixture.debugElement.query(By.directive(OrganizationTableHeaderRowComponent));
    expect(header).not.toBeNull();

    const headerComponent = header.componentInstance as OrganizationTableHeaderRowComponent;
    expect(headerComponent.columns.map((column) => column.label)).toEqual([
      'Designation',
      'Code',
      'Level',
      'Description',
      'Actions'
    ]);
  });

  it('removes an existing designation', async () => {
    const target = component.designations()[0];
    component.requestDesignationRemoval(target.id);
    await component.confirmDesignationRemoval();

    expect(storeMock.removeDesignation).toHaveBeenCalledWith(target.id);
    expect(component.designations().some((d) => d.id === target.id)).toBe(false);
  });

  it('opens and closes create modal', () => {
    expect(component.isCreateModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);
    component.closeCreateModal();
    expect(component.isCreateModalOpen()).toBe(false);
  });
});
