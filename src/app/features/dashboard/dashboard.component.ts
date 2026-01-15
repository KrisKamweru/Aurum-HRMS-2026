import { Component, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConvexClientService } from '../../core/services/convex-client.service';
import { api } from '../../../../convex/_generated/api';
import { Doc } from '../../../../convex/_generated/dataModel';
import { UiFormFieldComponent } from '../../shared/components/ui-form-field/ui-form-field.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiDataTableComponent, TableColumn } from '../../shared/components/ui-data-table/ui-data-table.component';
import { UiCardComponent } from '../../shared/components/ui-card/ui-card.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';
import { ToastService } from '../../shared/services/toast.service';

type Employee = Doc<'employees'>;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiFormFieldComponent, UiButtonComponent, UiDataTableComponent, UiIconComponent, UiCardComponent],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private convexService = inject(ConvexClientService);
  private toastService = inject(ToastService);

  // Today's date for the header
  protected readonly today = new Date();

  // Real employee data from Convex
  protected readonly employees = signal<Employee[]>([]);
  private unsubscribe: (() => void) | null = null;

  // Table Configuration
  protected readonly columns: TableColumn[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      formatter: (value, row) => `${row.firstName} ${row.lastName}`
    },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'position', header: 'Position', sortable: true },
    {
      key: 'status',
      header: 'Status',
      type: 'badge',
      badgeVariant: (value) => {
        switch (value) {
          case 'active': return 'success';
          case 'on-leave': return 'warning';
          case 'terminated': return 'danger';
          default: return 'neutral';
        }
      }
    }
  ];

  protected readonly newEmployeeForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    department: ['', Validators.required],
  });

  protected isSubmitting = signal(false);

  ngOnInit() {
    const client = this.convexService.getClient();
    this.unsubscribe = client.onUpdate(api.employees.list, {}, (employees) => {
      this.employees.set(employees);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  // Dashboard stats computed from employee data
  protected readonly stats = computed(() => {
    const emps = this.employees();
    return {
      totalEmployees: emps.length,
      activeEmployees: emps.filter(e => e.status === 'active').length,
      onLeave: emps.filter(e => e.status === 'on-leave').length,
      departments: [...new Set(emps.map(e => e.department))].length,
    };
  });

  protected async onQuickAdd() {
    if (this.newEmployeeForm.valid) {
      this.isSubmitting.set(true);
      const formData = this.newEmployeeForm.value;

      try {
        await this.convexService.getClient().mutation(api.employees.create, {
          firstName: formData.firstName!,
          lastName: formData.lastName!,
          email: formData.email!,
          department: formData.department!,
          position: 'New Hire', // Default position
          status: 'active',
          startDate: new Date().toISOString().split('T')[0],
        });

        // Reset form
        this.newEmployeeForm.reset();
        this.toastService.success('Employee added successfully');
      } catch (error) {
        console.error('Failed to create employee:', error);
        this.toastService.error('Failed to create employee. Please try again.');
      } finally {
        this.isSubmitting.set(false);
      }
    } else {
      this.newEmployeeForm.markAllAsTouched();
    }
  }
}
