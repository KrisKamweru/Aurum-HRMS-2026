import { Injectable, signal } from '@angular/core';
import { OrganizationRebuildDataService } from './organization-rebuild.data.service';
import {
  RebuildDepartment,
  RebuildDesignation,
  RebuildLocation,
  RebuildUnlinkedEmployee,
  RebuildUnlinkedUser
} from './organization-rebuild.models';

@Injectable({ providedIn: 'root' })
export class OrganizationRebuildStore {
  private readonly departmentState = signal<RebuildDepartment[]>([]);
  private readonly designationState = signal<RebuildDesignation[]>([]);
  private readonly locationState = signal<RebuildLocation[]>([]);
  private readonly pendingUserState = signal<RebuildUnlinkedUser[]>([]);
  private readonly unlinkedEmployeeState = signal<RebuildUnlinkedEmployee[]>([]);
  private readonly selectedLinkState = signal<Record<string, string>>({});
  private readonly linkedCountState = signal(0);

  private readonly departmentsLoadingState = signal(false);
  private readonly designationsLoadingState = signal(false);
  private readonly locationsLoadingState = signal(false);
  private readonly userLinkingLoadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  constructor(private readonly data: OrganizationRebuildDataService) {}

  readonly departments = this.departmentState.asReadonly();
  readonly designations = this.designationState.asReadonly();
  readonly locations = this.locationState.asReadonly();
  readonly pendingUserLinks = this.pendingUserState.asReadonly();
  readonly unlinkedEmployees = this.unlinkedEmployeeState.asReadonly();
  readonly linkedCount = this.linkedCountState.asReadonly();

  readonly departmentsLoading = this.departmentsLoadingState.asReadonly();
  readonly designationsLoading = this.designationsLoadingState.asReadonly();
  readonly locationsLoading = this.locationsLoadingState.asReadonly();
  readonly userLinkingLoading = this.userLinkingLoadingState.asReadonly();
  readonly isSaving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async loadDepartments(): Promise<void> {
    this.departmentsLoadingState.set(true);
    this.clearError();
    try {
      this.departmentState.set(await this.data.listDepartments());
    } catch (error: unknown) {
      this.setError(error, 'Unable to load departments.');
    } finally {
      this.departmentsLoadingState.set(false);
    }
  }

  async addDepartment(payload: { name: string; code?: string; description?: string }): Promise<boolean> {
    const name = payload.name.trim();
    if (!name) {
      this.errorState.set('Department name is required.');
      return false;
    }
    if (this.departments().some((row) => row.name.toLowerCase() === name.toLowerCase())) {
      this.errorState.set('Department names must be unique.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.createDepartment({
        name,
        code: this.normalizeCode(payload.code, name),
        description: this.normalizeOptionalText(payload.description)
      });
      await this.loadDepartments();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create department.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateDepartment(payload: { id: string; name: string; code?: string; description?: string }): Promise<boolean> {
    const name = payload.name.trim();
    if (!name) {
      this.errorState.set('Department name is required.');
      return false;
    }
    if (
      this.departments().some(
        (row) => row.id !== payload.id && row.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      this.errorState.set('Department names must be unique.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateDepartment({
        id: payload.id,
        name,
        code: this.normalizeCode(payload.code, name),
        description: this.normalizeOptionalText(payload.description)
      });
      await this.loadDepartments();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update department.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async removeDepartment(id: string): Promise<boolean> {
    if (!this.departments().some((row) => row.id === id)) {
      this.errorState.set('Department not found.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.deleteDepartment(id);
      await this.loadDepartments();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to remove department.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async loadDesignations(): Promise<void> {
    this.designationsLoadingState.set(true);
    this.clearError();
    try {
      this.designationState.set(await this.data.listDesignations());
    } catch (error: unknown) {
      this.setError(error, 'Unable to load designations.');
    } finally {
      this.designationsLoadingState.set(false);
    }
  }

  async addDesignation(payload: {
    title: string;
    code?: string;
    level?: number | null;
    description?: string;
  }): Promise<boolean> {
    const title = payload.title.trim();
    if (!title) {
      this.errorState.set('Designation title is required.');
      return false;
    }
    if (this.designations().some((row) => row.title.toLowerCase() === title.toLowerCase())) {
      this.errorState.set('Designation titles must be unique.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.createDesignation({
        title,
        code: this.normalizeCode(payload.code, title),
        level: this.normalizeLevel(payload.level),
        description: this.normalizeOptionalText(payload.description)
      });
      await this.loadDesignations();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create designation.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateDesignation(payload: {
    id: string;
    title: string;
    code?: string;
    level?: number | null;
    description?: string;
  }): Promise<boolean> {
    const title = payload.title.trim();
    if (!title) {
      this.errorState.set('Designation title is required.');
      return false;
    }
    if (
      this.designations().some(
        (row) => row.id !== payload.id && row.title.toLowerCase() === title.toLowerCase()
      )
    ) {
      this.errorState.set('Designation titles must be unique.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateDesignation({
        id: payload.id,
        title,
        code: this.normalizeCode(payload.code, title),
        level: this.normalizeLevel(payload.level),
        description: this.normalizeOptionalText(payload.description)
      });
      await this.loadDesignations();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update designation.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async removeDesignation(id: string): Promise<boolean> {
    if (!this.designations().some((row) => row.id === id)) {
      this.errorState.set('Designation not found.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.deleteDesignation(id);
      await this.loadDesignations();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to remove designation.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async loadLocations(): Promise<void> {
    this.locationsLoadingState.set(true);
    this.clearError();
    try {
      this.locationState.set(await this.data.listLocations());
    } catch (error: unknown) {
      this.setError(error, 'Unable to load locations.');
    } finally {
      this.locationsLoadingState.set(false);
    }
  }

  async addLocation(payload: { name: string; address: string; city: string; country: string }): Promise<boolean> {
    const name = payload.name.trim();
    const city = payload.city.trim();
    const country = payload.country.trim();
    const address = payload.address.trim();
    if (!name || !city || !country || !address) {
      this.errorState.set('Name, address, city, and country are required.');
      return false;
    }
    if (
      this.locations().some(
        (row) => row.name.toLowerCase() === name.toLowerCase() && row.city.toLowerCase() === city.toLowerCase()
      )
    ) {
      this.errorState.set('Location names must be unique per city.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.createLocation({ name, address, city, country });
      await this.loadLocations();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to create location.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async updateLocation(payload: {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
  }): Promise<boolean> {
    const name = payload.name.trim();
    const city = payload.city.trim();
    const country = payload.country.trim();
    const address = payload.address.trim();
    if (!name || !city || !country || !address) {
      this.errorState.set('Name, address, city, and country are required.');
      return false;
    }
    if (
      this.locations().some(
        (row) =>
          row.id !== payload.id &&
          row.name.toLowerCase() === name.toLowerCase() &&
          row.city.toLowerCase() === city.toLowerCase()
      )
    ) {
      this.errorState.set('Location names must be unique per city.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.updateLocation({ id: payload.id, name, address, city, country });
      await this.loadLocations();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to update location.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async removeLocation(id: string): Promise<boolean> {
    if (!this.locations().some((row) => row.id === id)) {
      this.errorState.set('Location not found.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.deleteLocation(id);
      await this.loadLocations();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to remove location.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  async loadUserLinkingData(): Promise<void> {
    this.userLinkingLoadingState.set(true);
    this.clearError();
    try {
      const [users, employees] = await Promise.all([this.data.getUnlinkedUsers(), this.data.getUnlinkedEmployees()]);
      this.pendingUserState.set(users);
      this.unlinkedEmployeeState.set(employees);
      this.selectedLinkState.set(this.buildSuggestedSelections(users, employees));
    } catch (error: unknown) {
      this.setError(error, 'Unable to load user-linking data.');
    } finally {
      this.userLinkingLoadingState.set(false);
    }
  }

  selectedEmployeeForUser(userId: string): string | undefined {
    return this.selectedLinkState()[userId];
  }

  setSelectedEmployeeForUser(userId: string, employeeId: string): void {
    const normalized = employeeId.trim();
    this.selectedLinkState.update((state) => ({
      ...state,
      [userId]: normalized
    }));
  }

  async linkUserToEmployee(userId: string): Promise<boolean> {
    const employeeId = this.selectedEmployeeForUser(userId);
    if (!employeeId) {
      this.errorState.set('Choose an employee before linking.');
      return false;
    }

    this.savingState.set(true);
    this.clearError();
    try {
      await this.data.linkUserToEmployee(userId, employeeId);
      this.linkedCountState.update((value) => value + 1);
      await this.loadUserLinkingData();
      return true;
    } catch (error: unknown) {
      this.setError(error, 'Unable to link user to employee.');
      return false;
    } finally {
      this.savingState.set(false);
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private normalizeCode(code: string | undefined, fallbackSeed: string): string {
    const raw = (code ?? fallbackSeed).trim().toUpperCase();
    const normalized = raw.replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
    return normalized || 'UNIT';
  }

  private normalizeOptionalText(value: string | undefined): string | undefined {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeLevel(level: number | null | undefined): number | undefined {
    if (level === null || level === undefined) {
      return undefined;
    }
    const normalized = Number(level);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return undefined;
    }
    return normalized;
  }

  private buildSuggestedSelections(
    users: RebuildUnlinkedUser[],
    employees: RebuildUnlinkedEmployee[]
  ): Record<string, string> {
    const selection: Record<string, string> = {};
    for (const user of users) {
      const exact = employees.find((employee) => employee.email.toLowerCase() === user.email.toLowerCase());
      if (exact) {
        selection[user.id] = exact.id;
        continue;
      }

      const normalizedUserName = user.name.trim().toLowerCase();
      const byName = employees.find(
        (employee) => `${employee.firstName} ${employee.lastName}`.trim().toLowerCase() === normalizedUserName
      );
      if (byName) {
        selection[user.id] = byName.id;
      }
    }
    return selection;
  }

  private setError(error: unknown, fallbackMessage: string): void {
    if (error instanceof Error && error.message.trim().length > 0) {
      this.errorState.set(error.message);
      return;
    }
    this.errorState.set(fallbackMessage);
  }
}
