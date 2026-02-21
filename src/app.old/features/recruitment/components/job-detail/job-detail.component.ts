import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiBadgeComponent, BadgeVariant } from '../../../../shared/components/ui-badge/ui-badge.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { UiFormFieldComponent } from '../../../../shared/components/ui-form-field/ui-form-field.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { UiGridComponent } from '../../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiIconComponent,
    UiBadgeComponent,
    UiModalComponent,
    UiFormFieldComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Back Link -->
      <a routerLink="/recruitment/jobs" class="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-300 transition-colors">
        <ui-icon name="arrow-left" class="w-4 h-4 mr-1"></ui-icon>
        Back to Jobs
      </a>

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      } @else if (!job()) {
        <div class="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700">
          <ui-icon name="exclamation-circle" class="w-12 h-12 text-stone-400 mx-auto mb-3"></ui-icon>
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100">Job Not Found</h3>
          <p class="text-stone-500 dark:text-stone-400 mt-1">The job posting you are looking for does not exist or has been removed.</p>
        </div>
      } @else {
        <!-- Job Header -->
        <div class="dash-frame">
          <ui-grid [columns]="'1fr'" [gap]="'0px'">
            <ui-grid-tile title="Job Overview" variant="compact">
              <div class="tile-body">
                <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div>
                    <div class="flex items-center gap-3 mb-3">
                      <h1 class="text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">{{ job().title }}</h1>
                      <ui-badge [variant]="getStatusVariant(job().status)">
                        {{ job().status | titlecase }}
                      </ui-badge>
                    </div>

                    <div class="flex flex-wrap gap-4 text-sm text-stone-600 dark:text-stone-400">
                      <div class="flex items-center gap-1.5">
                        <ui-icon name="building-office" class="w-4 h-4"></ui-icon>
                        {{ job().departmentName }}
                      </div>
                      <div class="flex items-center gap-1.5">
                        <ui-icon name="map-pin" class="w-4 h-4"></ui-icon>
                        {{ job().locationName }}
                      </div>
                      <div class="flex items-center gap-1.5">
                        <ui-icon name="briefcase" class="w-4 h-4"></ui-icon>
                        {{ formatType(job().employmentType) }}
                      </div>
                      <div class="flex items-center gap-1.5">
                        <ui-icon name="banknotes" class="w-4 h-4"></ui-icon>
                        {{ job().salaryRange || 'Competitive' }}
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-3 shrink-0">
                    @if (canManage()) {
                      <ui-button variant="outline" [routerLink]="['/recruitment/jobs', job()._id, 'edit']">
                        <ui-icon name="pencil" class="w-4 h-4 mr-2"></ui-icon>
                        Edit Job
                      </ui-button>
                    }
                    <ui-button (onClick)="openApplyModal()" [disabled]="job().status !== 'open'">
                      Apply Now
                    </ui-button>
                  </div>
                </div>

                <hr class="my-8 border-stone-100 dark:border-stone-700">

                <!-- Job Description -->
                <div class="prose dark:prose-invert max-w-none text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                  {{ job().description }}
                </div>
              </div>
            </ui-grid-tile>
          </ui-grid>
        </div>
      }

      <!-- Application Modal -->
      <ui-modal [(isOpen)]="isApplyModalOpen" title="Apply for {{ job()?.title }}">
        <form [formGroup]="applyForm" (ngSubmit)="submitApplication()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ui-form-field label="First Name" [error]="getErrorMessage('firstName')">
              <input type="text" formControlName="firstName" class="form-input" placeholder="John">
            </ui-form-field>
            <ui-form-field label="Last Name" [error]="getErrorMessage('lastName')">
              <input type="text" formControlName="lastName" class="form-input" placeholder="Doe">
            </ui-form-field>
          </div>

          <ui-form-field label="Email" [error]="getErrorMessage('email')">
            <input type="email" formControlName="email" class="form-input" placeholder="john.doe@example.com">
          </ui-form-field>

          <ui-form-field label="Phone (Optional)" [error]="getErrorMessage('phone')">
            <input type="tel" formControlName="phone" class="form-input" placeholder="+1 555-0123">
          </ui-form-field>

          <ui-form-field label="Resume/CV (PDF)" [error]="resumeError()">
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-300 dark:border-stone-600 border-dashed rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer relative">
              <input type="file" (change)="onFileSelected($event)" accept=".pdf" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              <div class="space-y-1 text-center">
                <ui-icon name="document" class="mx-auto h-12 w-12 text-stone-400"></ui-icon>
                <div class="flex text-sm text-stone-600 dark:text-stone-400 justify-center">
                  <span class="font-medium text-primary-600 dark:text-primary-400">Upload a file</span>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-stone-500 dark:text-stone-500">PDF up to 5MB</p>
                @if (selectedFile) {
                  <p class="text-sm text-emerald-600 font-medium mt-2">{{ selectedFile.name }}</p>
                }
              </div>
            </div>
          </ui-form-field>

          <ui-form-field label="Additional Notes" [error]="getErrorMessage('notes')">
            <textarea formControlName="notes" rows="3" class="form-textarea" placeholder="Why are you a good fit for this role?"></textarea>
          </ui-form-field>

          <div class="flex justify-end gap-3 pt-4">
            <ui-button variant="ghost" type="button" (onClick)="isApplyModalOpen.set(false)">Cancel</ui-button>
            <ui-button type="submit" [loading]="submitting()">Submit Application</ui-button>
          </div>
        </form>
      </ui-modal>
    </div>
  `,
  styles: [`
    .form-input, .form-textarea {
      display: block;
      width: 100%;
      border-radius: 0.75rem;
      border-color: #e5e7eb;
      background-color: rgba(249, 250, 251, 0.5);
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #1f2937;
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
    }
    :host-context(.dark) .form-input, :host-context(.dark) .form-textarea {
      background-color: rgba(31, 41, 55, 0.5);
      border-color: #374151;
      color: #f3f4f6;
    }
    .form-input:focus, .form-textarea:focus {
      outline: 2px solid transparent;
      outline-offset: 2px;
      --tw-ring-offset-width: 0px;
      --tw-ring-color: #8b1e3f;
      --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
      --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
      box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
      border-color: transparent;
      background-color: #ffffff;
    }
    :host-context(.dark) .form-input:focus, :host-context(.dark) .form-textarea:focus {
      background-color: #1f2937;
    }
  `]
})
export class JobDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private convex = inject(ConvexClientService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  jobId = signal<string | null>(null);
  job = signal<any>(null);
  loading = signal(true);
  submitting = signal(false);
  isApplyModalOpen = signal(false);
  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

  // File upload
  selectedFile: File | null = null;
  resumeError = signal<string>('');

  applyForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    notes: ['']
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.jobId.set(params['id']);
        this.loadJob(params['id']);
      }
    });

    // Pre-fill form if logged in
    const user = this.authService.getUser()();
    if (user) {
      // Split name if possible
      const parts = (user.name || '').split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      this.applyForm.patchValue({
        firstName,
        lastName,
        email: user.email || ''
      });
    }
  }

  async loadJob(id: string) {
    this.loading.set(true);
    try {
      const client = this.convex.getClient();
      const jobData = await client.query(api.recruitment.getJob, { id: id as Id<"jobs"> });
      this.job.set(jobData);
    } catch (e) {
      console.error('Failed to load job', e);
    } finally {
      this.loading.set(false);
    }
  }

  openApplyModal() {
    this.isApplyModalOpen.set(true);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        this.resumeError.set('Only PDF files are allowed');
        this.selectedFile = null;
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.resumeError.set('File size must be less than 5MB');
        this.selectedFile = null;
        return;
      }
      this.resumeError.set('');
      this.selectedFile = file;
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.applyForm.get(controlName);
    if (control?.touched && control?.invalid) {
      if (control.errors?.['required']) return 'This field is required';
      if (control.errors?.['email']) return 'Invalid email address';
    }
    return '';
  }

  async submitApplication() {
    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    try {
      const client = this.convex.getClient();
      let resumeId: Id<"_storage"> | undefined = undefined;

      // 1. Upload Resume if selected
      if (this.selectedFile) {
        // Reuse upload logic: Get URL then upload
        const postUrl = await client.mutation(api.employee_details.generateUploadUrl, {});

        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": this.selectedFile.type },
          body: this.selectedFile,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const { storageId } = await result.json();
        resumeId = storageId;
      }

      // 2. Submit Application
      const formValue = this.applyForm.value;
      await client.mutation(api.recruitment.submitApplication, {
        jobId: this.jobId() as Id<"jobs">,
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        email: formValue.email!,
        phone: formValue.phone || undefined,
        notes: formValue.notes || undefined,
        resumeId: resumeId
      });

      this.toast.success('Application submitted successfully!');
      this.isApplyModalOpen.set(false);
      this.applyForm.reset();
      this.selectedFile = null;

    } catch (error: any) {
      console.error('Application error:', error);
      this.toast.error(error.message || 'Failed to submit application');
    } finally {
      this.submitting.set(false);
    }
  }

  getStatusVariant(status: string): BadgeVariant {
    switch (status) {
      case 'open': return 'success';
      case 'draft': return 'neutral';
      case 'closed': return 'danger';
      default: return 'neutral';
    }
  }

  formatType(type: string): string {
    return type?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || '';
  }
}
