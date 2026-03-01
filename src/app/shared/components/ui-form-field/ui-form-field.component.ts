import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-form-field',
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex flex-col space-y-2 w-full">
      <label [for]="id()" class="text-[13px] font-semibold tracking-wide text-slate-700 dark:text-slate-300 flex justify-between uppercase">
        <span>
          {{ label() }}
          @if (required()) {
            <span class="text-red-500 ml-1">*</span>
          }
        </span>
        @if (hint()) {
          <span class="text-xs text-slate-500 font-normal normal-case">{{ hint() }}</span>
        }
      </label>
      <div class="relative">
        <ng-content></ng-content>
      </div>
      @if (error() || (control() && control()?.invalid && (control()?.dirty || control()?.touched))) {
        <p class="text-xs font-medium text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
          {{ errorMessage() }}
        </p>
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
