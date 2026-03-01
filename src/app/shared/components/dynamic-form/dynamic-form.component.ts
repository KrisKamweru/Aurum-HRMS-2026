import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FieldConfig, FormHelperService, FormSectionConfig, FormStepConfig } from '../../services/form-helper.service';
import { UiFormFieldComponent } from '../ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../ui-button/ui-button.component';

type FormContainer = 'page' | 'modal' | 'drawer';

interface ResolvedSection {
  id: string;
  title?: string;
  description?: string;
  columns: { base: 1 | 2 | 3; md: 1 | 2 | 3; lg: 1 | 2 | 3 };
  fields: FieldConfig[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dynamic-form',
  imports: [CommonModule, ReactiveFormsModule, UiFormFieldComponent, UiButtonComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" [class]="containerClass()" class="relative">
      <!-- Steps Progress -->
      @if (steps().length > 1) {
        <div class="mb-8 flex items-center justify-between relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:w-full before:bg-slate-200 dark:before:bg-slate-800 before:-z-10">
          @for (step of steps(); track step.id; let i = $index) {
            <div class="flex flex-col items-center gap-2 z-10 bg-transparent px-2 relative">
              <button 
                type="button" 
                (click)="setStep(i)"
                [disabled]="i > activeStepIndex && (i > activeStepIndex + 1 || !canAdvanceCurrentStep())"
                class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 border-2 outline-none"
                [ngClass]="{
                  'bg-primary-600 border-primary-600 text-white shadow-md transform scale-110': i === activeStepIndex,
                  'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900/50 dark:border-primary-400 dark:text-primary-300': i < activeStepIndex,
                  'bg-slate-50 border-slate-300 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500': i > activeStepIndex
                }"
              >
                {{ i + 1 }}
              </button>
              <span class="text-xs font-semibold" [ngClass]="{'text-primary-700 dark:text-primary-400': i <= activeStepIndex, 'text-slate-400 dark:text-slate-500': i > activeStepIndex}">{{ step.title }}</span>
            </div>
          }
        </div>
      }

      <!-- Fields Sections -->
      <div class="space-y-8 min-h-[200px]">
        @for (section of visibleSections(); track section.id) {
          <div class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            @if (section.title || section.description) {
              <div class="border-b border-black/5 dark:border-white/5 pb-3">
                @if (section.title) { <h4 class="text-lg font-display font-medium text-slate-800 dark:text-slate-200">{{ section.title }}</h4> }
                @if (section.description) { <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ section.description }}</p> }
              </div>
            }
            <div [class]="getGridClass(section) + ' gap-6'">
              @for (field of section.fields; track field.name) {
                <div [class]="getFieldClass(field)">
                  @if (field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number' || field.type === 'date') {
                    <ui-form-field [label]="field.label" [required]="!!field.required" [hint]="field.placeholder" [error]="isInvalid(field.name) ? 'Invalid value' : ''" [control]="form.get(field.name)">
                      <input 
                        [type]="field.type" 
                        [formControlName]="field.name"
                        class="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface-elevated)] border border-white/60 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 glass-surface-hover shadow-sm"
                        [placeholder]="field.placeholder || ''"
                      />
                    </ui-form-field>
                  }
                  @if (field.type === 'select' && field.options) {
                    <ui-form-field [label]="field.label" [required]="!!field.required" [hint]="field.placeholder" [error]="isInvalid(field.name) ? 'Required' : ''" [control]="form.get(field.name)">
                      <select 
                        [formControlName]="field.name"
                        class="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface-elevated)] border border-white/60 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all glass-surface-hover appearance-none cursor-pointer shadow-sm"
                      >
                        <option value="" disabled selected>{{ field.placeholder || 'Select...' }}</option>
                        @for (opt of field.options; track opt.value) {
                          <option [value]="opt.value">{{ opt.label }}</option>
                        }
                      </select>
                    </ui-form-field>
                  }
                  @if (field.type === 'checkbox') {
                    <label class="flex items-center gap-3 cursor-pointer mt-8">
                      <input type="checkbox" [formControlName]="field.name" class="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 bg-[var(--color-bg-surface-elevated)] border-white/60 dark:border-white/10" />
                      <span class="text-sm font-medium text-slate-800 dark:text-slate-200">{{ field.label }}</span>
                    </label>
                  }
                  @if (field.type === 'textarea') {
                    <ui-form-field [label]="field.label" [required]="!!field.required" [hint]="field.placeholder" [error]="isInvalid(field.name) ? 'Required' : ''" [control]="form.get(field.name)">
                      <textarea 
                        [formControlName]="field.name"
                        rows="3"
                        class="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface-elevated)] border border-white/60 dark:border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-slate-400 glass-surface-hover shadow-sm resize-y"
                        [placeholder]="field.placeholder || ''"
                      ></textarea>
                    </ui-form-field>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
        <div>
          @if (showCancel()) {
            <ui-button type="button" variant="ghost" (click)="cancel.emit()">Cancel</ui-button>
          }
        </div>
        <div class="flex items-center gap-3">
          @if (steps().length > 1 && activeStepIndex > 0) {
            <ui-button type="button" variant="secondary" (click)="goPrevStep()">Back</ui-button>
          }
          <ui-button type="submit" variant="primary" [disabled]="loading()">
            @if (loading()) { <span class="animate-pulse">Loading...</span> } 
            @else { {{ isLastStep() ? submitLabel() : 'Next Step' }} }
          </ui-button>
        </div>
      </div>
    </form>
  `
})
export class DynamicFormComponent implements OnChanges {
  private readonly formHelper = inject(FormHelperService);

  readonly fields = input.required<FieldConfig[]>();
  readonly sections = input<FormSectionConfig[]>([]);
  readonly steps = input<FormStepConfig[]>([]);
  readonly container = input<FormContainer>('page');
  readonly submitLabel = input('Save');
  readonly showCancel = input(false);
  readonly loading = input(false);
  readonly initialValues = input<Record<string, unknown>>({});

  readonly formSubmit = output<Record<string, unknown>>();
  readonly cancel = output<void>();

  form!: FormGroup;
  activeStepIndex = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.form || changes['fields']) {
      this.form = this.formHelper.createForm(this.fields());
      this.activeStepIndex = 0;
    }
    const initialValues = this.initialValues();
    if (changes['initialValues'] && initialValues) {
      this.form.patchValue(initialValues, { emitEvent: false });
    }
  }

  containerClass(): string {
    const container = this.container();
    if (container === 'modal') {
      return 'space-y-5';
    }
    if (container === 'drawer') {
      return 'space-y-6';
    }
    return 'space-y-6';
  }

  currentStep(): FormStepConfig | undefined {
    return this.steps()[this.activeStepIndex];
  }

  resolvedSections(): ResolvedSection[] {
    const sectionMap = new Map<string, ResolvedSection>();
    for (const field of this.fields()) {
      const id = field.sectionId ?? 'default';
      if (!sectionMap.has(id)) {
        const config = this.sections().find((section) => section.id === id);
        sectionMap.set(id, {
          id,
          title: config?.title,
          description: config?.description,
          columns: {
            base: config?.columns?.base ?? 1,
            md: config?.columns?.md ?? (this.container() === 'modal' ? 2 : 2),
            lg: config?.columns?.lg ?? (this.container() === 'page' ? 3 : 2)
          },
          fields: []
        });
      }
      sectionMap.get(id)?.fields.push(field);
    }
    return [...sectionMap.values()];
  }

  visibleSections(): ResolvedSection[] {
    if (this.steps().length === 0) {
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
    } else if (index === this.activeStepIndex + 1 && this.canAdvanceCurrentStep()) {
      this.activeStepIndex = index;
    }
  }

  goNextStep(): void {
    if (!this.canAdvanceCurrentStep()) {
      this.markCurrentStepTouched();
      return;
    }
    this.activeStepIndex = Math.min(this.activeStepIndex + 1, this.steps().length - 1);
  }

  goPrevStep(): void {
    this.activeStepIndex = Math.max(0, this.activeStepIndex - 1);
  }

  isLastStep(): boolean {
    return this.steps().length === 0 || this.activeStepIndex >= this.steps().length - 1;
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
    if (this.steps().length === 0) {
      return this.fields().map((field) => field.name);
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


