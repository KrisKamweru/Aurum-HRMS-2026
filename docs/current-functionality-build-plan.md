# Current Functionality Build Plan

Date: 2026-03-06

## Purpose

This document indexes the functionality currently present in the codebase so the app can be rebuilt from scratch without losing important product behavior, permissions, or backend contracts.

It is intentionally based on live TypeScript and Convex code, not visual completeness.

## Scope And Reading Rules

- Indexed from:
  - `src/app/app.routes.ts`
  - feature page components, stores, and data services in `src/app/features/**`
  - shared UI components in `src/app/shared/components/**`
  - backend surface in `convex/*.ts`
- Ignored:
  - missing or empty templates
  - visual completeness
  - archived/historical markdown except as cross-reference
- Important constraint:
  - many active rebuild components currently use `template: ''`
  - this plan treats the route contracts, page logic, store methods, data service calls, guards, and Convex APIs as the source of truth

## Snapshot

- Angular route entries in `src/app/app.routes.ts`: `56`
- active empty-template components in `src/app/features` and `src/app/shared`: `48`
- exported Convex queries/mutations/actions: `182`
- current frontend architecture:
  - standalone Angular components
  - signals-based local state
  - data-service layer per feature
  - Convex-backed auth and data access
  - role-guarded route matrix

## What The Current Rebuild Is Actually Trying To Be

The current codebase is not just rebuilding feature pages. It is also rebuilding a product shell and a reusable design system.

Observed direction from modified files:

- demo shell is being used as a live design-system playground
- shared components are being upgraded into a coherent glass/frosted UI kit
- dynamic forms, data tables, toasts, stepper flows, nav items, confirm dialogs, date ranges, icons, avatar states, and notification dropdowns are meant to be first-class primitives
- business features are mostly written against those shared primitives, even when the final HTML has not been restored yet

If you restart, the design-system rebuild should be treated as a real workstream, not incidental polish.

## Rebuild Principles

- Preserve route parity unless a route is explicitly deprecated.
- Preserve RBAC parity before feature parity.
- Preserve Convex contract parity for all frontend-used functions before optimizing anything.
- Rebuild shared primitives before feature-heavy pages.
- Treat maker-checker, trust-review, and compensation flows as high-risk and non-optional.
- Do not assume “missing template” means “unfinished feature”; most behavior exists in TS already.

## Cross-Cutting Foundations

### 1. App Shell And Routing

Must preserve:

- guarded route matrix with lazy-loaded standalone pages
- redirects:
  - `/` -> `/dashboard`
  - `/settings` -> `/settings/general`
  - `/organization` -> `/organization/departments`
  - `/auth` -> `/auth/login`
- fallback `**` -> `/dashboard`
- route metadata titles

### 2. Authentication And Session

Frontend contracts:

- password login
- password registration
- OAuth provider sign-in handoff
- session hydration from Convex `users.viewer`
- sign-out
- pending-user routing rules
- unsupported password-reset handling with explicit user messaging

Key files:

- `src/app/core/auth/auth-session.service.ts`
- `src/app/core/auth/auth.guard.ts`
- `src/app/core/auth/role.guard.ts`
- `src/app/core/services/convex-client.service.ts`

Behavior to preserve:

- unauthenticated users go to `/auth/login`
- `pending` users are restricted to `/pending` and `/create-organization`
- non-pending users are bounced away from `/pending`
- role guard redirects unauthorized users to `/dashboard`

### 3. Shared UI Platform

These are platform dependencies, not decorative extras:

- `dynamic-form`
  - section-based forms
  - step-based forms
  - page/modal container modes
  - typed submit/cancel events
- `ui-modal`
  - `thin|normal|wide`
  - internal body scroll
- `ui-confirm-dialog`
  - `info|warning|danger`
  - optional required reason capture
- `ui-data-table`
  - sortable columns
  - typed display modes: `text|date|currency|badge`
  - row click events
  - loading and empty states
- `ui-button`
  - variants: `primary|secondary|danger|ghost|outline|gold`
  - blocked state via `prerequisitesMet`
- `ui-toast`
- `ui-date-range`
- `ui-avatar`
- `ui-badge`
- `ui-icon`
- `ui-nav-item`
- `notifications-panel`
- `ui-stepper`

### 4. Design-System Demo Surface

Routes under `/demo/*` plus `/6` are optional from a product perspective but useful as:

- component verification surfaces
- regression harnesses for the design language
- pattern references during rebuild

Current demo subareas:

- dashboard demo
- forms demo
- tables demo
- glassmorphism demo
- buttons demo
- modals demo
- date picker demo
- extras demo
  - stepper
  - notifications panel
  - toast triggers

## Functional Domain Inventory

### Dashboard

Routes:

- `/dashboard`

Current state:

- route exists and is authenticated
- current page class is mostly empty
- backend dashboard functions exist:
  - `dashboard.getStats`
  - `dashboard.getEmployeeStats`

Rebuild classification:

- foundation shell route must exist
- actual dashboard UX likely needs to be rebuilt from backend capability rather than current page HTML

### Onboarding

Routes:

- `/pending`
- `/create-organization`

Functionality:

- list organizations
- suggest matching organizations by email/domain
- view current join requests
- cancel join requests
- open searchable organization directory
- submit join request with optional note
- create organization through a multi-step setup wizard
- create starter departments and designations during org setup
- create admin employee record during org setup
- refresh session after org creation and route to dashboard

Convex dependencies:

- `onboarding.listOrganizations`
- `onboarding.getMatchingOrganizations`
- `onboarding.getMyJoinRequests`
- `onboarding.createJoinRequest`
- `onboarding.cancelJoinRequest`
- `onboarding.createOrganizationWithSetup`

### Profile

Routes:

- `/profile`

Functionality:

- load own employee profile
- edit personal information in modal/stepper flow
- save profile updates

Convex dependencies:

- `employees.getMyProfile`
- `employees.updateMyProfile`

### Settings

Routes:

- `/settings/general`
- `/settings/leave-policies`

Functionality:

- general organization settings load/save
- leave policy list
- create leave policy
- edit leave policy
- delete leave policy
- seed default leave policies

Convex dependencies:

- `settings.getSettings`
- `settings.updateSettings`
- `settings.listLeavePolicies`
- `settings.createLeavePolicy`
- `settings.updateLeavePolicy`
- `settings.deleteLeavePolicy`
- `settings.seedDefaultPolicies`

### Organization Masters

Routes:

- `/organization/departments`
- `/organization/designations`
- `/organization/locations`
- `/organization/user-linking`
- `/organization/chart`
- `/organization/settings`

Functionality:

- departments CRUD
- manager assignment for departments
- designations CRUD
- locations CRUD
- user-to-employee linking
- unlinked user lookup
- unlinked employee lookup
- organization chart load
- organization settings edit with optimistic UI
- stale-write conflict detection via `expectedUpdatedAt`
- shared page states for loading, empty, and retry

Convex dependencies:

- `organization.listDepartments`
- `organization.createDepartment`
- `organization.updateDepartment`
- `organization.deleteDepartment`
- `organization.listDesignations`
- `organization.createDesignation`
- `organization.updateDesignation`
- `organization.deleteDesignation`
- `organization.listLocations`
- `organization.createLocation`
- `organization.updateLocation`
- `organization.deleteLocation`
- `users.getUnlinkedUsers`
- `users.getUnlinkedEmployees`
- `users.linkUserToEmployee`
- `employees.getOrgChart`
- `organization.getOrganizationSettings`
- `organization.updateOrganizationSettings`

### Employees

Routes:

- `/employees`
- `/employees/:id`

Functionality:

- employee list
- create employee
- update employee core record
- activate/deactivate employee
- delete employee
- load reference data:
  - departments
  - designations
  - locations
  - managers
- employee detail summary
- employee compensation tab
- employee financial tab
- compensation edit flow for `super_admin|admin|hr_manager`
- compensation read-only restrictions for `manager|employee`
- compensation changes require reason and route through approval behavior
- detail collections:
  - emergency contacts
  - banking details
  - education
  - statutory info
  - documents

Convex dependencies:

- `employees.list`
- `employees.get`
- `employees.create`
- `employees.update`
- `employees.updateStatus`
- `employees.remove`
- `employees.updateCompensation`
- `organization.listDepartments`
- `organization.listDesignations`
- `organization.listLocations`
- `employee_details.listEmergencyContacts`
- `employee_details.listBankingDetails`
- `employee_details.listEducation`
- `employee_details.getStatutoryInfo`
- `employee_details.listDocuments`

### Leave Management

Routes:

- `/leave-requests`

Functionality:

- load leave requests
- derive employee options
- detect manager/admin capability
- create leave request
- approve request
- reject request
- cancel request
- enforce rejection-reason path via status workflow

Convex dependencies:

- `leave_requests.list`
- `leave_requests.create`
- `leave_requests.updateStatus`
- `employees.list`
- `users.viewer`

### Attendance

Routes:

- `/attendance`
- `/attendance/team`

Functionality:

- personal attendance dashboard
- today status
- monthly summary
- attendance history
- clock in
- clock out
- reason-required retry path
- team attendance daily view
- manual attendance entry/correction
- held trust-event review queue
- approve/reject held trust events
- team rollups:
  - present
  - late
  - absent
  - on leave

Convex dependencies:

- `users.viewer`
- `attendance.getTodayStatus`
- `attendance.getMyAttendance`
- `attendance.getAttendanceSummary`
- `attendance.getTeamAttendance`
- `attendance.listHeldTrustEvents`
- `attendance.clockIn`
- `attendance.clockOut`
- `attendance.manualEntry`
- `attendance.reviewHeldTrustEvent`

### Payroll

Routes:

- `/payroll`
- `/payroll/:id`
- `/payroll/slip/:id`

Functionality:

- payroll home with run summaries
- create payroll run
- derive next payroll period
- review pending sensitive changes
- approve sensitive change
- reject sensitive change with required reason
- payroll run detail
- process payroll run
- finalize payroll run with required reason
- delete payroll run with required reason
- payslip drill-down
- payslip access with unauthorized redirect handling
- print-friendly payslip action
- YTD metrics
- run slip list

Convex dependencies:

- `users.viewer`
- `payroll.listRuns`
- `payroll.listPendingSensitiveChanges`
- `payroll.createRun`
- `payroll.getRun`
- `payroll.getRunSlips`
- `payroll.processRun`
- `payroll.finalizeRun`
- `payroll.deleteRun`
- `payroll.reviewSensitiveChange`
- `payroll.getPayslip`

### Core HR Lifecycle

Routes:

- `/core-hr`
- `/core-hr/promotions`
- `/core-hr/transfers`
- `/core-hr/awards`
- `/core-hr/warnings`
- `/core-hr/resignations`
- `/core-hr/terminations`
- `/core-hr/complaints`
- `/core-hr/travel`

Functionality:

- overview cards/counts
- unified records page driven by route `recordType`
- reference loading:
  - employees
  - departments
  - designations
  - locations
- create promotion
- create transfer
- give award
- issue warning
- submit resignation
- approve resignation
- reject resignation
- terminate employee
- file complaint
- create travel request

Convex dependencies:

- `users.viewer`
- `employees.list`
- `organization.listDepartments`
- `organization.listDesignations`
- `organization.listLocations`
- `core_hr.getPromotions`
- `core_hr.createPromotion`
- `core_hr.getTransfers`
- `core_hr.createTransfer`
- `core_hr.getAwards`
- `core_hr.giveAward`
- `core_hr.getWarnings`
- `core_hr.issueWarning`
- `core_hr.getResignations`
- `core_hr.submitResignation`
- `core_hr.updateResignationStatus`
- `core_hr.getTerminations`
- `core_hr.terminateEmployee`
- `core_hr.getComplaints`
- `core_hr.fileComplaint`
- `core_hr.getTravelRequests`
- `core_hr.createTravelRequest`

### Recruitment

Routes:

- `/recruitment`
- `/recruitment/jobs`
- `/recruitment/jobs/new`
- `/recruitment/jobs/:id`
- `/recruitment/jobs/:id/edit`
- `/recruitment/board`

Functionality:

- jobs list
- create job
- edit job
- load job detail
- apply to job
- view application pipeline by job
- update application status
- load department/location references
- role-aware management vs applicant behavior

Convex dependencies:

- `users.viewer`
- `recruitment.listJobs`
- `recruitment.getJob`
- `recruitment.createJob`
- `recruitment.updateJob`
- `recruitment.listApplications`
- `recruitment.submitApplication`
- `recruitment.updateApplicationStatus`
- `organization.listDepartments`
- `organization.listLocations`

### Training

Routes:

- `/training`
- `/training/catalog`
- `/training/my-learning`
- `/training/courses/new`
- `/training/courses/:id/edit`

Functionality:

- course catalog
- filter by status
- role-aware create/edit controls
- course detail load for editing
- create course
- update course
- my-learning enrollments
- enroll in course
- progress/status visualization in learning flow

Convex dependencies:

- `users.viewer`
- `training.listCourses`
- `training.getCourse`
- `training.createCourse`
- `training.updateCourse`
- `training.getMyEnrollments`
- `training.enrollEmployee`

### Reports

Routes:

- `/reports`
- `/reports/attendance`
- `/reports/analytics`
- `/reports/payroll`
- `/reports/tax`

Functionality:

- report index/home
- load shared filter options:
  - departments
  - payroll runs
- attendance report:
  - date range filters
  - department filter
  - summary metrics
  - CSV export
- payroll report:
  - run filter
  - department filter
  - summary metrics
  - CSV export
- tax report:
  - payroll run filter
  - tax table
  - CSV export
- analytics report:
  - period filter `daily|weekly|monthly|quarterly`
  - canonical metrics load
  - run due report schedules

Convex dependencies:

- `reports.getDepartments`
- `reports.getPayrollRuns`
- `reports.getAttendanceReport`
- `reports.getPayrollReport`
- `reports.getTaxReport`
- `reporting_ops.getCanonicalMetrics`
- `reporting_ops.runDueReportSchedules`

### Super Admin

Routes:

- `/super-admin`

Functionality:

- organization list
- system stats
- create organization
- edit organization
- activate organization
- suspend organization
- form-driven org management with confirm dialog guardrails

Convex dependencies:

- `super_admin.listOrganizations`
- `super_admin.getSystemStats`
- `super_admin.createOrganization`
- `super_admin.updateOrganization`
- `super_admin.updateOrganizationStatus`

## Backend Surface Present But Not Clearly Used By Active Frontend

These exist in Convex and should be consciously kept, deferred, or deprecated during a restart:

- notifications domain
  - list/unread/mark/clear/create APIs exist
  - active rebuilt shell does not currently wire them into production pages
- compliance domain
  - change-request audit
  - access review assignments
  - retention preview/purge
- operations domain
  - alert routes
  - incident template generation
- org-context domain
  - active-organization context switching backend exists
  - no active rebuilt frontend shell for this was found in current `src/app`
- workflow engine
  - workflow definitions, instances, actions, timeline, escalation helpers
- reporting schedule management beyond “run due now”
  - schedule CRUD and delivery logs exist in backend
- employee detail write paths not surfaced in current rebuild pages
  - emergency contacts mutations
  - banking detail mutations
  - education mutations
  - statutory upsert
  - document add/delete/upload URL
- recruitment support API not surfaced in rebuild pages
  - candidate detail query
  - job status mutation
- training support API not surfaced in rebuild pages
  - course enrollment management/admin updates
- super-admin support API not surfaced in rebuild page
  - `getOrganization`
  - `assignUserToOrg`
  - `listPendingUsers`
- tax configuration and seed utilities
- seed/dev support modules

These are the easiest places to accidentally lose capability in a rewrite because they are not obvious from the current route matrix.

## Security And Risk-Critical Flows

These should be rebuilt before general UI polish:

- auth session hydration and guard timing
- pending-user route restrictions
- role-based route protection
- compensation-change workflow with reason capture
- payroll sensitive-change approval/rejection
- payroll finalize/delete with reason capture
- payslip authorization handling
- attendance held trust-event review
- resignation approval/rejection
- organization settings optimistic concurrency handling
- cross-role read-only behavior on employee compensation/financial views

## Recommended Restart Build Order

### Phase 0. Contract Capture

- freeze route matrix
- freeze active frontend-to-Convex API map
- freeze role matrix per route and action
- mark explicit deprecations instead of silently dropping routes

### Phase 1. Foundations

- app shell
- router
- auth session
- auth guard
- role guard
- Convex client
- layout/container/scroll rules

### Phase 2. Shared System

- button
- badge
- icon
- avatar
- modal
- confirm dialog
- toast
- nav item
- data table
- date range
- stepper
- dynamic form
- notifications panel

### Phase 3. Account And Access Entry

- login
- register
- forgot password degraded state
- pending onboarding
- create organization wizard
- profile

### Phase 4. Core Master Data

- organization masters
- organization settings
- employees list/detail
- settings general
- leave policies

### Phase 5. Daily Operations

- leave
- attendance personal
- attendance team
- reports attendance

### Phase 6. Money And Controls

- payroll home
- payroll run detail
- payslip view
- payroll report
- tax report

### Phase 7. HR Expansion

- core HR lifecycle suite
- recruitment suite
- training suite

### Phase 8. Admin And Support Surfaces

- analytics report
- super admin
- notification wiring
- org switcher if multi-org operator mode is still required

### Phase 9. Optional Surfaces

- demo routes
- `/6` showcase route
- operations/compliance/workflow admin surfaces

## Keep / Defer / Decide

Keep:

- auth
- onboarding
- profile
- settings
- organization
- employees
- leave
- attendance
- payroll
- core HR lifecycle
- recruitment
- training
- reports
- super admin
- shared component system

Defer if needed:

- dashboard visual rebuild
- notifications production shell integration
- compliance admin UI
- operations admin UI
- workflow admin UI
- report schedule management UI
- org context switcher UI

Decide explicitly:

- `/demo/*`
- `/6`
- backend-only maintenance modules
- seed utilities in a clean restart repo

## Rebuild Acceptance Checklist

- every kept route is reachable
- every kept route has matching guard behavior
- every kept route has matching Convex contract coverage
- every risk-critical action has tests
- no role escalation path is introduced
- no approval/reason workflow is simplified away by accident
- no backend module is removed without an explicit deprecation decision
- empty-template logic-only pages are either fully rebuilt or intentionally retired

## Related Existing Docs

- `docs/rebuild-manifests/functionality-index.md`
- `docs/rebuild-manifests/high-risk-flow-map.md`
- `docs/rebuild-manifests/route-role-matrix.md`
- `docs/rebuild-parity-plan.md`
- `ROADMAP.md`

## Bottom Line

If you trash the current frontend and start again, the minimum product you are preserving is not “a few screens.” It is:

- a guarded multi-role HRMS route matrix
- a shared form/table/modal design system
- onboarding plus org setup
- employee and org master data
- leave, attendance, payroll, and reports
- lifecycle HR actions
- recruitment and training
- super-admin controls

The biggest hidden risk is dropping backend capability that is present but not obvious from the current empty-template pages. Preserve contract parity first, then choose what to simplify.
