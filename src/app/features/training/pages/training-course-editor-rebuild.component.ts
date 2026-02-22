import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { FieldConfig, FormSectionConfig, FormStepConfig } from '../../../shared/services/form-helper.service';
import { TrainingRebuildStore } from '../data/training-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-training-course-editor-rebuild',
  imports: [UiButtonComponent, DynamicFormComponent],
  template: ''
})
export class TrainingCourseEditorRebuildComponent implements OnInit {
  private readonly store = inject(TrainingRebuildStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly selectedCourse = this.store.selectedCourse;
  readonly error = this.store.error;
  readonly catalogLoading = this.store.catalogLoading;
  readonly detailLoading = this.store.detailLoading;
  readonly isSaving = this.store.isSaving;

  readonly courseId = signal<string | null>(null);
  readonly initialValues = signal<Record<string, unknown>>({});

  readonly isEditing = computed(() => this.courseId() !== null);
  readonly isLoading = computed(() => this.catalogLoading() || this.detailLoading());

  readonly courseSections: FormSectionConfig[] = [
    {
      id: 'identity',
      title: 'Course identity',
      description: 'Core details and ownership metadata',
      columns: { base: 1, md: 2, lg: 2 }
    },
    {
      id: 'schedule',
      title: 'Schedule and status',
      description: 'Timing, format, and enrollment constraints',
      columns: { base: 1, md: 2, lg: 2 }
    }
  ];

  readonly courseSteps: FormStepConfig[] = [
    { id: 'course-step-1', title: 'Identity', sectionIds: ['identity'] },
    { id: 'course-step-2', title: 'Schedule', sectionIds: ['schedule'] }
  ];

  readonly courseFields: FieldConfig[] = [
    { name: 'title', label: 'Course Title', type: 'text', sectionId: 'identity', required: true, colSpan: 2 },
    { name: 'instructor', label: 'Instructor', type: 'text', sectionId: 'identity', required: false },
    {
      name: 'type',
      label: 'Course Type',
      type: 'select',
      sectionId: 'identity',
      required: true,
      options: [
        { label: 'Workshop', value: 'workshop' },
        { label: 'Seminar', value: 'seminar' },
        { label: 'Online', value: 'online' },
        { label: 'Other', value: 'other' }
      ]
    },
    { name: 'startDate', label: 'Start Date', type: 'date', sectionId: 'schedule', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', sectionId: 'schedule', required: true },
    { name: 'capacity', label: 'Capacity', type: 'number', sectionId: 'schedule', required: false },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      sectionId: 'schedule',
      required: true,
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ]
    },
    { name: 'description', label: 'Description', type: 'textarea', sectionId: 'schedule', required: true, colSpan: 2 }
  ];

  ngOnInit(): void {
    this.courseId.set(this.route.snapshot.paramMap.get('id'));
    void this.reload();
  }

  async reload(): Promise<void> {
    await this.store.loadCatalog();
    if (!this.isEditing()) {
      this.initialValues.set({
        type: 'workshop',
        status: 'upcoming'
      });
      return;
    }

    await this.store.loadCourseDetail(this.courseId() ?? '');
    const course = this.selectedCourse();
    if (!course) {
      return;
    }

    this.initialValues.set({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      startDate: course.startDate,
      endDate: course.endDate,
      type: course.type,
      status: course.status,
      capacity: course.capacity
    });
  }

  async save(payload: Record<string, unknown>): Promise<void> {
    const draft = {
      title: this.readText(payload, 'title'),
      description: this.readText(payload, 'description'),
      instructor: this.readText(payload, 'instructor'),
      startDate: this.readText(payload, 'startDate'),
      endDate: this.readText(payload, 'endDate'),
      type: this.readText(payload, 'type'),
      status: this.readText(payload, 'status'),
      capacity: this.readOptionalNumber(payload['capacity'])
    };

    if (this.isEditing()) {
      const success = await this.store.updateCourse({ id: this.courseId() ?? '', ...draft });
      if (success) {
        this.backToCatalog();
      }
      return;
    }

    const id = await this.store.createCourse(draft);
    if (id) {
      this.backToCatalog();
    }
  }

  backToCatalog(): void {
    void this.router.navigate(['/training/catalog']);
  }

  private readText(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  private readOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
