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
