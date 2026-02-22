import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ProfileRebuildStore } from '../data/profile-rebuild.store';
import { ProfileRebuildComponent } from './profile-rebuild.component';

describe('ProfileRebuildComponent', () => {
  let fixture: ComponentFixture<ProfileRebuildComponent>;
  let component: ProfileRebuildComponent;
  let storeMock: Pick<ProfileRebuildStore, 'profile' | 'isLoading' | 'isSaving' | 'error' | 'load' | 'save' | 'clearError'>;

  beforeEach(async () => {
    storeMock = {
      profile: signal({
        id: 'emp-1',
        firstName: 'Amina',
        lastName: 'Otieno',
        email: 'amina@aurum.dev',
        startDate: '2025-01-01',
        status: 'active',
        tenure: '1y',
        user: { name: 'Amina', email: 'amina@aurum.dev', role: 'employee' }
      }).asReadonly(),
      isLoading: signal(false).asReadonly(),
      isSaving: signal(false).asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      load: vi.fn(async () => {}),
      save: vi.fn(async () => true),
      clearError: vi.fn(() => {})
    };

    await TestBed.configureTestingModule({
      imports: [ProfileRebuildComponent],
      providers: [provideRouter([]), { provide: ProfileRebuildStore, useValue: storeMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads profile on init', () => {
    expect(storeMock.load).toHaveBeenCalledTimes(1);
  });

  it('opens edit modal and seeds initial values from profile', () => {
    component.openEditModal();

    expect(storeMock.clearError).toHaveBeenCalled();
    expect(component.isEditModalOpen()).toBe(true);
    expect(component.editInitialValues()['phone']).toBe('');
  });

  it('submits edit payload through store and closes modal on success', async () => {
    component.isEditModalOpen.set(true);
    await component.submitEdit({
      phone: '+254700000001',
      address: 'Nairobi',
      gender: 'female',
      dob: '1995-01-01'
    });

    expect(storeMock.save).toHaveBeenCalledWith({
      phone: '+254700000001',
      address: 'Nairobi',
      gender: 'female',
      dob: '1995-01-01'
    });
    expect(component.isEditModalOpen()).toBe(false);
  });
});
