import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { ProfileRebuildStore } from '../data/profile-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-profile-rebuild',
  imports: [CommonModule, RouterLink, UiModalComponent, DynamicFormComponent],
  providers: [DatePipe],
  template: ''
})
export class ProfileRebuildComponent implements OnInit {
  private readonly datePipe = inject(DatePipe);
  readonly store = inject(ProfileRebuildStore);

  readonly isEditModalOpen = signal(false);
  readonly editInitialValues = signal<Record<string, unknown>>({});
  readonly profile = computed(() => this.store.profile());

  readonly editFields: FieldConfig[] = [
    { name: 'phone', label: 'Phone Number', type: 'text', sectionId: 'contact', placeholder: '+1 555 555 5555' },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      sectionId: 'personal',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' },
        { label: 'Prefer not to say', value: 'prefer-not-to-say' }
      ]
    },
    { name: 'dob', label: 'Date of Birth', type: 'date', sectionId: 'personal' },
    { name: 'address', label: 'Address', type: 'textarea', sectionId: 'contact', colSpan: 2 }
  ];

  readonly editSections: FormSectionConfig[] = [
    {
      id: 'personal',
      title: 'Personal',
      description: 'Identity details used in self-service and HR records.',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'contact',
      title: 'Contact',
      description: 'Reachability and mailing information.',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly editSteps: FormStepConfig[] = [
    { id: 'profile-personal', title: 'Personal', sectionIds: ['personal'] },
    { id: 'profile-contact', title: 'Contact', sectionIds: ['contact'] }
  ];

  ngOnInit(): void {
    void this.store.load();
  }

  openEditModal(): void {
    const profile = this.store.profile();
    if (!profile) {
      return;
    }
    this.store.clearError();
    this.editInitialValues.set({
      phone: profile.phone ?? '',
      gender: profile.gender ?? '',
      dob: profile.dob ?? '',
      address: profile.address ?? ''
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  async submitEdit(payload: Record<string, unknown>): Promise<void> {
    const saved = await this.store.save({
      phone: this.readText(payload, 'phone'),
      gender: this.readText(payload, 'gender'),
      dob: this.readText(payload, 'dob'),
      address: this.readText(payload, 'address')
    });
    if (saved) {
      this.isEditModalOpen.set(false);
    }
  }

  initials(firstName: string, lastName: string): string {
    const first = firstName.trim().charAt(0).toUpperCase();
    const last = lastName.trim().charAt(0).toUpperCase();
    return `${first}${last}`.trim() || 'AU';
  }

  formatOptionalDate(value: string | undefined): string {
    if (!value) {
      return 'Not set';
    }
    return this.datePipe.transform(value, 'mediumDate') ?? 'Not set';
  }

  private readText(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];
    return typeof value === 'string' ? value : undefined;
  }
}
