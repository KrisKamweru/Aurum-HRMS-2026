import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';
import { ToastMessage, UiToastComponent } from '../../../shared/components/ui-toast/ui-toast.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-forms-demo',
  imports: [ReactiveFormsModule, UiCardComponent, UiFormFieldComponent, UiButtonComponent, DynamicFormComponent, UiToastComponent],
  template: `
    <ui-toast [toasts]="toasts()" (dismiss)="dismissToast($event)"></ui-toast>

    <div class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy-700 dark:text-burgundy-400">Demo</p>
        <h2 class="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">Forms & Dynamic Form</h2>
        <p class="text-sm text-stone-600 dark:text-stone-400">
          Manual form-field wrappers and the rebuilt dynamic-form with multi-column and stepper flows.
        </p>
      </header>

      <div class="grid gap-6 xl:grid-cols-2">
        <ui-card variant="glass" title="Manual Reactive Form" subtitle="ui-form-field wrappers + strict validation">
          <form [formGroup]="manualForm" class="space-y-4" (ngSubmit)="submitManualForm()">
            <div class="grid gap-4 md:grid-cols-2">
              <ui-form-field label="Full Name" [required]="true" [control]="manualForm.controls.fullName" class="md:col-span-2">
                <input
                  id="manual-name"
                  type="text"
                  formControlName="fullName"
                  class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
                />
              </ui-form-field>

              <ui-form-field label="Email" [required]="true" [control]="manualForm.controls.email">
                <input
                  id="manual-email"
                  type="email"
                  formControlName="email"
                  class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
                />
              </ui-form-field>

              <ui-form-field label="Role" [required]="true" [control]="manualForm.controls.role">
                <select
                  id="manual-role"
                  formControlName="role"
                  class="w-full rounded-[10px] border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-stone-100"
                >
                  <option value="">Select role</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </ui-form-field>
            </div>

            <div class="flex justify-end">
              <ui-button type="submit">Submit Manual Form</ui-button>
            </div>
          </form>
        </ui-card>

        <ui-card
          variant="default"
          title="Dynamic Form (Stepper + Multi-Column)"
          subtitle="Matches the rebuilt modal/page form capabilities"
        >
          <app-dynamic-form
            [fields]="dynamicFields"
            [sections]="dynamicSections"
            [steps]="dynamicSteps"
            container="modal"
            submitLabel="Create Demo User"
            [showCancel]="true"
            (formSubmit)="onDynamicSubmit($event)"
            (cancel)="onDynamicCancel()"
          />
        </ui-card>
      </div>
    </div>
  `
})
export class FormsDemoComponent {
  private readonly fb = inject(FormBuilder);

  readonly manualForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['', [Validators.required]]
  });

  readonly toasts = signal<ToastMessage[]>([]);

  readonly dynamicSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Identity',
      description: 'Core account details',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'profile',
      title: 'Profile Details',
      description: 'Additional context and preferences',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly dynamicSteps: FormStepConfig[] = [
    {
      id: 'account',
      title: 'Account',
      description: 'Enter sign-in details',
      sectionIds: ['identity']
    },
    {
      id: 'profile',
      title: 'Profile',
      description: 'Capture profile metadata',
      sectionIds: ['profile']
    }
  ];

  readonly dynamicFields: FieldConfig[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'Jane',
      sectionId: 'identity'
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Doe',
      sectionId: 'identity'
    },
    {
      name: 'workEmail',
      label: 'Work Email',
      type: 'email',
      required: true,
      placeholder: 'jane@company.com',
      sectionId: 'identity',
      colSpan: 2
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      required: true,
      sectionId: 'profile',
      options: [
        { label: 'Engineering', value: 'engineering' },
        { label: 'HR', value: 'hr' },
        { label: 'Finance', value: 'finance' }
      ]
    },
    {
      name: 'jobTitle',
      label: 'Job Title',
      type: 'text',
      required: true,
      sectionId: 'profile'
    },
    {
      name: 'bio',
      label: 'Bio',
      type: 'textarea',
      sectionId: 'profile',
      colSpan: 2,
      placeholder: 'Short bio for internal directory'
    },
    {
      name: 'newsletter',
      label: 'Newsletter',
      type: 'checkbox',
      hint: 'Receive platform release notes',
      value: true,
      sectionId: 'profile',
      colSpan: 2
    }
  ];

  submitManualForm(): void {
    if (this.manualForm.invalid) {
      this.manualForm.markAllAsTouched();
      this.pushToast('error', 'Please fix the manual form errors before submitting.');
      return;
    }

    const payload = this.manualForm.getRawValue();
    this.pushToast('success', `Manual form submitted for ${payload.fullName}.`);
  }

  onDynamicSubmit(data: Record<string, unknown>): void {
    const firstName = typeof data['firstName'] === 'string' ? data['firstName'] : 'user';
    this.pushToast('success', `Dynamic form created ${firstName}.`);
  }

  onDynamicCancel(): void {
    this.pushToast('info', 'Dynamic form cancelled.');
  }

  dismissToast(id: string): void {
    this.toasts.update((items) => items.filter((toast) => toast.id !== id));
  }

  private pushToast(type: ToastMessage['type'], message: string): void {
    const id = `toast-${Date.now()}-${this.toasts().length}`;
    this.toasts.update((items) => [...items, { id, type, message }]);
  }
}
