import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiFormFieldComponent } from '../../shared/components/ui-form-field/ui-form-field.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { api } from '../../../../convex/_generated/api';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-org-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    UiButtonComponent,
    UiIconComponent,
    UiFormFieldComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="min-h-screen bg-stone-50 py-8 px-4">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8b1e3f] to-[#3f0d1c] mb-4 shadow-lg shadow-[#8b1e3f]/20">
            <span class="text-2xl font-bold text-white tracking-tighter">Ah</span>
          </div>
          <h1 class="text-2xl font-bold text-stone-900">Create Your Organization</h1>
          <p class="text-stone-500 mt-1">Set up your organization in a few simple steps</p>
        </div>

        <!-- Step Indicators -->
        <div class="flex items-center justify-center mb-8">
          @for (step of steps; track step.id; let i = $index) {
            <div class="flex items-center">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all"
                [class.bg-[#8b1e3f]]="i < currentStep()"
                [class.border-[#8b1e3f]]="i <= currentStep()"
                [class.text-white]="i < currentStep()"
                [class.text-[#8b1e3f]]="i === currentStep()"
                [class.border-stone-300]="i > currentStep()"
                [class.text-stone-400]="i > currentStep()"
              >
                @if (i < currentStep()) {
                  <ui-icon name="check" class="w-5 h-5"></ui-icon>
                } @else {
                  <span class="font-semibold">{{ i + 1 }}</span>
                }
              </div>
              @if (i < steps.length - 1) {
                <div
                  class="w-16 h-0.5 mx-2 transition-all"
                  [class.bg-[#8b1e3f]]="i < currentStep()"
                  [class.bg-stone-300]="i >= currentStep()"
                ></div>
              }
            </div>
          }
        </div>

        <!-- Step Title -->
        <div class="text-center mb-6">
          <h2 class="text-lg font-semibold text-stone-900">{{ steps[currentStep()].title }}</h2>
          <p class="text-sm text-stone-500">{{ steps[currentStep()].description }}</p>
        </div>

        <!-- Step Content -->
        <div class="dash-frame">
          <ui-grid [columns]="'1fr'" [gap]="'0px'">
            <ui-grid-tile title="Organization Setup" variant="compact">
              <div class="tile-body">
                <form [formGroup]="wizardForm">
            <!-- Step 1: Organization Details -->
            @if (currentStep() === 0) {
              <div class="space-y-4" formGroupName="organization">
                <ui-form-field
                  label="Organization Name"
                  [control]="wizardForm.get('organization.name')"
                  id="orgName"
                  [required]="true"
                >
                  <input
                    type="text"
                    id="orgName"
                    formControlName="name"
                    placeholder="e.g., Acme Corporation"
                    class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
                  />
                </ui-form-field>

                <ui-form-field
                  label="Email Domain"
                  [control]="wizardForm.get('organization.domain')"
                  id="orgDomain"
                  hint="Users with this email domain will see your org as suggested"
                >
                  <div class="flex items-center">
                    <span class="text-stone-400 mr-2">@</span>
                    <input
                      type="text"
                      id="orgDomain"
                      formControlName="domain"
                      placeholder="e.g., acme.com"
                      class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
                    />
                  </div>
                </ui-form-field>
              </div>
            }

            <!-- Step 2: Departments -->
            @if (currentStep() === 1) {
              <div class="space-y-4" formArrayName="departments">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-stone-500">Add your organization's departments</span>
                  <ui-button variant="secondary" size="sm" (onClick)="addDepartment()">
                    <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon>
                    Add
                  </ui-button>
                </div>

                @for (dept of departmentsArray.controls; track $index; let i = $index) {
                  <div class="p-4 rounded-xl border border-stone-200 bg-stone-50/30 space-y-3" [formGroupName]="i">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-stone-700">Department {{ i + 1 }}</span>
                      @if (departmentsArray.length > 1) {
                        <button
                          type="button"
                          class="text-red-500 hover:text-red-700 p-1"
                          (click)="removeDepartment(i)"
                        >
                          <ui-icon name="trash" class="w-4 h-4"></ui-icon>
                        </button>
                      }
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        formControlName="name"
                        placeholder="Department Name"
                        class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-white"
                      />
                      <input
                        type="text"
                        formControlName="code"
                        placeholder="Code (e.g., ENG)"
                        class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      formControlName="description"
                      placeholder="Description (optional)"
                      class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-white"
                    />
                  </div>
                }

                @if (departmentsArray.length === 0) {
                  <div class="text-center py-8 border-2 border-dashed border-stone-200 rounded-xl">
                    <p class="text-stone-500">No departments yet. Add your first department.</p>
                  </div>
                }
              </div>
            }

            <!-- Step 3: Designations -->
            @if (currentStep() === 2) {
              <div class="space-y-4" formArrayName="designations">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-stone-500">Add job titles/designations</span>
                  <ui-button variant="secondary" size="sm" (onClick)="addDesignation()">
                    <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon>
                    Add
                  </ui-button>
                </div>

                @for (desig of designationsArray.controls; track $index; let i = $index) {
                  <div class="p-4 rounded-xl border border-stone-200 bg-stone-50/30 space-y-3" [formGroupName]="i">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-stone-700">Designation {{ i + 1 }}</span>
                      @if (designationsArray.length > 1) {
                        <button
                          type="button"
                          class="text-red-500 hover:text-red-700 p-1"
                          (click)="removeDesignation(i)"
                        >
                          <ui-icon name="trash" class="w-4 h-4"></ui-icon>
                        </button>
                      }
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        formControlName="title"
                        placeholder="Job Title"
                        class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-white sm:col-span-2"
                      />
                      <input
                        type="text"
                        formControlName="code"
                        placeholder="Code"
                        class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-white"
                      />
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        formControlName="level"
                        placeholder="Level (1-10)"
                        class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-white"
                      />
                      <input
                        type="text"
                        formControlName="description"
                        placeholder="Description (optional)"
                        class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border bg-white"
                      />
                    </div>
                  </div>
                }

                @if (designationsArray.length === 0) {
                  <div class="text-center py-8 border-2 border-dashed border-stone-200 rounded-xl">
                    <p class="text-stone-500">No designations yet. Add your first job title.</p>
                  </div>
                }
              </div>
            }

            <!-- Step 4: Admin Profile -->
            @if (currentStep() === 3) {
              <div class="space-y-4" formGroupName="adminEmployee">
                <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                  <div class="flex items-start gap-3">
                    <ui-icon name="information-circle" class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"></ui-icon>
                    <div class="text-sm text-amber-800">
                      <p class="font-medium">You'll be the admin</p>
                      <p class="mt-1">Your account ({{ user()?.email }}) will be set as the organization admin with full access.</p>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ui-form-field
                    label="First Name"
                    [control]="wizardForm.get('adminEmployee.firstName')"
                    id="firstName"
                    [required]="true"
                  >
                    <input
                      type="text"
                      id="firstName"
                      formControlName="firstName"
                      class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
                    />
                  </ui-form-field>

                  <ui-form-field
                    label="Last Name"
                    [control]="wizardForm.get('adminEmployee.lastName')"
                    id="lastName"
                    [required]="true"
                  >
                    <input
                      type="text"
                      id="lastName"
                      formControlName="lastName"
                      class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
                    />
                  </ui-form-field>
                </div>

                <ui-form-field
                  label="Phone"
                  [control]="wizardForm.get('adminEmployee.phone')"
                  id="phone"
                >
                  <input
                    type="tel"
                    id="phone"
                    formControlName="phone"
                    placeholder="+1 (555) 000-0000"
                    class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
                  />
                </ui-form-field>

                @if (departmentsArray.length > 0) {
                  <ui-form-field
                    label="Your Department"
                    [control]="wizardForm.get('adminEmployee.departmentIndex')"
                    id="deptIndex"
                  >
                    <select
                      id="deptIndex"
                      formControlName="departmentIndex"
                      class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
                    >
                      <option [ngValue]="null">Select department (optional)</option>
                      @for (dept of departmentsArray.controls; track $index; let i = $index) {
                        <option [ngValue]="i">{{ dept.get('name')?.value }}</option>
                      }
                    </select>
                  </ui-form-field>
                }

                @if (designationsArray.length > 0) {
                  <ui-form-field
                    label="Your Designation"
                    [control]="wizardForm.get('adminEmployee.designationIndex')"
                    id="desigIndex"
                  >
                    <select
                      id="desigIndex"
                      formControlName="designationIndex"
                      class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
                    >
                      <option [ngValue]="null">Select designation (optional)</option>
                      @for (desig of designationsArray.controls; track $index; let i = $index) {
                        <option [ngValue]="i">{{ desig.get('title')?.value }}</option>
                      }
                    </select>
                  </ui-form-field>
                }
              </div>
            }
                </form>

                <!-- Navigation Buttons -->
                <div class="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
                  <ui-button
                    variant="ghost"
                    [disabled]="currentStep() === 0"
                    (onClick)="previousStep()"
                  >
                    <ui-icon name="arrow-left" class="w-4 h-4 mr-2"></ui-icon>
                    Previous
                  </ui-button>

                  @if (currentStep() < steps.length - 1) {
                    <ui-button
                      variant="primary"
                      [disabled]="!isCurrentStepValid()"
                      (onClick)="nextStep()"
                    >
                      Next
                      <ui-icon name="arrow-right" class="w-4 h-4 ml-2"></ui-icon>
                    </ui-button>
                  } @else {
                    <ui-button
                      variant="primary"
                      [loading]="submitting()"
                      [disabled]="!isCurrentStepValid() || submitting()"
                      (onClick)="submit()"
                    >
                      Create Organization
                      <ui-icon name="check" class="w-4 h-4 ml-2"></ui-icon>
                    </ui-button>
                  }
                </div>
              </div>
            </ui-grid-tile>
          </ui-grid>
        </div>

        <!-- Back to Pending -->
        <div class="text-center mt-6">
          <a
            routerLink="/pending"
            class="text-sm text-stone-500 hover:text-[#8b1e3f] transition-colors"
          >
            ← Back to pending page
          </a>
        </div>
      </div>
    </div>
  `
})
export class OrgWizardComponent {
  private convex = inject(ConvexClientService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  user = this.authService.getUser();
  currentStep = signal(0);
  submitting = signal(false);

  steps: WizardStep[] = [
    { id: 'org', title: 'Organization Details', description: 'Basic information about your organization', icon: 'building-office-2' },
    { id: 'departments', title: 'Departments', description: 'Add your organization structure', icon: 'rectangle-group' },
    { id: 'designations', title: 'Designations', description: 'Define job titles and levels', icon: 'identification' },
    { id: 'admin', title: 'Your Profile', description: 'Set up your admin account', icon: 'user' }
  ];

  wizardForm: FormGroup;

  constructor() {
    this.wizardForm = this.fb.group({
      organization: this.fb.group({
        name: ['', Validators.required],
        domain: ['']
      }),
      departments: this.fb.array([]),
      designations: this.fb.array([]),
      adminEmployee: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        phone: [''],
        departmentIndex: [null],
        designationIndex: [null]
      })
    });

    // Add one default department and designation
    this.addDepartment();
    this.addDesignation();

    // Pre-fill name from user if available
    const userName = this.user()?.name;
    if (userName) {
      const parts = userName.split(' ');
      this.wizardForm.patchValue({
        adminEmployee: {
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || ''
        }
      });
    }

    // Pre-fill domain from email
    const email = this.user()?.email;
    if (email) {
      const domain = email.split('@')[1];
      if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail') && !domain.includes('outlook')) {
        this.wizardForm.patchValue({
          organization: { domain }
        });
      }
    }
  }

  get departmentsArray(): FormArray {
    return this.wizardForm.get('departments') as FormArray;
  }

  get designationsArray(): FormArray {
    return this.wizardForm.get('designations') as FormArray;
  }

  addDepartment() {
    this.departmentsArray.push(this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      description: ['']
    }));
  }

  removeDepartment(index: number) {
    this.departmentsArray.removeAt(index);
  }

  addDesignation() {
    this.designationsArray.push(this.fb.group({
      title: ['', Validators.required],
      code: ['', Validators.required],
      level: [null],
      description: ['']
    }));
  }

  removeDesignation(index: number) {
    this.designationsArray.removeAt(index);
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep()) {
      case 0:
        return this.wizardForm.get('organization')?.valid ?? false;
      case 1:
        return this.departmentsArray.length > 0 && this.departmentsArray.valid;
      case 2:
        return this.designationsArray.length > 0 && this.designationsArray.valid;
      case 3:
        return this.wizardForm.get('adminEmployee')?.valid ?? false;
      default:
        return false;
    }
  }

  nextStep() {
    if (this.currentStep() < this.steps.length - 1 && this.isCurrentStepValid()) {
      this.currentStep.update(s => s + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
    }
  }

  async submit() {
    if (!this.wizardForm.valid) {
      this.wizardForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    try {
      const formValue = this.wizardForm.value;

      await this.convex.getClient().mutation(api.onboarding.createOrganizationWithSetup, {
        organization: {
          name: formValue.organization.name,
          domain: formValue.organization.domain || undefined
        },
        departments: formValue.departments.map((d: any) => ({
          name: d.name,
          code: d.code,
          description: d.description || undefined
        })),
        designations: formValue.designations.map((d: any) => ({
          title: d.title,
          code: d.code,
          level: d.level || undefined,
          description: d.description || undefined
        })),
        adminEmployee: {
          firstName: formValue.adminEmployee.firstName,
          lastName: formValue.adminEmployee.lastName,
          phone: formValue.adminEmployee.phone || undefined,
          departmentIndex: formValue.adminEmployee.departmentIndex ?? undefined,
          designationIndex: formValue.adminEmployee.designationIndex ?? undefined
        }
      });

      this.toastService.success('Organization created successfully!');

      // Force auth refresh and redirect to dashboard
      await this.authService.refreshUser();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.error('Error creating organization:', err);
      this.toastService.error(err.message || 'Failed to create organization');
    } finally {
      this.submitting.set(false);
    }
  }
}
