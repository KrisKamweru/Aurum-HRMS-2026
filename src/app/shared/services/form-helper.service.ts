import { Injectable } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';

export interface FieldOption {
  label: string;
  value: string | number | boolean;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  value?: string | number | boolean | null;
  placeholder?: string;
  hint?: string;
  options?: FieldOption[];
  validators?: unknown[];
  disabled?: boolean;
  sectionId?: string;
  colSpan?: 1 | 2 | 3;
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

@Injectable({ providedIn: 'root' })
export class FormHelperService {
  constructor(private readonly fb: FormBuilder) {}

  createForm(fields: FieldConfig[]): FormGroup {
    const controls: Record<string, FormControl> = {};

    for (const field of fields) {
      const validators = [...(field.validators ?? [])];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.type === 'email') {
        validators.push(Validators.email);
      }
      controls[field.name] = new FormControl(
        { value: field.value ?? this.defaultValueForType(field.type), disabled: !!field.disabled },
        validators as never
      );
    }

    return this.fb.group(controls);
  }

  markAllAsTouched(form: FormGroup): void {
    Object.values(form.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  }

  private defaultValueForType(type: FieldType): string | number | boolean {
    if (type === 'checkbox') {
      return false;
    }
    return '';
  }
}
