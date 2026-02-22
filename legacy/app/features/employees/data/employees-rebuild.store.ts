import { Injectable, computed, inject, signal } from '@angular/core';
import { EmployeesRebuildDataService } from './employees-rebuild.data.service';
import {
  CreateEmployeeInput,
  RebuildEmployeeCompensationActionResult,
  RebuildEmployeeDetailCollections,
  RebuildEmployeeRecord,
  RebuildEmployeePayFrequency,
  RebuildEmployeeReference,
  RebuildEmployeeStatus,
  UpdateEmployeeCompensationInput,
  UpdateEmployeeInput
} from './employees-rebuild.models';

interface EmployeeMutationDraft {
  firstName: string;
  lastName: string;
  email: string;
  departmentId?: string;
  designationId?: string;
  locationId?: string;
  managerId?: string;
  status?: string;
  startDate: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeesRebuildStore {
  private readonly data = inject(EmployeesRebuildDataService);

  private readonly employeeState = signal<RebuildEmployeeRecord[]>([]);
  private readonly selectedEmployeeState = signal<RebuildEmployeeRecord | null>(null);
  private readonly detailCollectionsState = signal<RebuildEmployeeDetailCollections>({
    emergencyContacts: 0,
    bankingRecords: 0,
    educationRecords: 0,
    documents: 0,
    hasStatutoryInfo: false
  });

  private readonly departmentRefsState = signal<RebuildEmployeeReference[]>([]);
  private readonly designationRefsState = signal<RebuildEmployeeReference[]>([]);
  private readonly locationRefsState = signal<RebuildEmployeeReference[]>([]);
  private readonly managerRefsState = signal<RebuildEmployeeReference[]>([]);

  private readonly listLoadingState = signal(false);
  private readonly detailLoadingState = signal(false);
  private readonly referencesLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly employees = this.employeeState.asReadonly();
  readonly selectedEmployee = this.selectedEmployeeState.asReadonly();
  readonly detailCollections = this.detailCollectionsState.asReadonly();
  readonly departmentReferences = this.departmentRefsState.asReadonly();
  readonly designationReferences = this.designationRefsState.asReadonly();
  readonly locationReferences = this.locationRefsState.asReadonly();
  readonly managerReferences = this.managerRefsState.asReadonly();

  readonly listLoading = this.listLoadingState.asReadonly();
  readonly detailLoading = this.detailLoadingState.asReadonly();
  readonly referencesLoading = this.referencesLoadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly activeEmployeeCount = computed(
    () => this.employees().filter((employee) => employee.status.trim().toLowerCase() === 'active').length
  );

  readonly inactiveEmployeeCount = computed(() => this.employees().length - this.activeEmployeeCount());

  async loadEmployees(): Promise<void> {
    this.listLoadingState.set(true);
    this.clearError();
    try {
      this.employeeState.set(await this.data.listEmployees());
    } catch (error: unknown) {
      this.setError(error, 'Unable to load employees.');
    } finally {
      this.listLoadingState.set(false);
    }
  }

  async loadReferences(): Promise<void> {
    this.referencesLoadingState.set(true);
    this.clearError();
    try {
      const [departments, designations, locations, managers] = await Promise.all([
        this.data.listDepartmentReferences(),
        this.data.listDesignationReferences(),
        this.data.listLocationReferences(),
        this.data.listManagerReferences()
      ]);
      this.departmentRefsState.set(departments);
      this.designationRefsState.set(designations);
      this.locationRefsState.set(locations);
      this.managerRefsState.set(managers);
    } catch (error: unknown) {
      this.setError(error, 'Unable to load employee form references.');
    } finally {
      this.referencesLoadingState.set(false);
    }
  }

  async loadEmployeeDetail(id: string): Promise<void> {
    const normalizedId = id.trim();
    if (!normalizedId) {
      this.errorState.set('Employee id is required.');
      return;
    }

    this.detailLoadingState.set(true);
    this.clearError();
    try {
      const [employee, collections] = await Promise.all([
        this.data.getEmployee(normalizedId),
        this.data.listEmployeeDetailCollections(normalizedId)
      ]);
      if (!employee) {
        this.selectedEmployeeState.set(null);
        this.detailCollectionsState.set({
          emergencyContacts: 0,
          bankingRecords: 0,
          educationRecords: 0,
          documents: 0,
          hasStatutoryInfo: false
        });
        this.errorState.set('Employee not found.');
        return;
      }
      this.selectedEmployeeState.set(employee);
      this.detailCollectionsState.set(collections);
    } catch (error: unknown) {
      this.selectedEmployeeState.set(null);
      this.setError(error, 'Unable to load employee profile.');
    } finally {
      this.detailLoadingState.set(false);
    }
  }

  async addEmployee(payload: EmployeeMutationDraft): Promise<boolean> {
    const normalized = this.toCreateInput(payload);
    if (!normalized) {
      return false;
    }
    if (this.hasEmailConflict(normalized.email)) {
      this.errorState.set('Employee email must be unique.');
      return false;
    }
    if (!this.managerExists(normalized.managerId)) {
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.createEmployee(normalized);
      await Promise.all([this.loadEmployees(), this.loadReferences()]);
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create employee.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateEmployee(payload: EmployeeMutationDraft & { id: string }): Promise<boolean> {
    const id = payload.id.trim();
    if (!id) {
      this.errorState.set('Employee id is required.');
      return false;
    }
    const current = this.employees().find((employee) => employee.id === id);
    if (!current) {
      this.errorState.set('Employee not found.');
      return false;
    }

    const normalized = this.toUpdateInput(payload);
    if (!normalized) {
      return false;
    }
    if (normalized.managerId && normalized.managerId === id) {
      this.errorState.set('An employee cannot be their own manager.');
      return false;
    }
    if (this.hasEmailConflict(normalized.email, id)) {
      this.errorState.set('Employee email must be unique.');
      return false;
    }
    if (!this.managerExists(normalized.managerId, id)) {
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateEmployee(normalized);
      if (normalized.status !== current.status && this.isKnownStatus(normalized.status)) {
        await this.data.updateEmployeeStatus(id, normalized.status);
      }
      await Promise.all([this.loadEmployees(), this.loadReferences()]);
      if (this.selectedEmployee()?.id === id) {
        await this.loadEmployeeDetail(id);
      }
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update employee.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async removeEmployee(id: string): Promise<boolean> {
    const normalizedId = id.trim();
    if (!this.employees().some((employee) => employee.id === normalizedId)) {
      this.errorState.set('Employee not found.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.deleteEmployee(normalizedId);
      await Promise.all([this.loadEmployees(), this.loadReferences()]);
      if (this.selectedEmployee()?.id === normalizedId) {
        this.selectedEmployeeState.set(null);
      }
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to remove employee.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async submitCompensationChange(
    payload: UpdateEmployeeCompensationInput
  ): Promise<RebuildEmployeeCompensationActionResult | null> {
    const employeeId = payload.employeeId.trim();
    const reason = this.normalizeOptionalText(payload.reason);
    const currency = this.normalizeOptionalText(payload.currency)?.toUpperCase();
    const payFrequency = this.normalizePayFrequency(payload.payFrequency);
    const baseSalary = this.normalizeCompensationAmount(payload.baseSalary);

    if (!employeeId) {
      this.errorState.set('Employee id is required.');
      return null;
    }
    if (!reason) {
      this.errorState.set('A change reason is required for compensation updates.');
      return null;
    }
    if (payload.baseSalary !== undefined && baseSalary === undefined) {
      this.errorState.set('Base salary must be a valid non-negative number.');
      return null;
    }
    if (!currency && baseSalary === undefined && !payFrequency) {
      this.errorState.set('At least one compensation field is required.');
      return null;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      const result = await this.data.updateEmployeeCompensation({
        employeeId,
        baseSalary,
        currency,
        payFrequency,
        reason
      });
      if (this.selectedEmployee()?.id === employeeId) {
        await this.loadEmployeeDetail(employeeId);
      }
      return result;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update compensation.');
      return null;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private toCreateInput(payload: EmployeeMutationDraft): CreateEmployeeInput | null {
    const normalized = this.normalizeCommon(payload);
    if (!normalized) {
      return null;
    }
    return normalized;
  }

  private toUpdateInput(payload: EmployeeMutationDraft & { id: string }): UpdateEmployeeInput | null {
    const normalized = this.normalizeCommon(payload);
    if (!normalized) {
      return null;
    }
    return {
      id: payload.id.trim(),
      ...normalized
    };
  }

  private normalizeCommon(payload: EmployeeMutationDraft): CreateEmployeeInput | null {
    const firstName = payload.firstName.trim();
    const lastName = payload.lastName.trim();
    const email = payload.email.trim().toLowerCase();
    const startDate = payload.startDate.trim();
    const departmentId = this.normalizeOptionalId(payload.departmentId);
    const designationId = this.normalizeOptionalId(payload.designationId);
    const status = this.normalizeStatus(payload.status);

    if (!firstName || !lastName || !email || !startDate) {
      this.errorState.set('First name, last name, email, and start date are required.');
      return null;
    }
    if (!departmentId || !designationId) {
      this.errorState.set('Department and designation are required.');
      return null;
    }

    return {
      firstName,
      lastName,
      email,
      departmentId,
      designationId,
      locationId: this.normalizeOptionalId(payload.locationId),
      managerId: this.normalizeOptionalId(payload.managerId),
      status,
      startDate,
      phone: this.normalizeOptionalText(payload.phone),
      address: this.normalizeOptionalText(payload.address),
      gender: this.normalizeOptionalText(payload.gender),
      dob: this.normalizeOptionalText(payload.dob)
    };
  }

  private normalizeStatus(status: string | undefined): RebuildEmployeeStatus {
    if (status === 'active' || status === 'on-leave' || status === 'terminated' || status === 'resigned') {
      return status;
    }
    return 'active';
  }

  private hasEmailConflict(email: string, currentId?: string): boolean {
    const target = email.trim().toLowerCase();
    return this.employees().some((employee) => employee.id !== currentId && employee.email.trim().toLowerCase() === target);
  }

  private managerExists(managerId: string | undefined, employeeId?: string): boolean {
    if (!managerId) {
      return true;
    }
    const manager = this.managerReferences().find((candidate) => candidate.id === managerId);
    if (!manager) {
      this.errorState.set('Selected manager is no longer available.');
      return false;
    }
    if (employeeId && manager.id === employeeId) {
      this.errorState.set('An employee cannot be their own manager.');
      return false;
    }
    return true;
  }

  private normalizeOptionalId(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizePayFrequency(value: string | undefined): RebuildEmployeePayFrequency | undefined {
    if (value === 'monthly' || value === 'bi_weekly' || value === 'weekly') {
      return value;
    }
    return undefined;
  }

  private normalizeCompensationAmount(value: number | undefined): number | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (!Number.isFinite(value) || value < 0) {
      return undefined;
    }
    return value;
  }

  private isKnownStatus(status: string): status is RebuildEmployeeStatus {
    return status === 'active' || status === 'on-leave' || status === 'terminated' || status === 'resigned';
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }
}
