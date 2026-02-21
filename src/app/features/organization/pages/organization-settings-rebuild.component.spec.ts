import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
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
      status: 'active'
    };
    getOrganizationSettings.mockReset();
    updateOrganizationSettings.mockReset();
    getOrganizationSettings.mockImplementation(async () => settings);
    updateOrganizationSettings.mockImplementation(async (payload) => {
      settings = { ...settings, ...payload, domain: payload.domain ?? '' };
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
      status: 'active'
    });
    expect(component.settings()?.name).toBe('Aurum Global');
  });
});
