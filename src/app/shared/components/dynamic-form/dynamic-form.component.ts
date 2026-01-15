import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
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
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
      <div class="space-y-4">
        @for (field of fields; track field.name) {
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
                class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border transition-colors duration-200 bg-stone-50/50 focus:bg-white"
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
                class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border transition-colors duration-200 bg-stone-50/50 focus:bg-white"
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
                  class="h-4 w-4 rounded border-stone-200 text-[#8b1e3f] focus:ring-[#8b1e3f] transition-colors"
                />
                <label [for]="field.name" class="ml-2 block text-sm text-stone-900 font-medium">
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
                class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-3 py-2 border transition-colors duration-200 bg-stone-50/50 focus:bg-white"
                [class.border-red-300]="isInvalid(field.name)"
              />
            }
          </ui-form-field>
        }
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
        @if (showCancel) {
          <ui-button
            type="button"
            variant="ghost"
            (onClick)="cancel.emit()"
            [disabled]="loading"
          >
            Cancel
          </ui-button>
        }

        <ui-button
          type="submit"
          [loading]="loading"
          [disabled]="form.invalid || loading"
        >
          {{ submitLabel }}
        </ui-button>
      </div>
    </form>
  `
})
export class DynamicFormComponent implements OnInit {
  @Input() fields: FieldConfig[] = [];
  @Input() submitLabel = 'Save';
  @Input() showCancel = false;
  @Input() loading = false;
  @Input() initialValues: any = {};

  @Output() formSubmit = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  private formHelper = inject(FormHelperService);

  ngOnInit() {
    this.form = this.formHelper.createForm(this.fields);
    if (this.initialValues && Object.keys(this.initialValues).length > 0) {
      this.form.patchValue(this.initialValues);
    }
  }

  isInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
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
