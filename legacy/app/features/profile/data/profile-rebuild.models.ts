export interface RebuildProfileUser {
  name: string;
  email: string;
  imageUrl?: string;
  role: string;
}

export interface RebuildProfileRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  startDate: string;
  status: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  department?: string;
  position?: string;
  location?: string;
  managerName?: string;
  tenure: string;
  user: RebuildProfileUser;
}

export interface RebuildProfileUpdateInput {
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
}
