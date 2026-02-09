import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  FieldConfig,
  FormHelperService,
  FormSectionConfig,
  FormStepConfig,
} from '../../services/form-helper.service';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { UiFormFieldComponent } from '../ui-form-field/ui-form-field.component';
import { UiStepperComponent } from '../ui-stepper/ui-stepper.component';

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
  imports: [CommonModule, ReactiveFormsModule, UiFormFieldComponent, UiButtonComponent, UiStepperComponent],
  template: `
    @if (form) {
      <form [formGroup]="form" (ngSubmit)="onSubmit()" [class]="containerClass()">
        @if (steps().length > 0) {
          <ui-stepper
            [stepsData]="stepIndicatorData()"
            [showNavigation]="false"
            [disabled]="loading()"
            [submitText]="submitLabel()"
            [linear]="true"
            (stepChange)="onStepperChange($event)"
            (submitEvent)="onSubmit()"
          >
            <ng-container></ng-container>
          </ui-stepper>

          <div class="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-900/40">
            <p class="text-sm font-semibold text-stone-800 dark:text-stone-100">
              {{ activeStepTitle() }}
            </p>
            @if (activeStepDescription()) {
              <p class="mt-1 text-xs text-stone-600 dark:text-stone-300">{{ activeStepDescription() }}</p>
            }
          </div>
        }

        @for (section of visibleSections(); track section.id) {
          @if (section.title) {
            <div class="mb-3 border-b border-stone-200 pb-2 dark:border-stone-700">
              <h3 class="text-base font-semibold text-stone-900 dark:text-stone-100">{{ section.title }}</h3>
              @if (section.description) {
                <p class="mt-1 text-xs text-stone-600 dark:text-stone-300">{{ section.description }}</p>
              }
            </div>
          }

          <div [class]="getGridClass(section)">
            @for (field of section.fields; track field.name) {
              <div [class]="getFieldClass(field)">
                <ui-form-field
                  [label]="field.label"
                  [required]="field.required || false"
                  [hint]="field.hint"
                  [control]="form.get(field.name)"
                  [id]="field.name"
                >
                  @if (field.type === 'select') {
                    <select
                      [id]="field.name"
                      [formControlName]="field.name"
                      class="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-burgundy-500 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/5 dark:text-stone-100"
                      [class.border-red-300]="isInvalid(field.name)"
                    >
                      <option value="">Select {{ field.label }}</option>
                      @for (opt of field.options; track $index) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  } @else if (field.type === 'textarea') {
                    <textarea
                      [id]="field.name"
                      [formControlName]="field.name"
                      [placeholder]="field.placeholder || ''"
                      rows="4"
                      class="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-burgundy-500 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/5 dark:text-stone-100"
                      [class.border-red-300]="isInvalid(field.name)"
                    ></textarea>
                  } @else if (field.type === 'checkbox') {
                    <div class="flex items-center">
                      <input
                        [id]="field.name"
                        type="checkbox"
                        [formControlName]="field.name"
                        class="h-4 w-4 rounded border-stone-200 text-burgundy-700 transition-colors dark:border-white/8 dark:bg-white/5 dark:text-burgundy-300"
                      />
                      <label [for]="field.name" class="ml-2 block text-sm text-stone-700 dark:text-stone-300">
                        {{ field.placeholder || field.label }}
                      </label>
                    </div>
                  } @else {
                    <input
                      [id]="field.name"
                      [type]="field.type"
                      [formControlName]="field.name"
                      [placeholder]="field.placeholder || ''"
                      class="block w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-burgundy-500 focus:ring-burgundy-500/20 dark:border-white/8 dark:bg-white/5 dark:text-stone-100"
                      [class.border-red-300]="isInvalid(field.name)"
                    />
                  }
                </ui-form-field>
              </div>
            }
          </div>
        }

        <div class="flex items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-white/8">
          <div>
            @if (steps().length > 0) {
              <ui-button
                type="button"
                variant="ghost"
                [disabled]="activeStepIndex() === 0 || loading()"
                (onClick)="goPrevStep()"
              >
                Back
              </ui-button>
            }
          </div>
          <div class="flex items-center gap-3">
            @if (showCancel()) {
              <ui-button type="button" variant="ghost" (onClick)="cancel.emit()" [disabled]="loading()">
                Cancel
              </ui-button>
            }
            @if (steps().length > 0 && !isLastStep()) {
              <ui-button
                type="button"
                (onClick)="goNextStep()"
                [disabled]="!canAdvanceCurrentStep() || loading()"
              >
                Next
              </ui-button>
            } @else {
              <ui-button type="submit" [loading]="loading()" [disabled]="form.invalid || loading()">
                {{ submitLabel() }}
              </ui-button>
            }
          </div>
        </div>
      </form>
    }
  `,
})
export class DynamicFormComponent {
  fields = input.required<FieldConfig[]>();
  sections = input<FormSectionConfig[]>([]);
  steps = input<FormStepConfig[]>([]);
  container = input<FormContainer>('page');
  submitLabel = input('Save');
  showCancel = input(false);
  loading = input(false);
  initialValues = input<any>({});

  formSubmit = output<any>();
  cancel = output<void>();

  form!: FormGroup;
  private formHelper = inject(FormHelperService);
  private activeStep = signal(0);

  resolvedSections = computed<ResolvedSection[]>(() => {
    const fields = this.fields();
    const configuredSections = this.sections();
    const map = new Map<string, ResolvedSection>();

    for (const field of fields) {
      const sectionId = field.sectionId ?? field.section ?? 'default';
      if (!map.has(sectionId)) {
        const configured = configuredSections.find((s) => s.id === sectionId);
        map.set(sectionId, {
          id: sectionId,
          title: configured?.title ?? (field.sectionId ? undefined : field.section ?? undefined),
          description: configured?.description,
          columns: {
            base: configured?.columns?.base ?? 1,
            md: configured?.columns?.md ?? Math.max(configured?.columns?.base ?? field.columns ?? 1, 1) as 1 | 2 | 3,
            lg: configured?.columns?.lg ?? Math.max(configured?.columns?.md ?? field.columns ?? 1, 1) as 1 | 2 | 3,
          },
          fields: [],
        });
      }
      map.get(sectionId)!.fields.push(field);
    }

    return [...map.values()];
  });

  visibleSections = computed(() => {
    const sections = this.resolvedSections();
    const steps = this.steps();
    if (steps.length === 0) return sections;

    const active = steps[this.activeStep()];
    if (!active) return sections;

    const bySection = new Set(active.sectionIds ?? []);
    const byField = new Set(active.fieldNames ?? []);

    return sections
      .map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field) =>
            bySection.size === 0
              ? byField.size === 0 || byField.has(field.name)
              : bySection.has(section.id) || byField.has(field.name)
        ),
      }))
      .filter((section) => section.fields.length > 0);
  });

  activeStepIndex = computed(() => this.activeStep());
  isLastStep = computed(() => this.activeStep() >= this.steps().length - 1);
  activeStepTitle = computed(() => this.steps()[this.activeStep()]?.title ?? 'Form');
  activeStepDescription = computed(() => this.steps()[this.activeStep()]?.description ?? '');
  stepIndicatorData = computed(() =>
    this.steps().map((step) => ({
      title: step.title,
      subtitle: step.description,
    }))
  );

  constructor() {
    effect(() => {
      const fields = this.fields();
      this.form = this.formHelper.createForm(fields);

      const values = this.initialValues();
      if (values && Object.keys(values).length > 0) {
        this.form.patchValue(values, { emitEvent: false });
      }
      this.activeStep.set(0);
    });

    effect(() => {
      const values = this.initialValues();
      if (this.form && values && Object.keys(values).length > 0) {
        this.form.patchValue(values, { emitEvent: false });
      }
    });
  }

  containerClass() {
    switch (this.container()) {
      case 'modal':
        return 'space-y-5';
      case 'drawer':
        return 'space-y-6';
      default:
        return 'space-y-6';
    }
  }

  getGridClass(section: ResolvedSection): string {
    const baseMap: Record<1 | 2 | 3, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
    };
    const mdMap: Record<1 | 2 | 3, string> = {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
    };
    const lgMap: Record<1 | 2 | 3, string> = {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
    };
    return `grid ${baseMap[section.columns.base]} ${mdMap[section.columns.md]} ${lgMap[section.columns.lg]} gap-4`;
  }

  getFieldClass(field: FieldConfig): string {
    const colSpan = field.colSpan ?? (field.colspan as 1 | 2 | 3 | undefined) ?? 1;
    const rowSpan = field.rowSpan ?? 1;
    const colClass =
      colSpan === 3 ? 'md:col-span-2 lg:col-span-3' : colSpan === 2 ? 'md:col-span-2' : 'col-span-1';
    const rowClass = rowSpan === 2 ? 'row-span-2' : '';
    return `${colClass} ${rowClass}`.trim();
  }

  isInvalid(fieldName: string): boolean {
    const control = this.form?.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  private currentStepFieldNames(): string[] {
    const steps = this.steps();
    if (steps.length === 0) {
      return this.fields().map((f) => f.name);
    }
    const step = steps[this.activeStep()];
    if (!step) return [];

    const sectionIds = new Set(step.sectionIds ?? []);
    const explicit = new Set(step.fieldNames ?? []);
    if (sectionIds.size === 0 && explicit.size > 0) {
      return [...explicit];
    }
    const sectionFields = this.resolvedSections()
      .filter((s) => sectionIds.size === 0 || sectionIds.has(s.id))
      .flatMap((s) => s.fields.map((f) => f.name));
    return [...new Set([...sectionFields, ...explicit])];
  }

  canAdvanceCurrentStep(): boolean {
    const names = this.currentStepFieldNames();
    if (names.length === 0) return true;
    for (const name of names) {
      const control = this.form.get(name);
      if (control && control.invalid) {
        return false;
      }
    }
    return true;
  }

  goNextStep(): void {
    if (!this.canAdvanceCurrentStep()) {
      this.markCurrentStepTouched();
      return;
    }
    const next = Math.min(this.activeStep() + 1, Math.max(this.steps().length - 1, 0));
    this.activeStep.set(next);
  }

  goPrevStep(): void {
    this.activeStep.set(Math.max(this.activeStep() - 1, 0));
  }

  onStepperChange(index: number): void {
    if (index <= this.activeStep()) {
      this.activeStep.set(index);
    }
  }

  private markCurrentStepTouched() {
    for (const name of this.currentStepFieldNames()) {
      this.form.get(name)?.markAsTouched();
    }
  }

  onSubmit() {
    if (this.steps().length > 0 && !this.isLastStep() && !this.canAdvanceCurrentStep()) {
      this.markCurrentStepTouched();
      return;
    }
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    } else {
      this.formHelper.markAllAsTouched(this.form);
    }
  }
}
