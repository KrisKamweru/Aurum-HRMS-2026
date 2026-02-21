import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../shared/components/ui-modal/ui-modal.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { UiDateRangeComponent, DateRange } from '../../shared/components/ui-date-range/ui-date-range.component';
import { UiGridComponent } from '../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../shared/components/ui-grid/ui-grid-tile.component';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { api } from '../../../../convex/_generated/api';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiModalComponent, UiIconComponent, UiDateRangeComponent, UiGridComponent, UiGridTileComponent],
  template: `
    <div class="space-y-10 sm:space-y-12">
      <div class="flex items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 class="text-2xl font-semibold text-stone-900 dark:text-white tracking-tight">Leave Requests</h1>
          <p class="mt-3 text-stone-500 dark:text-stone-400">Manage employee leave applications.</p>
        </div>
        <ui-button
          (onClick)="openCreateModal()"
          [prerequisitesMet]="canManage() || !!currentUser()?.employeeId"
          prerequisiteMessage="Your account is not linked to an employee profile. Please contact HR."
        >
          <ui-icon name="plus" class="w-4 h-4 mr-2"></ui-icon>
          New Request
        </ui-button>
      </div>

      <!-- Leave requests list with Design Six styling -->
      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="All Leave Requests" variant="compact">
            <div class="tile-body">
              @if (loading()) {
                <div class="flex items-center justify-center py-12">
                  <div class="animate-spin rounded-full h-8 w-8 border-2 border-burgundy-700 border-t-transparent"></div>
                </div>
              } @else if (requests().length === 0) {
                <div class="px-5 py-12 text-center">
                  <p class="text-sm text-stone-500 dark:text-stone-400">No leave requests found.</p>
                </div>
              } @else {
                @for (request of requests(); track request._id) {
                  <div class="px-5 py-4 border-b border-stone-50 dark:border-white/[0.03]
                              hover:bg-burgundy-50/50 dark:hover:bg-burgundy-700/[0.06] transition-colors">
                    <div class="flex items-start justify-between gap-4">
                      <!-- Employee info with avatar -->
                      <div class="flex items-center gap-3">
                        <span class="w-6 h-6 rounded-md bg-burgundy-700 text-white
                                     flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {{ getInitials(request.employeeName) }}
                        </span>
                        <div>
                          <p class="text-sm font-semibold text-stone-800 dark:text-white">
                            {{ request.employeeName }}
                          </p>
                          <p class="text-xs text-stone-400 dark:text-stone-500">
                            {{ formatDateRange(request.startDate, request.endDate) }}
                          </p>
                        </div>
                      </div>

                      <!-- Leave type and actions -->
                      <div class="flex items-center gap-3">
                        <!-- Leave type label -->
                        <span class="text-xs font-medium text-burgundy-600 dark:text-burgundy-400 capitalize">
                          {{ request.type }}
                        </span>

                        <!-- Status badge -->
                        <span [class]="getStatusBadgeClass(request.status)">
                          {{ request.status }}
                        </span>

                        <!-- Action buttons -->
                        @if (request.status === 'pending' && canManage()) {
                          <div class="flex gap-2">
                            <button
                              class="px-2.5 py-1 rounded-md bg-burgundy-700 text-white text-[10px] font-semibold
                                     hover:bg-burgundy-800 transition-colors"
                              (click)="updateStatus(request, 'approved')"
                              title="Approve"
                            >
                              Approve
                            </button>
                            <button
                              class="px-2.5 py-1 rounded-md text-[10px] font-semibold
                                     border border-stone-200 text-stone-500
                                     dark:border-white/8 dark:text-stone-400
                                     hover:bg-stone-50 dark:hover:bg-white/5 transition-colors"
                              (click)="updateStatus(request, 'rejected')"
                              title="Deny"
                            >
                              Deny
                            </button>
                          </div>
                        }
                        @if (request.status === 'pending' && isOwnRequest(request)) {
                          <button
                            class="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100
                                   dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-white/5
                                   rounded-[10px] transition-colors"
                            (click)="updateStatus(request, 'cancelled')"
                            title="Cancel Request"
                          >
                            <ui-icon name="trash" class="w-4 h-4"></ui-icon>
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Reason (if provided) -->
                    @if (request.reason) {
                      <div class="mt-3 ml-9">
                        <p class="text-xs text-stone-500 dark:text-stone-400 italic">
                          "{{ request.reason }}"
                        </p>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>

      <ui-modal
        [(isOpen)]="showModal"
        title="New Leave Request"
      >
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <!-- Employee Selection (for managers/admins only) -->
          @if (canManage()) {
            <div>
              <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Employee <span class="text-red-500">*</span>
              </label>
              <select
                [ngModel]="formEmployeeId()"
                (ngModelChange)="formEmployeeId.set($event)"
                name="employeeId"
                required
                class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg
                       bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                       focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
              >
                <option value="">Select an employee</option>
                @for (emp of employees(); track emp._id) {
                  <option [value]="emp._id">{{ emp.firstName }} {{ emp.lastName }}</option>
                }
              </select>
            </div>
          }

          <!-- Leave Type -->
          <div>
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Leave Type <span class="text-red-500">*</span>
            </label>
            <select
              [ngModel]="formLeaveType()"
              (ngModelChange)="formLeaveType.set($event)"
              name="leaveType"
              required
              class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg
                     bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                     focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
            >
              <option value="">Select leave type</option>
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <!-- Date Range Picker -->
          <div>
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Leave Dates <span class="text-red-500">*</span>
            </label>
            <ui-date-range
              [startDate]="formStartDate()"
              [endDate]="formEndDate()"
              [minDate]="minLeaveDate()"
              (rangeChange)="onDateRangeChange($event)"
            />
          </div>

          <!-- Reason (optional) -->
          <div>
            <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
              Reason
            </label>
            <textarea
              [ngModel]="formReason()"
              (ngModelChange)="formReason.set($event)"
              name="reason"
              rows="3"
              placeholder="Optional reason for leave request"
              class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg
                     bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100
                     focus:ring-2 focus:ring-burgundy-500 focus:border-transparent resize-none"
            ></textarea>
          </div>

          <!-- Form Actions -->
          <div class="flex gap-3 pt-4">
            <ui-button
              type="submit"
              [loading]="submitting()"
              [prerequisitesMet]="isFormValid()"
              prerequisiteMessage="Please fill in all required fields and select valid dates"
            >
              Submit Request
            </ui-button>
            <ui-button
              variant="outline"
              type="button"
              (onClick)="showModal.set(false)"
            >
              Cancel
            </ui-button>
          </div>
        </form>
      </ui-modal>
    </div>
  `
})
export class LeaveRequestsComponent implements OnInit, OnDestroy {
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  currentUser = computed(() => this.authService.getUser()());
  canManage = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

  requests = signal<any[]>([]);
  employees = signal<any[]>([]);
  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);

  // Form state with signals
  formEmployeeId = signal<string>('');
  formLeaveType = signal<string>('');
  formStartDate = signal<Date | null>(null);
  formEndDate = signal<Date | null>(null);
  formReason = signal<string>('');
  minLeaveDate = signal<Date>(new Date()); // Can't request leave in the past

  private unsubscribe: (() => void) | null = null;
  private employeesUnsubscribe: (() => void) | null = null;

  // Computed to check if form is valid
  isFormValid = computed(() => {
    const hasEmployee = this.canManage() ? !!this.formEmployeeId() : true;
    const hasLeaveType = !!this.formLeaveType();
    const hasStartDate = !!this.formStartDate();
    const hasEndDate = !!this.formEndDate();

    return hasEmployee && hasLeaveType && hasStartDate && hasEndDate;
  });

  ngOnInit() {
    const client = this.convexService.getClient();

    // Subscribe to requests
    this.unsubscribe = client.onUpdate(api.leave_requests.list, {}, (data) => {
      this.requests.set(data);
      this.loading.set(false);
    });

    // Fetch employees for the dropdown
    // Only fetch if we can manage, otherwise we don't need the list
    if (this.canManage()) {
       this.employeesUnsubscribe = client.onUpdate(api.employees.list, {}, (data) => {
        this.employees.set(data);
      });
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) this.unsubscribe();
    if (this.employeesUnsubscribe) this.employeesUnsubscribe();
  }

  onDateRangeChange(range: DateRange): void {
    this.formStartDate.set(range.start);
    this.formEndDate.set(range.end);
  }

  openCreateModal() {
    if (!this.canManage()) {
      const user = this.authService.getUser()();
      if (!user?.employeeId) {
        this.toastService.error('Your account is not linked to an employee profile. Please contact HR.');
        return;
      }
    }

    // Reset form state
    this.formEmployeeId.set('');
    this.formLeaveType.set('');
    this.formStartDate.set(null);
    this.formEndDate.set(null);
    this.formReason.set('');

    this.showModal.set(true);
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.submitting.set(true);
    const client = this.convexService.getClient();

    try {
      let employeeId = this.formEmployeeId();

      // If not managing (regular employee), use own ID
      if (!this.canManage()) {
        const user = this.authService.getUser()();
        if (user && user.employeeId) {
          employeeId = user.employeeId;
        } else {
          throw new Error('Employee profile not found');
        }
      }

      const startDate = this.formStartDate();
      const endDate = this.formEndDate();

      if (!startDate || !endDate) {
        throw new Error('Please select valid dates');
      }

      await client.mutation(api.leave_requests.create, {
        employeeId: employeeId as any,
        type: this.formLeaveType() as 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: this.formReason()
      });
      this.showModal.set(false);
      this.toastService.success('Leave request submitted successfully');
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      this.toastService.error(error.message || 'Failed to submit leave request');
    } finally {
      this.submitting.set(false);
    }
  }

  isOwnRequest(row: any): boolean {
    const user = this.currentUser();
    return user?.employeeId === row.employeeId;
  }

  async updateStatus(row: any, status: 'approved' | 'rejected' | 'cancelled') {
    const action = status === 'cancelled' ? 'cancel' : status;
    const confirmed = await this.confirmDialog.confirm({
      title: `${action === 'approved' ? 'Approve' : action === 'rejected' ? 'Reject' : 'Cancel'} Leave Request`,
      message: `Are you sure you want to ${action} this request?`,
      confirmText: action === 'approved' ? 'Approve' : action === 'rejected' ? 'Reject' : 'Cancel Request',
      cancelText: 'Go Back',
      variant: action === 'rejected' ? 'danger' : 'warning'
    });

    if (!confirmed) return;

    try {
      const client = this.convexService.getClient();
      await client.mutation(api.leave_requests.updateStatus, {
        id: row._id,
        status
      });
      this.toastService.success(`Leave request ${status} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      this.toastService.error(`Failed to ${status} request. Please try again.`);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'N/A';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDateRange(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'No dates';
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startFormatted = start.toLocaleDateString('en-US', formatOptions);
    const endFormatted = end.toLocaleDateString('en-US', formatOptions);

    if (start.getFullYear() === end.getFullYear()) {
      return `${startFormatted} – ${endFormatted}`;
    } else {
      return `${startFormatted}, ${start.getFullYear()} – ${endFormatted}, ${end.getFullYear()}`;
    }
  }

  getStatusBadgeClass(status: string): string {
    const baseClasses = 'px-2.5 py-1 rounded-full text-xs font-semibold';

    switch (status) {
      case 'approved':
        return `${baseClasses} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`;
      case 'pending':
        return `${baseClasses} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
      case 'rejected':
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
      default:
        return `${baseClasses} bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300`;
    }
  }
}
