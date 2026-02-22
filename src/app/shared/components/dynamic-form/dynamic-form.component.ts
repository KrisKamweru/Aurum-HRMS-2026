import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dynamic-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: ''
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


