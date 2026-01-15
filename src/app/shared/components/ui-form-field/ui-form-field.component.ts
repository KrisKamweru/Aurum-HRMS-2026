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
        <label [for]="id" class="block text-sm font-semibold text-stone-700">
          {{ label }}
          @if (required) {
            <span class="text-[#8b1e3f]">*</span>
          }
        </label>
        @if (hint) {
          <span class="text-xs text-stone-500">{{ hint }}</span>
        }
      </div>

      <ng-content></ng-content>

      @if (control && invalid() && touched()) {
        <div class="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium animate-slide-down">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5">
             <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
           </svg>
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
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
