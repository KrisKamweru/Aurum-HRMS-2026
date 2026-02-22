import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { AppRole } from '../../../core/auth/auth.types';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  ComplaintStatus,
  CreateAwardInput,
  CreateComplaintInput,
  CreatePromotionInput,
  CreateTerminationInput,
  CreateTransferInput,
  CreateTravelInput,
  CreateWarningInput,
  RebuildAwardRecord,
  RebuildComplaintRecord,
  RebuildCoreHrEmployeeReference,
  RebuildCoreHrReferenceOption,
  RebuildCoreHrViewerContext,
  RebuildPromotionRecord,
  RebuildResignationRecord,
  RebuildTerminationRecord,
  RebuildTransferRecord,
  RebuildTravelRecord,
  RebuildWarningRecord,
  ResignationDecision,
  ResignationStatus,
  SubmitResignationInput,
  TerminationType,
  TravelStatus,
  WarningSeverity
} from './core-hr-rebuild.models';

@Injectable({ providedIn: 'root' })
export class CoreHrRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async getViewerContext(): Promise<RebuildCoreHrViewerContext> {
    const viewer = await this.convex.query(api.users.viewer, {});
    if (!viewer || typeof viewer !== 'object') {
      return { role: 'pending' };
    }

    const record = viewer as Record<string, unknown>;
    return {
      role: this.normalizeRole(record['role']),
      employeeId: typeof record['employeeId'] === 'string' ? record['employeeId'] : undefined
    };
  }

  async listEmployees(): Promise<RebuildCoreHrEmployeeReference[]> {
    const rows = await this.convex.query(api.employees.list, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapEmployee(row))
      .filter((row): row is RebuildCoreHrEmployeeReference => row !== null);
  }

  async listDepartments(): Promise<RebuildCoreHrReferenceOption[]> {
    const rows = await this.convex.query(api.organization.listDepartments, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapReference(row, 'name'))
      .filter((row): row is RebuildCoreHrReferenceOption => row !== null);
  }

  async listDesignations(): Promise<RebuildCoreHrReferenceOption[]> {
    const rows = await this.convex.query(api.organization.listDesignations, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapReference(row, 'title'))
      .filter((row): row is RebuildCoreHrReferenceOption => row !== null);
  }

  async listLocations(): Promise<RebuildCoreHrReferenceOption[]> {
    const rows = await this.convex.query(api.organization.listLocations, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapReference(row, 'name'))
      .filter((row): row is RebuildCoreHrReferenceOption => row !== null);
  }

  async listPromotions(): Promise<RebuildPromotionRecord[]> {
    const rows = await this.convex.query(api.core_hr.getPromotions, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapPromotion(row))
      .filter((row): row is RebuildPromotionRecord => row !== null);
  }

  async createPromotion(input: CreatePromotionInput): Promise<void> {
    await this.convex.mutation(api.core_hr.createPromotion, {
      employeeId: this.toId('employees', input.employeeId),
      fromDesignationId: this.toId('designations', input.fromDesignationId),
      toDesignationId: this.toId('designations', input.toDesignationId),
      promotionDate: input.promotionDate,
      salaryIncrement: input.salaryIncrement,
      remarks: this.normalizeOptionalText(input.remarks)
    });
  }

  async listTransfers(): Promise<RebuildTransferRecord[]> {
    const rows = await this.convex.query(api.core_hr.getTransfers, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapTransfer(row))
      .filter((row): row is RebuildTransferRecord => row !== null);
  }

  async createTransfer(input: CreateTransferInput): Promise<void> {
    await this.convex.mutation(api.core_hr.createTransfer, {
      employeeId: this.toId('employees', input.employeeId),
      fromDepartmentId: this.toId('departments', input.fromDepartmentId),
      toDepartmentId: this.toId('departments', input.toDepartmentId),
      fromLocationId: input.fromLocationId ? this.toId('locations', input.fromLocationId) : undefined,
      toLocationId: input.toLocationId ? this.toId('locations', input.toLocationId) : undefined,
      transferDate: input.transferDate,
      remarks: this.normalizeOptionalText(input.remarks)
    });
  }

  async listAwards(): Promise<RebuildAwardRecord[]> {
    const rows = await this.convex.query(api.core_hr.getAwards, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapAward(row))
      .filter((row): row is RebuildAwardRecord => row !== null);
  }

  async giveAward(input: CreateAwardInput): Promise<void> {
    await this.convex.mutation(api.core_hr.giveAward, {
      employeeId: this.toId('employees', input.employeeId),
      title: input.title,
      gift: this.normalizeOptionalText(input.gift),
      cashPrice: input.cashPrice,
      date: input.date,
      description: this.normalizeOptionalText(input.description)
    });
  }

  async listWarnings(): Promise<RebuildWarningRecord[]> {
    const rows = await this.convex.query(api.core_hr.getWarnings, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapWarning(row))
      .filter((row): row is RebuildWarningRecord => row !== null);
  }

  async issueWarning(input: CreateWarningInput): Promise<void> {
    await this.convex.mutation(api.core_hr.issueWarning, {
      employeeId: this.toId('employees', input.employeeId),
      subject: input.subject,
      description: input.description,
      severity: input.severity,
      issueDate: input.issueDate,
      actionTaken: this.normalizeOptionalText(input.actionTaken)
    });
  }

  async listResignations(): Promise<RebuildResignationRecord[]> {
    const rows = await this.convex.query(api.core_hr.getResignations, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapResignation(row))
      .filter((row): row is RebuildResignationRecord => row !== null);
  }

  async submitResignation(input: SubmitResignationInput): Promise<void> {
    await this.convex.mutation(api.core_hr.submitResignation, {
      employeeId: this.toId('employees', input.employeeId),
      noticeDate: input.noticeDate,
      lastWorkingDay: input.lastWorkingDay,
      reason: input.reason
    });
  }

  async updateResignationStatus(resignationId: string, status: ResignationDecision): Promise<void> {
    await this.convex.mutation(api.core_hr.updateResignationStatus, {
      resignationId: this.toId('resignations', resignationId),
      status
    });
  }

  async listTerminations(): Promise<RebuildTerminationRecord[]> {
    const rows = await this.convex.query(api.core_hr.getTerminations, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapTermination(row))
      .filter((row): row is RebuildTerminationRecord => row !== null);
  }

  async terminateEmployee(input: CreateTerminationInput): Promise<void> {
    await this.convex.mutation(api.core_hr.terminateEmployee, {
      employeeId: this.toId('employees', input.employeeId),
      terminationDate: input.terminationDate,
      type: input.type,
      reason: input.reason,
      noticeGiven: input.noticeGiven
    });
  }

  async listComplaints(): Promise<RebuildComplaintRecord[]> {
    const rows = await this.convex.query(api.core_hr.getComplaints, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapComplaint(row))
      .filter((row): row is RebuildComplaintRecord => row !== null);
  }

  async fileComplaint(input: CreateComplaintInput): Promise<void> {
    await this.convex.mutation(api.core_hr.fileComplaint, {
      complainantId: this.toId('employees', input.complainantId),
      accusedId: input.accusedId ? this.toId('employees', input.accusedId) : undefined,
      subject: input.subject,
      description: input.description,
      date: input.date
    });
  }

  async listTravelRequests(): Promise<RebuildTravelRecord[]> {
    const rows = await this.convex.query(api.core_hr.getTravelRequests, {});
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows
      .map((row) => this.mapTravel(row))
      .filter((row): row is RebuildTravelRecord => row !== null);
  }

  async createTravelRequest(input: CreateTravelInput): Promise<void> {
    await this.convex.mutation(api.core_hr.createTravelRequest, {
      employeeId: this.toId('employees', input.employeeId),
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      purpose: input.purpose,
      budget: input.budget
    });
  }

  private mapEmployee(row: unknown): RebuildCoreHrEmployeeReference | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['firstName'] !== 'string' ||
      typeof value['lastName'] !== 'string'
    ) {
      return null;
    }

    const fullName = `${value['firstName']} ${value['lastName']}`.trim();
    return {
      id: value['_id'],
      fullName,
      email: typeof value['email'] === 'string' ? value['email'] : '',
      status: typeof value['status'] === 'string' ? value['status'] : 'active',
      departmentId: typeof value['departmentId'] === 'string' ? value['departmentId'] : undefined,
      departmentName: typeof value['department'] === 'string' ? value['department'] : undefined,
      designationId: typeof value['designationId'] === 'string' ? value['designationId'] : undefined,
      designationName: typeof value['position'] === 'string' ? value['position'] : undefined,
      locationId: typeof value['locationId'] === 'string' ? value['locationId'] : undefined,
      locationName: typeof value['location'] === 'string' ? value['location'] : undefined
    };
  }

  private mapReference(row: unknown, labelKey: 'name' | 'title'): RebuildCoreHrReferenceOption | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (typeof value['_id'] !== 'string' || typeof value[labelKey] !== 'string') {
      return null;
    }

    return {
      id: value['_id'],
      label: value[labelKey]
    };
  }

  private mapPromotion(row: unknown): RebuildPromotionRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['fromDesignationId'] !== 'string' ||
      typeof value['toDesignationId'] !== 'string' ||
      typeof value['promotionDate'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      fromDesignationId: value['fromDesignationId'],
      toDesignationId: value['toDesignationId'],
      promotionDate: value['promotionDate'],
      salaryIncrement: this.readNumber(value['salaryIncrement']),
      remarks: typeof value['remarks'] === 'string' ? value['remarks'] : ''
    };
  }

  private mapTransfer(row: unknown): RebuildTransferRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['fromDepartmentId'] !== 'string' ||
      typeof value['toDepartmentId'] !== 'string' ||
      typeof value['transferDate'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      fromDepartmentId: value['fromDepartmentId'],
      toDepartmentId: value['toDepartmentId'],
      fromLocationId: typeof value['fromLocationId'] === 'string' ? value['fromLocationId'] : undefined,
      toLocationId: typeof value['toLocationId'] === 'string' ? value['toLocationId'] : undefined,
      transferDate: value['transferDate'],
      remarks: typeof value['remarks'] === 'string' ? value['remarks'] : ''
    };
  }

  private mapAward(row: unknown): RebuildAwardRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['title'] !== 'string' ||
      typeof value['date'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      title: value['title'],
      gift: typeof value['gift'] === 'string' ? value['gift'] : '',
      cashPrice: this.readNumber(value['cashPrice']),
      date: value['date'],
      description: typeof value['description'] === 'string' ? value['description'] : ''
    };
  }

  private mapWarning(row: unknown): RebuildWarningRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['subject'] !== 'string' ||
      typeof value['description'] !== 'string' ||
      typeof value['issueDate'] !== 'string' ||
      !this.isSeverity(value['severity'])
    ) {
      return null;
    }

    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      subject: value['subject'],
      description: value['description'],
      severity: value['severity'],
      issueDate: value['issueDate'],
      actionTaken: typeof value['actionTaken'] === 'string' ? value['actionTaken'] : ''
    };
  }

  private mapResignation(row: unknown): RebuildResignationRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['noticeDate'] !== 'string' ||
      typeof value['lastWorkingDay'] !== 'string' ||
      typeof value['reason'] !== 'string' ||
      !this.isResignationStatus(value['status'])
    ) {
      return null;
    }

    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      noticeDate: value['noticeDate'],
      lastWorkingDay: value['lastWorkingDay'],
      reason: value['reason'],
      status: value['status']
    };
  }

  private mapTermination(row: unknown): RebuildTerminationRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['terminationDate'] !== 'string' ||
      typeof value['reason'] !== 'string' ||
      !this.isTerminationType(value['type'])
    ) {
      return null;
    }

    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      terminationDate: value['terminationDate'],
      type: value['type'],
      reason: value['reason'],
      noticeGiven: !!value['noticeGiven']
    };
  }

  private mapComplaint(row: unknown): RebuildComplaintRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['complainantId'] !== 'string' ||
      typeof value['subject'] !== 'string' ||
      typeof value['description'] !== 'string' ||
      typeof value['date'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      complainantId: value['complainantId'],
      accusedId: typeof value['accusedId'] === 'string' ? value['accusedId'] : undefined,
      subject: value['subject'],
      description: value['description'],
      date: value['date'],
      status: this.normalizeComplaintStatus(value['status'])
    };
  }

  private mapTravel(row: unknown): RebuildTravelRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const value = row as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['employeeId'] !== 'string' ||
      typeof value['destination'] !== 'string' ||
      typeof value['startDate'] !== 'string' ||
      typeof value['endDate'] !== 'string' ||
      typeof value['purpose'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      employeeId: value['employeeId'],
      destination: value['destination'],
      startDate: value['startDate'],
      endDate: value['endDate'],
      purpose: value['purpose'],
      budget: this.readNumber(value['budget']),
      status: this.normalizeTravelStatus(value['status'])
    };
  }

  private normalizeRole(role: unknown): AppRole {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'hr_manager':
      case 'manager':
      case 'employee':
      case 'pending':
        return role;
      default:
        return 'pending';
    }
  }

  private isSeverity(value: unknown): value is WarningSeverity {
    return value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
  }

  private isResignationStatus(value: unknown): value is ResignationStatus {
    return value === 'pending' || value === 'approved' || value === 'rejected';
  }

  private isTerminationType(value: unknown): value is TerminationType {
    return value === 'voluntary' || value === 'involuntary';
  }

  private normalizeComplaintStatus(value: unknown): ComplaintStatus {
    if (value === 'resolved' || value === 'dismissed' || value === 'pending') {
      return value;
    }
    return 'pending';
  }

  private normalizeTravelStatus(value: unknown): TravelStatus {
    if (value === 'approved' || value === 'rejected' || value === 'pending') {
      return value;
    }
    return 'pending';
  }

  private readNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }
}
