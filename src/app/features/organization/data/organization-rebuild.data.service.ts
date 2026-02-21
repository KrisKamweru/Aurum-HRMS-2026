import { Injectable } from '@angular/core';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { ConvexClientService } from '../../../core/services/convex-client.service';
import {
  CreateDepartmentInput,
  CreateDesignationInput,
  CreateLocationInput,
  RebuildDepartment,
  RebuildEmployeeLookup,
  RebuildDesignation,
  RebuildLocation,
  RebuildOrgChartNode,
  RebuildOrganizationSettings,
  RebuildUnlinkedEmployee,
  RebuildUnlinkedUser,
  UpdateDepartmentInput,
  UpdateDesignationInput,
  UpdateOrganizationSettingsInput,
  UpdateLocationInput
} from './organization-rebuild.models';

@Injectable({ providedIn: 'root' })
export class OrganizationRebuildDataService {
  private readonly convex = this.convexClient.getHttpClient();

  constructor(private readonly convexClient: ConvexClientService) {}

  async listDepartments(): Promise<RebuildDepartment[]> {
    const [departments, employees] = await Promise.all([
      this.convex.query(api.organization.listDepartments, {}),
      this.convex.query(api.employees.list, {})
    ]);
    const managerLookup = this.mapEmployeeLookupList(employees);
    const managerNameById = new Map(
      managerLookup.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`.trim()])
    );

    const byDepartment = new Map<string, number>();
    for (const employee of employees) {
      const departmentId = employee.departmentId ? String(employee.departmentId) : '';
      if (!departmentId) {
        continue;
      }
      byDepartment.set(departmentId, (byDepartment.get(departmentId) ?? 0) + 1);
    }

    return departments.map((department) => ({
      id: String(department._id),
      name: department.name,
      code: department.code,
      description: department.description ?? '',
      managerId: department.managerId ? String(department.managerId) : undefined,
      managerName: department.managerId ? managerNameById.get(String(department.managerId)) : undefined,
      headcount: byDepartment.get(String(department._id)) ?? 0
    }));
  }

  async listEmployeesForManagerLookup(): Promise<RebuildEmployeeLookup[]> {
    const employees = await this.convex.query(api.employees.list, {});
    return this.mapEmployeeLookupList(employees);
  }

  async createDepartment(input: CreateDepartmentInput): Promise<void> {
    await this.convex.mutation(api.organization.createDepartment, {
      name: input.name,
      code: input.code,
      description: input.description,
      managerId: input.managerId ? this.toId('employees', input.managerId) : undefined
    });
  }

  async updateDepartment(input: UpdateDepartmentInput): Promise<void> {
    await this.convex.mutation(api.organization.updateDepartment, {
      id: this.toId('departments', input.id),
      name: input.name,
      code: input.code,
      description: input.description,
      managerId: input.managerId ? this.toId('employees', input.managerId) : undefined
    });
  }

  async deleteDepartment(id: string): Promise<void> {
    await this.convex.mutation(api.organization.deleteDepartment, {
      id: this.toId('departments', id)
    });
  }

  async listDesignations(): Promise<RebuildDesignation[]> {
    const designations = await this.convex.query(api.organization.listDesignations, {});
    return designations.map((designation) => ({
      id: String(designation._id),
      title: designation.title,
      code: designation.code,
      level: designation.level ?? null,
      description: designation.description ?? ''
    }));
  }

  async createDesignation(input: CreateDesignationInput): Promise<void> {
    await this.convex.mutation(api.organization.createDesignation, {
      title: input.title,
      code: input.code,
      level: input.level,
      description: input.description
    });
  }

  async updateDesignation(input: UpdateDesignationInput): Promise<void> {
    await this.convex.mutation(api.organization.updateDesignation, {
      id: this.toId('designations', input.id),
      title: input.title,
      code: input.code,
      level: input.level,
      description: input.description
    });
  }

  async deleteDesignation(id: string): Promise<void> {
    await this.convex.mutation(api.organization.deleteDesignation, {
      id: this.toId('designations', id)
    });
  }

  async listLocations(): Promise<RebuildLocation[]> {
    const locations = await this.convex.query(api.organization.listLocations, {});
    return locations.map((location) => ({
      id: String(location._id),
      name: location.name,
      address: location.address,
      city: location.city,
      country: location.country
    }));
  }

  async createLocation(input: CreateLocationInput): Promise<void> {
    await this.convex.mutation(api.organization.createLocation, {
      name: input.name,
      address: input.address,
      city: input.city,
      country: input.country
    });
  }

  async updateLocation(input: UpdateLocationInput): Promise<void> {
    await this.convex.mutation(api.organization.updateLocation, {
      id: this.toId('locations', input.id),
      name: input.name,
      address: input.address,
      city: input.city,
      country: input.country
    });
  }

  async deleteLocation(id: string): Promise<void> {
    await this.convex.mutation(api.organization.deleteLocation, {
      id: this.toId('locations', id)
    });
  }

  async getUnlinkedUsers(): Promise<RebuildUnlinkedUser[]> {
    const users = await this.convex.query(api.users.getUnlinkedUsers, {});
    return users.map((user) => ({
      id: String(user._id),
      name: user.name ?? 'Unnamed User',
      email: user.email ?? '',
      role: user.role ?? 'employee'
    }));
  }

  async getUnlinkedEmployees(): Promise<RebuildUnlinkedEmployee[]> {
    const employees = await this.convex.query(api.users.getUnlinkedEmployees, {});
    return employees.map((employee) => ({
      id: String(employee._id),
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      status: employee.status
    }));
  }

  async linkUserToEmployee(userId: string, employeeId: string): Promise<void> {
    await this.convex.mutation(api.users.linkUserToEmployee, {
      userId: this.toId('users', userId),
      employeeId: this.toId('employees', employeeId)
    });
  }

  async getOrganizationChart(): Promise<RebuildOrgChartNode[]> {
    const nodes = await this.convex.query(api.employees.getOrgChart, {});
    if (!Array.isArray(nodes)) {
      return [];
    }
    return nodes
      .map((node) => this.mapOrgChartNode(node))
      .filter((node): node is RebuildOrgChartNode => node !== null);
  }

  async getOrganizationSettings(): Promise<RebuildOrganizationSettings | null> {
    const org = await this.convex.query(api.organization.getOrganizationSettings, {});
    if (!org || typeof org !== 'object') {
      return null;
    }
    const record = org as Record<string, unknown>;
    const name = typeof record['name'] === 'string' ? record['name'] : '';
    const domain = typeof record['domain'] === 'string' ? record['domain'] : '';
    const subscriptionPlan = record['subscriptionPlan'];
    const status = record['status'];
    const id = typeof record['_id'] === 'string' ? record['_id'] : '';
    if (!name || !id) {
      return null;
    }
    if (subscriptionPlan !== 'free' && subscriptionPlan !== 'pro' && subscriptionPlan !== 'enterprise') {
      return null;
    }
    if (status !== 'active' && status !== 'suspended') {
      return null;
    }
    return {
      id,
      name,
      domain,
      subscriptionPlan,
      status
    };
  }

  async updateOrganizationSettings(input: UpdateOrganizationSettingsInput): Promise<void> {
    await this.convex.mutation(api.organization.updateOrganizationSettings, {
      name: input.name,
      domain: input.domain,
      subscriptionPlan: input.subscriptionPlan,
      status: input.status
    });
  }

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }

  private mapOrgChartNode(node: unknown): RebuildOrgChartNode | null {
    if (!node || typeof node !== 'object') {
      return null;
    }
    const record = node as Record<string, unknown>;
    if (
      typeof record['_id'] !== 'string' ||
      typeof record['firstName'] !== 'string' ||
      typeof record['lastName'] !== 'string' ||
      typeof record['email'] !== 'string' ||
      typeof record['status'] !== 'string'
    ) {
      return null;
    }
    const children = Array.isArray(record['directReports']) ? record['directReports'] : [];

    return {
      id: record['_id'],
      firstName: record['firstName'],
      lastName: record['lastName'],
      email: record['email'],
      status: record['status'],
      managerId: typeof record['managerId'] === 'string' ? record['managerId'] : undefined,
      designationName: typeof record['designationName'] === 'string' ? record['designationName'] : 'Unassigned',
      directReports: children
        .map((child) => this.mapOrgChartNode(child))
        .filter((child): child is RebuildOrgChartNode => child !== null)
    };
  }

  private mapEmployeeLookupList(records: unknown): RebuildEmployeeLookup[] {
    if (!Array.isArray(records)) {
      return [];
    }

    return records
      .map((record) => this.mapEmployeeLookup(record))
      .filter((record): record is RebuildEmployeeLookup => record !== null);
  }

  private mapEmployeeLookup(record: unknown): RebuildEmployeeLookup | null {
    if (!record || typeof record !== 'object') {
      return null;
    }
    const value = record as Record<string, unknown>;
    if (
      typeof value['_id'] !== 'string' ||
      typeof value['firstName'] !== 'string' ||
      typeof value['lastName'] !== 'string' ||
      typeof value['email'] !== 'string' ||
      typeof value['status'] !== 'string'
    ) {
      return null;
    }

    return {
      id: value['_id'],
      firstName: value['firstName'],
      lastName: value['lastName'],
      email: value['email'],
      status: value['status'],
      designationName: typeof value['position'] === 'string' ? value['position'] : undefined
    };
  }
}
