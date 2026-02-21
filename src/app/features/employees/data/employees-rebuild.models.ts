export type RebuildEmployeeStatus = 'active' | 'on-leave' | 'terminated' | 'resigned';

export interface RebuildEmployeeRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  startDate: string;
  departmentId?: string;
  department?: string;
  designationId?: string;
  position?: string;
  locationId?: string;
  location?: string;
  managerId?: string;
  managerName?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  baseSalary?: number;
  currency?: string;
  payFrequency?: 'monthly' | 'bi_weekly' | 'weekly';
}

export interface RebuildEmployeeReference {
  id: string;
  label: string;
  meta?: string;
}

export interface RebuildEmployeeDetailCollections {
  emergencyContacts: number;
  bankingRecords: number;
  educationRecords: number;
  documents: number;
  hasStatutoryInfo: boolean;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  departmentId?: string;
  designationId?: string;
  locationId?: string;
  status: RebuildEmployeeStatus;
  startDate: string;
  managerId?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
}

export interface UpdateEmployeeInput extends CreateEmployeeInput {
  id: string;
}
