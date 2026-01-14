import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../shared/services/form-helper.service';

@Component({
  selector: 'app-forms-demo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiCardComponent, UiFormFieldComponent, UiButtonComponent, DynamicFormComponent],
  template: `
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Manual Forms</h2>
        <p class="text-gray-600 mb-4">Using <code>ui-form-field</code> wrapper with standard Reactive Forms.</p>

        <ui-card>
          <form [formGroup]="manualForm" (ngSubmit)="onManualSubmit()" class="max-w-md space-y-4">
            <ui-form-field label="Username" [required]="true" [control]="manualForm.get('username')" hint="Your unique identifier">
              <input
                type="text"
                id="username"
                formControlName="username"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm px-3 py-2 border"
                [class.border-red-300]="manualForm.get('username')?.invalid && manualForm.get('username')?.touched"
              />
            </ui-form-field>

            <ui-form-field label="Email" [required]="true" [control]="manualForm.get('email')">
              <input
                type="email"
                id="email"
                formControlName="email"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm px-3 py-2 border"
                [class.border-red-300]="manualForm.get('email')?.invalid && manualForm.get('email')?.touched"
              />
            </ui-form-field>

            <ui-button type="submit">Submit Manual Form</ui-button>
          </form>
        </ui-card>
      </div>

      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Dynamic Forms</h2>
        <p class="text-gray-600 mb-4">Generated entirely from JSON configuration using <code>dynamic-form</code>.</p>

        <ui-card>
          <div class="max-w-md">
            <app-dynamic-form
              [fields]="dynamicFields"
              submitLabel="Create User"
              [showCancel]="true"
              (formSubmit)="onDynamicSubmit($event)"
              (cancel)="onDynamicCancel()"
            ></app-dynamic-form>
          </div>
        </ui-card>
      </div>
    </div>
  `
})
export class FormsDemoComponent {
  private fb = inject(FormBuilder);

  // Manual Form
  manualForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]]
  });

  onManualSubmit() {
    if (this.manualForm.valid) {
      alert('Manual Form Valid: ' + JSON.stringify(this.manualForm.value));
    } else {
      this.manualForm.markAllAsTouched();
    }
  }

  // Dynamic Form Config
  dynamicFields: FieldConfig[] = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'John Doe'
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Guest', value: 'guest' }
      ]
    },
    {
      name: 'bio',
      label: 'Biography',
      type: 'textarea',
      required: false,
      placeholder: 'Tell us about yourself...'
    },
    {
      name: 'notifications',
      label: 'Receive Notifications',
      type: 'checkbox',
      value: true
    }
  ];

  onDynamicSubmit(data: any) {
    alert('Dynamic Form Data: ' + JSON.stringify(data));
  }

  onDynamicCancel() {
    alert('Dynamic Form Cancelled');
  }
}
