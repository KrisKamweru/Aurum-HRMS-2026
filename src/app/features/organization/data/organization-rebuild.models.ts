export interface RebuildDepartment {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId?: string;
  headcount: number;
}

export interface RebuildDesignation {
  id: string;
  title: string;
  code: string;
  level: number | null;
  description: string;
}

export interface RebuildLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface RebuildUnlinkedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface RebuildUnlinkedEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  managerId?: string;
}

export interface UpdateDepartmentInput extends CreateDepartmentInput {
  id: string;
}

export interface CreateDesignationInput {
  title: string;
  code: string;
  level?: number;
  description?: string;
}

export interface UpdateDesignationInput extends CreateDesignationInput {
  id: string;
}

export interface CreateLocationInput {
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface UpdateLocationInput extends CreateLocationInput {
  id: string;
}
