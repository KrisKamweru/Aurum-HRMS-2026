import { Component, input, output, effect, inject, computed } from '@angular/core';
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
        @for (sectionGroup of groupedFields(); track $index) {
          <!-- Section Header (if section name exists) -->
          @if (sectionGroup.section) {
            <div class="border-b border-stone-200 dark:border-stone-700 pb-2 mb-4">
              <h3 class="text-lg font-semibold text-stone-800 dark:text-stone-100">
                {{ sectionGroup.section }}
              </h3>
            </div>
          }

          <!-- Fields Grid -->
          <div [class]="getGridClass(sectionGroup.fields)">
            @for (field of sectionGroup.fields; track field.name) {
              <div [class]="getFieldClass(field)">
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
                      class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500/20 text-base sm:text-sm px-3 py-2 border transition-colors duration-200 bg-white dark:bg-white/5 dark:text-stone-100"
                      [class.border-red-300]="isInvalid(field.name)"
                      [class.focus:border-red-500]="isInvalid(field.name)"
                      [class.focus:ring-red-500]="isInvalid(field.name)"
                    >
                      <option value="">Select {{ field.label }}</option>
                      @for (opt of field.options; track $index) {
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
                      class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500/20 text-base sm:text-sm px-3 py-2 border transition-colors duration-200 bg-white dark:bg-white/5 dark:text-stone-100"
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
                        class="h-5 w-5 sm:h-4 sm:w-4 rounded border-stone-200 dark:border-white/8 text-burgundy-700 dark:text-burgundy-300 focus:ring-burgundy-500/20 transition-colors dark:bg-white/5"
                      />
                      <label [for]="field.name" class="ml-2 block text-[13px] font-medium text-stone-700 dark:text-stone-300">
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
                      class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-500 focus:ring-burgundy-500/20 text-base sm:text-sm px-3 py-2 border transition-colors duration-200 bg-white dark:bg-white/5 dark:text-stone-100"
                      [class.border-red-300]="isInvalid(field.name)"
                    />
                  }
                </ui-form-field>
              </div>
            }
          </div>
        }

        <div class="flex justify-end gap-3 pt-4 border-t border-stone-200 dark:border-white/8">
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

  // Group fields by section
  groupedFields = computed(() => {
    const fields = this.fields();
    const groups: { section: string | null; fields: FieldConfig[] }[] = [];
    let currentSection: string | null = null;
    let currentFields: FieldConfig[] = [];

    for (const field of fields) {
      if (field.section !== currentSection) {
        if (currentFields.length > 0) {
          groups.push({ section: currentSection, fields: currentFields });
        }
        currentSection = field.section ?? null;
        currentFields = [field];
      } else {
        currentFields.push(field);
      }
    }

    if (currentFields.length > 0) {
      groups.push({ section: currentSection, fields: currentFields });
    }

    return groups;
  });

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

  // Get grid class based on max columns in field set
  getGridClass(fields: FieldConfig[]): string {
    const maxCols = Math.max(...fields.map(f => f.columns ?? 1));
    if (maxCols === 3) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    if (maxCols === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    return 'space-y-4'; // single column, use simple spacing
  }

  // Get field wrapper class based on colspan
  getFieldClass(field: FieldConfig): string {
    const colspan = field.colspan ?? 1;
    if (colspan === 2) return 'md:col-span-2';
    if (colspan === 3) return 'md:col-span-2 lg:col-span-3';
    return '';
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
