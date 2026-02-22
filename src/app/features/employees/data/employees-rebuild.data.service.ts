import { Injectable, inject } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  CreateEmployeeInput,
  RebuildEmployeeCompensationActionResult,
  RebuildEmployeeDetailCollections,
  RebuildEmployeeRecord,
  RebuildEmployeeReference,
  RebuildEmployeeStatus,
  UpdateEmployeeCompensationInput,
  UpdateEmployeeInput
} from './employees-rebuild.models';

@Injectable({ providedIn: 'root' })
export class EmployeesRebuildDataService {
  private readonly convexClient = inject(ConvexClientService);
  private readonly convex = this.convexClient.getHttpClient();

  async listEmployees(): Promise<RebuildEmployeeRecord[]> {
    const rows = await this.convex.query(api.employees.list, {});
    return this.mapEmployeeList(rows);
  }

  async getEmployee(id: string): Promise<RebuildEmployeeRecord | null> {
    const row = await this.convex.query(api.employees.get, {
      id: this.toId('employees', id)
    });
    return this.mapEmployee(row);
  }

  async listDepartmentReferences(): Promise<RebuildEmployeeReference[]> {
    const rows = await this.convex.query(api.organization.listDepartments, {});
    return this.mapReferenceRows(rows, 'name', 'code');
  }

  async listDesignationReferences(): Promise<RebuildEmployeeReference[]> {
    const rows = await this.convex.query(api.organization.listDesignations, {});
    return this.mapReferenceRows(rows, 'title', 'code');
  }

  async listLocationReferences(): Promise<RebuildEmployeeReference[]> {
    const rows = await this.convex.query(api.organization.listLocations, {});
    return this.mapReferenceRows(rows, 'name', 'city');
  }

  async listManagerReferences(): Promise<RebuildEmployeeReference[]> {
    const employees = await this.listEmployees();
    return employees
      .filter((employee) => employee.status.trim().toLowerCase() === 'active')
      .map((employee) => ({
        id: employee.id,
        label: employee.fullName,
        meta: employee.email
      }));
  }

  async createEmployee(input: CreateEmployeeInput): Promise<void> {
    await this.convex.mutation(api.employees.create, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      departmentId: this.optionalId('departments', input.departmentId),
      designationId: this.optionalId('designations', input.designationId),
      locationId: this.optionalId('locations', input.locationId),
      status: input.status,
      startDate: input.startDate,
      managerId: this.optionalId('employees', input.managerId),
      phone: this.optionalText(input.phone),
      address: this.optionalText(input.address),
      gender: this.optionalText(input.gender),
      dob: this.optionalText(input.dob)
    });
  }

  async updateEmployee(input: UpdateEmployeeInput): Promise<void> {
    await this.convex.mutation(api.employees.update, {
      id: this.toId('employees', input.id),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      departmentId: this.optionalId('departments', input.departmentId),
      designationId: this.optionalId('designations', input.designationId),
      locationId: this.optionalId('locations', input.locationId),
      startDate: input.startDate,
      managerId: this.optionalId('employees', input.managerId),
      phone: this.optionalText(input.phone),
      address: this.optionalText(input.address),
      gender: this.optionalText(input.gender),
      dob: this.optionalText(input.dob)
    });
  }

  async updateEmployeeStatus(id: string, status: RebuildEmployeeStatus): Promise<void> {
    await this.convex.mutation(api.employees.updateStatus, {
      id: this.toId('employees', id),
      status
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.convex.mutation(api.employees.remove, {
      id: this.toId('employees', id)
    });
  }

  async updateEmployeeCompensation(
    input: UpdateEmployeeCompensationInput
  ): Promise<RebuildEmployeeCompensationActionResult> {
    const response = await this.convex.mutation(api.employees.updateCompensation, {
      employeeId: this.toId('employees', input.employeeId),
      baseSalary: input.baseSalary,
      currency: this.optionalText(input.currency),
      payFrequency: input.payFrequency,
      reason: this.optionalText(input.reason)
    });
    return this.mapCompensationActionResult(response);
  }

  async listEmployeeDetailCollections(employeeId: string): Promise<RebuildEmployeeDetailCollections> {
    const typedEmployeeId = this.toId('employees', employeeId);
    const [contacts, banking, education, statutory, documents] = await Promise.all([
      this.convex.query(api.employee_details.listEmergencyContacts, { employeeId: typedEmployeeId }),
      this.convex.query(api.employee_details.listBankingDetails, { employeeId: typedEmployeeId }),
      this.convex.query(api.employee_details.listEducation, { employeeId: typedEmployeeId }),
      this.convex.query(api.employee_details.getStatutoryInfo, { employeeId: typedEmployeeId }),
      this.convex.query(api.employee_details.listDocuments, { employeeId: typedEmployeeId })
    ]);

    return {
      emergencyContacts: Array.isArray(contacts) ? contacts.length : 0,
      bankingRecords: Array.isArray(banking) ? banking.length : 0,
      educationRecords: Array.isArray(education) ? education.length : 0,
      documents: Array.isArray(documents) ? documents.length : 0,
      hasStatutoryInfo: !!statutory
    };
  }

  private mapEmployeeList(rows: unknown): RebuildEmployeeRecord[] {
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows.map((row) => this.mapEmployee(row)).filter((row): row is RebuildEmployeeRecord => row !== null);
  }

  private mapEmployee(row: unknown): RebuildEmployeeRecord | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const record = row as Record<string, unknown>;
    if (
      typeof record['_id'] !== 'string' ||
      typeof record['firstName'] !== 'string' ||
      typeof record['lastName'] !== 'string' ||
      typeof record['email'] !== 'string'
    ) {
      return null;
    }

    const firstName = record['firstName'].trim();
    const lastName = record['lastName'].trim();
    const status = typeof record['status'] === 'string' ? record['status'] : 'active';
    const baseSalary = typeof record['baseSalary'] === 'number' ? record['baseSalary'] : undefined;
    const payFrequency = this.readPayFrequency(record['payFrequency']);

    return {
      id: record['_id'],
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      email: record['email'],
      status,
      startDate: typeof record['startDate'] === 'string' ? record['startDate'] : '',
      departmentId: this.readId(record['departmentId']),
      department: this.readText(record['department']),
      designationId: this.readId(record['designationId']),
      position: this.readText(record['position']),
      locationId: this.readId(record['locationId']),
      location: this.readText(record['location']),
      managerId: this.readId(record['managerId']),
      managerName: this.readText(record['managerName']),
      phone: this.readText(record['phone']),
      address: this.readText(record['address']),
      gender: this.readText(record['gender']),
      dob: this.readText(record['dob']),
      baseSalary,
      currency: this.readText(record['currency']),
      payFrequency
    };
  }

  private mapReferenceRows(
    rows: unknown,
    labelKey: 'name' | 'title',
    metaKey: 'code' | 'city'
  ): RebuildEmployeeReference[] {
    if (!Array.isArray(rows)) {
      return [];
    }
    return rows
      .map((row) => {
        if (!row || typeof row !== 'object') {
          return null;
        }
        const record = row as Record<string, unknown>;
        if (typeof record['_id'] !== 'string' || typeof record[labelKey] !== 'string') {
          return null;
        }
        const meta = typeof record[metaKey] === 'string' ? (record[metaKey] as string) : undefined;
        if (meta) {
          return {
            id: record['_id'],
            label: record[labelKey] as string,
            meta
          } satisfies RebuildEmployeeReference;
        }
        return {
          id: record['_id'],
          label: record[labelKey] as string
        } satisfies RebuildEmployeeReference;
      })
      .filter((row): row is RebuildEmployeeReference => row !== null);
  }

  private readText(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private readId(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private readPayFrequency(value: unknown): 'monthly' | 'bi_weekly' | 'weekly' | undefined {
    if (value === 'monthly' || value === 'bi_weekly' || value === 'weekly') {
      return value;
    }
    return undefined;
  }

  private mapCompensationActionResult(value: unknown): RebuildEmployeeCompensationActionResult {
    if (!value || typeof value !== 'object') {
      return { mode: 'applied' };
    }
    const record = value as Record<string, unknown>;
    return {
      mode: record['mode'] === 'pending' ? 'pending' : 'applied',
      changeRequestId: typeof record['changeRequestId'] === 'string' ? record['changeRequestId'] : undefined
    };
  }

  private optionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private optionalId<T extends TableNames>(table: T, id: string | undefined): Id<T> | undefined {
    const normalized = id?.trim() ?? '';
    if (!normalized) {
      return undefined;
    }
    return this.toId(table, normalized);
  }

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }
}
