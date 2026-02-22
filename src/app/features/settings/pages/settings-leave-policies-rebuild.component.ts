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
  template: ''
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
