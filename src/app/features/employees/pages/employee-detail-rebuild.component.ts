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
  template: `
    <main class="h-full px-4 py-8 sm:px-6 lg:px-8">
      <section class="mb-6 flex items-center justify-between gap-3">
        <ui-button variant="outline" size="sm" (onClick)="goToList()">Back to Employees</ui-button>
        @if (currentEmployeeId()) {
          <p class="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Employee ID: {{ currentEmployeeId() }}
          </p>
        }
      </section>

      @if (routeError()) {
        <section class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          {{ routeError() }}
        </section>
      } @else if (detailLoading()) {
        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="space-y-3">
            <div class="h-5 w-52 animate-pulse rounded bg-stone-200 dark:bg-white/10"></div>
            <div class="h-32 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5"></div>
          </div>
        </section>
      } @else if (error()) {
        <section class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700/30 dark:bg-red-900/20 dark:text-red-300">
          <p>{{ error() }}</p>
          <ui-button class="mt-3" variant="outline" size="sm" (onClick)="reloadCurrentEmployee()">Retry</ui-button>
        </section>
      } @else if (employee()) {
        <section class="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div class="space-y-2">
            <h1 class="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{{ employee()!.fullName }}</h1>
            <p class="text-[15px] text-stone-600 dark:text-stone-400">{{ employee()!.email }}</p>
            <div class="flex flex-wrap items-center gap-2">
              <ui-badge [rounded]="true" size="sm" [variant]="statusVariant(employee()!.status)">
                {{ employee()!.status }}
              </ui-badge>
              <ui-badge [rounded]="true" size="sm" variant="neutral">
                {{ employee()!.department || 'No department' }}
              </ui-badge>
              <ui-badge [rounded]="true" size="sm" variant="neutral">
                {{ employee()!.position || 'No designation' }}
              </ui-badge>
            </div>
          </div>
        </section>

        <section class="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
          <div class="flex flex-wrap gap-2">
            <ui-button
              size="sm"
              [variant]="activeTab() === 'summary' ? 'primary' : 'outline'"
              (onClick)="setActiveTab('summary')"
            >
              Summary
            </ui-button>
            <ui-button
              size="sm"
              [variant]="activeTab() === 'compensation' ? 'primary' : 'outline'"
              (onClick)="setActiveTab('compensation')"
            >
              Compensation
            </ui-button>
            <ui-button
              size="sm"
              [variant]="activeTab() === 'financial' ? 'primary' : 'outline'"
              (onClick)="setActiveTab('financial')"
            >
              Financial
            </ui-button>
          </div>
          @if (compensationNotice()) {
            <p class="mt-3 text-sm text-stone-600 dark:text-stone-400">{{ compensationNotice() }}</p>
          }
        </section>

        @if (activeTab() === 'compensation') {
          <section class="mb-6">
            <ui-grid columns="minmax(0, 1.6fr) minmax(0, 1fr)" gap="1rem">
              <ui-grid-tile title="Compensation Details" variant="glass">
                <div class="p-5">
                  @if (isEditingCompensation()) {
                    <form [formGroup]="compensationForm" class="space-y-4" (ngSubmit)="openCompensationConfirm()">
                      <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-1 md:col-span-2">
                          <label for="base-salary" class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Base Salary
                          </label>
                          <input
                            id="base-salary"
                            type="number"
                            min="0"
                            formControlName="baseSalary"
                            class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100"
                          />
                        </div>

                        <div class="space-y-1">
                          <label for="comp-currency" class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Currency
                          </label>
                          <select
                            id="comp-currency"
                            formControlName="currency"
                            class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100"
                          >
                            <option value="USD">USD</option>
                            <option value="KES">KES</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>

                        <div class="space-y-1">
                          <label for="comp-frequency" class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            Pay Frequency
                          </label>
                          <select
                            id="comp-frequency"
                            formControlName="payFrequency"
                            class="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="bi_weekly">Bi-Weekly</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>
                      </div>

                      <div class="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          class="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
                          (click)="cancelCompensationEdit()"
                        >
                          Cancel
                        </button>
                        <ui-button type="submit" [loading]="storeSaving()" [disabled]="compensationForm.invalid">Save Changes</ui-button>
                      </div>
                    </form>
                  } @else {
                    <dl class="space-y-3 text-sm">
                      <div class="flex items-center justify-between gap-4">
                        <dt class="text-stone-500 dark:text-stone-400">Base Salary</dt>
                        <dd class="font-medium text-stone-800 dark:text-stone-200">{{ formattedSalary() }}</dd>
                      </div>
                      <div class="flex items-center justify-between gap-4">
                        <dt class="text-stone-500 dark:text-stone-400">Currency</dt>
                        <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.currency || 'Not set' }}</dd>
                      </div>
                      <div class="flex items-center justify-between gap-4">
                        <dt class="text-stone-500 dark:text-stone-400">Pay Frequency</dt>
                        <dd class="font-medium text-stone-800 dark:text-stone-200">{{ formattedPayFrequency() }}</dd>
                      </div>
                    </dl>
                    @if (canEditCompensation()) {
                      <div class="mt-4 flex justify-end">
                        <ui-button size="sm" (onClick)="startCompensationEdit()">Edit</ui-button>
                      </div>
                    }
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Approval Workflow" variant="glass">
                <div class="space-y-3 p-5 text-sm">
                  <p class="text-stone-700 dark:text-stone-300">
                    Compensation changes follow a dual-control approval flow for non-super-admin payroll roles.
                  </p>
                  <div class="rounded-xl border border-stone-200 bg-white/80 p-3 text-stone-700 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-300">
                    @if (lastCompensationActionMode() === 'pending') {
                      Change submitted for approval.
                    } @else if (lastCompensationActionMode() === 'applied') {
                      Change applied immediately.
                    } @else {
                      No recent compensation change submitted in this session.
                    }
                  </div>
                  <p class="text-xs text-stone-500 dark:text-stone-400">
                    Managers can review pending requests in payroll controls but cannot edit compensation directly.
                  </p>
                </div>
              </ui-grid-tile>
            </ui-grid>
          </section>
        }

        @if (activeTab() === 'financial') {
          <section class="mb-6">
            <ui-grid columns="repeat(2, minmax(0, 1fr))" gap="1rem">
              <ui-grid-tile title="Allowances" variant="glass">
                <div class="space-y-3 p-5 text-sm">
                  <p class="text-stone-600 dark:text-stone-400">
                    Financial line-item editing will be restored in a dedicated payroll-linked editor. Current rebuild keeps this read-safe.
                  </p>
                  @if (canManageFinancialAdjustments()) {
                    <div class="flex justify-end">
                      <ui-button size="sm" variant="outline" [disabled]="true">Add</ui-button>
                    </div>
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Deductions" variant="glass">
                <div class="space-y-3 p-5 text-sm">
                  <p class="text-stone-600 dark:text-stone-400">
                    Deduction configuration remains controlled via payroll-sensitive workflows during rebuild cutover.
                  </p>
                  @if (canManageFinancialAdjustments()) {
                    <div class="flex justify-end">
                      <ui-button size="sm" variant="outline" [disabled]="true">Add</ui-button>
                    </div>
                  }
                </div>
              </ui-grid-tile>
            </ui-grid>
          </section>
        }

        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Professional</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Start Date</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.startDate | date: 'mediumDate' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Manager</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.managerName || 'Unassigned' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Location</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.location || 'Unassigned' }}</dd>
              </div>
            </dl>
          </article>

          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Personal</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Phone</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.phone || 'Not set' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Gender</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.gender || 'Not set' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">DOB</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">
                  @if (employee()!.dob) {
                    {{ employee()!.dob | date: 'mediumDate' }}
                  } @else {
                    Not set
                  }
                </dd>
              </div>
            </dl>
          </article>

          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Compensation</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Base Salary</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ formattedSalary() }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Currency</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ employee()!.currency || 'Not set' }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt class="text-stone-500 dark:text-stone-400">Pay Frequency</dt>
                <dd class="font-medium text-stone-800 dark:text-stone-200">{{ formattedPayFrequency() }}</dd>
              </div>
            </dl>
          </article>

          <article class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/[0.04] md:col-span-2 xl:col-span-3">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Profile Data Domains</h2>
            <p class="mt-1 text-sm text-stone-600 dark:text-stone-400">
              These counts track parity-critical employee detail modules while deeper interaction flows are rebuilt.
            </p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Emergency Contacts</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().emergencyContacts }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Banking</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().bankingRecords }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Education</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().educationRecords }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Documents</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">{{ detailCollections().documents }}</p>
              </div>
              <div class="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-white/8 dark:bg-white/[0.03]">
                <p class="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">Statutory Profile</p>
                <p class="mt-1 text-lg font-semibold text-stone-900 dark:text-stone-100">
                  {{ detailCollections().hasStatutoryInfo ? 'Present' : 'Missing' }}
                </p>
              </div>
            </div>
          </article>
        </section>
      }
    </main>

    <ui-confirm-dialog
      [isOpen]="isCompensationConfirmOpen()"
      [options]="compensationConfirmOptions"
      (isOpenChange)="setCompensationConfirmOpen($event)"
      (cancel)="clearPendingCompensationDraft()"
      (confirm)="confirmCompensationChange($event)"
    />
  `
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
