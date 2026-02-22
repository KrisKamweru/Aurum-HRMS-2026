export type OrganizationPlan = 'free' | 'pro' | 'enterprise';
export type OrganizationStatus = 'active' | 'suspended';

export interface SuperAdminOrganization {
  id: string;
  name: string;
  domain?: string;
  subscriptionPlan: OrganizationPlan;
  status: OrganizationStatus;
  userCount: number;
  employeeCount: number;
  pendingRequestCount: number;
}

export interface SuperAdminStats {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  totalEmployees: number;
}

export interface OrganizationDraft {
  name: string;
  domain?: string;
  subscriptionPlan: OrganizationPlan;
}

export interface UpdateOrganizationDraft extends OrganizationDraft {
  id: string;
}
