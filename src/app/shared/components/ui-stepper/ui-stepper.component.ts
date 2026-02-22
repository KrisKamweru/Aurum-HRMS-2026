import { Component, ContentChildren, QueryList, signal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiStepComponent } from './ui-step.component';

export interface StepperStepConfig {
  title: string;
  subtitle?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-stepper',
  imports: [NgTemplateOutlet],
  template: ''
})
export class UiStepperComponent {
  readonly stepsData = input<StepperStepConfig[]>([]);
  readonly showNavigation = input(true);
  readonly disabled = input(false);
  readonly submitText = input('Submit');
  readonly linear = input(true);

  readonly stepChange = output<number>();
  readonly submitEvent = output<void>();

  @ContentChildren(UiStepComponent) steps!: QueryList<UiStepComponent>;

  private readonly currentStepIndex = signal(0);

  currentStep(): number {
    return this.currentStepIndex();
  }

  renderSteps(): StepperStepConfig[] {
    if (this.stepsData().length > 0) {
      return this.stepsData();
    }
    return this.steps?.toArray().map((step) => ({ title: step.title(), subtitle: step.subtitle() })) ?? [];
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
    if (!this.linear()) {
      return true;
    }
    return index <= this.currentStep();
  }

  submit(): void {
    this.submitEvent.emit(undefined);
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


