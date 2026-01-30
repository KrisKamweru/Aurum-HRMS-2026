import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../shared/services/form-helper.service';
import { api } from '../../../../convex/_generated/api';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent,
    UiModalComponent,
    DynamicFormComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-stone-900 dark:text-white">Payroll Runs</h1>
          <p class="text-stone-500 dark:text-stone-400 mt-1">Manage monthly payroll processing and salary slips</p>
        </div>
        <ui-button (onClick)="openCreateModal()" variant="primary" icon="plus">
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          New Run
        </ui-button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-stone-800 p-6 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <ui-icon name="banknotes" class="w-6 h-6 text-blue-600 dark:text-blue-400"></ui-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Total Processed (YTD)</p>
              <h3 class="text-2xl font-bold text-stone-900 dark:text-white">--</h3>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-stone-800 p-6 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <ui-icon name="users" class="w-6 h-6 text-green-600 dark:text-green-400"></ui-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Employees Paid</p>
              <h3 class="text-2xl font-bold text-stone-900 dark:text-white">--</h3>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-stone-800 p-6 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <ui-icon name="clock" class="w-6 h-6 text-amber-600 dark:text-amber-400"></ui-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-stone-500 dark:text-stone-400">Pending Runs</p>
              <h3 class="text-2xl font-bold text-stone-900 dark:text-white">--</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Payroll Runs List -->
      <div class="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
            <thead class="bg-stone-50 dark:bg-stone-900/50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Period</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Run Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Employees</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total Net Pay</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Status</th>
                <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-stone-700">
              @for (run of runs(); track run._id) {
                <tr class="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-burgundy-100 dark:bg-burgundy-900/30 text-burgundy-700 dark:text-burgundy-300 font-bold">
                        {{ getMonthName(run.month) | slice:0:3 }}
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-stone-900 dark:text-white">
                          {{ getMonthName(run.month) }} {{ run.year }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                    {{ run.runDate | date:'mediumDate' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400">
                    {{ run.employeeCount || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-stone-900 dark:text-white">
                    {{ run.totalNetPay ? (run.totalNetPay | currency) : '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="getStatusClasses(run.status)">
                      {{ run.status | titlecase }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      (click)="viewRun(run._id)"
                      class="text-burgundy-600 dark:text-burgundy-400 hover:text-burgundy-900 dark:hover:text-burgundy-300 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-stone-500 dark:text-stone-400">
                    <ui-icon name="document-text" class="w-12 h-12 mx-auto mb-3 opacity-20"></ui-icon>
                    <p class="text-lg font-medium">No payroll runs found</p>
                    <p class="text-sm">Create a new run to get started</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create Run Modal -->
    <ui-modal
      [(isOpen)]="isCreateModalOpen"
      title="Create New Payroll Run"
      size="md"
    >
      <app-dynamic-form
        [fields]="createFormFields"
        submitLabel="Create Draft"
        [loading]="isCreating"
        (formSubmit)="handleCreateRun($event)"
        (cancel)="isCreateModalOpen = false"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `
})
export class PayrollListComponent implements OnInit {
  private convex = inject(ConvexClientService);
  private router = inject(Router);
  private toast = inject(ToastService);

  runs = signal<any[]>([]);
  isCreateModalOpen = false;
  isCreating = false;

  createFormFields: FieldConfig[] = [
    {
      name: 'month',
      label: 'Month',
      type: 'select',
      required: true,
      options: [
        { label: 'January', value: 1 },
        { label: 'February', value: 2 },
        { label: 'March', value: 3 },
        { label: 'April', value: 4 },
        { label: 'May', value: 5 },
        { label: 'June', value: 6 },
        { label: 'July', value: 7 },
        { label: 'August', value: 8 },
        { label: 'September', value: 9 },
        { label: 'October', value: 10 },
        { label: 'November', value: 11 },
        { label: 'December', value: 12 },
      ]
    },
    {
      name: 'year',
      label: 'Year',
      type: 'number',
      required: true,
      placeholder: new Date().getFullYear().toString()
    }
  ];

  ngOnInit() {
    const client = this.convex.getClient();
    // Subscribe to updates
    client.onUpdate(api.payroll.listRuns, {}, (runs) => {
      this.runs.set(runs);
    });
  }

  openCreateModal() {
    // Pre-fill next logical month
    // If we have runs, take the latest one and add 1 month
    // Otherwise current month
    this.isCreateModalOpen = true;
  }

  async handleCreateRun(data: any) {
    this.isCreating = true;
    try {
      const runId = await this.convex.getClient().mutation(api.payroll.createRun, {
        month: Number(data.month),
        year: Number(data.year)
      });

      this.toast.success('Payroll run created successfully');
      this.isCreateModalOpen = false;
      this.router.navigate(['/payroll', runId]);
    } catch (error: any) {
      console.error('Failed to create run:', error);
      this.toast.error(error.message || 'Failed to create payroll run');
    } finally {
      this.isCreating = false;
    }
  }

  viewRun(id: string) {
    this.router.navigate(['/payroll', id]);
  }

  getMonthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  getStatusClasses(status: string): string {
    const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'completed':
        return `${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
      case 'processing':
        return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
      case 'draft':
      default:
        return `${base} bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-300`;
    }
  }
}
