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
import type * as core_hr from "../core_hr.js";
import type * as dashboard from "../dashboard.js";
import type * as employee_details from "../employee_details.js";
import type * as employees from "../employees.js";
import type * as http from "../http.js";
import type * as leave_requests from "../leave_requests.js";
import type * as onboarding from "../onboarding.js";
import type * as organization from "../organization.js";
import type * as seed from "../seed.js";
import type * as super_admin from "../super_admin.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  attendance: typeof attendance;
  auth: typeof auth;
  core_hr: typeof core_hr;
  dashboard: typeof dashboard;
  employee_details: typeof employee_details;
  employees: typeof employees;
  http: typeof http;
  leave_requests: typeof leave_requests;
  onboarding: typeof onboarding;
  organization: typeof organization;
  seed: typeof seed;
  super_admin: typeof super_admin;
  users: typeof users;
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
