import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import { api } from '../../../../../convex/_generated/api';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../shared/services/form-helper.service';
import { ToastService } from '../../../shared/services/toast.service';
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
    RouterModule,
    UiButtonComponent,
    UiIconComponent,
    UiModalComponent,
    DynamicFormComponent,
    ProfilePersonalComponent,
    ProfileFinancialComponent,
    ProfileEducationComponent,
    ProfileDocumentsComponent
  ],
  template: `
    <div class="space-y-6" *ngIf="employee(); else loadingTpl">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-2xl font-bold text-stone-500 dark:text-stone-300">
            {{ getInitials(employee()) }}
          </div>
          <div>
            <h1 class="heading-accent text-2xl dark:text-stone-100">{{ employee().firstName }} {{ employee().lastName }}</h1>
            <p class="text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <ui-icon name="briefcase" class="w-4 h-4"></ui-icon>
              {{ employee().position || 'No Position' }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2" *ngIf="canManageEmployees()">
          <ui-button variant="outline" (onClick)="openAction('promote')">Promote</ui-button>
          <ui-button variant="outline" (onClick)="openAction('transfer')">Transfer</ui-button>
          <ui-button variant="outline" (onClick)="openAction('warning')" class="!text-amber-600 dark:!text-amber-400 !border-amber-200 dark:!border-amber-800 hover:!bg-amber-50 dark:hover:!bg-amber-900/20">Warning</ui-button>
          <ui-button variant="outline" (onClick)="openAction('award')" class="!text-indigo-600 dark:!text-indigo-400 !border-indigo-200 dark:!border-indigo-800 hover:!bg-indigo-50 dark:hover:!bg-indigo-900/20">Award</ui-button>
          <ui-button variant="outline" (onClick)="openAction('travel')" class="!text-sky-600 dark:!text-sky-400 !border-sky-200 dark:!border-sky-800 hover:!bg-sky-50 dark:hover:!bg-sky-900/20">Travel</ui-button>
          <ui-button variant="outline" (onClick)="openAction('complaint')" class="!text-rose-600 dark:!text-rose-400 !border-rose-200 dark:!border-rose-800 hover:!bg-rose-50 dark:hover:!bg-rose-900/20">Complaint</ui-button>
          <ui-button variant="outline" (onClick)="openAction('resign')" class="!text-orange-600 dark:!text-orange-400 !border-orange-200 dark:!border-orange-800 hover:!bg-orange-50 dark:hover:!bg-orange-900/20">Resignation</ui-button>
          <ui-button variant="outline" (onClick)="openAction('terminate')" class="!text-red-600 dark:!text-red-400 !border-red-200 dark:!border-red-800 hover:!bg-red-50 dark:hover:!bg-red-900/20">Terminate</ui-button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-stone-200 dark:border-stone-700 overflow-x-auto">
        <nav class="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            *ngFor="let tab of tabs"
            [class.border-[#8b1e3f]]="activeTab() === tab"
            [class.dark:border-[#fce7eb]]="activeTab() === tab"
            [class.text-[#8b1e3f]]="activeTab() === tab"
            [class.dark:text-[#fce7eb]]="activeTab() === tab"
            [class.border-transparent]="activeTab() !== tab"
            [class.text-stone-500]="activeTab() !== tab"
            [class.dark:text-stone-400]="activeTab() !== tab"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm hover:text-[#8b1e3f] dark:hover:text-[#fce7eb] transition-colors capitalize"
            (click)="activeTab.set(tab)"
          >
            {{ tab }}
          </button>
        </nav>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" *ngIf="activeTab() === 'overview'">

        <!-- Left Column: Personal & Professional Info -->
        <div class="md:col-span-2 space-y-6">
          <!-- Professional Details card -->
          <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <h3 class="font-bold text-lg mb-4 text-[#8b1e3f] dark:text-[#fce7eb] border-b border-stone-100 dark:border-stone-700 pb-2">Professional Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="info-group">
                <label>Employee ID</label>
                <p class="font-mono text-sm text-stone-800 dark:text-stone-200">{{ employee()._id }}</p>
              </div>
              <div class="info-group">
                <label>Email</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().email }}</p>
              </div>
              <div class="info-group">
                <label>Department</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().department || '-' }}</p>
              </div>
              <div class="info-group">
                <label>Location</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().location || '-' }}</p>
              </div>
              <div class="info-group">
                <label>Status</label>
                <span [class]="'badge ' + getStatusBadgeClass(employee().status)">
                  {{ employee().status | titlecase }}
                </span>
              </div>
              <div class="info-group">
                <label>Start Date</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().startDate | date }}</p>
              </div>
              <div class="info-group">
                <label>Manager</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().managerName || '-' }}</p>
              </div>
            </div>
          </div>

          <!-- Personal Details card -->
          <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
            <h3 class="font-bold text-lg mb-4 text-[#8b1e3f] dark:text-[#fce7eb] border-b border-stone-100 dark:border-stone-700 pb-2">Personal Details</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="info-group">
                <label>Phone</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().phone || '-' }}</p>
              </div>
              <div class="info-group">
                <label>Address</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().address || '-' }}</p>
              </div>
              <div class="info-group">
                <label>Gender</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().gender || '-' }}</p>
              </div>
              <div class="info-group">
                <label>Date of Birth</label>
                <p class="text-stone-800 dark:text-stone-200">{{ employee().dob ? (employee().dob | date) : '-' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Quick Actions -->
        <div class="space-y-6">
          <div class="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-6 border border-stone-200 dark:border-stone-700">
            <h3 class="font-bold mb-2 text-stone-800 dark:text-stone-200">Quick Actions</h3>
            <p class="text-sm text-stone-500 dark:text-stone-400 mb-4">Common tasks for this employee.</p>
            <div class="flex flex-col gap-2">
              <button (click)="activeTab.set('documents')" class="text-left p-2 hover:bg-white dark:hover:bg-stone-800 rounded transition text-sm flex items-center gap-2 text-stone-600 dark:text-stone-300">
                <ui-icon name="document" class="w-4 h-4"></ui-icon> View Documents
              </button>
              <button (click)="activeTab.set('history')" class="text-left p-2 hover:bg-white dark:hover:bg-stone-800 rounded transition text-sm flex items-center gap-2 text-stone-600 dark:text-stone-300">
                 <ui-icon name="clock" class="w-4 h-4"></ui-icon> View History
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Extended Tabs Content -->
      <app-profile-personal
        *ngIf="activeTab() === 'personal'"
        [contacts]="emergencyContacts()"
        [loading]="contactsLoading()"
        (save)="saveContact($event)"
        (delete)="deleteContact($event)"
      ></app-profile-personal>

      <app-profile-financial
        *ngIf="activeTab() === 'financial'"
        [statutory]="statutoryInfo()"
        [banking]="bankingDetails()"
        [loading]="bankingLoading()"
        (saveStatutory)="saveStatutory($event)"
        (saveBank)="saveBank($event)"
        (deleteBank)="deleteBank($event)"
      ></app-profile-financial>

      <app-profile-education
        *ngIf="activeTab() === 'education'"
        [education]="education()"
        [loading]="educationLoading()"
        (save)="saveEducation($event)"
        (delete)="deleteEducation($event)"
      ></app-profile-education>

      <app-profile-documents
        *ngIf="activeTab() === 'documents'"
        [documents]="documents()"
        [loading]="documentsLoading()"
        (save)="saveDocument($event)"
        (delete)="deleteDocument($event)"
      ></app-profile-documents>

      <!-- History Tab -->
      <div class="space-y-6" *ngIf="activeTab() === 'history'">

        <!-- Promotions -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
          <h3 class="font-bold text-lg mb-4 text-[#8b1e3f] dark:text-[#fce7eb] flex items-center gap-2">
            <ui-icon name="trending-up" class="w-5 h-5"></ui-icon> Promotions
          </h3>
          <div *ngIf="promotions().length === 0" class="text-stone-500 dark:text-stone-400 italic">No promotion history.</div>
          <div class="space-y-4">
            <div *ngFor="let item of promotions()" class="border-l-2 border-[#8b1e3f] dark:border-[#fce7eb] pl-4 py-1">
              <div class="text-sm text-stone-500 dark:text-stone-400">{{ item.promotionDate | date }}</div>
              <div class="font-medium text-stone-800 dark:text-stone-200">Promoted to new designation</div>
              <div class="text-sm text-stone-600 dark:text-stone-300" *ngIf="item.remarks">"{{ item.remarks }}"</div>
              <div class="text-xs text-stone-400 dark:text-stone-500 mt-1" *ngIf="item.salaryIncrement">Salary Increment: {{ item.salaryIncrement | currency }}</div>
            </div>
          </div>
        </div>

        <!-- Transfers -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
          <h3 class="font-bold text-lg mb-4 text-[#8b1e3f] dark:text-[#fce7eb] flex items-center gap-2">
            <ui-icon name="arrows-right-left" class="w-5 h-5"></ui-icon> Transfers
          </h3>
          <div *ngIf="transfers().length === 0" class="text-stone-500 dark:text-stone-400 italic">No transfer history.</div>
          <div class="space-y-4">
            <div *ngFor="let item of transfers()" class="border-l-2 border-blue-500 dark:border-blue-400 pl-4 py-1">
              <div class="text-sm text-stone-500 dark:text-stone-400">{{ item.transferDate | date }}</div>
              <div class="font-medium text-stone-800 dark:text-stone-200">Transferred</div>
              <div class="text-sm text-stone-600 dark:text-stone-300" *ngIf="item.remarks">"{{ item.remarks }}"</div>
            </div>
          </div>
        </div>

        <!-- Resignations -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700" *ngIf="resignations().length > 0">
          <h3 class="font-bold text-lg mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
            <ui-icon name="user" class="w-5 h-5"></ui-icon> Separation / Resignation
          </h3>
          <div class="space-y-4">
            <div *ngFor="let item of resignations()" class="border-l-2 border-red-500 dark:border-red-400 pl-4 py-1">
              <div class="flex justify-between">
                 <div class="font-medium text-stone-800 dark:text-stone-200">Resignation Submitted</div>
                 <span [class]="'badge ' + getStatusBadgeClass(item.status)">{{ item.status | titlecase }}</span>
              </div>
              <div class="text-sm text-stone-500 dark:text-stone-400 mt-1">Last Working Day: {{ item.lastWorkingDay | date }}</div>
              <div class="text-sm text-stone-600 dark:text-stone-300 italic mt-1">"{{ item.reason }}"</div>
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
          <h3 class="font-bold text-lg mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <ui-icon name="exclamation-triangle" class="w-5 h-5"></ui-icon> Warnings
          </h3>
          <div *ngIf="warnings().length === 0" class="text-stone-500 dark:text-stone-400 italic">No disciplinary history.</div>
          <div class="space-y-4">
            <div *ngFor="let item of warnings()" class="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30">
              <div class="flex justify-between items-start">
                <span class="font-bold text-amber-800 dark:text-amber-200">{{ item.subject }}</span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 uppercase">{{ item.severity }}</span>
              </div>
              <div class="text-sm text-amber-900 dark:text-amber-100 mt-1">{{ item.description }}</div>
              <div class="text-xs text-amber-700 dark:text-amber-300 mt-2">Date: {{ item.issueDate | date }}</div>
            </div>
          </div>
        </div>

        <!-- Awards -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
          <h3 class="font-bold text-lg mb-4 text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <ui-icon name="star" class="w-5 h-5"></ui-icon> Awards
          </h3>
          <div *ngIf="awards().length === 0" class="text-stone-500 dark:text-stone-400 italic">No awards received.</div>
          <div class="space-y-4">
            <div *ngFor="let item of awards()" class="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-3">
               <div class="p-2 bg-white dark:bg-stone-800 rounded-full text-yellow-500 dark:text-yellow-400 shadow-sm">
                 <ui-icon name="star" class="w-5 h-5"></ui-icon>
               </div>
               <div>
                 <div class="font-bold text-indigo-900 dark:text-indigo-200">{{ item.title }}</div>
                 <div class="text-sm text-indigo-800 dark:text-indigo-300">{{ item.description }}</div>
                 <div class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{{ item.date | date }} <span *ngIf="item.cashPrice">• {{ item.cashPrice | currency }}</span></div>
               </div>
            </div>
          </div>
        </div>

        <!-- Travel Requests -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
          <h3 class="font-bold text-lg mb-4 text-sky-600 dark:text-sky-400 flex items-center gap-2">
            <ui-icon name="globe-alt" class="w-5 h-5"></ui-icon> Travel History
          </h3>
          <div *ngIf="travelRequests().length === 0" class="text-stone-500 dark:text-stone-400 italic">No travel history.</div>
          <div class="space-y-4">
            <div *ngFor="let item of travelRequests()" class="bg-sky-50 dark:bg-sky-900/10 p-3 rounded-lg border border-sky-100 dark:border-sky-800/30">
              <div class="flex justify-between items-start">
                <span class="font-bold text-sky-900 dark:text-sky-200">{{ item.destination }}</span>
                <span [class]="'badge ' + getStatusBadgeClass(item.status)">{{ item.status | titlecase }}</span>
              </div>
              <div class="text-sm text-sky-800 dark:text-sky-300 mt-1">Purpose: {{ item.purpose }}</div>
              <div class="text-xs text-sky-600 dark:text-sky-400 mt-2">
                {{ item.startDate | date }} - {{ item.endDate | date }}
                <span *ngIf="item.budget">• Budget: {{ item.budget | currency }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Complaints -->
        <div class="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700">
          <h3 class="font-bold text-lg mb-4 text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <ui-icon name="scale" class="w-5 h-5"></ui-icon> Complaints Filed
          </h3>
          <div *ngIf="complaints().length === 0" class="text-stone-500 dark:text-stone-400 italic">No complaints filed.</div>
          <div class="space-y-4">
            <div *ngFor="let item of complaints()" class="bg-rose-50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-100 dark:border-rose-800/30">
              <div class="flex justify-between items-start">
                <span class="font-bold text-rose-900 dark:text-rose-200">{{ item.subject }}</span>
                <span [class]="'badge ' + getStatusBadgeClass(item.status)">{{ item.status | titlecase }}</span>
              </div>
              <div class="text-sm text-rose-800 dark:text-rose-300 mt-1">{{ item.description }}</div>
              <div class="text-xs text-rose-600 dark:text-rose-400 mt-2">
                Filed on: {{ item.date | date }}
                <span *ngIf="item.accusedId">• Against ID: {{ item.accusedId }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Loading Template -->
    <ng-template #loadingTpl>
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8b1e3f]"></div>
      </div>
    </ng-template>

    <!-- Action Modal -->
    <ui-modal [(isOpen)]="showActionModal" [title]="actionModalTitle()">
      <app-dynamic-form
        *ngIf="currentActionConfig()"
        [fields]="currentActionConfig()!"
        [loading]="submitting()"
        [submitLabel]="actionSubmitLabel()"
        (formSubmit)="onActionSubmit($event)"
        (cancel)="showActionModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `,
  styles: [`
    .info-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #78716c;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    :host-context(.dark) .info-group label {
      color: #a8a29e;
    }
    .info-group p {
      color: #292524;
      font-weight: 500;
    }
    :host-context(.dark) .info-group p {
      color: #e7e5e4;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-success { background-color: #dcfce7; color: #166534; }
    :host-context(.dark) .badge-success { background-color: rgba(22, 101, 52, 0.2); color: #86efac; border: 1px solid rgba(22, 101, 52, 0.3); }

    .badge-warning { background-color: #fef9c3; color: #854d0e; }
    :host-context(.dark) .badge-warning { background-color: rgba(133, 77, 14, 0.2); color: #fde047; border: 1px solid rgba(133, 77, 14, 0.3); }

    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    :host-context(.dark) .badge-danger { background-color: rgba(153, 27, 27, 0.2); color: #fca5a5; border: 1px solid rgba(153, 27, 27, 0.3); }

    .badge-neutral { background-color: #f3f4f6; color: #1f2937; }
    :host-context(.dark) .badge-neutral { background-color: rgba(31, 41, 55, 0.4); color: #d1d5db; border: 1px solid rgba(75, 85, 99, 0.3); }
  `]
})
export class EmployeeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  protected canManageEmployees = this.authService.hasRole(['super_admin', 'admin', 'hr_manager', 'manager']);

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

  // Sub-component loading states
  contactsLoading = signal(false);
  bankingLoading = signal(false);
  educationLoading = signal(false);
  documentsLoading = signal(false);

  // UI State
  activeTab = signal<'overview' | 'personal' | 'financial' | 'education' | 'documents' | 'history'>('overview');
  tabs: ('overview' | 'personal' | 'financial' | 'education' | 'documents' | 'history')[] = ['overview', 'personal', 'financial', 'education', 'documents', 'history'];

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
    if (!confirm('Are you sure you want to delete this contact?')) return;
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
    if (!confirm('Delete this bank account?')) return;
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
    if (!confirm('Remove this education record?')) return;
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
    if (!confirm('Delete this document?')) return;
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

  loadOrganizationData() {
    const client = this.convex.getClient();
    // We fetch these once to populate dropdowns.
    // Real-time updates might be overkill for dropdown lists but good for consistency.
    client.onUpdate(api.organization.listDepartments, {}, (data) => this.departments.set(data));
    client.onUpdate(api.organization.listDesignations, {}, (data) => this.designations.set(data));
    client.onUpdate(api.organization.listLocations, {}, (data) => this.locations.set(data));
    // Fetch employees for autocomplete/selects
    if (this.canManageEmployees()) {
      client.onUpdate(api.employees.list, {}, (data) => this.employeesList.set(data));
    }
  }

  getInitials(emp: any): string {
    if (!emp) return '';
    return (emp.firstName[0] + emp.lastName[0]).toUpperCase();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'badge-success';
      case 'pending':
      case 'investigating': return 'badge-warning';
      case 'terminated':
      case 'resigned':
      case 'rejected':
      case 'dismissed': return 'badge-danger';
      case 'resolved':
      case 'approved': return 'badge-success';
      default: return 'badge-neutral';
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
