import { Injectable } from '@angular/core';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { Id, TableNames } from '../../../../../convex/_generated/dataModel';
import { environment } from '../../../../environments/environment';
import {
  CreateDepartmentInput,
  CreateDesignationInput,
  CreateLocationInput,
  RebuildDepartment,
  RebuildDesignation,
  RebuildLocation,
  RebuildUnlinkedEmployee,
  RebuildUnlinkedUser,
  UpdateDepartmentInput,
  UpdateDesignationInput,
  UpdateLocationInput
} from './organization-rebuild.models';

@Injectable({ providedIn: 'root' })
export class OrganizationRebuildDataService {
  private readonly convex = new ConvexHttpClient(environment.convexUrl);

  async listDepartments(): Promise<RebuildDepartment[]> {
    const [departments, employees] = await Promise.all([
      this.convex.query(api.organization.listDepartments, {}),
      this.convex.query(api.employees.list, {})
    ]);

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
      headcount: byDepartment.get(String(department._id)) ?? 0
    }));
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

  private toId<T extends TableNames>(table: T, id: string): Id<T> {
    void table;
    return id as Id<T>;
  }
}
