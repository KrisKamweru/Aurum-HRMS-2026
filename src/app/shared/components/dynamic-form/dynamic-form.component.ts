import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig, FormHelperService, FormSectionConfig, FormStepConfig } from '../../services/form-helper.service';

type FormContainer = 'page' | 'modal' | 'drawer';

interface ResolvedSection {
  id: string;
  title?: string;
  description?: string;
  columns: { base: 1 | 2 | 3; md: 1 | 2 | 3; lg: 1 | 2 | 3 };
  fields: FieldConfig[];
}

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (form) {
      <form [formGroup]="form" [class]="containerClass()" (ngSubmit)="submit()">
        @if (steps.length > 0) {
          <div class="space-y-3">
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              @for (step of steps; track step.id; let i = $index) {
                <button
                  type="button"
                  class="rounded-xl border px-3 py-2 text-left text-sm transition-colors"
                  [class]="i <= activeStepIndex ? 'border-burgundy-300 bg-burgundy-50 text-burgundy-700 dark:border-burgundy-500/40 dark:bg-burgundy-700/15 dark:text-burgundy-300' : 'border-stone-200 bg-white text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300'"
                  [disabled]="i > activeStepIndex + 1 || loading"
                  (click)="setStep(i)"
                >
                  <p class="text-xs font-semibold uppercase tracking-wide">Step {{ i + 1 }}</p>
                  <p class="mt-1 font-semibold">{{ step.title }}</p>
                </button>
              }
            </div>
            <div class="rounded-xl border border-stone-200 bg-white p-4 text-sm dark:border-white/10 dark:bg-white/5">
              <p class="font-semibold text-stone-800 dark:text-stone-100">{{ currentStep()?.title }}</p>
              @if (currentStep()?.description) {
                <p class="mt-1 text-stone-600 dark:text-stone-400">{{ currentStep()?.description }}</p>
              }
            </div>
          </div>
        }

        @for (section of visibleSections(); track section.id) {
          <section class="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
            @if (section.title) {
              <header class="space-y-1">
                <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100">{{ section.title }}</h3>
                @if (section.description) {
                  <p class="text-[13px] text-stone-600 dark:text-stone-400">{{ section.description }}</p>
                }
              </header>
            }

            <div [class]="getGridClass(section)">
              @for (field of section.fields; track field.name) {
                <div [class]="getFieldClass(field)">
                  <label [for]="field.name" class="mb-1.5 block text-[13px] font-medium text-stone-700 dark:text-stone-300">
                    {{ field.label }}@if (field.required) {<span class="text-burgundy-700"> *</span>}
                  </label>
                  @switch (field.type) {
                    @case ('select') {
                      <select
                        [id]="field.name"
                        [formControlName]="field.name"
                        class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        <option value="">Select {{ field.label }}</option>
                        @for (opt of field.options ?? []; track opt.label) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                    }
                    @case ('textarea') {
                      <textarea
                        [id]="field.name"
                        rows="4"
                        [formControlName]="field.name"
                        [placeholder]="field.placeholder ?? ''"
                        class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      ></textarea>
                    }
                    @case ('checkbox') {
                      <label class="inline-flex items-center gap-2">
                        <input
                          [id]="field.name"
                          type="checkbox"
                          [formControlName]="field.name"
                          class="h-4 w-4 rounded border-stone-300 text-burgundy-700 focus:ring-burgundy-500 dark:border-white/20"
                        />
                        <span class="text-sm text-stone-700 dark:text-stone-300">{{ field.hint ?? field.label }}</span>
                      </label>
                    }
                    @default {
                      <input
                        [id]="field.name"
                        [type]="field.type"
                        [formControlName]="field.name"
                        [placeholder]="field.placeholder ?? ''"
                        class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm transition-all focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      />
                    }
                  }
                  @if (isInvalid(field.name)) {
                    <p class="mt-1 text-xs text-red-600 dark:text-red-400">This field is required.</p>
                  } @else if (field.hint) {
                    <p class="mt-1 text-xs text-stone-500 dark:text-stone-400">{{ field.hint }}</p>
                  }
                </div>
              }
            </div>
          </section>
        }

        <div class="flex items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-white/10">
          <button
            type="button"
            class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/10"
            [disabled]="activeStepIndex === 0 || loading"
            (click)="goPrevStep()"
          >
            Back
          </button>
          <div class="flex items-center gap-3">
            @if (showCancel) {
              <button
                type="button"
                class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/10"
                [disabled]="loading"
                (click)="cancel.emit()"
              >
                Cancel
              </button>
            }
            @if (steps.length > 0 && !isLastStep()) {
              <button
                type="button"
                class="rounded-[10px] bg-burgundy-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-burgundy-600"
                [disabled]="!canAdvanceCurrentStep() || loading"
                (click)="goNextStep()"
              >
                Next
              </button>
            } @else {
              <button
                type="submit"
                class="rounded-[10px] bg-burgundy-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-burgundy-600 disabled:opacity-60"
                [disabled]="form.invalid || loading"
              >
                {{ submitLabel }}
              </button>
            }
          </div>
        </div>
      </form>
    }
  `
})
export class DynamicFormComponent implements OnChanges {
  @Input({ required: true }) fields: FieldConfig[] = [];
  @Input() sections: FormSectionConfig[] = [];
  @Input() steps: FormStepConfig[] = [];
  @Input() container: FormContainer = 'page';
  @Input() submitLabel = 'Save';
  @Input() showCancel = false;
  @Input() loading = false;
  @Input() initialValues: Record<string, unknown> = {};

  @Output() formSubmit = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  activeStepIndex = 0;

  constructor(private readonly formHelper: FormHelperService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.form || changes['fields']) {
      this.form = this.formHelper.createForm(this.fields);
      this.activeStepIndex = 0;
    }
    if (changes['initialValues'] && this.initialValues) {
      this.form.patchValue(this.initialValues, { emitEvent: false });
    }
  }

  containerClass(): string {
    if (this.container === 'modal') {
      return 'space-y-5';
    }
    if (this.container === 'drawer') {
      return 'space-y-6';
    }
    return 'space-y-6';
  }

  currentStep(): FormStepConfig | undefined {
    return this.steps[this.activeStepIndex];
  }

  resolvedSections(): ResolvedSection[] {
    const sectionMap = new Map<string, ResolvedSection>();
    for (const field of this.fields) {
      const id = field.sectionId ?? 'default';
      if (!sectionMap.has(id)) {
        const config = this.sections.find((section) => section.id === id);
        sectionMap.set(id, {
          id,
          title: config?.title,
          description: config?.description,
          columns: {
            base: config?.columns?.base ?? 1,
            md: config?.columns?.md ?? (this.container === 'modal' ? 2 : 2),
            lg: config?.columns?.lg ?? (this.container === 'page' ? 3 : 2)
          },
          fields: []
        });
      }
      sectionMap.get(id)?.fields.push(field);
    }
    return [...sectionMap.values()];
  }

  visibleSections(): ResolvedSection[] {
    if (this.steps.length === 0) {
      return this.resolvedSections();
    }
    const step = this.currentStep();
    if (!step) {
      return this.resolvedSections();
    }
    const sectionIds = new Set(step.sectionIds ?? []);
    const explicitFields = new Set(step.fieldNames ?? []);
    return this.resolvedSections()
      .map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field) =>
            sectionIds.size === 0
              ? explicitFields.size === 0 || explicitFields.has(field.name)
              : sectionIds.has(section.id) || explicitFields.has(field.name)
        )
      }))
      .filter((section) => section.fields.length > 0);
  }

  getGridClass(section: ResolvedSection): string {
    const baseMap: Record<1 | 2 | 3, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3'
    };
    const mdMap: Record<1 | 2 | 3, string> = {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3'
    };
    const lgMap: Record<1 | 2 | 3, string> = {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3'
    };
    return `grid gap-4 ${baseMap[section.columns.base]} ${mdMap[section.columns.md]} ${lgMap[section.columns.lg]}`;
  }

  getFieldClass(field: FieldConfig): string {
    if ((field.colSpan ?? 1) === 3) {
      return 'md:col-span-2 lg:col-span-3';
    }
    if ((field.colSpan ?? 1) === 2) {
      return 'md:col-span-2';
    }
    return 'col-span-1';
  }

  isInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && control.touched;
  }

  setStep(index: number): void {
    if (index <= this.activeStepIndex) {
      this.activeStepIndex = index;
    }
  }

  goNextStep(): void {
    if (!this.canAdvanceCurrentStep()) {
      this.markCurrentStepTouched();
      return;
    }
    this.activeStepIndex = Math.min(this.activeStepIndex + 1, this.steps.length - 1);
  }

  goPrevStep(): void {
    this.activeStepIndex = Math.max(0, this.activeStepIndex - 1);
  }

  isLastStep(): boolean {
    return this.steps.length === 0 || this.activeStepIndex >= this.steps.length - 1;
  }

  canAdvanceCurrentStep(): boolean {
    const fieldNames = this.currentStepFieldNames();
    return fieldNames.every((name) => !this.form.get(name)?.invalid);
  }

  submit(): void {
    if (!this.isLastStep()) {
      this.goNextStep();
      return;
    }
    if (this.form.invalid) {
      this.formHelper.markAllAsTouched(this.form);
      return;
    }
    this.formSubmit.emit(this.form.value as Record<string, unknown>);
  }

  private currentStepFieldNames(): string[] {
    if (this.steps.length === 0) {
      return this.fields.map((field) => field.name);
    }
    const step = this.currentStep();
    if (!step) {
      return [];
    }
    const sectionIds = new Set(step.sectionIds ?? []);
    const explicit = new Set(step.fieldNames ?? []);
    const bySections = this.resolvedSections()
      .filter((section) => sectionIds.size === 0 || sectionIds.has(section.id))
      .flatMap((section) => section.fields.map((field) => field.name));
    return [...new Set([...bySections, ...explicit])];
  }

  private markCurrentStepTouched(): void {
    for (const name of this.currentStepFieldNames()) {
      this.form.get(name)?.markAsTouched();
    }
  }
}
