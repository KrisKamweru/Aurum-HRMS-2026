import { Component, EventEmitter, Input, Output, signal, inject, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiFormFieldComponent } from '../../../../shared/components/ui-form-field/ui-form-field.component';
import { ConvexClientService } from '../../../../core/services/convex-client.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { api } from '../../../../../../convex/_generated/api';

@Component({
  selector: 'app-manual-entry-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiModalComponent,
    UiButtonComponent,
    UiFormFieldComponent
  ],
  template: `
    <ui-modal
      [isOpen]="isOpen()"
      [title]="modalTitle()"
      (close)="close.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Date Display (Read-only) -->
        <div class="bg-stone-50 dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700 flex justify-between items-center">
          <div>
            <div class="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase">Date</div>
            <div class="text-stone-800 dark:text-stone-100 font-medium">{{ date() | date:'fullDate' }}</div>
          </div>
          <div>
            <div class="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase">Employee</div>
            <div class="text-stone-800 dark:text-stone-100 font-medium">{{ employee()?.name }}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Clock In Time -->
          <ui-form-field label="Clock In" [error]="getErrorMessage('clockIn')">
            <input
              type="time"
              formControlName="clockIn"
              class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all"
            />
          </ui-form-field>

          <!-- Clock Out Time -->
          <ui-form-field label="Clock Out" [error]="getErrorMessage('clockOut')">
            <input
              type="time"
              formControlName="clockOut"
              class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all"
            />
          </ui-form-field>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Status -->
          <ui-form-field label="Status" [error]="getErrorMessage('status')">
            <select
              formControlName="status"
              class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half-day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="on-leave">On Leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </ui-form-field>

          <!-- Break Minutes -->
          <ui-form-field label="Break (minutes)" [error]="getErrorMessage('breakMinutes')">
            <input
              type="number"
              formControlName="breakMinutes"
              min="0"
              class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all"
            />
          </ui-form-field>
        </div>

        <!-- Notes -->
        <ui-form-field label="Correction Notes" [error]="getErrorMessage('notes')">
          <textarea
            formControlName="notes"
            rows="3"
            class="w-full px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8b1e3f] focus:border-transparent transition-all"
            placeholder="Reason for manual entry or correction..."
          ></textarea>
        </ui-form-field>

        <div class="flex justify-end gap-3 pt-2">
          <ui-button
            variant="ghost"
            type="button"
            (onClick)="close.emit()"
            [disabled]="isSubmitting()"
          >
            Cancel
          </ui-button>
          <ui-button
            variant="primary"
            type="submit"
            [loading]="isSubmitting()"
          >
            Save Record
          </ui-button>
        </div>
      </form>
    </ui-modal>
  `
})
export class ManualEntryModalComponent {
  private fb = inject(FormBuilder);
  private convex = inject(ConvexClientService);
  private toast = inject(ToastService);

  isOpen = input(false);
  employee = input<{ id: string, name: string } | null>(null);
  date = input<string>('');

  @Input() set record(value: any) {
    if (value) {
      // Extract HH:MM from ISO strings
      const clockIn = value.clockIn ? new Date(value.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
      const clockOut = value.clockOut ? new Date(value.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

      this.form.patchValue({
        clockIn,
        clockOut,
        status: value.status || 'present',
        breakMinutes: value.breakMinutes || 0,
        notes: value.notes || ''
      });
    } else {
      this.form.reset({
        status: 'present',
        breakMinutes: 0
      });
    }
  }

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  isSubmitting = signal(false);

  form = this.fb.group({
    clockIn: [''],
    clockOut: [''],
    status: ['present', Validators.required],
    breakMinutes: [0, [Validators.min(0)]],
    notes: ['', Validators.required]
  });

  modalTitle = computed(() => {
    return `Update Attendance: ${this.employee()?.name}`;
  });

  getErrorMessage(controlName: string): string {
    const control = this.form.get(controlName);
    if (control?.touched && control?.invalid) {
      if (control.errors?.['required']) return 'This field is required';
      if (control.errors?.['min']) return 'Value must be positive';
    }
    return '';
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.form.value;
    const dateStr = this.date();

    // Helper to combine date and time to ISO
    const toISO = (timeStr: string | null | undefined) => {
      if (!timeStr) return undefined;
      // timeStr is HH:MM
      const [hours, minutes] = timeStr.split(':').map(Number);
      const d = new Date(dateStr);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    };

    try {
      await this.convex.getClient().mutation(api.attendance.manualEntry, {
        employeeId: this.employee()!.id as any,
        date: dateStr,
        clockIn: toISO(formValue.clockIn),
        clockOut: toISO(formValue.clockOut),
        status: formValue.status as any,
        breakMinutes: formValue.breakMinutes || 0,
        notes: formValue.notes || undefined
      });

      this.toast.success('Attendance record updated');
      this.saved.emit();
      this.close.emit();
    } catch (error: any) {
      console.error(error);
      this.toast.error(error.message || 'Failed to update record');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
