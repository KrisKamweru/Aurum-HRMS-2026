import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { UiFormFieldComponent } from '../../../shared/components/ui-form-field/ui-form-field.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { ToastService } from '../../../shared/services/toast.service';
import { api } from '../../../../../convex/_generated/api';

@Component({
  selector: 'app-user-linking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiCardComponent,
    UiIconComponent,
    UiModalComponent,
    UiFormFieldComponent,
    UiBadgeComponent
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">User-Employee Linking</h1>
        <p class="mt-2 text-[15px] text-stone-600 dark:text-stone-400">Connect user accounts to employee records for full system access.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <!-- Unlinked Users -->
        <ui-card>
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ui-icon name="user" class="w-5 h-5 text-burgundy-700 dark:text-burgundy-200"></ui-icon>
              Unlinked Users
              @if (unlinkedUsers().length > 0) {
                <span class="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">{{ unlinkedUsers().length }}</span>
              }
            </h2>
          </div>

          @if (loading()) {
            <div class="space-y-3">
              <div class="h-16 bg-stone-100 dark:bg-white/5 rounded-xl animate-pulse"></div>
              <div class="h-16 bg-stone-100 dark:bg-white/5 rounded-xl animate-pulse"></div>
            </div>
          } @else if (unlinkedUsers().length === 0) {
            <div class="text-center py-8 text-stone-400 dark:text-stone-500">
              <ui-icon name="check-circle" class="w-8 h-8 mx-auto mb-2 text-green-500 dark:text-green-400"></ui-icon>
              <p>All users are linked to employee records</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (user of unlinkedUsers(); track user._id) {
                <div class="p-4 rounded-xl border border-stone-200 dark:border-white/8 bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl flex items-center justify-between group hover:border-burgundy-700/20 dark:hover:border-burgundy-700/40 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400 overflow-hidden">
                      @if (user.image) {
                        <img [src]="user.image" class="w-full h-full object-cover" alt="">
                      } @else {
                        <ui-icon name="user" class="w-5 h-5"></ui-icon>
                      }
                    </div>
                    <div>
                      <div class="font-medium text-stone-900 dark:text-stone-100">{{ user.name }}</div>
                      <div class="text-xs text-stone-500 dark:text-stone-400">{{ user.email }}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ui-button
                      variant="secondary"
                      size="sm"
                      (onClick)="openLinkModal(user)"
                    >
                      Link
                    </ui-button>
                    <ui-button
                      variant="primary"
                      size="sm"
                      (onClick)="openCreateModal(user)"
                    >
                      Create Employee
                    </ui-button>
                  </div>
                </div>
              }
            </div>
          }
        </ui-card>

        <!-- Unlinked Employees -->
        <ui-card>
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ui-icon name="identification" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></ui-icon>
              Unlinked Employees
              @if (unlinkedEmployees().length > 0) {
                <span class="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full">{{ unlinkedEmployees().length }}</span>
              }
            </h2>
          </div>

          @if (loading()) {
            <div class="space-y-3">
              <div class="h-16 bg-stone-100 dark:bg-white/5 rounded-xl animate-pulse"></div>
              <div class="h-16 bg-stone-100 dark:bg-white/5 rounded-xl animate-pulse"></div>
            </div>
          } @else if (unlinkedEmployees().length === 0) {
            <div class="text-center py-8 text-stone-400 dark:text-stone-500">
              <ui-icon name="check-circle" class="w-8 h-8 mx-auto mb-2 text-green-500 dark:text-green-400"></ui-icon>
              <p>All employees have linked user accounts</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (emp of unlinkedEmployees(); track emp._id) {
                <div class="p-4 rounded-xl border border-stone-200 dark:border-white/8 bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <ui-icon name="identification" class="w-5 h-5"></ui-icon>
                    </div>
                    <div>
                      <div class="font-medium text-stone-900 dark:text-stone-100">{{ emp.firstName }} {{ emp.lastName }}</div>
                      <div class="text-xs text-stone-500 dark:text-stone-400">{{ emp.email }}</div>
                    </div>
                  </div>
                  <ui-badge [variant]="emp.status === 'active' ? 'success' : 'warning'" size="sm">
                    {{ emp.status | titlecase }}
                  </ui-badge>
                </div>
              }
            </div>
          }
        </ui-card>
      </div>

      <!-- Link Modal -->
      <ui-modal
        [(isOpen)]="showLinkModal"
        title="Link User to Employee"
      >
        <div class="space-y-4">
          @if (selectedUser()) {
            <div class="p-3 bg-stone-50 dark:bg-white/5 dark:backdrop-blur-xl rounded-xl border border-stone-200 dark:border-white/8">
              <div class="text-xs text-stone-500 dark:text-stone-400 mb-1">User</div>
              <div class="font-medium text-stone-900 dark:text-stone-100">{{ selectedUser()?.name }}</div>
              <div class="text-sm text-stone-500 dark:text-stone-400">{{ selectedUser()?.email }}</div>
            </div>
          }

          <div>
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Select Employee to Link</label>
            <select
              [(ngModel)]="selectedEmployeeId"
              class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-4 py-3 border bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl dark:text-stone-100 focus:bg-white dark:focus:bg-white/5"
            >
              <option value="">Select an employee...</option>
              @for (emp of unlinkedEmployees(); track emp._id) {
                <option [value]="emp._id">{{ emp.firstName }} {{ emp.lastName }} ({{ emp.email }})</option>
              }
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-white/5">
            <ui-button variant="ghost" (onClick)="showLinkModal.set(false)">
              Cancel
            </ui-button>
            <ui-button
              variant="primary"
              [loading]="submitting()"
              [disabled]="!selectedEmployeeId || submitting()"
              (onClick)="linkUser()"
            >
              Link
            </ui-button>
          </div>
        </div>
      </ui-modal>

      <!-- Create Employee Modal -->
      <ui-modal
        [(isOpen)]="showCreateModal"
        title="Create Employee Record"
      >
        <form [formGroup]="createForm" (ngSubmit)="createEmployee()" class="space-y-4">
          @if (selectedUser()) {
            <div class="p-3 bg-stone-50 dark:bg-white/5 dark:backdrop-blur-xl rounded-xl border border-stone-200 dark:border-white/8">
              <div class="text-xs text-stone-500 dark:text-stone-400 mb-1">Creating employee for</div>
              <div class="font-medium text-stone-900 dark:text-stone-100">{{ selectedUser()?.name }}</div>
              <div class="text-sm text-stone-500 dark:text-stone-400">{{ selectedUser()?.email }}</div>
            </div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ui-form-field
              label="First Name"
              [control]="createForm.get('firstName')"
              id="firstName"
              [required]="true"
            >
              <input
                type="text"
                id="firstName"
                formControlName="firstName"
                class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-4 py-3 border bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl dark:text-stone-100 focus:bg-white dark:focus:bg-white/5"
              />
            </ui-form-field>

            <ui-form-field
              label="Last Name"
              [control]="createForm.get('lastName')"
              id="lastName"
              [required]="true"
            >
              <input
                type="text"
                id="lastName"
                formControlName="lastName"
                class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-4 py-3 border bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl dark:text-stone-100 focus:bg-white dark:focus:bg-white/5"
              />
            </ui-form-field>
          </div>

          <ui-form-field
            label="Department"
            [control]="createForm.get('departmentId')"
            id="departmentId"
          >
            <select
              id="departmentId"
              formControlName="departmentId"
              class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-4 py-3 border bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl dark:text-stone-100 focus:bg-white dark:focus:bg-white/5"
            >
              <option value="">Select department (optional)</option>
              @for (dept of departments(); track dept._id) {
                <option [value]="dept._id">{{ dept.name }}</option>
              }
            </select>
          </ui-form-field>

          <ui-form-field
            label="Designation"
            [control]="createForm.get('designationId')"
            id="designationId"
          >
            <select
              id="designationId"
              formControlName="designationId"
              class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-4 py-3 border bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl dark:text-stone-100 focus:bg-white dark:focus:bg-white/5"
            >
              <option value="">Select designation (optional)</option>
              @for (desig of designations(); track desig._id) {
                <option [value]="desig._id">{{ desig.title }}</option>
              }
            </select>
          </ui-form-field>

          <ui-form-field
            label="Start Date"
            [control]="createForm.get('startDate')"
            id="startDate"
            [required]="true"
          >
            <input
              type="date"
              id="startDate"
              formControlName="startDate"
              class="block w-full rounded-xl border-stone-200 dark:border-white/8 shadow-sm focus:border-burgundy-700 focus:ring-burgundy-700 sm:text-sm px-4 py-3 border bg-stone-50/50 dark:bg-white/5 dark:backdrop-blur-xl dark:text-stone-100 focus:bg-white dark:focus:bg-white/5"
            />
          </ui-form-field>

          <div class="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-white/5">
            <ui-button type="button" variant="ghost" (onClick)="showCreateModal.set(false)">
              Cancel
            </ui-button>
            <ui-button
              type="submit"
              variant="primary"
              [loading]="submitting()"
              [disabled]="createForm.invalid || submitting()"
            >
              Create & Link
            </ui-button>
          </div>
        </form>
      </ui-modal>
    </div>
  `
})
export class UserLinkingComponent implements OnInit, OnDestroy {
  private convex = inject(ConvexClientService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  unlinkedUsers = signal<any[]>([]);
  unlinkedEmployees = signal<any[]>([]);
  departments = signal<any[]>([]);
  designations = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);

  showLinkModal = signal(false);
  showCreateModal = signal(false);
  selectedUser = signal<any>(null);
  selectedEmployeeId = '';

  createForm: FormGroup;

  private unsubUsers: (() => void) | null = null;
  private unsubEmployees: (() => void) | null = null;
  private unsubDepts: (() => void) | null = null;
  private unsubDesigs: (() => void) | null = null;

  constructor() {
    this.createForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      departmentId: [''],
      designationId: [''],
      startDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  ngOnInit() {
    const client = this.convex.getClient();

    this.unsubUsers = client.onUpdate(api.users.getUnlinkedUsers, {}, (data) => {
      this.unlinkedUsers.set(data);
      this.loading.set(false);
    });

    this.unsubEmployees = client.onUpdate(api.users.getUnlinkedEmployees, {}, (data) => {
      this.unlinkedEmployees.set(data);
    });

    this.unsubDepts = client.onUpdate(api.organization.listDepartments, {}, (data) => {
      this.departments.set(data);
    });

    this.unsubDesigs = client.onUpdate(api.organization.listDesignations, {}, (data) => {
      this.designations.set(data);
    });
  }

  ngOnDestroy() {
    this.unsubUsers?.();
    this.unsubEmployees?.();
    this.unsubDepts?.();
    this.unsubDesigs?.();
  }

  openLinkModal(user: any) {
    this.selectedUser.set(user);
    this.selectedEmployeeId = '';
    this.showLinkModal.set(true);
  }

  openCreateModal(user: any) {
    this.selectedUser.set(user);
    // Pre-fill name from user
    const nameParts = (user.name || '').split(' ');
    this.createForm.patchValue({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      startDate: new Date().toISOString().split('T')[0]
    });
    this.showCreateModal.set(true);
  }

  async linkUser() {
    if (!this.selectedUser() || !this.selectedEmployeeId) return;

    this.submitting.set(true);
    try {
      await this.convex.getClient().mutation(api.users.linkUserToEmployee, {
        userId: this.selectedUser()._id,
        employeeId: this.selectedEmployeeId as any
      });
      this.toastService.success('User linked to employee successfully');
      this.showLinkModal.set(false);
      this.selectedUser.set(null);
      this.selectedEmployeeId = '';
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to link user');
    } finally {
      this.submitting.set(false);
    }
  }

  async createEmployee() {
    if (!this.selectedUser() || this.createForm.invalid) return;

    this.submitting.set(true);
    try {
      const formValue = this.createForm.value;
      await this.convex.getClient().mutation(api.users.createEmployeeForUser, {
        userId: this.selectedUser()._id,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        departmentId: formValue.departmentId || undefined,
        designationId: formValue.designationId || undefined,
        startDate: formValue.startDate
      });
      this.toastService.success('Employee created and linked successfully');
      this.showCreateModal.set(false);
      this.selectedUser.set(null);
      this.createForm.reset({
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to create employee');
    } finally {
      this.submitting.set(false);
    }
  }
}
