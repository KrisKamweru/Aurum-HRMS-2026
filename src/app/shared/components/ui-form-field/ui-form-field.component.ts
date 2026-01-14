import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-1">
      <div class="flex justify-between">
        <label [for]="id" class="block text-sm font-medium text-gray-700">
          {{ label }}
          @if (required) {
            <span class="text-rose-600">*</span>
          }
        </label>
        @if (hint) {
          <span class="text-xs text-gray-500">{{ hint }}</span>
        }
      </div>

      <ng-content></ng-content>

      @if (control && invalid() && touched()) {
        <div class="text-sm text-red-600 animate-slide-down">
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-slide-down {
      animation: slideDown 0.2s ease-out;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class UiFormFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() id: string = crypto.randomUUID();
  @Input() required = false;
  @Input() hint?: string;
  @Input() control?: AbstractControl | null;

  // Manual error override
  @Input() error?: string;

  protected invalid = computed(() => this.control?.invalid ?? false);
  protected touched = computed(() => this.control?.touched ?? false);

  protected errorMessage = computed(() => {
    if (this.error) return this.error;
    if (!this.control?.errors) return '';

    const errors = this.control.errors;
    if (errors['required']) return `${this.label} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${this.label} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.label} must be no more than ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return 'Invalid format';

    return 'Invalid value';
  });
}
