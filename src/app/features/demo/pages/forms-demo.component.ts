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
  template: ''
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
