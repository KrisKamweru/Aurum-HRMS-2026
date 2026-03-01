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
    <div class="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 class="text-3xl font-display font-semibold text-slate-900 dark:text-white">Forms & Inputs</h1>
        <p class="text-slate-500 mt-1">Demonstrating data capture interfaces with glassmorphic elements.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Manual Form -->
        <ui-card variant="interactive" title="Manual Reactive Form" subtitle="Using ui-form-field components directly">
          <form [formGroup]="manualForm" (ngSubmit)="submitManualForm()" class="space-y-5 mt-4">
            <ui-form-field label="Full Name" [control]="manualForm.controls.fullName" [required]="true" hint="As it appears on your ID">
              <input type="text" formControlName="fullName" class="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 glass-surface-hover shadow-sm" placeholder="Jane Doe" />
            </ui-form-field>

            <ui-form-field label="Email Address" [control]="manualForm.controls.email" [required]="true">
              <input type="email" formControlName="email" class="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 glass-surface-hover shadow-sm" placeholder="jane@company.com" />
            </ui-form-field>

            <ui-form-field label="Role" [control]="manualForm.controls.role" [required]="true">
              <select formControlName="role" class="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all glass-surface-hover appearance-none cursor-pointer shadow-sm">
                <option value="" disabled selected>Select a role...</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </ui-form-field>

            <div class="pt-4 flex justify-end">
              <ui-button variant="primary" type="submit" [disabled]="manualForm.invalid && manualForm.touched">Submit Form</ui-button>
            </div>
          </form>
        </ui-card>

        <!-- Dynamic Form -->
        <ui-card variant="interactive" padding="lg" accent="primary" title="Dynamic Configuration Form" subtitle="JSON-driven layout generation">
          <div class="mt-4">
            <app-dynamic-form 
              [sections]="dynamicSections" 
              [steps]="dynamicSteps" 
              [fields]="dynamicFields" 
              (formSubmit)="onDynamicSubmit($event)"
              (cancel)="onDynamicCancel()"
            ></app-dynamic-form>
          </div>
        </ui-card>
      </div>
    </div>

    <ui-toast [toasts]="toasts()" (dismiss)="dismissToast($event)"></ui-toast>
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
