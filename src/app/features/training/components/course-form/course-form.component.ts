import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../../shared/services/form-helper.service';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiCardComponent,
    DynamicFormComponent
  ],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="heading-accent">{{ isEditing() ? 'Edit Course' : 'Create New Course' }}</h1>
          <p class="text-stone-500 mt-1">
            {{ isEditing() ? 'Update course details and schedule.' : 'Add a new training opportunity for employees.' }}
          </p>
        </div>
        <ui-button variant="ghost" routerLink="/training/catalog">
          Cancel
        </ui-button>
      </div>

      <ui-card>
        @if (loading()) {
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        } @else {
          <app-dynamic-form
            [fields]="formConfig"
            [initialValues]="initialValues()"
            [loading]="submitting()"
            [submitLabel]="isEditing() ? 'Update Course' : 'Create Course'"
            (formSubmit)="onSubmit($event)"
            [showCancel]="false"
          ></app-dynamic-form>
        }
      </ui-card>
    </div>
  `
})
export class CourseFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  courseId = signal<string | null>(null);
  isEditing = computed(() => !!this.courseId());
  loading = signal(true);
  submitting = signal(false);
  initialValues = signal<any>({});

  formConfig: FieldConfig[] = [
    { name: 'title', label: 'Course Title', type: 'text', required: true, placeholder: 'e.g. Leadership 101' },
    { name: 'instructor', label: 'Instructor/Provider', type: 'text', placeholder: 'e.g. Jane Doe or LinkedIn Learning' },
    {
      name: 'type',
      label: 'Format',
      type: 'select',
      required: true,
      options: [
        { label: 'Workshop (In-person)', value: 'workshop' },
        { label: 'Seminar', value: 'seminar' },
        { label: 'Online Course', value: 'online' },
        { label: 'Other', value: 'other' }
      ]
    },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'capacity', label: 'Capacity (Optional)', type: 'number', placeholder: 'Max participants' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' }
      ]
    },
    { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Course objectives and details...' }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.courseId.set(params['id']);
        this.loadCourse(params['id']);
      } else {
        this.initialValues.set({ status: 'upcoming', type: 'workshop' });
        this.loading.set(false);
      }
    });
  }

  async loadCourse(id: string) {
    try {
      const client = this.convex.getClient();
      const course = await client.query(api.training.getCourse, { id: id as Id<"training_courses"> });
      if (course) {
        this.initialValues.set(course);
      } else {
        this.toast.error('Course not found');
        this.router.navigate(['/training/catalog']);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      this.toast.error('Failed to load course details');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    try {
      const client = this.convex.getClient();
      const payload = {
        title: formData.title,
        description: formData.description,
        instructor: formData.instructor || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
        status: formData.status,
        capacity: formData.capacity ? Number(formData.capacity) : undefined
      };

      if (this.isEditing()) {
        await client.mutation(api.training.updateCourse, {
          id: this.courseId() as Id<"training_courses">,
          updates: payload
        });
        this.toast.success('Course updated successfully');
      } else {
        await client.mutation(api.training.createCourse, payload);
        this.toast.success('Course created successfully');
      }
      this.router.navigate(['/training/catalog']);
    } catch (error: any) {
      console.error('Error saving course:', error);
      this.toast.error(error.message || 'Failed to save course');
    } finally {
      this.submitting.set(false);
    }
  }
}
