import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { TableColumn, UiDataTableComponent } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { RebuildAccrualFrequency, RebuildLeavePolicyType } from '../data/settings-rebuild.models';
import { SettingsRebuildStore } from '../data/settings-rebuild.store';

type ConfirmAction = 'none' | 'delete' | 'seed';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-leave-policies-rebuild',
  imports: [UiDataTableComponent, UiModalComponent, DynamicFormComponent, UiConfirmDialogComponent],
  template: `
    <main class="h-full overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-6xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Settings</p>
          <h1 class="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Leave Policies</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Maintain leave policy catalog, accrual cadence, and entitlement defaults for the organization.
          </p>
        </header>

        @if (store.error()) {
          <section class="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {{ store.error() }}
          </section>
        }

        <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm text-stone-600 dark:text-stone-400">Select a row to edit or delete a policy. Create and edit flows use the rebuilt multi-step form modal.</p>
              <p class="mt-1 text-xs text-stone-500 dark:text-stone-500">{{ store.leavePolicies().length }} policies loaded</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-[10px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10" [disabled]="store.policiesLoading() || store.isSaving()" (click)="refresh()">Refresh</button>
              <button type="button" class="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15" [disabled]="store.isSeeding() || store.isSaving()" (click)="openSeedConfirm()">{{ store.isSeeding() ? 'Seeding…' : 'Seed Defaults' }}</button>
              <button type="button" class="rounded-[10px] bg-burgundy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-burgundy-600 disabled:opacity-60" [disabled]="store.isSaving()" (click)="openCreateModal()">Add Policy</button>
            </div>
          </div>
        </section>

        <section class="grid gap-4 lg:grid-cols-[1fr_320px]">
          <article class="min-w-0 rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
            <ui-data-table [data]="store.leavePolicies()" [columns]="columns" [loading]="store.policiesLoading()" headerVariant="neutral" (rowClick)="onRowClick($event)" />
          </article>

          <aside class="space-y-4">
            <article class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
              <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Selected Policy</h2>
              @if (selectedPolicy(); as policy) {
                <dl class="mt-3 space-y-2 text-sm">
                  <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Name</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ policy.name }}</dd></div>
                  <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Code</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ policy.code }}</dd></div>
                  <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Type</dt><dd class="font-medium capitalize text-stone-800 dark:text-stone-100">{{ policy.type }}</dd></div>
                  <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Days / Year</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ policy.daysPerYear }}</dd></div>
                  <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Status</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ policy.isActive ? 'Active' : 'Inactive' }}</dd></div>
                </dl>
                <div class="mt-4 grid gap-2">
                  <button type="button" class="rounded-[10px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10" [disabled]="store.isSaving()" (click)="openEditModal()">Edit Selected</button>
                  <button type="button" class="rounded-[10px] border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15" [disabled]="store.isSaving()" (click)="openDeleteConfirm()">Delete Selected</button>
                </div>
              } @else {
                <p class="mt-3 text-sm text-stone-600 dark:text-stone-400">Select a policy row to inspect and manage it.</p>
              }
            </article>
          </aside>
        </section>
      </div>

      <ui-modal [isOpen]="isEditorOpen()" (isOpenChange)="isEditorOpen.set($event)" [hasFooter]="false" width="normal" [title]="editorMode() === 'create' ? 'Create Leave Policy' : 'Edit Leave Policy'">
        <app-dynamic-form
          container="modal"
          [fields]="formFields"
          [sections]="formSections"
          [steps]="formSteps"
          [initialValues]="formInitialValues()"
          [loading]="store.isSaving()"
          [showCancel]="true"
          [submitLabel]="editorMode() === 'create' ? 'Create Policy' : 'Save Policy'"
          (cancel)="closeEditor()"
          (formSubmit)="submitPolicy($event)"
        />
      </ui-modal>

      <ui-confirm-dialog [isOpen]="isConfirmOpen()" (isOpenChange)="isConfirmOpen.set($event)" [options]="confirmOptions()" (confirm)="handleConfirm()" />
    </main>
  `
})
export class SettingsLeavePoliciesRebuildComponent implements OnInit {
  readonly store = inject(SettingsRebuildStore);

  readonly selectedPolicyId = signal<string | null>(null);
  readonly isEditorOpen = signal(false);
  readonly editorMode = signal<'create' | 'edit'>('create');
  readonly editingPolicyId = signal<string | null>(null);
  readonly formInitialValues = signal<Record<string, unknown>>({});

  readonly isConfirmOpen = signal(false);
  readonly confirmAction = signal<ConfirmAction>('none');
  readonly confirmOptions = signal<ConfirmDialogOptions>({
    title: 'Confirm',
    message: 'Continue?',
    variant: 'info'
  });

  readonly selectedPolicy = computed(() => {
    const id = this.selectedPolicyId();
    return this.store.leavePolicies().find((policy) => policy.id === id) ?? null;
  });

  readonly columns: TableColumn[] = [
    { key: 'name', header: 'Policy', sortable: true },
    { key: 'code', header: 'Code', sortable: true },
    { key: 'type', header: 'Type', sortable: true, formatter: (value) => this.startCase(value) },
    { key: 'daysPerYear', header: 'Days / Year', sortable: true },
    { key: 'accrualFrequency', header: 'Accrual', sortable: true, formatter: (value) => this.startCase(value) },
    {
      key: 'isActive',
      header: 'Status',
      type: 'badge',
      formatter: (value) => (value === false ? 'Inactive' : 'Active'),
      badgeVariant: (value) => (value === false ? 'neutral' : 'success')
    }
  ];

  readonly formFields: FieldConfig[] = [
    { name: 'name', label: 'Policy Name', type: 'text', required: true, sectionId: 'identity', colSpan: 2 },
    { name: 'code', label: 'Code', type: 'text', required: true, sectionId: 'identity' },
    {
      name: 'type',
      label: 'Leave Type',
      type: 'select',
      required: true,
      sectionId: 'identity',
      options: [
        { label: 'Vacation', value: 'vacation' },
        { label: 'Sick', value: 'sick' },
        { label: 'Personal', value: 'personal' },
        { label: 'Maternity', value: 'maternity' },
        { label: 'Paternity', value: 'paternity' },
        { label: 'Other', value: 'other' }
      ]
    },
    { name: 'daysPerYear', label: 'Days Per Year', type: 'number', required: true, sectionId: 'rules' },
    {
      name: 'accrualFrequency',
      label: 'Accrual Frequency',
      type: 'select',
      required: true,
      sectionId: 'rules',
      options: [
        { label: 'Annual', value: 'annual' },
        { label: 'Monthly', value: 'monthly' }
      ]
    },
    { name: 'carryOverDays', label: 'Carry Over Days', type: 'number', sectionId: 'rules' },
    { name: 'isActive', label: 'Active', type: 'checkbox', sectionId: 'rules', hint: 'Policy is available for use' },
    { name: 'description', label: 'Description', type: 'textarea', sectionId: 'notes', colSpan: 2 }
  ];

  readonly formSections: FormSectionConfig[] = [
    { id: 'identity', title: 'Identity', description: 'Name, code, and leave category.', columns: { base: 1, md: 2, lg: 2 } },
    { id: 'rules', title: 'Entitlements', description: 'Accrual and yearly entitlement rules.', columns: { base: 1, md: 2, lg: 2 } },
    { id: 'notes', title: 'Notes', description: 'Optional usage notes for admins.', columns: { base: 1, md: 2, lg: 2 } }
  ];

  readonly formSteps: FormStepConfig[] = [
    { id: 'policy-identity', title: 'Identity', sectionIds: ['identity'] },
    { id: 'policy-rules', title: 'Entitlements', sectionIds: ['rules'] },
    { id: 'policy-notes', title: 'Notes', sectionIds: ['notes'] }
  ];

  ngOnInit(): void {
    void this.store.loadLeavePolicies();
  }

  async refresh(): Promise<void> {
    await this.store.loadLeavePolicies();
  }

  onRowClick(row: Record<string, unknown>): void {
    const id = row['id'];
    if (typeof id === 'string') {
      this.selectedPolicyId.set(id);
    }
  }

  openCreateModal(): void {
    this.editorMode.set('create');
    this.editingPolicyId.set(null);
    this.formInitialValues.set({
      type: 'vacation',
      accrualFrequency: 'annual',
      isActive: true,
      daysPerYear: 0
    });
    this.isEditorOpen.set(true);
  }

  openEditModal(): void {
    const selected = this.selectedPolicy();
    if (!selected) {
      return;
    }
    this.editorMode.set('edit');
    this.editingPolicyId.set(selected.id);
    this.formInitialValues.set({
      name: selected.name,
      code: selected.code,
      type: selected.type,
      daysPerYear: selected.daysPerYear,
      accrualFrequency: selected.accrualFrequency,
      carryOverDays: selected.carryOverDays ?? '',
      description: selected.description ?? '',
      isActive: selected.isActive
    });
    this.isEditorOpen.set(true);
  }

  closeEditor(): void {
    this.isEditorOpen.set(false);
  }

  openDeleteConfirm(): void {
    const selected = this.selectedPolicy();
    if (!selected) {
      return;
    }
    this.confirmAction.set('delete');
    this.confirmOptions.set({
      title: 'Delete Leave Policy',
      message: `Delete "${selected.name}" (${selected.code})? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    this.isConfirmOpen.set(true);
  }

  openSeedConfirm(): void {
    this.confirmAction.set('seed');
    this.confirmOptions.set({
      title: 'Seed Default Leave Policies',
      message: 'Create any missing default leave policies for this organization.',
      confirmText: 'Seed Defaults',
      cancelText: 'Cancel',
      variant: 'warning'
    });
    this.isConfirmOpen.set(true);
  }

  async handleConfirm(): Promise<void> {
    const action = this.confirmAction();
    this.confirmAction.set('none');
    this.isConfirmOpen.set(false);
    if (action === 'delete') {
      const selected = this.selectedPolicy();
      if (selected) {
        const deleted = await this.store.deleteLeavePolicy(selected.id);
        if (deleted) {
          this.selectedPolicyId.set(null);
        }
      }
      return;
    }
    if (action === 'seed') {
      await this.store.seedDefaults();
    }
  }

  async submitPolicy(payload: Record<string, unknown>): Promise<void> {
    if (this.editorMode() === 'create') {
      const created = await this.store.createLeavePolicy({
        name: this.readText(payload, 'name'),
        code: this.readText(payload, 'code'),
        type: this.readPolicyType(payload['type']),
        daysPerYear: this.readNumber(payload['daysPerYear']),
        accrualFrequency: this.readAccrual(payload['accrualFrequency']),
        carryOverDays: this.readOptionalNumber(payload['carryOverDays']),
        description: this.readOptionalText(payload, 'description')
      });
      if (created) {
        this.closeEditor();
      }
      return;
    }

    const id = this.editingPolicyId();
    if (!id) {
      return;
    }
    const updated = await this.store.updateLeavePolicy({
      id,
      name: this.readText(payload, 'name'),
      daysPerYear: this.readNumber(payload['daysPerYear']),
      accrualFrequency: this.readAccrual(payload['accrualFrequency']),
      carryOverDays: this.readOptionalNumber(payload['carryOverDays']),
      description: this.readOptionalText(payload, 'description'),
      isActive: payload['isActive'] !== false
    });
    if (updated) {
      this.closeEditor();
    }
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  private readOptionalText(payload: Record<string, unknown>, key: string): string | undefined {
    const value = this.readText(payload, key).trim();
    return value.length > 0 ? value : undefined;
  }

  private readNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private readOptionalNumber(value: unknown): number | undefined {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private readPolicyType(value: unknown): RebuildLeavePolicyType {
    if (
      value === 'vacation' ||
      value === 'sick' ||
      value === 'personal' ||
      value === 'maternity' ||
      value === 'paternity' ||
      value === 'other'
    ) {
      return value;
    }
    return 'other';
  }

  private readAccrual(value: unknown): RebuildAccrualFrequency {
    return value === 'monthly' ? 'monthly' : 'annual';
  }

  private startCase(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
