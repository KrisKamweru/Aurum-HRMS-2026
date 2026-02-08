import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { api } from '../../../../../convex/_generated/api';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../shared/services/form-helper.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { UiGridComponent } from '../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../shared/components/ui-grid/ui-grid-tile.component';
import { UiDataTableComponent, TableColumn } from '../../../shared/components/ui-data-table/ui-data-table.component';
import { Id } from '../../../../../convex/_generated/dataModel';
import { AuthService } from '../../../core/auth/auth.service';

// Sub-components
import { ProfilePersonalComponent } from './components/profile-personal.component';
import { ProfileFinancialComponent } from './components/profile-financial.component';
import { ProfileEducationComponent } from './components/profile-education.component';
import { ProfileDocumentsComponent } from './components/profile-documents.component';

type ActionType = 'promote' | 'transfer' | 'resign' | 'terminate' | 'warning' | 'award' | 'complaint' | 'travel' | null;

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    UiButtonComponent,
    UiIconComponent,
    UiModalComponent,
    DynamicFormComponent,
    UiGridComponent,
    UiGridTileComponent,
    UiDataTableComponent,
    ProfilePersonalComponent,
    ProfileFinancialComponent,
    ProfileEducationComponent,
    ProfileDocumentsComponent
  ],
  template: `
    @if (employee()) {
      <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-burgundy-700 dark:bg-burgundy-700/75 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white flex-shrink-0">
            {{ getInitials(employee()) }}
          </div>
          <div>
            <h1 class="text-3xl font-bold text-stone-900 dark:text-white tracking-tight">{{ employee().firstName }} {{ employee().lastName }}</h1>
            <p class="text-[15px] text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-1">
              <ui-icon name="briefcase" class="w-4 h-4"></ui-icon>
              {{ employee().position || 'No Position' }}
            </p>
          </div>
        </div>

        @if (canPerformHrActions()) {
          <div class="flex flex-wrap gap-2 w-full md:w-auto md:justify-end">
            <ui-button
              variant="outline"
              size="sm"
              (onClick)="openAction('promote')"
              [prerequisitesMet]="designations().length > 1"
              prerequisiteMessage="You need multiple designations defined to promote an employee."
              [prerequisiteAction]="{ label: 'Manage Designations', link: ['/organization/designations'] }"
            >
              Promote
            </ui-button>

            <ui-button
              variant="outline"
              size="sm"
              (onClick)="openAction('transfer')"
              [prerequisitesMet]="departments().length > 1"
              prerequisiteMessage="You need multiple departments defined to transfer an employee."
              [prerequisiteAction]="{ label: 'Manage Departments', link: ['/organization/departments'] }"
            >
              Transfer
            </ui-button>

            <ui-button variant="outline" size="sm" (onClick)="openAction('warning')" class="!text-amber-600 dark:!text-amber-400 !border-amber-200 dark:!border-amber-800 hover:!bg-amber-50 dark:hover:!bg-amber-900/20">Warning</ui-button>
            <ui-button variant="outline" size="sm" (onClick)="openAction('award')" class="!text-indigo-600 dark:!text-indigo-400 !border-indigo-200 dark:!border-indigo-800 hover:!bg-indigo-50 dark:hover:!bg-indigo-900/20">Award</ui-button>

            <!-- More Actions Dropdown (Simulated with wrap for now) -->
            <ui-button variant="outline" size="sm" (onClick)="openAction('travel')" class="!text-sky-600 dark:!text-sky-400 !border-sky-200 dark:!border-sky-800 hover:!bg-sky-50 dark:hover:!bg-sky-900/20">Travel</ui-button>
            <ui-button variant="outline" size="sm" (onClick)="openAction('complaint')" class="!text-rose-600 dark:!text-rose-400 !border-rose-200 dark:!border-rose-800 hover:!bg-rose-50 dark:hover:!bg-rose-900/20">Complaint</ui-button>
            <ui-button variant="outline" size="sm" (onClick)="openAction('resign')" class="!text-orange-600 dark:!text-orange-400 !border-orange-200 dark:!border-orange-800 hover:!bg-orange-50 dark:hover:!bg-orange-900/20">Resignation</ui-button>
            <ui-button variant="outline" size="sm" (onClick)="openAction('terminate')" class="!text-red-600 dark:!text-red-400 !border-red-200 dark:!border-red-800 hover:!bg-red-50 dark:hover:!bg-red-900/20">Terminate</ui-button>
          </div>
        }
      </div>

      <!-- Tabs -->
      <div class="border-b border-stone-200 dark:border-white/8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <nav class="-mb-px flex space-x-8 overflow-x-auto no-scrollbar pb-1 sm:pb-0" aria-label="Tabs">
          @for (tab of tabs; track tab) {
            <button
              [class.border-burgundy-700]="activeTab() === tab"
              [class.dark:border-burgundy-400]="activeTab() === tab"
              [class.text-burgundy-700]="activeTab() === tab"
              [class.dark:text-burgundy-300]="activeTab() === tab"
              [class.border-transparent]="activeTab() !== tab"
              [class.text-stone-500]="activeTab() !== tab"
              [class.dark:text-stone-400]="activeTab() !== tab"
              class="whitespace-nowrap py-3 border-b-2 font-semibold text-sm hover:text-burgundy-700 dark:hover:text-burgundy-300 transition-colors capitalize flex-shrink-0"
              (click)="activeTab.set(tab)"
            >
              {{ tab }}
            </button>
          }
        </nav>
      </div>

      <!-- Content Grid -->
      @if (activeTab() === 'overview') {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

        <!-- Left Column: Personal & Professional Info -->
        <div class="md:col-span-2 space-y-4 sm:space-y-6">
          <!-- Professional Details card -->
          <div class="dash-frame">
            <ui-grid [columns]="'1fr'" [gap]="'0px'">
              <ui-grid-tile title="Professional Details" variant="compact">
                <div class="tile-body">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Employee ID</label>
                      <p class="font-mono text-sm text-stone-800 dark:text-stone-200">{{ employee()._id }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Email</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().email }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Department</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().department || '-' }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Location</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().location || '-' }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Status</label>
                      <span [class]="getStatusBadgeClass(employee().status)">
                        {{ employee().status | titlecase }}
                      </span>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Start Date</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().startDate | date }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Manager</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().managerName || '-' }}</p>
                    </div>
                  </div>
                </div>
              </ui-grid-tile>
            </ui-grid>
          </div>

          <!-- Personal Details card -->
          <div class="dash-frame">
            <ui-grid [columns]="'1fr'" [gap]="'0px'">
              <ui-grid-tile title="Personal Details" variant="compact">
                <div class="tile-body">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Phone</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().phone || '-' }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Address</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().address || '-' }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Gender</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().gender || '-' }}</p>
                    </div>
                    <div class="info-group">
                      <label class="block text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-1">Date of Birth</label>
                      <p class="text-stone-800 dark:text-stone-200">{{ employee().dob ? (employee().dob | date) : '-' }}</p>
                    </div>
                  </div>
                </div>
              </ui-grid-tile>
            </ui-grid>
          </div>
        </div>

        <!-- Right Column: Quick Actions -->
        <div class="space-y-4 sm:space-y-6">
          <div class="dash-frame">
            <ui-grid [columns]="'1fr'" [gap]="'0px'">
              <ui-grid-tile title="Quick Actions" variant="compact">
                <div class="tile-body">
                  <p class="text-[13px] text-stone-500 dark:text-stone-400 mb-4">Common tasks for this employee.</p>
                  <div class="flex flex-col gap-1">
                    <button (click)="activeTab.set('documents')" class="text-left px-3 py-2 hover:bg-burgundy-50/50 dark:hover:bg-burgundy-700/[0.06] rounded-lg transition-colors text-sm flex items-center gap-2 text-stone-600 dark:text-stone-300">
                      <ui-icon name="document" class="w-4 h-4"></ui-icon> View Documents
                    </button>
                    <button (click)="activeTab.set('compensation')" class="text-left px-3 py-2 hover:bg-burgundy-50/50 dark:hover:bg-burgundy-700/[0.06] rounded-lg transition-colors text-sm flex items-center gap-2 text-stone-600 dark:text-stone-300">
                      <ui-icon name="currency-dollar" class="w-4 h-4"></ui-icon> View Compensation
                    </button>
                    <button (click)="activeTab.set('payroll')" class="text-left px-3 py-2 hover:bg-burgundy-50/50 dark:hover:bg-burgundy-700/[0.06] rounded-lg transition-colors text-sm flex items-center gap-2 text-stone-600 dark:text-stone-300">
                      <ui-icon name="banknotes" class="w-4 h-4"></ui-icon> View Payslips
                    </button>
                    <button (click)="activeTab.set('history')" class="text-left px-3 py-2 hover:bg-burgundy-50/50 dark:hover:bg-burgundy-700/[0.06] rounded-lg transition-colors text-sm flex items-center gap-2 text-stone-600 dark:text-stone-300">
                       <ui-icon name="clock" class="w-4 h-4"></ui-icon> View History
                    </button>
                  </div>
                </div>
              </ui-grid-tile>
            </ui-grid>
          </div>
        </div>
      </div>
      }

      <!-- Extended Tabs Content -->
      @if (activeTab() === 'personal') {
        <app-profile-personal
          [contacts]="emergencyContacts()"
          [loading]="contactsLoading()"
          (save)="saveContact($event)"
          (delete)="deleteContact($event)"
        ></app-profile-personal>
      }

      @if (activeTab() === 'financial') {
        <app-profile-financial
          [statutory]="statutoryInfo()"
          [banking]="bankingDetails()"
          [adjustments]="adjustments()"
          [loading]="bankingLoading()"
          [adjustmentsLoading]="adjustmentsLoading()"
          [canEditFinancialData]="canEditFinancialData()"
          (saveStatutory)="saveStatutory($event)"
          (saveBank)="saveBank($event)"
          (deleteBank)="deleteBank($event)"
          (addCredit)="addCredit($event)"
          (addDebit)="addDebit($event)"
          (toggleAdjustment)="toggleAdjustment($event)"
        ></app-profile-financial>
      }

      @if (activeTab() === 'education') {
        <app-profile-education
          [education]="education()"
          [loading]="educationLoading()"
          (save)="saveEducation($event)"
          (delete)="deleteEducation($event)"
        ></app-profile-education>
      }

      @if (activeTab() === 'documents') {
        <app-profile-documents
          [documents]="documents()"
          [loading]="documentsLoading()"
          (save)="saveDocument($event)"
          (delete)="deleteDocument($event)"
        ></app-profile-documents>
      }

      <!-- Compensation Tab -->
      @if (activeTab() === 'compensation') {
        <div>
          <div class="dash-frame">
            <ui-grid [columns]="'1fr'" [gap]="'0px'">
              <ui-grid-tile title="Compensation Details" variant="compact">
              @if (canEditCompensation()) {
                <button tile-actions (click)="toggleEditCompensation()" class="text-sm text-burgundy-600 dark:text-burgundy-400 hover:text-burgundy-700 dark:hover:text-burgundy-300 font-semibold">
                  {{ editingCompensation() ? 'Cancel' : 'Edit' }}
                </button>
              }
              <div class="tile-body">
            @if (editingCompensation()) {
              <!-- Edit Form -->
              <form [formGroup]="compensationForm" (ngSubmit)="saveCompensation()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Base Salary</label>
                  <input formControlName="baseSalary" type="number" step="0.01" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-burgundy-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Currency</label>
                  <select formControlName="currency" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-burgundy-500">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="INR">INR</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Pay Frequency</label>
                  <select formControlName="payFrequency" class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-burgundy-500">
                    <option value="monthly">Monthly</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div class="md:col-span-2 flex justify-end gap-3 pt-4">
                  <button type="button" (click)="toggleEditCompensation()" class="px-4 py-2 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" class="px-4 py-2 bg-burgundy-600 text-white rounded-lg hover:bg-burgundy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" [disabled]="saving()">
                    {{ saving() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            } @else {
              <!-- View Mode -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p class="text-sm text-stone-500 dark:text-stone-400">Base Salary</p>
                  <p class="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">
                    {{ formatSalary(employee()?.baseSalary, employee()?.currency) }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-stone-500 dark:text-stone-400">Currency</p>
                  <p class="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">
                    {{ employee()?.currency || 'Not set' }}
                  </p>
                </div>
                <div>
                  <p class="text-sm text-stone-500 dark:text-stone-400">Pay Frequency</p>
                  <p class="text-lg font-semibold text-stone-900 dark:text-stone-100 mt-1">
                    {{ formatPayFrequency(employee()?.payFrequency) }}
                  </p>
                </div>
              </div>
            }
              </div>
            </ui-grid-tile>
          </ui-grid>
          </div>
        </div>
      }

      <!-- Payroll Tab -->
      @if (activeTab() === 'payroll') {
        <div class="space-y-4 sm:space-y-6">
          <div class="dash-frame">
            <ui-grid [columns]="'1fr'" [gap]="'0px'">
              <ui-grid-tile title="Payslips" variant="compact">
                <div class="tile-body">
                  <ui-data-table
                    [data]="payslips()"
                    [columns]="payslipColumns"
                    [loading]="false"
                    [cellTemplates]="{ month: payslipMonth }"
                    [actionsTemplate]="payslipActions"
                    headerVariant="neutral"
                  >
                    <ng-template #payslipMonth let-row>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-stone-800 dark:text-stone-100">
                          {{ getMonthName(row.month) }} {{ row.year }}
                        </span>
                        @if (row.status !== 'completed') {
                          <span class="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full dark:bg-stone-700 dark:text-stone-300">
                            {{ row.status | titlecase }}
                          </span>
                        }
                      </div>
                    </ng-template>

                    <ng-template #payslipActions let-row>
                      <a [routerLink]="['/payroll/slip', row._id]" class="text-sm font-semibold text-burgundy-600 dark:text-burgundy-400 hover:text-burgundy-900 dark:hover:text-burgundy-300">View</a>
                    </ng-template>
                  </ui-data-table>
                </div>
              </ui-grid-tile>
            </ui-grid>
          </div>
        </div>
      }
      <!-- History Tab -->
      @if (activeTab() === 'history') {
        <div class="space-y-4 sm:space-y-6">
          <div class="dash-frame">
            <ui-grid [columns]="'1fr'" [gap]="'0px'">
              <ui-grid-tile title="Promotions" variant="compact" divider="bottom">
                <div class="tile-body space-y-4">
                  @if (promotions().length === 0) {
                    <div class="text-stone-500 dark:text-stone-400 italic">No promotion history.</div>
                  }
                  @for (item of promotions(); track item._id) {
                    <div class="border-l-2 border-burgundy-700 dark:border-burgundy-400 pl-4 py-1">
                      <div class="text-sm text-stone-500 dark:text-stone-400">{{ item.promotionDate | date }}</div>
                      <div class="font-medium text-stone-800 dark:text-stone-200">Promoted to new designation</div>
                      @if (item.remarks) {
                        <div class="text-sm text-stone-600 dark:text-stone-300">"{{ item.remarks }}"</div>
                      }
                      @if (item.salaryIncrement) {
                        <div class="text-xs text-stone-400 dark:text-stone-500 mt-1">Salary Increment: {{ item.salaryIncrement | currency }}</div>
                      }
                    </div>
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Transfers" variant="compact" divider="bottom">
                <div class="tile-body space-y-4">
                  @if (transfers().length === 0) {
                    <div class="text-stone-500 dark:text-stone-400 italic">No transfer history.</div>
                  }
                  @for (item of transfers(); track item._id) {
                    <div class="border-l-2 border-blue-500 dark:border-blue-400 pl-4 py-1">
                      <div class="text-sm text-stone-500 dark:text-stone-400">{{ item.transferDate | date }}</div>
                      <div class="font-medium text-stone-800 dark:text-stone-200">Transferred</div>
                      @if (item.remarks) {
                        <div class="text-sm text-stone-600 dark:text-stone-300">"{{ item.remarks }}"</div>
                      }
                    </div>
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Separation / Resignation" variant="compact" divider="bottom">
                <div class="tile-body space-y-4">
                  @if (resignations().length === 0) {
                    <div class="text-stone-500 dark:text-stone-400 italic">No resignations recorded.</div>
                  }
                  @for (item of resignations(); track item._id) {
                    <div class="border-l-2 border-red-500 dark:border-red-400 pl-4 py-1">
                      <div class="flex justify-between">
                        <div class="font-medium text-stone-800 dark:text-stone-200">Resignation Submitted</div>
                        <span [class]="getStatusBadgeClass(item.status)">{{ item.status | titlecase }}</span>
                      </div>
                      <div class="text-sm text-stone-500 dark:text-stone-400 mt-1">Last Working Day: {{ item.lastWorkingDay | date }}</div>
                      <div class="text-sm text-stone-600 dark:text-stone-300 italic mt-1">"{{ item.reason }}"</div>
                    </div>
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Warnings" variant="compact" divider="bottom">
                <div class="tile-body space-y-4">
                  @if (warnings().length === 0) {
                    <div class="text-stone-500 dark:text-stone-400 italic">No disciplinary history.</div>
                  }
                  @for (item of warnings(); track item._id) {
                    <div class="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
                      <div class="flex justify-between items-start">
                        <span class="font-bold text-amber-800 dark:text-amber-200">{{ item.subject }}</span>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 uppercase">{{ item.severity }}</span>
                      </div>
                      <div class="text-sm text-amber-900 dark:text-amber-100 mt-1">{{ item.description }}</div>
                      <div class="text-xs text-amber-700 dark:text-amber-300 mt-2">Date: {{ item.issueDate | date }}</div>
                    </div>
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Awards" variant="compact" divider="bottom">
                <div class="tile-body space-y-4">
                  @if (awards().length === 0) {
                    <div class="text-stone-500 dark:text-stone-400 italic">No awards received.</div>
                  }
                  @for (item of awards(); track item._id) {
                    <div class="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-3">
                      <div class="p-2 bg-white dark:bg-white/5 rounded-full text-yellow-500 dark:text-yellow-400 shadow-sm">
                        <ui-icon name="star" class="w-5 h-5"></ui-icon>
                      </div>
                      <div>
                        <div class="font-bold text-indigo-900 dark:text-indigo-200">{{ item.title }}</div>
                        <div class="text-sm text-indigo-800 dark:text-indigo-300">{{ item.description }}</div>
                        <div class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          {{ item.date | date }}
                          @if (item.cashPrice) {
                            <span>• {{ item.cashPrice | currency }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Travel History" variant="compact" divider="bottom">
                <div class="tile-body space-y-4">
                  @if (travelRequests().length === 0) {
                    <div class="text-stone-500 dark:text-stone-400 italic">No travel history.</div>
                  }
                  @for (item of travelRequests(); track item._id) {
                    <div class="bg-sky-50 dark:bg-sky-900/10 p-3 rounded-lg border border-sky-100 dark:border-sky-800/30">
                      <div class="flex justify-between items-start">
                        <span class="font-bold text-sky-900 dark:text-sky-200">{{ item.destination }}</span>
                        <span [class]="getStatusBadgeClass(item.status)">{{ item.status | titlecase }}</span>
                      </div>
                      <div class="text-sm text-sky-800 dark:text-sky-300 mt-1">Purpose: {{ item.purpose }}</div>
                      <div class="text-xs text-sky-600 dark:text-sky-400 mt-2">
                        {{ item.startDate | date }} - {{ item.endDate | date }}
                        @if (item.budget) {
                          <span>• Budget: {{ item.budget | currency }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </ui-grid-tile>

              <ui-grid-tile title="Complaints Filed" variant="compact">
                <div class="tile-body space-y-4">
                  @if (complaints().length === 0) {
                    <div class="text-stone-500 dark:text-stone-400 italic">No complaints filed.</div>
                  }
                  @for (item of complaints(); track item._id) {
                    <div class="bg-rose-50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-100 dark:border-rose-800/30">
                      <div class="flex justify-between items-start">
                        <span class="font-bold text-rose-900 dark:text-rose-200">{{ item.subject }}</span>
                        <span [class]="getStatusBadgeClass(item.status)">{{ item.status | titlecase }}</span>
                      </div>
                      <div class="text-sm text-rose-800 dark:text-rose-300 mt-1">{{ item.description }}</div>
                      <div class="text-xs text-rose-600 dark:text-rose-400 mt-2">
                        Filed on: {{ item.date | date }}
                        @if (item.accusedId) {
                          <span>• Against ID: {{ item.accusedId }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </ui-grid-tile>
            </ui-grid>
          </div>
        </div>
      }
      </div>
    } @else {
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy-700"></div>
      </div>
    }

    <!-- Action Modal -->
    <ui-modal [(isOpen)]="showActionModal" [title]="actionModalTitle()">
      @if (currentActionConfig()) {
        <app-dynamic-form
          [fields]="currentActionConfig()!"
          [loading]="submitting()"
          [submitLabel]="actionSubmitLabel()"
          (formSubmit)="onActionSubmit($event)"
          (cancel)="showActionModal.set(false)"
          [showCancel]="true"
        ></app-dynamic-form>
      }
    </ui-modal>
  `
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  protected canManageEmployees = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);
  protected canPerformHrActions = this.authService.hasRole(['super_admin', 'admin', 'hr_manager']);
  protected canEditFinancialData = this.authService.hasRole(['super_admin', 'admin', 'hr_manager']);

  employeeId = signal<Id<"employees"> | null>(null);
  employee = signal<any>(null);

  // Lists for dropdowns
  departments = signal<any[]>([]);
  designations = signal<any[]>([]);
  locations = signal<any[]>([]);
  employeesList = signal<any[]>([]);

  // History Data
  promotions = signal<any[]>([]);
  transfers = signal<any[]>([]);
  resignations = signal<any[]>([]);
  terminations = signal<any[]>([]);
  warnings = signal<any[]>([]);
  awards = signal<any[]>([]);
  travelRequests = signal<any[]>([]);
  complaints = signal<any[]>([]);

  // Extended Profile Data
  emergencyContacts = signal<any[]>([]);
  bankingDetails = signal<any[]>([]);
  statutoryInfo = signal<any>(null);
  education = signal<any[]>([]);
  documents = signal<any[]>([]);
  payslips = signal<any[]>([]);
  adjustments = signal<{ credits: any[], debits: any[] }>({ credits: [], debits: [] });

  // Sub-component loading states
  contactsLoading = signal(false);
  bankingLoading = signal(false);
  adjustmentsLoading = signal(false);
  educationLoading = signal(false);
  documentsLoading = signal(false);

  // UI State
  activeTab = signal<'overview' | 'personal' | 'financial' | 'education' | 'documents' | 'compensation' | 'history' | 'payroll'>('overview');
  tabs: ('overview' | 'personal' | 'financial' | 'education' | 'documents' | 'compensation' | 'history' | 'payroll')[] = ['overview', 'personal', 'financial', 'education', 'documents', 'compensation', 'history', 'payroll'];

  payslipColumns: TableColumn[] = [
    { key: 'month', header: 'Month', sortable: true },
    { key: 'generatedAt', header: 'Generated', type: 'date', sortable: true },
    { key: 'grossSalary', header: 'Gross', type: 'currency' },
    { key: 'netSalary', header: 'Net Pay', type: 'currency' }
  ];

  // Compensation State
  editingCompensation = signal(false);
  saving = signal(false);
  compensationForm!: FormGroup;


  // Modal State
  showActionModal = signal(false);
  currentAction = signal<ActionType>(null);
  submitting = signal(false);

  // Derived state for Modal
  actionModalTitle = computed(() => {
    switch (this.currentAction()) {
      case 'promote': return 'Promote Employee';
      case 'transfer': return 'Transfer Employee';
      case 'resign': return 'Process Separation';
      case 'terminate': return 'Terminate Employee';
      case 'warning': return 'Issue Warning';
      case 'award': return 'Give Award';
      case 'travel': return 'Request Travel';
      case 'complaint': return 'File Complaint';
      default: return 'Action';
    }
  });

  actionSubmitLabel = computed(() => {
    return this.currentAction() === 'resign' || this.currentAction() === 'complaint' || this.currentAction() === 'travel' ? 'Submit' : 'Save';
  });

  currentActionConfig = computed(() => {
    switch (this.currentAction()) {
      case 'promote': return this.getPromoteConfig();
      case 'transfer': return this.getTransferConfig();
      case 'resign': return this.getResignConfig();
      case 'terminate': return this.getTerminateConfig();
      case 'warning': return this.getWarningConfig();
      case 'award': return this.getAwardConfig();
      case 'travel': return this.getTravelConfig();
      case 'complaint': return this.getComplaintConfig();
      default: return null;
    }
  });

  ngOnInit() {
    // Initialize compensation form
    this.compensationForm = new FormGroup({
      baseSalary: new FormControl<number | null>(null),
      currency: new FormControl<string>('USD'),
      payFrequency: new FormControl<string>('monthly'),
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.employeeId.set(id as Id<"employees">);
        this.loadEmployeeData(id as Id<"employees">);
      } else {
        // "My Profile" mode - wait for user to be loaded
        this.loadCurrentUserProfile();
      }
    });

    this.loadOrganizationData();
  }

  private loadCurrentUserProfile() {
    // We need to wait for the user to be loaded from AuthService
    // Since getUser() is a signal, we can check it.
    // If it's already there, load immediately.
    // If not, we might need an effect, but this component is initialized after AuthGuard,
    // so user *should* be there or arriving shortly.

    // We'll use an effect to watch for the user if we don't have an ID yet
    // But we need to be careful not to create multiple effects or infinite loops.
    // simpler approach: just assume authService has user or will update.

    // Actually, we can just use an effect in the constructor or use a computed.
    // But we want to call 'loadEmployeeData' which is a side effect.

    // Let's rely on the signal value.
    const user = this.authService.getUser()();
    if (user && user.employeeId) {
      this.employeeId.set(user.employeeId);
      this.loadEmployeeData(user.employeeId);
    } else {
       // If user is not yet loaded, we could set up an effect,
       // or just retry?
       // A cleaner way in Angular 16+ with Signals:
       // We can just query based on the computed user signal?
       // But we have a unified 'employeeId' signal that drives the UI.
    }
  }

  // Actually, let's register an effect in the constructor to handle the "no ID param" case.
  constructor() {
      // In a real app, I'd put this in specific logic, but here:
      effect(() => {
          const user = this.authService.getUser()();
          const currentId = this.employeeId();
          const routeId = this.route.snapshot.paramMap.get('id');

          // Only auto-load profile if:
          // 1. We have a user with an employeeId
          // 2. We are NOT on a route with an explicit ID (i.e. /profile)
          // 3. We haven't loaded it yet
          if (user?.employeeId && !routeId && !currentId) {
              this.employeeId.set(user.employeeId);
              this.loadEmployeeData(user.employeeId);
          }
      }, { allowSignalWrites: true });
  }

  loadEmployeeData(id: Id<"employees">) {
    const client = this.convex.getClient();
    client.onUpdate(api.employees.get, { id }, (data) => {
      if (data === null) {
        this.toast.error('Employee not found');
        this.router.navigate(['/employees']);
        return;
      }
      this.employee.set(data);
    });

    // Load History
    client.onUpdate(api.core_hr.getPromotions, { employeeId: id }, (data) => this.promotions.set(data));
    client.onUpdate(api.core_hr.getTransfers, { employeeId: id }, (data) => this.transfers.set(data));
    client.onUpdate(api.core_hr.getResignations, { employeeId: id }, (data) => this.resignations.set(data));
    client.onUpdate(api.core_hr.getTerminations, { employeeId: id }, (data) => this.terminations.set(data));
    client.onUpdate(api.core_hr.getWarnings, { employeeId: id }, (data) => this.warnings.set(data));
    client.onUpdate(api.core_hr.getAwards, { employeeId: id }, (data) => this.awards.set(data));
    client.onUpdate(api.core_hr.getTravelRequests, { employeeId: id }, (data) => this.travelRequests.set(data));
    client.onUpdate(api.core_hr.getComplaints, { employeeId: id }, (data) => this.complaints.set(data));

    // Load Extended Details
    client.onUpdate(api.employee_details.listEmergencyContacts, { employeeId: id }, (data) => this.emergencyContacts.set(data));
    client.onUpdate(api.employee_details.listBankingDetails, { employeeId: id }, (data) => this.bankingDetails.set(data));
    client.onUpdate(api.employee_details.getStatutoryInfo, { employeeId: id }, (data) => this.statutoryInfo.set(data));
    client.onUpdate(api.employee_details.listEducation, { employeeId: id }, (data) => this.education.set(data));
    client.onUpdate(api.employee_details.listDocuments, { employeeId: id }, (data) => this.documents.set(data));
    client.onUpdate(api.payroll.getEmployeePayslips, { employeeId: id }, (data) => this.payslips.set(data));
    client.onUpdate(api.payroll.getEmployeeAdjustments, { employeeId: id }, (data) => this.adjustments.set(data));
  }

  // --- Extended Profile Handlers ---

  async saveContact(data: any) {
    if (!this.employeeId()) return;
    this.contactsLoading.set(true);
    try {
      const client = this.convex.getClient();
      if (data.id) {
        await client.mutation(api.employee_details.updateEmergencyContact, {
          id: data.id,
          employeeId: this.employeeId()!,
          updates: { ...data, id: undefined }
        });
      } else {
        await client.mutation(api.employee_details.addEmergencyContact, {
          employeeId: this.employeeId()!,
          ...data
        });
      }
      this.toast.success('Emergency contact saved');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to save contact');
    } finally {
      this.contactsLoading.set(false);
    }
  }

  async deleteContact(id: string) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Contact',
      message: 'Are you sure you want to delete this contact? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await this.convex.getClient().mutation(api.employee_details.deleteEmergencyContact, {
        id: id as any,
        employeeId: this.employeeId()!
      });
      this.toast.success('Contact deleted');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to delete');
    }
  }

  async saveStatutory(data: any) {
    if (!this.canEditFinancialData()) {
      this.toast.error('You do not have permission to update financial data');
      return;
    }
    if (!this.employeeId()) return;
    this.bankingLoading.set(true); // Share loading state or create new one
    try {
      await this.convex.getClient().mutation(api.employee_details.upsertStatutoryInfo, {
        employeeId: this.employeeId()!,
        ...data
      });
      this.toast.success('Statutory info updated');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to update');
    } finally {
      this.bankingLoading.set(false);
    }
  }

  async saveBank(data: any) {
    if (!this.canEditFinancialData()) {
      this.toast.error('You do not have permission to update financial data');
      return;
    }
    if (!this.employeeId()) return;
    this.bankingLoading.set(true);
    try {
      const client = this.convex.getClient();
      if (data.id) {
        await client.mutation(api.employee_details.updateBankingDetail, {
          id: data.id,
          employeeId: this.employeeId()!,
          updates: { ...data, id: undefined }
        });
      } else {
        await client.mutation(api.employee_details.addBankingDetail, {
          employeeId: this.employeeId()!,
          ...data
        });
      }
      this.toast.success('Banking details saved');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to save banking details');
    } finally {
      this.bankingLoading.set(false);
    }
  }

  async deleteBank(id: string) {
    if (!this.canEditFinancialData()) {
      this.toast.error('You do not have permission to update financial data');
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Bank Account',
      message: 'Are you sure you want to delete this bank account? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await this.convex.getClient().mutation(api.employee_details.deleteBankingDetail, {
        id: id as any,
        employeeId: this.employeeId()!
      });
      this.toast.success('Bank account deleted');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to delete');
    }
  }

  async addCredit(data: any) {
    if (!this.canEditFinancialData()) {
      this.toast.error('You do not have permission to update financial data');
      return;
    }
    if (!this.employeeId()) return;
    this.adjustmentsLoading.set(true);
    try {
      await this.convex.getClient().mutation(api.payroll.addCredit, {
        employeeId: this.employeeId()!,
        ...data,
        amount: Number(data.amount)
      });
      this.toast.success('Allowance added');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to add allowance');
    } finally {
      this.adjustmentsLoading.set(false);
    }
  }

  async addDebit(data: any) {
    if (!this.canEditFinancialData()) {
      this.toast.error('You do not have permission to update financial data');
      return;
    }
    if (!this.employeeId()) return;
    this.adjustmentsLoading.set(true);
    try {
      await this.convex.getClient().mutation(api.payroll.addDebit, {
        employeeId: this.employeeId()!,
        ...data,
        amount: Number(data.amount)
      });
      this.toast.success('Deduction added');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to add deduction');
    } finally {
      this.adjustmentsLoading.set(false);
    }
  }

  async toggleAdjustment(data: { id: string, type: 'credit' | 'debit', isActive: boolean }) {
    if (!this.canEditFinancialData()) {
      this.toast.error('You do not have permission to update financial data');
      return;
    }
    try {
      await this.convex.getClient().mutation(api.payroll.toggleAdjustmentStatus, data);
      this.toast.success('Status updated');
    } catch (err: any) {
      this.toast.error('Failed to update status');
    }
  }

  async saveEducation(data: any) {
    if (!this.employeeId()) return;
    this.educationLoading.set(true);
    try {
      const client = this.convex.getClient();
      if (data.id) {
        await client.mutation(api.employee_details.updateEducation, {
          id: data.id,
          employeeId: this.employeeId()!,
          updates: { ...data, id: undefined }
        });
      } else {
        await client.mutation(api.employee_details.addEducation, {
          employeeId: this.employeeId()!,
          ...data
        });
      }
      this.toast.success('Education history saved');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to save');
    } finally {
      this.educationLoading.set(false);
    }
  }

  async deleteEducation(id: string) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Education Record',
      message: 'Are you sure you want to remove this education record? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await this.convex.getClient().mutation(api.employee_details.deleteEducation, {
        id: id as any,
        employeeId: this.employeeId()!
      });
      this.toast.success('Record deleted');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to delete');
    }
  }

  async saveDocument(data: any) {
    if (!this.employeeId()) return;
    this.documentsLoading.set(true);
    try {
      // In a real implementation, we would handle the file upload here first
      // For now we just save the metadata as per the mock in the child component
      await this.convex.getClient().mutation(api.employee_details.addDocument, {
        employeeId: this.employeeId()!,
        ...data
      });
      this.toast.success('Document uploaded');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to upload');
    } finally {
      this.documentsLoading.set(false);
    }
  }

  async deleteDocument(id: string) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      await this.convex.getClient().mutation(api.employee_details.deleteDocument, {
        id: id as any,
        employeeId: this.employeeId()!
      });
      this.toast.success('Document deleted');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to delete');
    }
  }

  // --- Compensation Handlers ---

  canEditCompensation(): boolean {
    return this.authService.hasRole(['super_admin', 'admin', 'hr_manager'])();
  }

  toggleEditCompensation(): void {
    if (!this.canEditCompensation()) {
      this.toast.error('You do not have permission to edit compensation');
      return;
    }
    const editing = !this.editingCompensation();
    this.editingCompensation.set(editing);
    if (editing) {
      const emp = this.employee();
      this.compensationForm.patchValue({
        baseSalary: emp?.baseSalary ?? null,
        currency: emp?.currency ?? 'USD',
        payFrequency: emp?.payFrequency ?? 'monthly',
      });
    }
  }

  async saveCompensation(): Promise<void> {
    if (!this.canEditCompensation()) {
      this.toast.error('You do not have permission to edit compensation');
      return;
    }
    if (!this.employeeId()) return;
    this.saving.set(true);
    try {
      await this.convex.getClient().mutation(api.employees.updateCompensation, {
        employeeId: this.employeeId()!,
        ...this.compensationForm.value,
      });
      this.editingCompensation.set(false);
      this.toast.success('Compensation updated successfully');
    } catch (error: any) {
      this.toast.error(error.message || 'Failed to update compensation');
    } finally {
      this.saving.set(false);
    }
  }

  formatSalary(amount?: number, currency?: string): string {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  }

  formatPayFrequency(freq?: string): string {
    const map: Record<string, string> = {
      monthly: 'Monthly',
      bi_weekly: 'Bi-Weekly',
      weekly: 'Weekly',
    };
    return map[freq || ''] || 'Not set';
  }

  loadOrganizationData() {
    const client = this.convex.getClient();
    // We fetch these once to populate dropdowns.
    // Real-time updates might be overkill for dropdown lists but good for consistency.
    client.onUpdate(api.organization.listDepartments, {}, (data) => this.departments.set(data));
    client.onUpdate(api.organization.listDesignations, {}, (data) => this.designations.set(data));
    client.onUpdate(api.organization.listLocations, {}, (data) => this.locations.set(data));
    // Fetch employees for autocomplete/selects
    if (this.canPerformHrActions()) {
      client.onUpdate(api.employees.list, {}, (data) => this.employeesList.set(data));
    }
  }

  getInitials(emp: any): string {
    if (!emp) return '';
    return (emp.firstName[0] + emp.lastName[0]).toUpperCase();
  }

  getMonthName(month: number): string {
    if (!month) return '';
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
      case 'resolved':
      case 'approved':
        return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30';
      case 'pending':
      case 'investigating':
        return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/30';
      case 'terminated':
      case 'resigned':
      case 'rejected':
      case 'dismissed':
        return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/30';
      default:
        return 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 dark:bg-stone-700/40 dark:text-stone-300 dark:border-stone-600/40';
    }
  }

  openAction(action: ActionType) {
    this.currentAction.set(action);
    this.showActionModal.set(true);
  }

  async onActionSubmit(formData: any) {
    if (!this.employeeId()) return;
    this.submitting.set(true);
    const client = this.convex.getClient();

    try {
      switch (this.currentAction()) {
        case 'promote':
          await client.mutation(api.core_hr.createPromotion, {
            employeeId: this.employeeId()!,
            fromDesignationId: this.employee().designationId, // Current designation
            toDesignationId: formData.toDesignationId,
            promotionDate: formData.promotionDate,
            salaryIncrement: Number(formData.salaryIncrement) || 0,
            remarks: formData.remarks
          });
          break;

        case 'transfer':
          await client.mutation(api.core_hr.createTransfer, {
            employeeId: this.employeeId()!,
            fromDepartmentId: this.employee().departmentId,
            toDepartmentId: formData.toDepartmentId,
            fromLocationId: this.employee().locationId,
            toLocationId: formData.toLocationId,
            transferDate: formData.transferDate,
            remarks: formData.remarks
          });
          break;

        case 'resign':
          // If status implies immediate termination, we might call updateStatus on employee too,
          // but core_hr.submitResignation just records it.
          // Let's assume this action is just recording the request/event.
          await client.mutation(api.core_hr.submitResignation, {
            employeeId: this.employeeId()!,
            noticeDate: formData.noticeDate,
            lastWorkingDay: formData.lastWorkingDay,
            reason: formData.reason
          });
          // Optionally update employee status if it's immediate
          break;

        case 'terminate':
          await client.mutation(api.core_hr.terminateEmployee, {
            employeeId: this.employeeId()!,
            terminationDate: formData.terminationDate,
            type: formData.type,
            reason: formData.reason,
            noticeGiven: formData.noticeGiven
          });
          break;

        case 'warning':
          await client.mutation(api.core_hr.issueWarning, {
            employeeId: this.employeeId()!,
            subject: formData.subject,
            description: formData.description,
            severity: formData.severity,
            issueDate: formData.issueDate,
            actionTaken: formData.actionTaken
          });
          break;

        case 'award':
          await client.mutation(api.core_hr.giveAward, {
            employeeId: this.employeeId()!,
            title: formData.title,
            gift: formData.gift,
            cashPrice: Number(formData.cashPrice) || 0,
            date: formData.date,
            description: formData.description
          });
          break;

        case 'travel':
          await client.mutation(api.core_hr.createTravelRequest, {
            employeeId: this.employeeId()!,
            destination: formData.destination,
            startDate: formData.startDate,
            endDate: formData.endDate,
            purpose: formData.purpose,
            budget: Number(formData.budget) || 0
          });
          break;

        case 'complaint':
          await client.mutation(api.core_hr.fileComplaint, {
            complainantId: this.employeeId()!,
            accusedId: formData.accusedId, // Optional
            subject: formData.subject,
            description: formData.description,
            date: formData.date
          });
          break;
      }

      this.toast.success(`${this.actionModalTitle()} submitted successfully`);
      this.showActionModal.set(false);
    } catch (error: any) {
      console.error('Action failed:', error);
      this.toast.error(error.message || 'Action failed');
    } finally {
      this.submitting.set(false);
    }
  }

  // --- Form Configurations ---

  getPromoteConfig(): FieldConfig[] {
    return [
      {
        name: 'toDesignationId',
        label: 'New Designation',
        type: 'select',
        required: true,
        options: this.designations().map(d => ({ label: d.title, value: d._id }))
      },
      { name: 'promotionDate', label: 'Promotion Date', type: 'date', required: true },
      { name: 'salaryIncrement', label: 'Salary Increment Amount', type: 'number' },
      { name: 'remarks', label: 'Remarks', type: 'textarea' }
    ];
  }

  getTransferConfig(): FieldConfig[] {
    return [
      {
        name: 'toDepartmentId',
        label: 'New Department',
        type: 'select',
        required: true,
        options: this.departments().map(d => ({ label: d.name, value: d._id }))
      },
      {
        name: 'toLocationId',
        label: 'New Location',
        type: 'select',
        options: this.locations().map(l => ({ label: l.name, value: l._id }))
      },
      { name: 'transferDate', label: 'Transfer Date', type: 'date', required: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea' }
    ];
  }

  getResignConfig(): FieldConfig[] {
    return [
      { name: 'noticeDate', label: 'Notice Date', type: 'date', required: true },
      { name: 'lastWorkingDay', label: 'Last Working Day', type: 'date', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true }
    ];
  }

  getTerminateConfig(): FieldConfig[] {
    return [
      { name: 'terminationDate', label: 'Termination Date', type: 'date', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          { label: 'Voluntary', value: 'voluntary' },
          { label: 'Involuntary', value: 'involuntary' }
        ]
      },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true },
      { name: 'noticeGiven', label: 'Notice Given?', type: 'checkbox' }
    ];
  }

  getWarningConfig(): FieldConfig[] {
    return [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      {
        name: 'severity',
        label: 'Severity',
        type: 'select',
        required: true,
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Critical', value: 'critical' }
        ]
      },
      { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'actionTaken', label: 'Action Taken', type: 'text' }
    ];
  }

  getAwardConfig(): FieldConfig[] {
    return [
      { name: 'title', label: 'Award Title', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'gift', label: 'Gift Description', type: 'text' },
      { name: 'cashPrice', label: 'Cash Prize', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea' }
    ];
  }

  getTravelConfig(): FieldConfig[] {
    return [
      { name: 'destination', label: 'Destination', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      { name: 'budget', label: 'Est. Budget', type: 'number' },
      { name: 'purpose', label: 'Purpose', type: 'textarea', required: true }
    ];
  }

  getComplaintConfig(): FieldConfig[] {
    return [
      { name: 'subject', label: 'Subject', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      {
        name: 'accusedId',
        label: 'Accused (Optional)',
        type: 'select',
        options: this.employeesList().map(e => ({ label: `${e.firstName} ${e.lastName}`, value: e._id }))
      },
      { name: 'description', label: 'Description', type: 'textarea', required: true }
    ];
  }
}

