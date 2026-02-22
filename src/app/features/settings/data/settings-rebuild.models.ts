export type RebuildDateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type RebuildLeavePolicyType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'other';
export type RebuildAccrualFrequency = 'annual' | 'monthly';

export interface RebuildGeneralSettings {
  currency: string;
  timezone: string;
  dateFormat: RebuildDateFormat;
  workDays: number[];
}

export interface RebuildLeavePolicy extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  type: RebuildLeavePolicyType;
  daysPerYear: number;
  accrualFrequency: RebuildAccrualFrequency;
  carryOverDays?: number;
  description?: string;
  isActive: boolean;
}

export interface RebuildLeavePolicyCreateInput {
  name: string;
  code: string;
  type: RebuildLeavePolicyType;
  daysPerYear: number;
  accrualFrequency: RebuildAccrualFrequency;
  carryOverDays?: number;
  description?: string;
}

export interface RebuildLeavePolicyUpdateInput {
  id: string;
  name?: string;
  daysPerYear?: number;
  accrualFrequency?: RebuildAccrualFrequency;
  carryOverDays?: number;
  description?: string;
  isActive?: boolean;
}
