import { Injectable } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';

// Configuration type for generating forms dynamically
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  value?: any;
  required?: boolean;
  options?: { label: string; value: any }[]; // For select inputs
  validators?: any[];
  placeholder?: string;
  hint?: string;
  disabled?: boolean;

  // Layout properties
  columns?: 1 | 2 | 3;        // legacy: Number of columns for this field's row (default: 1)
  colspan?: number;           // legacy
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  section?: string;           // legacy section label
  sectionId?: string;
}

export interface FormSectionConfig {
  id: string;
  title?: string;
  description?: string;
  columns?: {
    base?: 1 | 2 | 3;
    md?: 1 | 2 | 3;
    lg?: 1 | 2 | 3;
  };
}

export interface FormStepConfig {
  id: string;
  title: string;
  description?: string;
  fieldNames?: string[];
  sectionIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FormHelperService {
  constructor(private fb: FormBuilder) {}

  /**
   * Creates a FormGroup from a list of FieldConfigs
   */
  createForm(fields: FieldConfig[]): FormGroup {
    const group: any = {};

    fields.forEach(field => {
      const controlValidators = field.validators || [];

      if (field.required) {
        controlValidators.push(Validators.required);
      }

      if (field.type === 'email') {
        controlValidators.push(Validators.email);
      }

      group[field.name] = new FormControl(
        { value: field.value || '', disabled: field.disabled || false },
        controlValidators
      );
    });

    return this.fb.group(group);
  }

  /**
   * Utility to mark all fields as touched (e.g., on submit attempt)
   */
  markAllAsTouched(form: FormGroup) {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }

  /**
   * Resets form with optional initial values
   */
  resetForm(form: FormGroup, values: any = {}) {
    form.reset(values);
  }
}
