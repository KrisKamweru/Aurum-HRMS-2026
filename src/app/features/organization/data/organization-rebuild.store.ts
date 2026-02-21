import { Injectable, signal } from '@angular/core';

export interface RebuildDepartment {
  id: string;
  name: string;
  headcount: number;
}

export interface RebuildDesignation {
  id: string;
  title: string;
  level: number;
}

export interface RebuildLocation {
  id: string;
  name: string;
  city: string;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationRebuildStore {
  private readonly departmentState = signal<RebuildDepartment[]>([
    { id: 'dept-hr', name: 'Human Resources', headcount: 4 },
    { id: 'dept-eng', name: 'Engineering', headcount: 8 }
  ]);

  private readonly designationState = signal<RebuildDesignation[]>([
    { id: 'desig-hrg', title: 'HR Generalist', level: 2 },
    { id: 'desig-se', title: 'Software Engineer', level: 2 }
  ]);

  private readonly locationState = signal<RebuildLocation[]>([
    { id: 'loc-nbo', name: 'Nairobi HQ', city: 'Nairobi', country: 'Kenya' },
    { id: 'loc-blr', name: 'Bengaluru Engineering Center', city: 'Bengaluru', country: 'India' }
  ]);

  readonly departments = this.departmentState.asReadonly();
  readonly designations = this.designationState.asReadonly();
  readonly locations = this.locationState.asReadonly();

  addDepartment(name: string): boolean {
    const normalized = name.trim();
    if (!normalized) {
      return false;
    }
    const exists = this.departmentState().some((row) => row.name.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      return false;
    }
    this.departmentState.update((rows) => [
      ...rows,
      {
        id: this.makeId('dept', rows.length + 1),
        name: normalized,
        headcount: 0
      }
    ]);
    return true;
  }

  addDesignation(title: string, level: number): boolean {
    const normalized = title.trim();
    if (!normalized) {
      return false;
    }
    const exists = this.designationState().some((row) => row.title.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      return false;
    }
    this.designationState.update((rows) => [
      ...rows,
      {
        id: this.makeId('desig', rows.length + 1),
        title: normalized,
        level
      }
    ]);
    return true;
  }

  addLocation(name: string, city: string, country: string): boolean {
    const normalizedName = name.trim();
    const normalizedCity = city.trim();
    const normalizedCountry = country.trim();
    if (!normalizedName || !normalizedCity || !normalizedCountry) {
      return false;
    }
    const exists = this.locationState().some(
      (row) =>
        row.name.toLowerCase() === normalizedName.toLowerCase() && row.city.toLowerCase() === normalizedCity.toLowerCase()
    );
    if (exists) {
      return false;
    }
    this.locationState.update((rows) => [
      ...rows,
      {
        id: this.makeId('loc', rows.length + 1),
        name: normalizedName,
        city: normalizedCity,
        country: normalizedCountry
      }
    ]);
    return true;
  }

  private makeId(prefix: string, sequence: number): string {
    return `${prefix}-${sequence}`;
  }
}
