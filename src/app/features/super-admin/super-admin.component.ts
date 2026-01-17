import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { UiFormFieldComponent } from '../../shared/components/ui-form-field/ui-form-field.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { ToastService } from '../../shared/services/toast.service';
import { api } from '../../../../convex/_generated/api';

@Component({
  selector: 'app-super-admin',
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
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="heading-accent text-2xl">Super Admin Dashboard</h1>
          <p class="mt-1 text-stone-500">Manage all organizations and system-wide settings</p>
        </div>
        <ui-button (onClick)="openCreateModal()">
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          Create Organization
        </ui-button>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ui-card accent="bg-[#8b1e3f]">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">Organizations</p>
              <h3 class="text-2xl font-bold mt-1 text-stone-800">{{ stats()?.totalOrganizations || 0 }}</h3>
            </div>
            <div class="p-2 bg-stone-100 rounded-lg text-[#8b1e3f]">
              <ui-icon name="building-office-2" class="w-5 h-5"></ui-icon>
            </div>
          </div>
          <div class="mt-3 text-xs text-stone-500">
            <span class="text-green-600">{{ stats()?.activeOrganizations || 0 }} active</span>
            <span class="mx-1">·</span>
            <span class="text-amber-600">{{ stats()?.suspendedOrganizations || 0 }} suspended</span>
          </div>
        </ui-card>

        <ui-card accent="bg-indigo-500">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">Total Users</p>
              <h3 class="text-2xl font-bold mt-1 text-stone-800">{{ stats()?.totalUsers || 0 }}</h3>
            </div>
            <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <ui-icon name="users" class="w-5 h-5"></ui-icon>
            </div>
          </div>
          <div class="mt-3 text-xs text-stone-500">
            <span class="text-green-600">{{ stats()?.activeUsers || 0 }} active</span>
            <span class="mx-1">·</span>
            <span class="text-amber-600">{{ stats()?.pendingUsers || 0 }} pending</span>
          </div>
        </ui-card>

        <ui-card accent="bg-emerald-500">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">Total Employees</p>
              <h3 class="text-2xl font-bold mt-1 text-stone-800">{{ stats()?.totalEmployees || 0 }}</h3>
            </div>
            <div class="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ui-icon name="identification" class="w-5 h-5"></ui-icon>
            </div>
          </div>
          <div class="mt-3 text-xs text-stone-500">
            Across all organizations
          </div>
        </ui-card>

        <ui-card accent="bg-amber-500">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-stone-500">Pending Users</p>
              <h3 class="text-2xl font-bold mt-1 text-stone-800">{{ stats()?.pendingUsers || 0 }}</h3>
            </div>
            <div class="p-2 bg-amber-50 rounded-lg text-amber-600">
              <ui-icon name="clock" class="w-5 h-5"></ui-icon>
            </div>
          </div>
          <div class="mt-3 text-xs text-stone-500">
            Awaiting organization assignment
          </div>
        </ui-card>
      </div>

      <!-- Organizations Table -->
      <ui-card>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-stone-900">All Organizations</h2>
        </div>

        @if (loading()) {
          <div class="space-y-3">
            <div class="h-16 bg-stone-100 rounded-xl animate-pulse"></div>
            <div class="h-16 bg-stone-100 rounded-xl animate-pulse"></div>
            <div class="h-16 bg-stone-100 rounded-xl animate-pulse"></div>
          </div>
        } @else if (organizations().length === 0) {
          <div class="text-center py-12 text-stone-400">
            <ui-icon name="building-office-2" class="w-12 h-12 mx-auto mb-3"></ui-icon>
            <p class="font-medium">No organizations yet</p>
            <p class="text-sm mt-1">Create your first organization to get started</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-stone-200">
                  <th class="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Organization</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Plan</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Users</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Employees</th>
                  <th class="text-center py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Pending</th>
                  <th class="text-right py-3 px-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100">
                @for (org of organizations(); track org._id) {
                  <tr class="hover:bg-stone-50 transition-colors">
                    <td class="py-4 px-4">
                      <div class="font-medium text-stone-900">{{ org.name }}</div>
                      @if (org.domain) {
                        <div class="text-xs text-stone-500">{{ org.domain }}</div>
                      }
                    </td>
                    <td class="py-4 px-4">
                      <ui-badge [variant]="org.status === 'active' ? 'success' : 'warning'" size="sm">
                        {{ org.status | titlecase }}
                      </ui-badge>
                    </td>
                    <td class="py-4 px-4">
                      <span class="text-sm text-stone-600 capitalize">{{ org.subscriptionPlan }}</span>
                    </td>
                    <td class="py-4 px-4 text-center">
                      <span class="text-sm font-medium text-stone-900">{{ org.userCount }}</span>
                    </td>
                    <td class="py-4 px-4 text-center">
                      <span class="text-sm font-medium text-stone-900">{{ org.employeeCount }}</span>
                    </td>
                    <td class="py-4 px-4 text-center">
                      @if (org.pendingRequestCount > 0) {
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                          {{ org.pendingRequestCount }}
                        </span>
                      } @else {
                        <span class="text-stone-400">-</span>
                      }
                    </td>
                    <td class="py-4 px-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <ui-button
                          variant="ghost"
                          size="sm"
                          (onClick)="openEditModal(org)"
                        >
                          Edit
                        </ui-button>
                        @if (org.status === 'active') {
                          <ui-button
                            variant="ghost"
                            size="sm"
                            class="text-amber-600 hover:text-amber-700"
                            [loading]="processingOrgId() === org._id"
                            (onClick)="suspendOrg(org._id)"
                          >
                            Suspend
                          </ui-button>
                        } @else {
                          <ui-button
                            variant="ghost"
                            size="sm"
                            class="text-green-600 hover:text-green-700"
                            [loading]="processingOrgId() === org._id"
                            (onClick)="activateOrg(org._id)"
                          >
                            Activate
                          </ui-button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </ui-card>

      <!-- Create/Edit Modal -->
      <ui-modal
        [(isOpen)]="showModal"
        [title]="editingOrg() ? 'Edit Organization' : 'Create Organization'"
      >
        <form [formGroup]="orgForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <ui-form-field
            label="Organization Name"
            [control]="orgForm.get('name')"
            id="name"
            [required]="true"
          >
            <input
              type="text"
              id="name"
              formControlName="name"
              placeholder="e.g., Acme Corporation"
              class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
            />
          </ui-form-field>

          <ui-form-field
            label="Email Domain"
            [control]="orgForm.get('domain')"
            id="domain"
            hint="Users with this domain will see this org as suggested"
          >
            <div class="flex items-center">
              <span class="text-stone-400 mr-2">@</span>
              <input
                type="text"
                id="domain"
                formControlName="domain"
                placeholder="e.g., acme.com"
                class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
              />
            </div>
          </ui-form-field>

          <ui-form-field
            label="Subscription Plan"
            [control]="orgForm.get('subscriptionPlan')"
            id="subscriptionPlan"
            [required]="true"
          >
            <select
              id="subscriptionPlan"
              formControlName="subscriptionPlan"
              class="block w-full rounded-xl border-stone-200 shadow-sm focus:border-[#8b1e3f] focus:ring-[#8b1e3f] sm:text-sm px-4 py-3 border bg-stone-50/50"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </ui-form-field>

          <div class="flex justify-end gap-3 pt-4 border-t border-stone-100">
            <ui-button type="button" variant="ghost" (onClick)="showModal.set(false)">
              Cancel
            </ui-button>
            <ui-button
              type="submit"
              variant="primary"
              [loading]="submitting()"
              [disabled]="orgForm.invalid || submitting()"
            >
              {{ editingOrg() ? 'Update' : 'Create' }}
            </ui-button>
          </div>
        </form>
      </ui-modal>
    </div>
  `
})
export class SuperAdminComponent implements OnInit, OnDestroy {
  private convex = inject(ConvexClientService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  organizations = signal<any[]>([]);
  stats = signal<any>(null);
  loading = signal(true);
  submitting = signal(false);
  processingOrgId = signal<string | null>(null);

  showModal = signal(false);
  editingOrg = signal<any>(null);

  orgForm: FormGroup;

  private unsubOrgs: (() => void) | null = null;
  private unsubStats: (() => void) | null = null;

  constructor() {
    this.orgForm = this.fb.group({
      name: ['', Validators.required],
      domain: [''],
      subscriptionPlan: ['free', Validators.required]
    });
  }

  ngOnInit() {
    const client = this.convex.getClient();

    this.unsubOrgs = client.onUpdate(api.super_admin.listOrganizations, {}, (data) => {
      this.organizations.set(data);
      this.loading.set(false);
    });

    this.unsubStats = client.onUpdate(api.super_admin.getSystemStats, {}, (data) => {
      this.stats.set(data);
    });
  }

  ngOnDestroy() {
    this.unsubOrgs?.();
    this.unsubStats?.();
  }

  openCreateModal() {
    this.editingOrg.set(null);
    this.orgForm.reset({ subscriptionPlan: 'free' });
    this.showModal.set(true);
  }

  openEditModal(org: any) {
    this.editingOrg.set(org);
    this.orgForm.patchValue({
      name: org.name,
      domain: org.domain || '',
      subscriptionPlan: org.subscriptionPlan
    });
    this.showModal.set(true);
  }

  async onSubmit() {
    if (this.orgForm.invalid) return;

    this.submitting.set(true);
    const formValue = this.orgForm.value;

    try {
      if (this.editingOrg()) {
        await this.convex.getClient().mutation(api.super_admin.updateOrganization, {
          orgId: this.editingOrg()._id,
          name: formValue.name,
          domain: formValue.domain || undefined,
          subscriptionPlan: formValue.subscriptionPlan
        });
        this.toastService.success('Organization updated successfully');
      } else {
        await this.convex.getClient().mutation(api.super_admin.createOrganization, {
          name: formValue.name,
          domain: formValue.domain || undefined,
          subscriptionPlan: formValue.subscriptionPlan
        });
        this.toastService.success('Organization created successfully');
      }
      this.showModal.set(false);
    } catch (err: any) {
      this.toastService.error(err.message || 'Operation failed');
    } finally {
      this.submitting.set(false);
    }
  }

  async suspendOrg(orgId: string) {
    if (!confirm('Are you sure you want to suspend this organization?')) return;

    this.processingOrgId.set(orgId);
    try {
      await this.convex.getClient().mutation(api.super_admin.updateOrganizationStatus, {
        orgId: orgId as any,
        status: 'suspended'
      });
      this.toastService.success('Organization suspended');
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to suspend organization');
    } finally {
      this.processingOrgId.set(null);
    }
  }

  async activateOrg(orgId: string) {
    this.processingOrgId.set(orgId);
    try {
      await this.convex.getClient().mutation(api.super_admin.updateOrganizationStatus, {
        orgId: orgId as any,
        status: 'active'
      });
      this.toastService.success('Organization activated');
    } catch (err: any) {
      this.toastService.error(err.message || 'Failed to activate organization');
    } finally {
      this.processingOrgId.set(null);
    }
  }
}
