import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../../shared/services/form-helper.service';

@Component({
  selector: 'app-profile-financial',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiButtonComponent,
    UiIconComponent,
    UiModalComponent,
    DynamicFormComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Statutory Info -->
      <ui-card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <ui-icon name="scale" class="w-5 h-5 text-indigo-500"></ui-icon>
            Statutory Information
          </h3>
          <ui-button size="sm" variant="ghost" (onClick)="openStatutoryModal()">
            <ui-icon name="pencil" class="w-4 h-4 mr-1"></ui-icon> Edit
          </ui-button>
        </div>

        @if (statutory()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg">
              <div class="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Country</div>
              <div class="font-medium text-stone-900 dark:text-stone-100">{{ statutory().country || '-' }}</div>
            </div>
            <div class="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg">
              <div class="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Tax ID (PIN/SSN)</div>
              <div class="font-medium text-stone-900 dark:text-stone-100 font-mono">{{ statutory().taxId || '-' }}</div>
            </div>
            <div class="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg">
              <div class="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">National ID</div>
              <div class="font-medium text-stone-900 dark:text-stone-100 font-mono">{{ statutory().nationalId || '-' }}</div>
            </div>
            <div class="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg">
              <div class="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Social Security / NSSF</div>
              <div class="font-medium text-stone-900 dark:text-stone-100 font-mono">{{ statutory().socialSecurityId || '-' }}</div>
            </div>
            <div class="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg">
              <div class="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold mb-1">Health Insurance / NHIF</div>
              <div class="font-medium text-stone-900 dark:text-stone-100 font-mono">{{ statutory().healthInsuranceId || '-' }}</div>
            </div>
          </div>
        } @else {
          <div class="text-stone-500 dark:text-stone-400 italic text-sm text-center py-4">
            Statutory information not set.
          </div>
        }
      </ui-card>

      <!-- Banking Details -->
      <ui-card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <ui-icon name="credit-card" class="w-5 h-5 text-emerald-500"></ui-icon>
            Banking Details
          </h3>
          <ui-button size="sm" variant="ghost" (onClick)="openBankModal()">
            <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon> Add
          </ui-button>
        </div>

        @if (banking().length === 0) {
          <div class="text-stone-500 dark:text-stone-400 italic text-sm text-center py-4">
            No bank accounts listed.
          </div>
        } @else {
          <div class="space-y-3">
            @for (bank of banking(); track bank._id) {
              <div class="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 flex justify-between items-center group">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ui-icon name="building-library" class="w-5 h-5"></ui-icon>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-stone-800 dark:text-stone-100">{{ bank.bankName }}</span>
                      @if (bank.isPrimary) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Primary</span>
                      }
                    </div>
                    <div class="text-sm text-stone-600 dark:text-stone-400 font-mono mt-0.5">
                      {{ bank.accountNumber }} • {{ bank.bankBranch || 'Main Branch' }}
                    </div>
                  </div>
                </div>

                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button (click)="editBank(bank)" class="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                    <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
                  </button>
                  <button (click)="deleteBank.emit(bank._id)" class="p-1.5 text-stone-400 hover:text-red-600">
                    <ui-icon name="trash" class="w-4 h-4"></ui-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </ui-card>

      <!-- Payroll Adjustments (Credits & Debits) -->
      @if (adjustments()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Allowances / Credits -->
          <ui-card>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <ui-icon name="arrow-up" class="w-5 h-5 text-green-500"></ui-icon>
                Allowances
              </h3>
              <ui-button size="sm" variant="ghost" (onClick)="openCreditModal()">
                <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon> Add
              </ui-button>
            </div>

            @if (adjustments()!.credits.length === 0) {
              <div class="text-stone-500 dark:text-stone-400 italic text-sm text-center py-4">
                No active allowances.
              </div>
            } @else {
              <div class="space-y-3">
                @for (item of adjustments()!.credits; track item._id) {
                  <div class="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800">
                    <div>
                      <div class="font-medium text-stone-900 dark:text-stone-100">{{ item.name }}</div>
                      <div class="text-xs text-stone-500 dark:text-stone-400">{{ item.itemType | titlecase }}</div>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="font-bold text-green-600 dark:text-green-400">+{{ item.amount | currency }}</span>
                      <button
                        (click)="toggleAdjustment.emit({ id: item._id, type: 'credit', isActive: !item.isActive })"
                        class="text-xs px-2 py-1 rounded border transition-colors"
                        [class.bg-green-100]="item.isActive"
                        [class.text-green-700]="item.isActive"
                        [class.border-green-200]="item.isActive"
                        [class.bg-stone-100]="!item.isActive"
                        [class.text-stone-500]="!item.isActive"
                        [class.border-stone-200]="!item.isActive"
                      >
                        {{ item.isActive ? 'Active' : 'Paused' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </ui-card>

          <!-- Deductions / Debits -->
          <ui-card>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <ui-icon name="arrow-down" class="w-5 h-5 text-red-500"></ui-icon>
                Deductions
              </h3>
              <ui-button size="sm" variant="ghost" (onClick)="openDebitModal()">
                <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon> Add
              </ui-button>
            </div>

            @if (adjustments()!.debits.length === 0) {
              <div class="text-stone-500 dark:text-stone-400 italic text-sm text-center py-4">
                No active deductions.
              </div>
            } @else {
              <div class="space-y-3">
                @for (item of adjustments()!.debits; track item._id) {
                  <div class="flex items-center justify-between p-3 rounded-lg bg-stone-50 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800">
                    <div>
                      <div class="font-medium text-stone-900 dark:text-stone-100">{{ item.name }}</div>
                      <div class="text-xs text-stone-500 dark:text-stone-400">{{ item.itemType | titlecase }}</div>
                    </div>
                    <div class="flex items-center gap-3">
                      <span class="font-bold text-red-600 dark:text-red-400">-{{ item.amount | currency }}</span>
                      <button
                        (click)="toggleAdjustment.emit({ id: item._id, type: 'debit', isActive: !item.isActive })"
                        class="text-xs px-2 py-1 rounded border transition-colors"
                        [class.bg-green-100]="item.isActive"
                        [class.text-green-700]="item.isActive"
                        [class.border-green-200]="item.isActive"
                        [class.bg-stone-100]="!item.isActive"
                        [class.text-stone-500]="!item.isActive"
                        [class.border-stone-200]="!item.isActive"
                      >
                        {{ item.isActive ? 'Active' : 'Paused' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </ui-card>
        </div>
      }
    </div>

    <!-- Statutory Modal -->
    <ui-modal
      [(isOpen)]="showStatutoryModal"
      title="Update Statutory Information"
    >
      <app-dynamic-form
        [fields]="statutoryConfig"
        [initialValues]="statutory() || {}"
        [loading]="loading()"
        submitLabel="Save Changes"
        (formSubmit)="onStatutorySubmit($event)"
        (cancel)="showStatutoryModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>

    <!-- Bank Modal -->
    <ui-modal
      [(isOpen)]="showBankModal"
      [title]="editingBank() ? 'Edit Bank Account' : 'Add Bank Account'"
    >
      <app-dynamic-form
        [fields]="bankConfig"
        [initialValues]="editingBank() || {}"
        [loading]="loading()"
        [submitLabel]="editingBank() ? 'Update' : 'Add'"
        (formSubmit)="onBankSubmit($event)"
        (cancel)="showBankModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>

    <!-- Credit Modal -->
    <ui-modal
      [(isOpen)]="showCreditModal"
      title="Add Allowance / Bonus"
    >
      <app-dynamic-form
        [fields]="creditConfig"
        [loading]="adjustmentsLoading()"
        submitLabel="Add Allowance"
        (formSubmit)="onCreditSubmit($event)"
        (cancel)="showCreditModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>

    <!-- Debit Modal -->
    <ui-modal
      [(isOpen)]="showDebitModal"
      title="Add Deduction / Penalty"
    >
      <app-dynamic-form
        [fields]="debitConfig"
        [loading]="adjustmentsLoading()"
        submitLabel="Add Deduction"
        (formSubmit)="onDebitSubmit($event)"
        (cancel)="showDebitModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `
})
export class ProfileFinancialComponent {
  statutory = input<any>(null);
  banking = input<any[]>([]);
  adjustments = input<{ credits: any[], debits: any[] } | null>(null);
  loading = input(false);
  adjustmentsLoading = input(false);

  saveStatutory = output<any>();
  saveBank = output<any>();
  deleteBank = output<string>();
  addCredit = output<any>();
  addDebit = output<any>();
  toggleAdjustment = output<{ id: string, type: 'credit' | 'debit', isActive: boolean }>();

  showStatutoryModal = signal(false);
  showBankModal = signal(false);
  showCreditModal = signal(false);
  showDebitModal = signal(false);
  editingBank = signal<any>(null);

  statutoryConfig: FieldConfig[] = [
    { name: 'country', label: 'Country of Employment', type: 'text', required: true },
    { name: 'taxId', label: 'Tax ID / KRA PIN / SSN', type: 'text' },
    { name: 'nationalId', label: 'National ID Number', type: 'text' },
    { name: 'socialSecurityId', label: 'Social Security / NSSF', type: 'text' },
    { name: 'healthInsuranceId', label: 'Health Insurance / NHIF', type: 'text' }
  ];

  bankConfig: FieldConfig[] = [
    { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
    { name: 'bankBranch', label: 'Branch Name', type: 'text' },
    { name: 'bankCode', label: 'Bank/Branch Code (Sort Code)', type: 'text' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
    { name: 'accountName', label: 'Account Holder Name', type: 'text' },
    {
      name: 'accountType',
      label: 'Account Type',
      type: 'select',
      options: [
        { label: 'Checking / Current', value: 'checking' },
        { label: 'Savings', value: 'savings' }
      ]
    },
    { name: 'isPrimary', label: 'Primary Account for Salary?', type: 'checkbox' }
  ];

  creditConfig: FieldConfig[] = [
    { name: 'name', label: 'Name (e.g. House Allowance)', type: 'text', required: true },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Allowance (Recurring)', value: 'allowance' },
        { label: 'Bonus (One-time)', value: 'bonus' },
        { label: 'Commission', value: 'commission' },
        { label: 'Reimbursement', value: 'reimbursement' },
        { label: 'Other', value: 'other' }
      ]
    },
    { name: 'isTaxable', label: 'Is Taxable?', type: 'checkbox', placeholder: 'Yes, taxable' },
    { name: 'isPermanent', label: 'Recurring Monthly?', type: 'checkbox', placeholder: 'Yes, add every month' }
  ];

  debitConfig: FieldConfig[] = [
    { name: 'name', label: 'Name (e.g. Salary Advance)', type: 'text', required: true },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Loan Repayment', value: 'loan' },
        { label: 'Salary Advance', value: 'advance' },
        { label: 'Penalty / Fine', value: 'penalty' },
        { label: 'Tax Adjustment', value: 'tax' },
        { label: 'Other', value: 'other' }
      ]
    },
    { name: 'isPermanent', label: 'Recurring Monthly?', type: 'checkbox', placeholder: 'Yes, deduct every month' }
  ];

  openStatutoryModal() {
    this.showStatutoryModal.set(true);
  }

  onStatutorySubmit(data: any) {
    this.saveStatutory.emit(data);
    this.showStatutoryModal.set(false);
  }

  openBankModal() {
    this.editingBank.set(null);
    this.showBankModal.set(true);
  }

  editBank(bank: any) {
    this.editingBank.set(bank);
    this.showBankModal.set(true);
  }

  onBankSubmit(data: any) {
    if (this.editingBank()) {
      this.saveBank.emit({ id: this.editingBank()._id, ...data });
    } else {
      this.saveBank.emit(data);
    }
    this.showBankModal.set(false);
  }

  openCreditModal() {
    this.showCreditModal.set(true);
  }

  onCreditSubmit(data: any) {
    this.addCredit.emit(data);
    this.showCreditModal.set(false);
  }

  openDebitModal() {
    this.showDebitModal.set(true);
  }

  onDebitSubmit(data: any) {
    this.addDebit.emit(data);
    this.showDebitModal.set(false);
  }
}
