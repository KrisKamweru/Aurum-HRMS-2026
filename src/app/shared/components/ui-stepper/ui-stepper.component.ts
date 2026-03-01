import { Component, ContentChildren, QueryList, signal, input, output, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiStepComponent } from './ui-step.component';

export interface StepperStepConfig {
  title: string;
  subtitle?: string;
  contentTemplate?: any;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-stepper',
  imports: [NgTemplateOutlet],
  template: `
    <div class="w-full flex flex-col">
      <div class="flex items-center w-full mb-8 relative">
        <div class="absolute left-0 top-1/2 -z-10 h-[2px] w-full -translate-y-1/2 bg-black/5 dark:bg-white/5"></div>
        <div class="absolute left-0 top-1/2 -z-10 h-[2px] -translate-y-1/2 bg-primary-800 transition-all duration-500 ease-out" [style.width]="renderSteps().length > 1 ? (currentStep() / (renderSteps().length - 1)) * 100 + '%' : '100%'"></div>
        
        <div class="flex w-full justify-between z-10">
          @for (step of renderSteps(); track step.title; let i = $index) {
            <div class="flex flex-col items-center gap-2 cursor-pointer relative group" (click)="goToStep(i)" [class.opacity-50]="!canNavigateToStep(i) && currentStep() !== i">
              <div class="flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all duration-300 font-semibold text-sm backdrop-blur-md"
                [class]="getStepCircleClass(i)">
                @if (i < currentStep()) {
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                } @else {
                  <span>{{ i + 1 }}</span>
                }
              </div>
              <div class="text-center absolute top-12 w-32 -mx-11">
                <span class="block text-[13px] font-semibold tracking-wide transition-colors duration-300 leading-tight" [class]="getStepLabelClass(i)">{{ step.title }}</span>
                @if (step.subtitle) {
                  <span class="block text-[11px] mt-1 font-medium" [class]="getStepSubtitleClass(i)">{{ step.subtitle }}</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
      
      <div class="mt-8 relative w-full glass-surface rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-white/10 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
         @if (renderSteps()[currentStep()]?.contentTemplate) {
           <ng-container *ngTemplateOutlet="renderSteps()[currentStep()].contentTemplate"></ng-container>
         }
      </div>
      
      @if (showNavigation()) {
        <div class="mt-8 flex justify-between">
          <button type="button" (click)="previous()" [disabled]="currentStep() === 0" class="px-6 py-2.5 rounded-full border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur-md">Back</button>
          
          @if (currentStep() < renderSteps().length - 1) {
            <button type="button" (click)="next()" class="px-6 py-2.5 rounded-full bg-primary-800 text-white shadow-sm hover:bg-primary-900 hover:shadow-md transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="disabled()">Next Step</button>
          } @else {
            <button type="button" (click)="submit()" class="px-6 py-2.5 rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="disabled()">{{ submitText() }}</button>
          }
        </div>
      }
    </div>
  `
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
    return this.steps?.toArray().map((step) => ({ 
      title: step.title(), 
      subtitle: step.subtitle(), 
      contentTemplate: step.contentTemplate 
    })) ?? [];
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
      return 'bg-primary-800 border-primary-800 text-white glass-surface';
    }
    if (index === this.currentStep()) {
      return 'bg-white/90 dark:bg-black/80 border-primary-800 text-primary-800 dark:text-primary-400 ring-[4px] ring-primary-800/20';
    }
    return 'bg-white/40 border-black/10 text-slate-400 dark:bg-white/5 dark:border-white/10 glass-surface';
  }

  getStepLabelClass(index: number): string {
    return index <= this.currentStep() ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500';
  }

  getStepSubtitleClass(index: number): string {
    return index <= this.currentStep() ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400/50 dark:text-slate-500/50';
  }
}


