import { AppRole } from '../../../core/auth/auth.types';

export type CoreHrRecordType =
  | 'promotions'
  | 'transfers'
  | 'awards'
  | 'warnings'
  | 'resignations'
  | 'terminations'
  | 'complaints'
  | 'travel';

export const CORE_HR_RECORD_TYPES: CoreHrRecordType[] = [
  'promotions',
  'transfers',
  'awards',
  'warnings',
  'resignations',
  'terminations',
  'complaints',
  'travel'
];

export interface RebuildCoreHrViewerContext {
  role: AppRole;
  employeeId?: string;
}

export interface RebuildCoreHrEmployeeReference {
  id: string;
  fullName: string;
  email: string;
  status: string;
  departmentId?: string;
  departmentName?: string;
  designationId?: string;
  designationName?: string;
  locationId?: string;
  locationName?: string;
}

export interface RebuildCoreHrReferenceOption {
  id: string;
  label: string;
}

export interface RebuildPromotionRecord {
  id: string;
  employeeId: string;
  fromDesignationId: string;
  toDesignationId: string;
  promotionDate: string;
  salaryIncrement: number;
  remarks: string;
}

export interface RebuildTransferRecord {
  id: string;
  employeeId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromLocationId?: string;
  toLocationId?: string;
  transferDate: string;
  remarks: string;
}

export interface RebuildAwardRecord {
  id: string;
  employeeId: string;
  title: string;
  gift: string;
  cashPrice: number;
  date: string;
  description: string;
}

export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RebuildWarningRecord {
  id: string;
  employeeId: string;
  subject: string;
  description: string;
  severity: WarningSeverity;
  issueDate: string;
  actionTaken: string;
}

export type ResignationStatus = 'pending' | 'approved' | 'rejected';

export interface RebuildResignationRecord {
  id: string;
  employeeId: string;
  noticeDate: string;
  lastWorkingDay: string;
  reason: string;
  status: ResignationStatus;
}

export type TerminationType = 'voluntary' | 'involuntary';

export interface RebuildTerminationRecord {
  id: string;
  employeeId: string;
  terminationDate: string;
  type: TerminationType;
  reason: string;
  noticeGiven: boolean;
}

export type ComplaintStatus = 'pending' | 'resolved' | 'dismissed';

export interface RebuildComplaintRecord {
  id: string;
  complainantId: string;
  accusedId?: string;
  subject: string;
  description: string;
  date: string;
  status: ComplaintStatus;
}

export type TravelStatus = 'pending' | 'approved' | 'rejected';

export interface RebuildTravelRecord {
  id: string;
  employeeId: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  budget: number;
  status: TravelStatus;
}

export interface RebuildCoreHrRecordMap {
  promotions: RebuildPromotionRecord[];
  transfers: RebuildTransferRecord[];
  awards: RebuildAwardRecord[];
  warnings: RebuildWarningRecord[];
  resignations: RebuildResignationRecord[];
  terminations: RebuildTerminationRecord[];
  complaints: RebuildComplaintRecord[];
  travel: RebuildTravelRecord[];
}

export type RebuildCoreHrRecord =
  | RebuildPromotionRecord
  | RebuildTransferRecord
  | RebuildAwardRecord
  | RebuildWarningRecord
  | RebuildResignationRecord
  | RebuildTerminationRecord
  | RebuildComplaintRecord
  | RebuildTravelRecord;

export type ResignationDecision = 'approved' | 'rejected';

export interface CreatePromotionInput {
  employeeId: string;
  fromDesignationId: string;
  toDesignationId: string;
  promotionDate: string;
  salaryIncrement?: number;
  remarks?: string;
}

export interface CreateTransferInput {
  employeeId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromLocationId?: string;
  toLocationId?: string;
  transferDate: string;
  remarks?: string;
}

export interface CreateAwardInput {
  employeeId: string;
  title: string;
  gift?: string;
  cashPrice?: number;
  date: string;
  description?: string;
}

export interface CreateWarningInput {
  employeeId: string;
  subject: string;
  description: string;
  severity: WarningSeverity;
  issueDate: string;
  actionTaken?: string;
}

export interface SubmitResignationInput {
  employeeId: string;
  noticeDate: string;
  lastWorkingDay: string;
  reason: string;
}

export interface CreateTerminationInput {
  employeeId: string;
  terminationDate: string;
  type: TerminationType;
  reason: string;
  noticeGiven: boolean;
}

export interface CreateComplaintInput {
  complainantId: string;
  accusedId?: string;
  subject: string;
  description: string;
  date: string;
}

export interface CreateTravelInput {
  employeeId: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  budget?: number;
}

export const EMPTY_CORE_HR_RECORD_MAP: RebuildCoreHrRecordMap = {
  promotions: [],
  transfers: [],
  awards: [],
  warnings: [],
  resignations: [],
  terminations: [],
  complaints: [],
  travel: []
};
