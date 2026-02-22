import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { SettingsRebuildStore } from '../data/settings-rebuild.store';
import { SettingsGeneralRebuildComponent } from './settings-general-rebuild.component';

describe('SettingsGeneralRebuildComponent', () => {
  let fixture: ComponentFixture<SettingsGeneralRebuildComponent>;
  let component: SettingsGeneralRebuildComponent;
  let storeMock: Pick<
    SettingsRebuildStore,
    'generalSettings' | 'generalLoading' | 'isSaving' | 'error' | 'loadGeneralSettings' | 'saveGeneralSettings'
  >;

  beforeEach(async () => {
    storeMock = {
      generalSettings: signal({
        currency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        workDays: [1, 2, 3, 4, 5]
      }).asReadonly(),
      generalLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      loadGeneralSettings: vi.fn(async () => {}),
      saveGeneralSettings: vi.fn(async () => true)
    };

    await TestBed.configureTestingModule({
      imports: [SettingsGeneralRebuildComponent],
      providers: [provideRouter([]), { provide: SettingsRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsGeneralRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads general settings on init', () => {
    expect(storeMock.loadGeneralSettings).toHaveBeenCalledTimes(1);
  });

  it('submits merged settings payload', async () => {
    await component.submit({
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY'
    });

    expect(storeMock.saveGeneralSettings).toHaveBeenCalledWith({
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      workDays: [1, 2, 3, 4, 5]
    });
  });
});
