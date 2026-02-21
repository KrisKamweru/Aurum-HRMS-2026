import { Component, Input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <label [for]="id" class="text-[13px] font-medium text-stone-700 dark:text-stone-300">
          {{ label }}
          @if (required) {
            <span class="text-burgundy-700">*</span>
          }
        </label>
        @if (hint) {
          <span class="text-xs text-stone-500 dark:text-stone-400">{{ hint }}</span>
        }
      </div>

      <ng-content></ng-content>

      @if (control && control.invalid && control.touched) {
        <p class="text-xs text-red-600 dark:text-red-400">{{ errorMessage() }}</p>
      }
    </div>
  `
})
export class UiFormFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() id = `field-${Math.random().toString(36).slice(2, 10)}`;
  @Input() required = false;
  @Input() hint?: string;
  @Input() control?: AbstractControl | null;
  @Input() error?: string;

  errorMessage(): string {
    if (this.error) {
      return this.error;
    }
    const errors = this.control?.errors;
    if (!errors) {
      return 'Invalid value';
    }
    if (errors['required']) {
      return `${this.label} is required`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['minlength']) {
      const length = Number(errors['minlength']['requiredLength']);
      return `${this.label} must be at least ${length} characters`;
    }
    if (errors['maxlength']) {
      const length = Number(errors['maxlength']['requiredLength']);
      return `${this.label} must be no more than ${length} characters`;
    }
    return 'Invalid value';
  }
}

