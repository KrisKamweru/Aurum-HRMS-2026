import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { OrganizationRebuildDataService } from '../data/organization-rebuild.data.service';
import { RebuildOrganizationSettings } from '../data/organization-rebuild.models';
import { OrganizationSettingsRebuildComponent } from './organization-settings-rebuild.component';

describe('OrganizationSettingsRebuildComponent', () => {
  let fixture: ComponentFixture<OrganizationSettingsRebuildComponent>;
  let component: OrganizationSettingsRebuildComponent;
  let settings: RebuildOrganizationSettings;
  const getOrganizationSettings = vi.fn<() => Promise<RebuildOrganizationSettings | null>>();
  const updateOrganizationSettings = vi.fn<
    (payload: { name: string; domain?: string; subscriptionPlan: 'free' | 'pro' | 'enterprise'; status: 'active' | 'suspended' }) => Promise<void>
  >();

  beforeEach(async () => {
    settings = {
      id: 'org-1',
      name: 'Aurum HRMS',
      domain: 'aurum.dev',
      subscriptionPlan: 'pro',
      status: 'active',
      updatedAt: '2026-02-21T10:00:00.000Z'
    };
    getOrganizationSettings.mockReset();
    updateOrganizationSettings.mockReset();
    getOrganizationSettings.mockImplementation(async () => settings);
    updateOrganizationSettings.mockImplementation(async (payload) => {
      settings = {
        ...settings,
        ...payload,
        domain: payload.domain ?? '',
        updatedAt: '2026-02-21T10:15:00.000Z'
      };
    });

    await TestBed.configureTestingModule({
      imports: [OrganizationSettingsRebuildComponent],
      providers: [{ provide: OrganizationRebuildDataService, useValue: { getOrganizationSettings, updateOrganizationSettings } }]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationSettingsRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads settings on init', () => {
    expect(getOrganizationSettings).toHaveBeenCalledTimes(1);
    expect(component.settings()?.name).toBe('Aurum HRMS');
  });

  it('opens edit modal with current values', () => {
    component.openEditModal();

    expect(component.isEditModalOpen()).toBe(true);
    expect(component.editInitialValues()['name']).toBe('Aurum HRMS');
  });

  it('submits updated settings and reloads snapshot', async () => {
    await component.submitSettings({
      name: 'Aurum Global',
      domain: 'global.aurum.dev',
      subscriptionPlan: 'enterprise',
      status: 'active'
    });

    expect(updateOrganizationSettings).toHaveBeenCalledWith({
      name: 'Aurum Global',
      domain: 'global.aurum.dev',
      subscriptionPlan: 'enterprise',
      status: 'active',
      expectedUpdatedAt: '2026-02-21T10:00:00.000Z'
    });
    expect(component.settings()?.name).toBe('Aurum Global');
  });

  it('applies optimistic settings immediately while save is in flight', async () => {
    let resolveUpdate: (() => void) | null = null;
    updateOrganizationSettings.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = () => {
            settings = {
              ...settings,
              name: 'Aurum Optimistic',
              domain: 'optimistic.aurum.dev',
              subscriptionPlan: 'enterprise',
              status: 'active',
              updatedAt: '2026-02-21T10:30:00.000Z'
            };
            resolve();
          };
        })
    );

    const submitPromise = component.submitSettings({
      name: 'Aurum Optimistic',
      domain: 'optimistic.aurum.dev',
      subscriptionPlan: 'enterprise',
      status: 'active'
    });

    expect(component.settings()?.name).toBe('Aurum Optimistic');
    resolveUpdate?.();
    await submitPromise;
  });

  it('reloads latest values and reports conflict when stale payload is rejected', async () => {
    updateOrganizationSettings.mockRejectedValueOnce(new Error('Conflict: stale settings snapshot'));
    settings = {
      ...settings,
      name: 'Aurum Latest',
      domain: 'latest.aurum.dev',
      updatedAt: '2026-02-21T10:45:00.000Z'
    };

    await component.submitSettings({
      name: 'Aurum Stale',
      domain: 'stale.aurum.dev',
      subscriptionPlan: 'enterprise',
      status: 'active'
    });

    expect(getOrganizationSettings).toHaveBeenCalledTimes(2);
    expect(component.settings()?.name).toBe('Aurum Latest');
    expect(component.error()).toContain('updated in another session');
  });

  it('retries settings load when page-state retry is requested', () => {
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;

    state.retryRequested.emit();

    expect(getOrganizationSettings).toHaveBeenCalledTimes(2);
  });

  it('uses detail loading skeleton variant', () => {
    const state = fixture.debugElement.query(By.directive(OrganizationPageStateComponent)).componentInstance as OrganizationPageStateComponent;
    expect(state.loadingVariant).toBe('detail');
  });
});
