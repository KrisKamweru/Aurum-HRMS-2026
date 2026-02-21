import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiStepComponent } from './ui-step.component';

export interface StepperStepConfig {
  title: string;
  subtitle?: string;
}

@Component({
  selector: 'ui-stepper',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="mb-6 flex items-center justify-center">
      @for (step of renderSteps(); track $index; let i = $index) {
        <div class="flex items-center">
          <button type="button" class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold" [class]="getStepCircleClass(i)" [disabled]="!canNavigateToStep(i)" (click)="goToStep(i)">
            @if (i < currentStep()) {
              <span>✓</span>
            } @else {
              <span>{{ i + 1 }}</span>
            }
          </button>
          <div class="ml-3 mr-6">
            <p class="text-sm font-medium" [class]="getStepLabelClass(i)">{{ step.title }}</p>
            @if (step.subtitle) {
              <p class="text-xs text-stone-500 dark:text-stone-400">{{ step.subtitle }}</p>
            }
          </div>
          @if (i < renderSteps().length - 1) {
            <div class="mr-6 h-0.5 w-16" [class]="i < currentStep() ? 'bg-burgundy-600' : 'bg-stone-300 dark:bg-stone-700'"></div>
          }
        </div>
      }
    </div>

    <div class="mb-6">
      @if (stepsData.length === 0) {
        @for (step of steps.toArray(); track $index; let i = $index) {
          @if (i === currentStep()) {
            <ng-container [ngTemplateOutlet]="step.contentTemplate"></ng-container>
          }
        }
      }
    </div>

    @if (showNavigation) {
      <div class="flex items-center justify-between border-t border-stone-200 pt-4 dark:border-white/8">
        <button type="button" class="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 dark:border-white/8 dark:text-stone-200" [disabled]="currentStep() === 0 || disabled" (click)="previous()">Back</button>
        @if (currentStep() < renderSteps().length - 1) {
          <button type="button" class="rounded-lg bg-burgundy-700 px-5 py-2 text-sm font-medium text-white" [disabled]="disabled" (click)="next()">Next</button>
        } @else {
          <button type="button" class="rounded-lg bg-burgundy-700 px-5 py-2 text-sm font-medium text-white" [disabled]="disabled" (click)="submit()">{{ submitText }}</button>
        }
      </div>
    }
  `
})
export class UiStepperComponent {
  @Input() stepsData: StepperStepConfig[] = [];
  @Input() showNavigation = true;
  @Input() disabled = false;
  @Input() submitText = 'Submit';
  @Input() linear = true;

  @Output() stepChange = new EventEmitter<number>();
  @Output() submitEvent = new EventEmitter<void>();

  @ContentChildren(UiStepComponent) steps!: QueryList<UiStepComponent>;

  private readonly currentStepIndex = signal(0);

  currentStep(): number {
    return this.currentStepIndex();
  }

  renderSteps(): StepperStepConfig[] {
    if (this.stepsData.length > 0) {
      return this.stepsData;
    }
    return this.steps?.toArray().map((step) => ({ title: step.title, subtitle: step.subtitle })) ?? [];
  }

  next(): void {
    if (this.currentStep() >= this.renderSteps().length - 1) {
      return;
    }
    this.currentStepIndex.update((value) => value + 1);
    this.stepChange.emit(this.currentStep());
  }

  previous(): void {
    if (this.currentStep() === 0) {
      return;
    }
    this.currentStepIndex.update((value) => value - 1);
    this.stepChange.emit(this.currentStep());
  }

  goToStep(index: number): void {
    if (!this.canNavigateToStep(index)) {
      return;
    }
    this.currentStepIndex.set(index);
    this.stepChange.emit(index);
  }

  canNavigateToStep(index: number): boolean {
    if (!this.linear) {
      return true;
    }
    return index <= this.currentStep();
  }

  submit(): void {
    this.submitEvent.emit();
  }

  getStepCircleClass(index: number): string {
    if (index < this.currentStep()) {
      return 'bg-burgundy-700 text-white';
    }
    if (index === this.currentStep()) {
      return 'bg-burgundy-700 text-white ring-4 ring-burgundy-100 dark:ring-burgundy-900/40';
    }
    return 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400';
  }

  getStepLabelClass(index: number): string {
    return index <= this.currentStep() ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400';
  }
}
