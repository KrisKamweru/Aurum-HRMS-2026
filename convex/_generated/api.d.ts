/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as compliance from "../compliance.js";
import type * as core_hr from "../core_hr.js";
import type * as dashboard from "../dashboard.js";
import type * as employee_details from "../employee_details.js";
import type * as employees from "../employees.js";
import type * as http from "../http.js";
import type * as leave_requests from "../leave_requests.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as operations from "../operations.js";
import type * as org_context from "../org_context.js";
import type * as organization from "../organization.js";
import type * as payroll from "../payroll.js";
import type * as recruitment from "../recruitment.js";
import type * as reporting_ops from "../reporting_ops.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as seed_tax from "../seed_tax.js";
import type * as sensitive_changes from "../sensitive_changes.js";
import type * as settings from "../settings.js";
import type * as super_admin from "../super_admin.js";
import type * as tax_calculator from "../tax_calculator.js";
import type * as training from "../training.js";
import type * as users from "../users.js";
import type * as workflow_engine from "../workflow_engine.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attendance: typeof attendance;
  auth: typeof auth;
  compliance: typeof compliance;
  core_hr: typeof core_hr;
  dashboard: typeof dashboard;
  employee_details: typeof employee_details;
  employees: typeof employees;
  http: typeof http;
  leave_requests: typeof leave_requests;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  operations: typeof operations;
  org_context: typeof org_context;
  organization: typeof organization;
  payroll: typeof payroll;
  recruitment: typeof recruitment;
  reporting_ops: typeof reporting_ops;
  reports: typeof reports;
  seed: typeof seed;
  seed_tax: typeof seed_tax;
  sensitive_changes: typeof sensitive_changes;
  settings: typeof settings;
  super_admin: typeof super_admin;
  tax_calculator: typeof tax_calculator;
  training: typeof training;
  users: typeof users;
  workflow_engine: typeof workflow_engine;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
