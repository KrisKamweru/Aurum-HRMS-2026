export type OnboardingJoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface OnboardingOrganizationDirectoryEntry {
  id: string;
  name: string;
  domain?: string;
}

export interface OnboardingJoinRequestRecord {
  id: string;
  orgId: string;
  orgName: string;
  status: OnboardingJoinRequestStatus;
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface OrganizationSetupDraft {
  organization: {
    name: string;
    domain?: string;
  };
  departments: OrganizationSetupDepartmentDraft[];
  designations: OrganizationSetupDesignationDraft[];
  adminEmployee: {
    firstName: string;
    lastName: string;
    phone?: string;
    departmentIndex?: number;
    designationIndex?: number;
  };
}

export interface OrganizationSetupDepartmentDraft {
  name: string;
  code: string;
  description?: string;
}

export interface OrganizationSetupDesignationDraft {
  title: string;
  code: string;
  level?: number;
  description?: string;
}

export interface OrganizationSetupResult {
  orgId: string;
  employeeId: string;
}
