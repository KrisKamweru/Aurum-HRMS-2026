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
  selector: 'app-job-form',
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
          <h1 class="heading-accent">{{ isEditing() ? 'Edit Job' : 'Post New Job' }}</h1>
          <p class="text-stone-500 mt-1">
            {{ isEditing() ? 'Update job details and requirements.' : 'Create a new opening to start recruiting.' }}
          </p>
        </div>
        <ui-button variant="ghost" routerLink="/recruitment/jobs">
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
            [submitLabel]="isEditing() ? 'Update Job' : 'Post Job'"
            (formSubmit)="onSubmit($event)"
            [showCancel]="false"
          ></app-dynamic-form>
        }
      </ui-card>
    </div>
  `
})
export class JobFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  jobId = signal<string | null>(null);
  isEditing = computed(() => !!this.jobId());
  loading = signal(true);
  submitting = signal(false);
  initialValues = signal<any>({});

  // Dropdown data
  departments = signal<any[]>([]);
  locations = signal<any[]>([]);

  formConfig: FieldConfig[] = [
    { name: 'title', label: 'Job Title', type: 'text', required: true, placeholder: 'e.g. Senior Software Engineer' },
    {
      name: 'departmentId',
      label: 'Department',
      type: 'select',
      required: true,
      options: []
    },
    {
      name: 'locationId',
      label: 'Location',
      type: 'select',
      required: false,
      options: []
    },
    {
      name: 'employmentType',
      label: 'Employment Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Full Time', value: 'full_time' },
        { label: 'Part Time', value: 'part_time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'intern' },
        { label: 'Temporary', value: 'temporary' }
      ]
    },
    { name: 'salaryRange', label: 'Salary Range', type: 'text', placeholder: 'e.g. $80,000 - $100,000' },
    { name: 'closingDate', label: 'Closing Date', type: 'date' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Open (Published)', value: 'open' },
        { label: 'Closed', value: 'closed' }
      ]
    },
    { name: 'description', label: 'Job Description', type: 'textarea', required: true, placeholder: 'Detailed description of the role, responsibilities, and requirements...' }
  ];

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.jobId.set(params['id']);
      }
    });

    this.loadData();
  }

  async loadData() {
    const client = this.convex.getClient();

    // Load deps
    const depts = await client.query(api.organization.listDepartments, {});
    const locs = await client.query(api.organization.listLocations, {});

    this.departments.set(depts);
    this.locations.set(locs);
    this.updateConfigs();

    // Load job if editing
    if (this.isEditing()) {
      const job = await client.query(api.recruitment.getJob, { id: this.jobId() as Id<"jobs"> });
      if (job) {
        this.initialValues.set(job);
      } else {
        this.toast.error('Job not found');
        this.router.navigate(['/recruitment/jobs']);
      }
    } else {
      // Defaults for new job
      this.initialValues.set({ status: 'draft', employmentType: 'full_time' });
    }

    this.loading.set(false);
  }

  updateConfigs() {
    this.formConfig = this.formConfig.map(field => {
      if (field.name === 'departmentId') {
        return { ...field, options: this.departments().map(d => ({ label: d.name, value: d._id })) };
      }
      if (field.name === 'locationId') {
        return { ...field, options: this.locations().map(l => ({ label: l.name, value: l._id })) };
      }
      return field;
    });
  }

  async onSubmit(formData: any) {
    this.submitting.set(true);
    try {
      const client = this.convex.getClient();
      const payload = {
        title: formData.title,
        description: formData.description,
        departmentId: formData.departmentId,
        locationId: formData.locationId,
        employmentType: formData.employmentType,
        salaryRange: formData.salaryRange,
        closingDate: formData.closingDate,
        status: formData.status
      };

      if (this.isEditing()) {
        await client.mutation(api.recruitment.updateJob, {
          id: this.jobId() as Id<"jobs">,
          updates: payload
        });
        this.toast.success('Job updated successfully');
      } else {
        await client.mutation(api.recruitment.createJob, payload);
        this.toast.success('Job posted successfully');
      }
      this.router.navigate(['/recruitment/jobs']);
    } catch (error: any) {
      console.error('Error saving job:', error);
      this.toast.error(error.message || 'Failed to save job');
    } finally {
      this.submitting.set(false);
    }
  }
}
