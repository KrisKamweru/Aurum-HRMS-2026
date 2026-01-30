import { Component, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FormHelperService, FieldConfig } from '../../services/form-helper.service';
import { UiFormFieldComponent } from '../ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../ui-button/ui-button.component';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiFormFieldComponent, UiButtonComponent],
  template: `
    @if (form) {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="space-y-4">
          @for (field of fields(); track field.name) {
            <ui-form-field
              [label]="field.label"
              [required]="field.required || false"
              [hint]="field.hint"
              [control]="form.get(field.name)"
              [id]="field.name"
            >
              <!-- Select -->
              @if (field.type === 'select') {
                <select
                  [id]="field.name"
                  [formControlName]="field.name"
                  class="block w-full rounded-xl border-stone-200 dark:border-stone-700 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] text-base sm:text-sm px-3 py-2 border transition-colors duration-200 bg-stone-50/50 dark:bg-stone-800/50 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800"
                  [class.border-red-300]="isInvalid(field.name)"
                  [class.focus:border-red-500]="isInvalid(field.name)"
                  [class.focus:ring-red-500]="isInvalid(field.name)"
                >
                  <option value="">Select {{ field.label }}</option>
                  @for (opt of field.options; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              }

              <!-- Textarea -->
              @else if (field.type === 'textarea') {
                <textarea
                  [id]="field.name"
                  [formControlName]="field.name"
                  [placeholder]="field.placeholder || ''"
                  rows="4"
                  class="block w-full rounded-xl border-stone-200 dark:border-stone-700 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] text-base sm:text-sm px-3 py-2 border transition-colors duration-200 bg-stone-50/50 dark:bg-stone-800/50 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800"
                  [class.border-red-300]="isInvalid(field.name)"
                ></textarea>
              }

              <!-- Checkbox -->
              @else if (field.type === 'checkbox') {
                <div class="flex items-center">
                  <input
                    [id]="field.name"
                    type="checkbox"
                    [formControlName]="field.name"
                    class="h-5 w-5 sm:h-4 sm:w-4 rounded border-stone-200 dark:border-stone-700 text-[#8b1e3f] focus:ring-[#8b1e3f] transition-colors dark:bg-stone-800"
                  />
                  <label [for]="field.name" class="ml-2 block text-sm text-stone-900 dark:text-stone-100 font-medium">
                    {{ field.placeholder || field.label }}
                  </label>
                </div>
              }

              <!-- Default Input (text, email, password, number, date) -->
              @else {
                <input
                  [id]="field.name"
                  [type]="field.type"
                  [formControlName]="field.name"
                  [placeholder]="field.placeholder || ''"
                  class="block w-full rounded-xl border-stone-200 dark:border-stone-700 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] text-base sm:text-sm px-3 py-2 border transition-colors duration-200 bg-stone-50/50 dark:bg-stone-800/50 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800"
                  [class.border-red-300]="isInvalid(field.name)"
                />
              }
            </ui-form-field>
          }
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          @if (showCancel()) {
            <ui-button
              type="button"
              variant="ghost"
              (onClick)="cancel.emit()"
              [disabled]="loading()"
            >
              Cancel
            </ui-button>
          }

          <ui-button
            type="submit"
            [loading]="loading()"
            [disabled]="form.invalid || loading()"
          >
            {{ submitLabel() }}
          </ui-button>
        </div>
      </form>
    }
  `
})
export class DynamicFormComponent {
  fields = input.required<FieldConfig[]>();
  submitLabel = input('Save');
  showCancel = input(false);
  loading = input(false);
  initialValues = input<any>({});

  formSubmit = output<any>();
  cancel = output<void>();

  form!: FormGroup;
  private formHelper = inject(FormHelperService);

  constructor() {
    effect(() => {
      // Re-create form when fields change
      const fields = this.fields();
      this.form = this.formHelper.createForm(fields);

      // Patch values immediately if available
      const values = this.initialValues();
      if (values && Object.keys(values).length > 0) {
        // Use timeout to ensure form is ready, though usually synchronous here is fine
        // Using patchValue with emitEvent: false helps avoid loops if we had them
        this.form.patchValue(values, { emitEvent: false });
      }
    });

    // Separate effect to handle value updates if they arrive later
    effect(() => {
      const values = this.initialValues();
      if (this.form && values && Object.keys(values).length > 0) {
        this.form.patchValue(values, { emitEvent: false });
      }
    });
  }

  isInvalid(fieldName: string): boolean {
    const control = this.form?.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit() {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    } else {
      this.formHelper.markAllAsTouched(this.form);
    }
  }
}
