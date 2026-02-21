import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { RebuildLocation } from '../data/organization-rebuild.models';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';
import { LocationsRebuildComponent } from './locations-rebuild.component';

describe('LocationsRebuildComponent', () => {
  let fixture: ComponentFixture<LocationsRebuildComponent>;
  let component: LocationsRebuildComponent;
  let locations: ReturnType<typeof signal<RebuildLocation[]>>;
  let storeMock: Pick<
    OrganizationRebuildStore,
    'locations' | 'locationsLoading' | 'isSaving' | 'error' | 'loadLocations' | 'addLocation' | 'updateLocation' | 'removeLocation' | 'clearError'
  >;

  beforeEach(async () => {
    locations = signal<RebuildLocation[]>([
      { id: 'loc-nbo', name: 'Nairobi HQ', address: '1 Riverside', city: 'Nairobi', country: 'Kenya' },
      { id: 'loc-blr', name: 'Bengaluru Engineering Center', address: '77 Tech Park', city: 'Bengaluru', country: 'India' }
    ]);
    const loading = signal(false);
    const saving = signal(false);
    const error = signal<string | null>(null);

    storeMock = {
      locations: locations.asReadonly(),
      locationsLoading: loading.asReadonly(),
      isSaving: saving.asReadonly(),
      error: error.asReadonly(),
      loadLocations: vi.fn(async () => {}),
      addLocation: vi.fn(async (payload) => {
        locations.update((rows) => [...rows, { id: `loc-${rows.length + 1}`, ...payload }]);
        return true;
      }),
      updateLocation: vi.fn(async (payload) => {
        locations.update((rows) => rows.map((row) => (row.id === payload.id ? { ...payload } : row)));
        return true;
      }),
      removeLocation: vi.fn(async (id) => {
        locations.update((rows) => rows.filter((row) => row.id !== id));
        return true;
      }),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [LocationsRebuildComponent],
      providers: [{ provide: OrganizationRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(LocationsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads locations on init', () => {
    expect(storeMock.loadLocations).toHaveBeenCalledTimes(1);
  });

  it('starts with provided locations', () => {
    expect(component.locations().length).toBe(2);
    expect(component.locations().map((d) => d.name)).toEqual(['Nairobi HQ', 'Bengaluru Engineering Center']);
  });

  it('adds a new location', async () => {
    component.openCreateModal();
    await component.createLocationFromForm({
      name: 'London Hub',
      address: '20 Bishopsgate',
      city: 'London',
      country: 'UK'
    });

    expect(storeMock.addLocation).toHaveBeenCalledTimes(1);
    expect(component.locations().some((d) => d.name === 'London Hub' && d.city === 'London')).toBe(true);
    expect(component.isCreateModalOpen()).toBe(false);
  });

  it('renders shared table action controls for each location row', () => {
    const host = fixture.nativeElement as HTMLElement;
    const actionCells = host.querySelectorAll('app-organization-table-actions');
    expect(actionCells.length).toBe(component.locations().length);
  });

  it('removes an existing location', async () => {
    const target = component.locations()[0];
    component.requestLocationRemoval(target.id);
    await component.confirmLocationRemoval();

    expect(storeMock.removeLocation).toHaveBeenCalledWith(target.id);
    expect(component.locations().some((d) => d.id === target.id)).toBe(false);
  });

  it('opens and closes create modal', () => {
    expect(component.isCreateModalOpen()).toBe(false);
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBe(true);
    component.closeCreateModal();
    expect(component.isCreateModalOpen()).toBe(false);
  });
});
