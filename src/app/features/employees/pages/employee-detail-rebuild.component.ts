import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { UiBadgeComponent, BadgeVariant } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ConfirmDialogOptions, UiConfirmDialogComponent } from '../../../shared/components/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';
import { RebuildEmployeePayFrequency, RebuildEmployeeRecord } from '../data/employees-rebuild.models';
import { EmployeesRebuildStore } from '../data/employees-rebuild.store';

type EmployeeDetailTab = 'summary' | 'compensation' | 'financial';

type CompensationFormGroup = FormGroup<{
  baseSalary: FormControl<number | null>;
  currency: FormControl<string>;
  payFrequency: FormControl<RebuildEmployeePayFrequency>;
}>;

interface PendingCompensationDraft {
  employeeId: string;
  baseSalary?: number;
  currency?: string;
  payFrequency?: RebuildEmployeePayFrequency;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-employee-detail-rebuild',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    UiBadgeComponent,
    UiButtonComponent,
    UiConfirmDialogComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: ''
})
export class EmployeeDetailRebuildComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthSessionService);
  protected readonly store = inject(EmployeesRebuildStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly employee = this.store.selectedEmployee;
  readonly detailCollections = this.store.detailCollections;
  readonly detailLoading = this.store.detailLoading;
  readonly error = this.store.error;
  readonly storeSaving = this.store.isSaving;
  readonly routeError = signal<string | null>(null);
  readonly currentEmployeeId = signal<string | null>(null);
  readonly activeTab = signal<EmployeeDetailTab>('summary');
  readonly isEditingCompensation = signal(false);
  readonly isCompensationConfirmOpen = signal(false);
  readonly lastCompensationActionMode = signal<'pending' | 'applied' | null>(null);
  readonly viewerRole = computed(() => this.auth.user()?.role ?? 'pending');
  readonly canEditCompensation = computed(() => {
    const role = this.viewerRole();
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager';
  });
  readonly canManageFinancialAdjustments = computed(() => this.canEditCompensation());
  readonly compensationNotice = computed(() => {
    const role = this.viewerRole();
    if (role === 'manager') {
      return 'Manager access is read-only for compensation and financial controls.';
    }
    if (role === 'employee') {
      return 'Employee access is read-only for compensation and financial controls.';
    }
    return null;
  });

  readonly compensationForm: CompensationFormGroup = new FormGroup({
    baseSalary: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    currency: new FormControl<string>('USD', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    payFrequency: new FormControl<RebuildEmployeePayFrequency>('monthly', { nonNullable: true, validators: [Validators.required] })
  });

  readonly compensationConfirmOptions: ConfirmDialogOptions = {
    title: 'Submit Compensation Change',
    message: 'Provide a reason to submit this compensation change for the approval workflow.',
    confirmText: 'Submit',
    cancelText: 'Cancel',
    variant: 'warning',
    reasonRequired: true,
    reasonLabel: 'Change Reason',
    reasonPlaceholder: 'Explain why this compensation change is required'
  };

  private pendingCompensationDraft: PendingCompensationDraft | null = null;

  constructor() {
    effect(() => {
      const employee = this.employee();
      if (!employee || this.isEditingCompensation()) {
        return;
      }
      this.resetCompensationForm(employee);
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id')?.trim() ?? '';
      if (!id) {
        this.currentEmployeeId.set(null);
        this.routeError.set('Employee route is missing an id parameter.');
        return;
      }
      this.routeError.set(null);
      this.currentEmployeeId.set(id);
      void this.store.loadEmployeeDetail(id);
    });
  }

  goToList(): void {
    void this.router.navigate(['/employees']);
  }

  reloadCurrentEmployee(): void {
    const id = this.currentEmployeeId();
    if (!id) {
      return;
    }
    void this.store.loadEmployeeDetail(id);
  }

  setActiveTab(tab: EmployeeDetailTab): void {
    this.activeTab.set(tab);
  }

  startCompensationEdit(): void {
    if (!this.canEditCompensation() || !this.employee()) {
      return;
    }
    this.resetCompensationForm(this.employee()!);
    this.isEditingCompensation.set(true);
    this.lastCompensationActionMode.set(null);
  }

  cancelCompensationEdit(): void {
    const employee = this.employee();
    if (employee) {
      this.resetCompensationForm(employee);
    }
    this.clearPendingCompensationDraft();
    this.isCompensationConfirmOpen.set(false);
    this.isEditingCompensation.set(false);
  }

  openCompensationConfirm(): void {
    if (!this.canEditCompensation() || !this.employee()) {
      return;
    }

    this.compensationForm.markAllAsTouched();
    if (this.compensationForm.invalid) {
      return;
    }

    const formValue = this.compensationForm.getRawValue();
    const salary = formValue.baseSalary;
    if (salary === null) {
      return;
    }

    this.pendingCompensationDraft = {
      employeeId: this.employee()!.id,
      baseSalary: salary,
      currency: formValue.currency,
      payFrequency: formValue.payFrequency
    };
    this.isCompensationConfirmOpen.set(true);
  }

  async confirmCompensationChange(reason: string): Promise<void> {
    if (!this.pendingCompensationDraft) {
      return;
    }

    const result = await this.store.submitCompensationChange({
      ...this.pendingCompensationDraft,
      reason
    });
    this.clearPendingCompensationDraft();
    if (!result) {
      return;
    }

    this.lastCompensationActionMode.set(result.mode);
    this.isEditingCompensation.set(false);
  }

  setCompensationConfirmOpen(isOpen: boolean): void {
    this.isCompensationConfirmOpen.set(isOpen);
    if (!isOpen) {
      this.clearPendingCompensationDraft();
    }
  }

  clearPendingCompensationDraft(): void {
    this.pendingCompensationDraft = null;
  }

  statusVariant(status: string): BadgeVariant {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'active') {
      return 'success';
    }
    if (normalized === 'on-leave') {
      return 'warning';
    }
    if (normalized === 'resigned' || normalized === 'terminated') {
      return 'danger';
    }
    return 'neutral';
  }

  formattedSalary(): string {
    const employee = this.employee();
    if (!employee || employee.baseSalary === undefined) {
      return 'Not set';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: employee.currency || 'USD'
    }).format(employee.baseSalary);
  }

  formattedPayFrequency(): string {
    const payFrequency = this.employee()?.payFrequency;
    if (payFrequency === 'monthly') {
      return 'Monthly';
    }
    if (payFrequency === 'bi_weekly') {
      return 'Bi-Weekly';
    }
    if (payFrequency === 'weekly') {
      return 'Weekly';
    }
    return 'Not set';
  }

  private resetCompensationForm(employee: RebuildEmployeeRecord): void {
    this.compensationForm.reset(
      {
        baseSalary: employee.baseSalary ?? null,
        currency: employee.currency || 'USD',
        payFrequency: employee.payFrequency || 'monthly'
      },
      { emitEvent: false }
    );
  }
}
