import { Component, input, output, contentChildren, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiStepComponent } from './ui-step.component';

@Component({
  selector: 'ui-stepper',
  imports: [NgTemplateOutlet],
  template: `
    <!-- Step Indicators -->
    <div class="flex items-center justify-center mb-8">
      @for (step of steps(); track $index; let i = $index) {
        <div class="flex items-center">
          <!-- Step Circle -->
          <button
            type="button"
            (click)="goToStep(i)"
            [disabled]="!canNavigateToStep(i)"
            class="flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors"
            [class]="getStepCircleClass(i)"
          >
            @if (i < currentStep()) {
              <!-- Checkmark for completed steps -->
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            } @else {
              {{ i + 1 }}
            }
          </button>

          <!-- Step Label -->
          <div class="ml-3 mr-6">
            <p class="text-sm font-medium" [class]="getStepLabelClass(i)">
              {{ step.title() }}
            </p>
            @if (step.subtitle()) {
              <p class="text-xs text-stone-500 dark:text-stone-400">{{ step.subtitle() }}</p>
            }
          </div>

          <!-- Connector Line (except after last step) -->
          @if (i < steps().length - 1) {
            <div
              class="w-16 h-0.5 mr-6"
              [class]="i < currentStep() ? 'bg-burgundy-600' : 'bg-stone-300 dark:bg-stone-600'"
            ></div>
          }
        </div>
      }
    </div>

    <!-- Step Content -->
    <div class="mb-8">
      @for (step of steps(); track $index; let i = $index) {
        @if (i === currentStep()) {
          <ng-container [ngTemplateOutlet]="step.contentTemplate"></ng-container>
        }
      }
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between pt-6 border-t border-stone-200 dark:border-stone-700">
      <button
        type="button"
        (click)="previous()"
        [disabled]="currentStep() === 0"
        class="px-6 py-2 text-sm font-medium rounded-lg transition-colors
               bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200
               hover:bg-stone-200 dark:hover:bg-stone-600
               disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Back
      </button>

      <div class="flex gap-3">
        @if (currentStep() < steps().length - 1) {
          <button
            type="button"
            (click)="next()"
            class="px-6 py-2 text-sm font-medium rounded-lg transition-colors
                   bg-burgundy-600 text-white hover:bg-burgundy-700"
          >
            Next
          </button>
        } @else {
          <button
            type="button"
            (click)="submit()"
            class="px-6 py-2 text-sm font-medium rounded-lg transition-colors
                   bg-burgundy-600 text-white hover:bg-burgundy-700"
          >
            {{ submitText() }}
          </button>
        }
      </div>
    </div>
  `
})
export class UiStepperComponent {
  // Inputs
  submitText = input<string>('Submit');
  linear = input<boolean>(true); // If true, must complete steps in order

  // Outputs
  stepChange = output<number>();
  submitEvent = output<void>();

  // Content children
  steps = contentChildren(UiStepComponent);

  // Internal state
  currentStep = signal(0);

  // Methods
  next(): void {
    if (this.currentStep() < this.steps().length - 1) {
      this.currentStep.update(s => s + 1);
      this.stepChange.emit(this.currentStep());
    }
  }

  previous(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
      this.stepChange.emit(this.currentStep());
    }
  }

  goToStep(index: number): void {
    if (this.canNavigateToStep(index)) {
      this.currentStep.set(index);
      this.stepChange.emit(index);
    }
  }

  canNavigateToStep(index: number): boolean {
    if (!this.linear()) return true;
    return index <= this.currentStep();
  }

  submit(): void {
    this.submitEvent.emit();
  }

  getStepCircleClass(index: number): string {
    if (index < this.currentStep()) {
      // Completed
      return 'bg-burgundy-600 text-white';
    } else if (index === this.currentStep()) {
      // Current
      return 'bg-burgundy-600 text-white ring-4 ring-burgundy-100 dark:ring-burgundy-900';
    } else {
      // Upcoming
      return 'bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400';
    }
  }

  getStepLabelClass(index: number): string {
    if (index <= this.currentStep()) {
      return 'text-stone-900 dark:text-stone-100';
    }
    return 'text-stone-500 dark:text-stone-400';
  }
}
