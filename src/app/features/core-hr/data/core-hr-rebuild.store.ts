import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CoreHrRecordType,
  CreateAwardInput,
  CreateComplaintInput,
  CreatePromotionInput,
  CreateTerminationInput,
  CreateTransferInput,
  CreateTravelInput,
  CreateWarningInput,
  EMPTY_CORE_HR_RECORD_MAP,
  RebuildCoreHrEmployeeReference,
  RebuildCoreHrRecordMap,
  RebuildCoreHrViewerContext,
  ResignationDecision,
  SubmitResignationInput,
  TerminationType,
  WarningSeverity
} from './core-hr-rebuild.models';
import { CoreHrRebuildDataService } from './core-hr-rebuild.data.service';

@Injectable({ providedIn: 'root' })
export class CoreHrRebuildStore {
  private readonly data = inject(CoreHrRebuildDataService);

  private readonly viewerState = signal<RebuildCoreHrViewerContext>({ role: 'pending' });
  private readonly employeesState = signal<RebuildCoreHrEmployeeReference[]>([]);
  private readonly departmentsState = signal<{ id: string; label: string }[]>([]);
  private readonly designationsState = signal<{ id: string; label: string }[]>([]);
  private readonly locationsState = signal<{ id: string; label: string }[]>([]);
  private readonly recordsState = signal<RebuildCoreHrRecordMap>(EMPTY_CORE_HR_RECORD_MAP);

  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly referencesLoadedState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly viewer = this.viewerState.asReadonly();
  readonly employees = this.employeesState.asReadonly();
  readonly departments = this.departmentsState.asReadonly();
  readonly designations = this.designationsState.asReadonly();
  readonly locations = this.locationsState.asReadonly();
  readonly records = this.recordsState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  readonly canManage = computed(() => {
    const role = this.viewer().role;
    return role === 'super_admin' || role === 'admin' || role === 'hr_manager';
  });

  readonly recordCounts = computed(() => ({
    promotions: this.records().promotions.length,
    transfers: this.records().transfers.length,
    awards: this.records().awards.length,
    warnings: this.records().warnings.length,
    resignations: this.records().resignations.length,
    terminations: this.records().terminations.length,
    complaints: this.records().complaints.length,
    travel: this.records().travel.length
  }));

  readonly pendingResignations = computed(
    () => this.records().resignations.filter((record) => record.status === 'pending').length
  );

  async loadOverview(): Promise<void> {
    this.loadingState.set(true);
    this.clearError();
    try {
      await this.ensureContextAndReferences();
      const [
        promotions,
        transfers,
        awards,
        warnings,
        resignations,
        terminations,
        complaints,
        travel
      ] = await Promise.all([
        this.data.listPromotions(),
        this.data.listTransfers(),
        this.data.listAwards(),
        this.data.listWarnings(),
        this.data.listResignations(),
        this.data.listTerminations(),
        this.data.listComplaints(),
        this.data.listTravelRequests()
      ]);

      this.recordsState.set({
        promotions,
        transfers,
        awards,
        warnings,
        resignations,
        terminations,
        complaints,
        travel
      });
    } catch (error: unknown) {
      this.setError(error, 'Unable to load core HR overview.');
    } finally {
      this.loadingState.set(false);
    }
  }

  async loadRecordType(type: CoreHrRecordType): Promise<void> {
    this.loadingState.set(true);
    this.clearError();
    try {
      await this.ensureContextAndReferences();
      await this.refreshRecordType(type);
    } catch (error: unknown) {
      this.setError(error, `Unable to load ${type}.`);
    } finally {
      this.loadingState.set(false);
    }
  }

  async submitRecord(type: CoreHrRecordType, payload: Record<string, unknown>): Promise<boolean> {
    this.savingState.set(true);
    this.clearError();

    try {
      switch (type) {
        case 'promotions': {
          const input = this.normalizePromotion(payload);
          if (!input) {
            return false;
          }
          await this.data.createPromotion(input);
          break;
        }
        case 'transfers': {
          const input = this.normalizeTransfer(payload);
          if (!input) {
            return false;
          }
          await this.data.createTransfer(input);
          break;
        }
        case 'awards': {
          const input = this.normalizeAward(payload);
          if (!input) {
            return false;
          }
          await this.data.giveAward(input);
          break;
        }
        case 'warnings': {
          const input = this.normalizeWarning(payload);
          if (!input) {
            return false;
          }
          await this.data.issueWarning(input);
          break;
        }
        case 'resignations': {
          const input = this.normalizeResignation(payload);
          if (!input) {
            return false;
          }
          await this.data.submitResignation(input);
          break;
        }
        case 'terminations': {
          const input = this.normalizeTermination(payload);
          if (!input) {
            return false;
          }
          await this.data.terminateEmployee(input);
          await this.refreshReferences();
          break;
        }
        case 'complaints': {
          const input = this.normalizeComplaint(payload);
          if (!input) {
            return false;
          }
          await this.data.fileComplaint(input);
          break;
        }
        case 'travel': {
          const input = this.normalizeTravel(payload);
          if (!input) {
            return false;
          }
          await this.data.createTravelRequest(input);
          break;
        }
      }

      await this.refreshRecordType(type);
      return true;
    } catch (error: unknown) {
      this.setError(error, `Unable to submit ${type}.`);
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async reviewResignation(resignationId: string, decision: ResignationDecision): Promise<boolean> {
    if (!this.canManage()) {
      this.errorState.set('You do not have permission to review resignations.');
      return false;
    }

    const target = this.records().resignations.find((row) => row.id === resignationId);
    if (!target) {
      this.errorState.set('Resignation request not found.');
      return false;
    }
    if (target.status !== 'pending') {
      this.errorState.set('Only pending resignations can be reviewed.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateResignationStatus(resignationId, decision);
      await this.refreshRecordType('resignations');
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update resignation status.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async ensureContextAndReferences(): Promise<void> {
    if (this.referencesLoadedState()) {
      return;
    }
    const [viewer, employees, departments, designations, locations] = await Promise.all([
      this.data.getViewerContext(),
      this.data.listEmployees(),
      this.data.listDepartments(),
      this.data.listDesignations(),
      this.data.listLocations()
    ]);

    this.viewerState.set(viewer);
    this.employeesState.set(employees);
    this.departmentsState.set(departments);
    this.designationsState.set(designations);
    this.locationsState.set(locations);
    this.referencesLoadedState.set(true);
  }

  private async refreshReferences(): Promise<void> {
    const [employees, departments, designations, locations] = await Promise.all([
      this.data.listEmployees(),
      this.data.listDepartments(),
      this.data.listDesignations(),
      this.data.listLocations()
    ]);
    this.employeesState.set(employees);
    this.departmentsState.set(departments);
    this.designationsState.set(designations);
    this.locationsState.set(locations);
  }

  private async refreshRecordType(type: CoreHrRecordType): Promise<void> {
    switch (type) {
      case 'promotions':
        this.setRecord(type, await this.data.listPromotions());
        break;
      case 'transfers':
        this.setRecord(type, await this.data.listTransfers());
        break;
      case 'awards':
        this.setRecord(type, await this.data.listAwards());
        break;
      case 'warnings':
        this.setRecord(type, await this.data.listWarnings());
        break;
      case 'resignations':
        this.setRecord(type, await this.data.listResignations());
        break;
      case 'terminations':
        this.setRecord(type, await this.data.listTerminations());
        break;
      case 'complaints':
        this.setRecord(type, await this.data.listComplaints());
        break;
      case 'travel':
        this.setRecord(type, await this.data.listTravelRequests());
        break;
    }
  }

  private setRecord<K extends CoreHrRecordType>(type: K, rows: RebuildCoreHrRecordMap[K]): void {
    this.recordsState.update((state) => ({
      ...state,
      [type]: rows
    }));
  }

  private normalizePromotion(payload: Record<string, unknown>): CreatePromotionInput | null {
    const employee = this.getSelectedEmployee(payload, 'employeeId');
    if (!employee?.designationId) {
      this.errorState.set('Selected employee does not have a current designation.');
      return null;
    }

    const toDesignationId = this.requiredText(payload, 'toDesignationId', 'Target designation');
    const promotionDate = this.requiredDate(payload, 'promotionDate', 'Promotion date');
    if (!toDesignationId || !promotionDate) {
      return null;
    }
    if (toDesignationId === employee.designationId) {
      this.errorState.set('Target designation must be different from the current designation.');
      return null;
    }

    const salaryIncrement = this.optionalNonNegativeNumber(payload, 'salaryIncrement', 'Salary increment');
    if (salaryIncrement === null) {
      return null;
    }

    return {
      employeeId: employee.id,
      fromDesignationId: employee.designationId,
      toDesignationId,
      promotionDate,
      salaryIncrement,
      remarks: this.optionalText(payload, 'remarks')
    };
  }

  private normalizeTransfer(payload: Record<string, unknown>): CreateTransferInput | null {
    const employee = this.getSelectedEmployee(payload, 'employeeId');
    if (!employee?.departmentId) {
      this.errorState.set('Selected employee does not have a current department.');
      return null;
    }

    const toDepartmentId = this.requiredText(payload, 'toDepartmentId', 'Target department');
    const transferDate = this.requiredDate(payload, 'transferDate', 'Transfer date');
    if (!toDepartmentId || !transferDate) {
      return null;
    }
    if (toDepartmentId === employee.departmentId) {
      this.errorState.set('Target department must be different from the current department.');
      return null;
    }

    return {
      employeeId: employee.id,
      fromDepartmentId: employee.departmentId,
      toDepartmentId,
      fromLocationId: employee.locationId,
      toLocationId: this.optionalText(payload, 'toLocationId'),
      transferDate,
      remarks: this.optionalText(payload, 'remarks')
    };
  }

  private normalizeAward(payload: Record<string, unknown>): CreateAwardInput | null {
    const employee = this.getSelectedEmployee(payload, 'employeeId');
    const title = this.requiredText(payload, 'title', 'Award title');
    const date = this.requiredDate(payload, 'date', 'Award date');
    if (!employee || !title || !date) {
      return null;
    }

    const cashPrice = this.optionalNonNegativeNumber(payload, 'cashPrice', 'Cash prize');
    if (cashPrice === null) {
      return null;
    }

    return {
      employeeId: employee.id,
      title,
      date,
      gift: this.optionalText(payload, 'gift'),
      cashPrice,
      description: this.optionalText(payload, 'description')
    };
  }

  private normalizeWarning(payload: Record<string, unknown>): CreateWarningInput | null {
    const employee = this.getSelectedEmployee(payload, 'employeeId');
    const subject = this.requiredText(payload, 'subject', 'Warning subject');
    const description = this.requiredText(payload, 'description', 'Warning description');
    const issueDate = this.requiredDate(payload, 'issueDate', 'Issue date');
    const severityValue = this.requiredText(payload, 'severity', 'Severity');
    if (!employee || !subject || !description || !issueDate || !severityValue) {
      return null;
    }
    if (!this.isWarningSeverity(severityValue)) {
      this.errorState.set('Select a valid warning severity.');
      return null;
    }

    return {
      employeeId: employee.id,
      subject,
      description,
      issueDate,
      severity: severityValue,
      actionTaken: this.optionalText(payload, 'actionTaken')
    };
  }

  private normalizeResignation(payload: Record<string, unknown>): SubmitResignationInput | null {
    const employee = this.getSelectedEmployee(payload, 'employeeId');
    const noticeDate = this.requiredDate(payload, 'noticeDate', 'Notice date');
    const lastWorkingDay = this.requiredDate(payload, 'lastWorkingDay', 'Last working day');
    const reason = this.requiredText(payload, 'reason', 'Resignation reason');
    if (!employee || !noticeDate || !lastWorkingDay || !reason) {
      return null;
    }
    if (!this.isDateOrderValid(noticeDate, lastWorkingDay)) {
      this.errorState.set('Last working day must be on or after notice date.');
      return null;
    }
    return {
      employeeId: employee.id,
      noticeDate,
      lastWorkingDay,
      reason
    };
  }

  private normalizeTermination(payload: Record<string, unknown>): CreateTerminationInput | null {
    const employee = this.getSelectedEmployee(payload, 'employeeId');
    const terminationDate = this.requiredDate(payload, 'terminationDate', 'Termination date');
    const type = this.requiredText(payload, 'type', 'Termination type');
    const reason = this.requiredText(payload, 'reason', 'Termination reason');
    if (!employee || !terminationDate || !type || !reason) {
      return null;
    }
    if (employee.status.trim().toLowerCase() === 'terminated') {
      this.errorState.set('Selected employee is already terminated.');
      return null;
    }
    if (!this.isTerminationType(type)) {
      this.errorState.set('Select a valid termination type.');
      return null;
    }

    return {
      employeeId: employee.id,
      terminationDate,
      type,
      reason,
      noticeGiven: this.booleanValue(payload, 'noticeGiven')
    };
  }

  private normalizeComplaint(payload: Record<string, unknown>): CreateComplaintInput | null {
    const complainant = this.getSelectedEmployee(payload, 'complainantId');
    const subject = this.requiredText(payload, 'subject', 'Complaint subject');
    const description = this.requiredText(payload, 'description', 'Complaint description');
    const date = this.requiredDate(payload, 'date', 'Incident date');
    if (!complainant || !subject || !description || !date) {
      return null;
    }

    const accusedId = this.optionalText(payload, 'accusedId');
    if (accusedId && accusedId === complainant.id) {
      this.errorState.set('Complainant and accused cannot be the same employee.');
      return null;
    }

    return {
      complainantId: complainant.id,
      accusedId,
      subject,
      description,
      date
    };
  }

  private normalizeTravel(payload: Record<string, unknown>): CreateTravelInput | null {
    const employee = this.getSelectedEmployee(payload, 'employeeId');
    const destination = this.requiredText(payload, 'destination', 'Destination');
    const startDate = this.requiredDate(payload, 'startDate', 'Start date');
    const endDate = this.requiredDate(payload, 'endDate', 'End date');
    const purpose = this.requiredText(payload, 'purpose', 'Travel purpose');
    if (!employee || !destination || !startDate || !endDate || !purpose) {
      return null;
    }
    if (!this.isDateOrderValid(startDate, endDate)) {
      this.errorState.set('Travel end date must be on or after the start date.');
      return null;
    }

    const budget = this.optionalNonNegativeNumber(payload, 'budget', 'Travel budget');
    if (budget === null) {
      return null;
    }

    return {
      employeeId: employee.id,
      destination,
      startDate,
      endDate,
      purpose,
      budget
    };
  }

  private getSelectedEmployee(payload: Record<string, unknown>, key: string): RebuildCoreHrEmployeeReference | null {
    const employeeId = this.requiredText(payload, key, 'Employee');
    if (!employeeId) {
      return null;
    }
    const employee = this.employees().find((option) => option.id === employeeId);
    if (!employee) {
      this.errorState.set('Selected employee is not available.');
      return null;
    }
    return employee;
  }

  private requiredText(payload: Record<string, unknown>, key: string, label: string): string | null {
    const normalized = this.optionalText(payload, key);
    if (!normalized) {
      this.errorState.set(`${label} is required.`);
      return null;
    }
    return normalized;
  }

  private requiredDate(payload: Record<string, unknown>, key: string, label: string): string | null {
    const value = this.requiredText(payload, key, label);
    if (!value) {
      return null;
    }
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      this.errorState.set(`${label} must be a valid date.`);
      return null;
    }
    return value;
  }

  private optionalNonNegativeNumber(
    payload: Record<string, unknown>,
    key: string,
    label: string
  ): number | undefined | null {
    const value = payload[key];
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) {
        this.errorState.set(`${label} must be a non-negative number.`);
        return null;
      }
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (normalized.length === 0) {
        return undefined;
      }
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed) || parsed < 0) {
        this.errorState.set(`${label} must be a non-negative number.`);
        return null;
      }
      return parsed;
    }
    this.errorState.set(`${label} must be a number.`);
    return null;
  }

  private optionalText(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private booleanValue(payload: Record<string, unknown>, key: string): boolean {
    return payload[key] === true;
  }

  private isDateOrderValid(startDate: string, endDate: string): boolean {
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);
    return Number.isFinite(start) && Number.isFinite(end) && end >= start;
  }

  private isWarningSeverity(value: string): value is WarningSeverity {
    return value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
  }

  private isTerminationType(value: string): value is TerminationType {
    return value === 'voluntary' || value === 'involuntary';
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallback);
  }
}
