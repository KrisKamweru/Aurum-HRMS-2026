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
  template: ''
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
