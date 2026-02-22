import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { StepperStepConfig, UiStepperComponent } from '../../../shared/components/ui-stepper/ui-stepper.component';
import { OrganizationSetupRebuildStore } from '../data/organization-setup-rebuild.store';
import { OrganizationSetupDraft } from '../data/onboarding-rebuild.models';

type OrganizationDetailsFormGroup = FormGroup<{
  name: FormControl<string>;
  domain: FormControl<string>;
}>;

type DepartmentFormGroup = FormGroup<{
  name: FormControl<string>;
  code: FormControl<string>;
  description: FormControl<string>;
}>;

type DesignationFormGroup = FormGroup<{
  title: FormControl<string>;
  code: FormControl<string>;
  level: FormControl<number | null>;
  description: FormControl<string>;
}>;

type AdminEmployeeFormGroup = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  phone: FormControl<string>;
  departmentIndex: FormControl<number | null>;
  designationIndex: FormControl<number | null>;
}>;

type WizardFormGroup = FormGroup<{
  organization: OrganizationDetailsFormGroup;
  departments: FormArray<DepartmentFormGroup>;
  designations: FormArray<DesignationFormGroup>;
  adminEmployee: AdminEmployeeFormGroup;
}>;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-create-organization-rebuild',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiBadgeComponent, UiButtonComponent, UiStepperComponent],
  template: `
    <main class="h-full overflow-y-auto bg-[radial-gradient(circle_at_14%_9%,_rgba(127,29,29,0.14),_transparent_46%),radial-gradient(circle_at_88%_14%,_rgba(180,83,9,0.10),_transparent_40%),linear-gradient(180deg,_#f8f6f2_0%,_#f3efe8_100%)] px-4 py-8 dark:bg-stone-950 sm:px-6">
      <div class="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section class="min-w-0 rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Onboarding</p>
              <h1 class="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Create Organization</h1>
              <p class="max-w-2xl text-[15px] text-stone-600 dark:text-stone-400">
                Guided workspace setup with multi-step, multi-column editing for structure and admin profile.
              </p>
            </div>
            <a
              routerLink="/pending"
              class="inline-flex items-center gap-2 rounded-[10px] border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-200 dark:hover:bg-white/10"
            >
              Back to Pending
            </a>
          </div>

          @if (store.error()) {
            <div class="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {{ store.error() }}
            </div>
          }

          <form [formGroup]="wizardForm" (ngSubmit)="submit()">
            <ui-stepper #stepper [stepsData]="steps" [showNavigation]="false" (stepChange)="onStepChange($event)" />

            @switch (currentStepIndex()) {
              @case (0) {
                <section class="rounded-2xl border border-stone-200 bg-white/50 p-5 dark:border-white/8 dark:bg-white/[0.02]" [formGroup]="wizardForm.controls.organization">
                  <div class="grid gap-4 md:grid-cols-2">
                    <label class="space-y-1 md:col-span-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Organization Name *</span>
                      <input type="text" formControlName="name" placeholder="Aurum HR" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                    </label>
                    <label class="space-y-1 md:col-span-2">
                      <span class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Email Domain</span>
                      <input type="text" formControlName="domain" placeholder="aurum.dev" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                      <p class="text-xs text-stone-500 dark:text-stone-400">Optional. Used for recommendation matching on pending access.</p>
                    </label>
                  </div>
                </section>
              }
              @case (1) {
                <section class="space-y-4 rounded-2xl border border-stone-200 bg-white/50 p-5 dark:border-white/8 dark:bg-white/[0.02]">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="text-sm text-stone-600 dark:text-stone-400">Add your starter departments.</p>
                    <ui-button type="button" size="sm" variant="secondary" (onClick)="addDepartment()">Add Department</ui-button>
                  </div>
                  <div class="space-y-3" formArrayName="departments">
                    @for (department of departmentsArray.controls; track $index; let i = $index) {
                      <div class="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/8 dark:bg-white/[0.02]" [formGroupName]="i">
                        <div class="mb-3 flex items-center justify-between gap-2">
                          <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">Department {{ i + 1 }}</p>
                          <ui-button type="button" size="sm" variant="ghost" [disabled]="departmentsArray.length <= 1" (onClick)="removeDepartment(i)">Remove</ui-button>
                        </div>
                        <div class="grid gap-3 md:grid-cols-2">
                          <input type="text" formControlName="name" placeholder="Department name" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                          <input type="text" formControlName="code" placeholder="Code (e.g. ENG)" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                          <input type="text" formControlName="description" placeholder="Description (optional)" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm md:col-span-2 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                        </div>
                      </div>
                    }
                  </div>
                </section>
              }
              @case (2) {
                <section class="space-y-4 rounded-2xl border border-stone-200 bg-white/50 p-5 dark:border-white/8 dark:bg-white/[0.02]">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="text-sm text-stone-600 dark:text-stone-400">Add starter designations / job titles.</p>
                    <ui-button type="button" size="sm" variant="secondary" (onClick)="addDesignation()">Add Designation</ui-button>
                  </div>
                  <div class="space-y-3" formArrayName="designations">
                    @for (designation of designationsArray.controls; track $index; let i = $index) {
                      <div class="rounded-2xl border border-stone-200 bg-white p-4 dark:border-white/8 dark:bg-white/[0.02]" [formGroupName]="i">
                        <div class="mb-3 flex items-center justify-between gap-2">
                          <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">Designation {{ i + 1 }}</p>
                          <ui-button type="button" size="sm" variant="ghost" [disabled]="designationsArray.length <= 1" (onClick)="removeDesignation(i)">Remove</ui-button>
                        </div>
                        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          <input type="text" formControlName="title" placeholder="Title" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm md:col-span-2 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                          <input type="text" formControlName="code" placeholder="Code" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                          <input type="number" formControlName="level" placeholder="Level" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                          <input type="text" formControlName="description" placeholder="Description (optional)" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm md:col-span-2 lg:col-span-2 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                        </div>
                      </div>
                    }
                  </div>
                </section>
              }
              @default {
                <section class="space-y-4 rounded-2xl border border-stone-200 bg-white/50 p-5 dark:border-white/8 dark:bg-white/[0.02]" [formGroup]="wizardForm.controls.adminEmployee">
                  <div class="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                    Your current account will become the initial admin after setup completes.
                  </div>
                  <div class="grid gap-4 md:grid-cols-2">
                    <input type="text" formControlName="firstName" placeholder="First name" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                    <input type="text" formControlName="lastName" placeholder="Last name" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                    <input type="tel" formControlName="phone" placeholder="Phone (optional)" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm md:col-span-2 dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100" />
                    <select formControlName="departmentIndex" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100">
                      <option [ngValue]="null">Department (optional)</option>
                      @for (option of departmentOptions(); track option.index) {
                        <option [ngValue]="option.index">{{ option.label }}</option>
                      }
                    </select>
                    <select formControlName="designationIndex" class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm dark:border-white/8 dark:bg-white/[0.03] dark:text-stone-100">
                      <option [ngValue]="null">Designation (optional)</option>
                      @for (option of designationOptions(); track option.index) {
                        <option [ngValue]="option.index">{{ option.label }}</option>
                      }
                    </select>
                  </div>
                </section>
              }
            }

            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-white/8">
              <p class="text-sm text-stone-600 dark:text-stone-400">Step {{ currentStepIndex() + 1 }} of {{ steps.length }}</p>
              <div class="flex flex-wrap gap-2">
                <ui-button type="button" size="sm" variant="secondary" [disabled]="currentStepIndex() === 0 || store.isSaving()" (onClick)="previousStep()">Back</ui-button>
                @if (!isLastStep()) {
                  <ui-button type="button" size="sm" variant="primary" [disabled]="store.isSaving()" (onClick)="nextStep()">Next</ui-button>
                } @else {
                  <ui-button type="submit" size="sm" variant="primary" [loading]="store.isSaving()" [disabled]="store.isSaving()">Create Organization</ui-button>
                }
              </div>
            </div>
          </form>
        </section>

        <aside class="space-y-4">
          <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Setup Summary</h2>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Organization</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ wizardForm.controls.organization.controls.name.value || 'Untitled' }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Domain</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ wizardForm.controls.organization.controls.domain.value || 'None' }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Departments</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ departmentsArray.length }}</dd></div>
              <div class="flex justify-between gap-3"><dt class="text-stone-500 dark:text-stone-400">Designations</dt><dd class="font-medium text-stone-800 dark:text-stone-100">{{ designationsArray.length }}</dd></div>
            </dl>
          </section>

          <section class="rounded-2xl border border-white/[0.55] bg-white/[0.72] p-5 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-white/[0.04]">
            <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100">Admin Account</h2>
            <p class="mt-2 text-sm text-stone-600 dark:text-stone-400">{{ authEmail() || 'No email found' }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <ui-badge size="sm" [rounded]="true" variant="neutral">Role after setup: Admin</ui-badge>
            </div>
          </section>
        </aside>
      </div>
    </main>
  `
})
export class CreateOrganizationRebuildComponent implements OnInit {
  readonly store = inject(OrganizationSetupRebuildStore);
  private readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);

  @ViewChild('stepper') private stepper?: UiStepperComponent;

  readonly currentStepIndex = signal(0);
  readonly authEmail = signal('');

  readonly steps: StepperStepConfig[] = [
    { title: 'Organization', subtitle: 'Name and domain' },
    { title: 'Departments', subtitle: 'Starter structure' },
    { title: 'Designations', subtitle: 'Job titles' },
    { title: 'Admin Profile', subtitle: 'Your employee record' }
  ];

  readonly wizardForm: WizardFormGroup = new FormGroup({
    organization: new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      domain: new FormControl('', { nonNullable: true })
    }),
    departments: new FormArray<DepartmentFormGroup>([this.createDepartmentForm()]),
    designations: new FormArray<DesignationFormGroup>([this.createDesignationForm()]),
    adminEmployee: new FormGroup({
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      phone: new FormControl('', { nonNullable: true }),
      departmentIndex: new FormControl<number | null>(null),
      designationIndex: new FormControl<number | null>(null)
    })
  });

  ngOnInit(): void {
    this.prefillFromSession();
  }

  get departmentsArray(): FormArray<DepartmentFormGroup> {
    return this.wizardForm.controls.departments;
  }

  get designationsArray(): FormArray<DesignationFormGroup> {
    return this.wizardForm.controls.designations;
  }

  onStepChange(index: number): void {
    this.currentStepIndex.set(index);
  }

  addDepartment(): void {
    this.departmentsArray.push(this.createDepartmentForm());
  }

  removeDepartment(index: number): void {
    if (this.departmentsArray.length <= 1) {
      return;
    }
    this.departmentsArray.removeAt(index);
    this.reconcileIndex(this.wizardForm.controls.adminEmployee.controls.departmentIndex, this.departmentsArray.length);
  }

  addDesignation(): void {
    this.designationsArray.push(this.createDesignationForm());
  }

  removeDesignation(index: number): void {
    if (this.designationsArray.length <= 1) {
      return;
    }
    this.designationsArray.removeAt(index);
    this.reconcileIndex(this.wizardForm.controls.adminEmployee.controls.designationIndex, this.designationsArray.length);
  }

  departmentOptions(): Array<{ index: number; label: string }> {
    return this.departmentsArray.controls.map((control, index) => ({
      index,
      label: control.controls.name.value.trim() || `Department ${index + 1}`
    }));
  }

  designationOptions(): Array<{ index: number; label: string }> {
    return this.designationsArray.controls.map((control, index) => ({
      index,
      label: control.controls.title.value.trim() || `Designation ${index + 1}`
    }));
  }

  previousStep(): void {
    this.stepper?.previous();
  }

  nextStep(): void {
    if (!this.isCurrentStepValid()) {
      this.markCurrentStepTouched();
      return;
    }
    this.stepper?.next();
  }

  isLastStep(): boolean {
    return this.currentStepIndex() >= this.steps.length - 1;
  }

  async submit(): Promise<void> {
    if (!this.isLastStep()) {
      this.nextStep();
      return;
    }
    if (!this.isCurrentStepValid() || this.wizardForm.invalid) {
      this.markAllTouched(this.wizardForm);
      return;
    }

    this.store.clearError();
    const created = await this.store.createOrganization(this.buildPayload());
    if (!created) {
      return;
    }
    await this.auth.refreshUser();
    await this.router.navigate(['/dashboard']);
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStepIndex()) {
      case 0:
        return this.wizardForm.controls.organization.valid;
      case 1:
        return this.departmentsArray.length > 0 && this.departmentsArray.controls.every((control) => control.valid);
      case 2:
        return this.designationsArray.length > 0 && this.designationsArray.controls.every((control) => control.valid);
      case 3:
        return this.wizardForm.controls.adminEmployee.valid;
      default:
        return false;
    }
  }

  private createDepartmentForm(): DepartmentFormGroup {
    return new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      description: new FormControl('', { nonNullable: true })
    });
  }

  private createDesignationForm(): DesignationFormGroup {
    return new FormGroup({
      title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      level: new FormControl<number | null>(null),
      description: new FormControl('', { nonNullable: true })
    });
  }

  private prefillFromSession(): void {
    const user = this.auth.user();
    this.authEmail.set(user?.email ?? '');

    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      this.wizardForm.controls.adminEmployee.patchValue({
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ')
      });
    }

    const domain = this.extractBusinessDomain(user?.email ?? '');
    if (domain) {
      this.wizardForm.controls.organization.controls.domain.setValue(domain);
    }
  }

  private extractBusinessDomain(email: string): string | null {
    const parts = email.split('@');
    if (parts.length < 2) {
      return null;
    }
    const domain = parts[1]?.toLowerCase() ?? '';
    if (
      domain.length === 0 ||
      domain.includes('gmail.') ||
      domain.includes('yahoo.') ||
      domain.includes('hotmail.') ||
      domain.includes('outlook.')
    ) {
      return null;
    }
    return domain;
  }

  private reconcileIndex(control: FormControl<number | null>, maxLength: number): void {
    const value = control.value;
    if (value === null) {
      return;
    }
    if (value < 0 || value >= maxLength) {
      control.setValue(null);
    }
  }

  private markCurrentStepTouched(): void {
    switch (this.currentStepIndex()) {
      case 0:
        this.markAllTouched(this.wizardForm.controls.organization);
        break;
      case 1:
        this.markAllTouched(this.departmentsArray);
        break;
      case 2:
        this.markAllTouched(this.designationsArray);
        break;
      case 3:
        this.markAllTouched(this.wizardForm.controls.adminEmployee);
        break;
      default:
        break;
    }
  }

  private markAllTouched(control: AbstractControl): void {
    control.markAsTouched();
    if (control instanceof FormGroup) {
      Object.values(control.controls).forEach((child) => this.markAllTouched(child));
      return;
    }
    if (control instanceof FormArray) {
      control.controls.forEach((child) => this.markAllTouched(child));
    }
  }

  private buildPayload(): OrganizationSetupDraft {
    const organization = this.wizardForm.controls.organization.getRawValue();
    const adminEmployee = this.wizardForm.controls.adminEmployee.getRawValue();

    return {
      organization: {
        name: organization.name.trim(),
        domain: this.normalizeOptional(organization.domain)
      },
      departments: this.departmentsArray.controls.map((control) => {
        const value = control.getRawValue();
        return {
          name: value.name.trim(),
          code: value.code.trim(),
          description: this.normalizeOptional(value.description)
        };
      }),
      designations: this.designationsArray.controls.map((control) => {
        const value = control.getRawValue();
        return {
          title: value.title.trim(),
          code: value.code.trim(),
          level: typeof value.level === 'number' && Number.isFinite(value.level) ? value.level : undefined,
          description: this.normalizeOptional(value.description)
        };
      }),
      adminEmployee: {
        firstName: adminEmployee.firstName.trim(),
        lastName: adminEmployee.lastName.trim(),
        phone: this.normalizeOptional(adminEmployee.phone),
        departmentIndex: adminEmployee.departmentIndex ?? undefined,
        designationIndex: adminEmployee.designationIndex ?? undefined
      }
    };
  }

  private normalizeOptional(value: string | null | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }
}
