import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-form-field',
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-1">
      <div class="flex items-center justify-between">
        <label [for]="id()" class="text-[13px] font-medium text-stone-700 dark:text-stone-300">
          {{ label() }}
          @if (required()) {
            <span class="text-burgundy-700">*</span>
          }
        </label>
        @if (hint()) {
          <span class="text-xs text-stone-500 dark:text-stone-400">{{ hint() }}</span>
        }
      </div>

      <ng-content></ng-content>

      @if (control(); as formControl) {
        @if (formControl.invalid && formControl.touched) {
          <p class="text-xs text-red-600 dark:text-red-400">{{ errorMessage() }}</p>
        }
      }
    </div>
  `
})
export class UiFormFieldComponent {
  readonly label = input.required<string>();
  readonly id = input(`field-${Math.random().toString(36).slice(2, 10)}`);
  readonly required = input(false);
  readonly hint = input<string>();
  readonly control = input<AbstractControl | null>();
  readonly error = input<string>();

  errorMessage(): string {
    const error = this.error();
    if (error) {
      return error;
    }
    const errors = this.control()?.errors;
    if (!errors) {
      return 'Invalid value';
    }
    if (errors['required']) {
      return `${this.label()} is required`;
    }
    if (errors['email']) {
      return 'Please enter a valid email address';
    }
    if (errors['minlength']) {
      const length = Number(errors['minlength']['requiredLength']);
      return `${this.label()} must be at least ${length} characters`;
    }
    if (errors['maxlength']) {
      const length = Number(errors['maxlength']['requiredLength']);
      return `${this.label()} must be no more than ${length} characters`;
    }
    return 'Invalid value';
  }
}



