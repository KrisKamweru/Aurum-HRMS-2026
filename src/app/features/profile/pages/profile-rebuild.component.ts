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
  template: `
    <main class="h-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-6xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Account</p>
          <h1 class="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Profile</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Manage your personal employee profile and contact details.
          </p>
        </header>

        @if (store.error()) {
          <section class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {{ store.error() }}
          </section>
        }

        @if (store.isLoading()) {
          <section class="grid gap-4 md:grid-cols-3">
            <div class="h-40 animate-pulse rounded-2xl border border-stone-200 bg-white/70 dark:border-white/8 dark:bg-white/[0.04]"></div>
            <div class="h-40 animate-pulse rounded-2xl border border-stone-200 bg-white/70 md:col-span-2 dark:border-white/8 dark:bg-white/[0.04]"></div>
          </section>
        } @else if (store.profile(); as profile) {
          <section class="grid gap-4 lg:grid-cols-[minmax(0,320px)_1fr]">
            <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
              <div class="flex flex-col items-center text-center">
                <div class="flex h-20 w-20 items-center justify-center rounded-full border border-white/60 bg-gradient-to-br from-burgundy-100 to-stone-100 text-xl font-semibold text-burgundy-700 dark:border-white/10 dark:from-burgundy-700/20 dark:to-white/5 dark:text-burgundy-300">
                  {{ initials(profile.firstName, profile.lastName) }}
                </div>
                <h2 class="mt-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
                  {{ profile.firstName }} {{ profile.lastName }}
                </h2>
                <p class="text-sm text-stone-600 dark:text-stone-400">{{ profile.position || 'Unassigned position' }}</p>
                <p class="mt-2 rounded-full border border-burgundy-200 bg-burgundy-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:border-burgundy-500/30 dark:bg-burgundy-700/10 dark:text-burgundy-300">
                  {{ profile.user.role }}
                </p>
              </div>

              <dl class="mt-6 space-y-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Department</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ profile.department || 'n/a' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Location</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ profile.location || 'n/a' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Manager</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ profile.managerName || 'n/a' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Start Date</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ profile.startDate | date: 'mediumDate' }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-stone-500 dark:text-stone-400">Tenure</dt>
                  <dd class="font-medium text-stone-800 dark:text-stone-100">{{ profile.tenure || 'n/a' }}</dd>
                </div>
              </dl>
            </article>

            <div class="space-y-4">
              <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Personal Information</h3>
                    <p class="text-sm text-stone-600 dark:text-stone-400">Contact details and personal identifiers used in HR workflows.</p>
                  </div>
                  <button
                    type="button"
                    class="rounded-[10px] bg-burgundy-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-burgundy-600 disabled:opacity-60"
                    [disabled]="store.isSaving()"
                    (click)="openEditModal()"
                  >
                    Edit Profile
                  </button>
                </div>

                <dl class="mt-5 grid gap-4 md:grid-cols-2">
                  <div class="space-y-1">
                    <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Email</dt>
                    <dd class="text-sm font-medium text-stone-800 dark:text-stone-100">{{ profile.email }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Phone</dt>
                    <dd class="text-sm font-medium text-stone-800 dark:text-stone-100">{{ profile.phone || 'Not set' }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Gender</dt>
                    <dd class="text-sm font-medium capitalize text-stone-800 dark:text-stone-100">{{ profile.gender || 'Not set' }}</dd>
                  </div>
                  <div class="space-y-1">
                    <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Date of Birth</dt>
                    <dd class="text-sm font-medium text-stone-800 dark:text-stone-100">{{ formatOptionalDate(profile.dob) }}</dd>
                  </div>
                  <div class="space-y-1 md:col-span-2">
                    <dt class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Address</dt>
                    <dd class="text-sm font-medium text-stone-800 dark:text-stone-100">{{ profile.address || 'Not set' }}</dd>
                  </div>
                </dl>
              </article>

              <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Account Preferences</h3>
                <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Display and leave-policy administration now live under the rebuilt settings module.
                </p>
                <div class="mt-4 flex flex-wrap gap-2">
                  <a
                    routerLink="/settings/general"
                    class="rounded-[10px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10"
                  >
                    General Settings
                  </a>
                  <a
                    routerLink="/settings/leave-policies"
                    class="rounded-[10px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10"
                  >
                    Leave Policies
                  </a>
                </div>
              </article>
            </div>
          </section>
        } @else {
          <section class="rounded-2xl border border-stone-200 bg-white/[0.72] p-6 text-sm text-stone-700 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04] dark:text-stone-300">
            No employee profile is linked to this account yet.
          </section>
        }
      </div>

      <ui-modal
        title="Edit Profile"
        width="normal"
        [isOpen]="isEditModalOpen()"
        [hasFooter]="false"
        (isOpenChange)="isEditModalOpen.set($event)"
      >
        <app-dynamic-form
          container="modal"
          [fields]="editFields"
          [sections]="editSections"
          [steps]="editSteps"
          [initialValues]="editInitialValues()"
          [loading]="store.isSaving()"
          [showCancel]="true"
          submitLabel="Save Changes"
          (cancel)="closeEditModal()"
          (formSubmit)="submitEdit($event)"
        />
      </ui-modal>
    </main>
  `
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
