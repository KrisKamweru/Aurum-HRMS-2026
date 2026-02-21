# Aurum HRMS Rebuild Parity Plan

Date: 2026-02-21  
Status: Planning only (no migration started)

## Objective
Archive the current frontend as legacy (`.old`) and rebuild the app from a clean structure without losing existing business behavior, security controls, or role-based access contracts.

## Legacy Reference Policy (`src/app.old`)
`src/app.old` exists only as a functionality and contract archive.

- Allowed use:
  - route/role/API parity verification
  - behavior reference for business rules and edge cases
  - migration checklists and regression mapping
- Disallowed use:
  - copy/paste of legacy templates/styles/layouts into rebuilt features
  - visual or UX back-porting from legacy pages
- Rebuild rule:
  - all rebuilt UI must follow `DESIGN LANGUAGE.md` and shared rebuilt primitives (`dynamic-form`, `ui-modal`, etc.), while preserving functional parity.

## Scope
- Frontend routes, pages, and critical user flows.
- Frontend-to-Convex function usage.
- Role/guard behavior and negative-authorization expectations.
- Existing test coverage baselines used as parity gates.

## Current Route and Feature Inventory

### App-level routes
- `/pending` -> onboarding pending state.
- `/create-organization` -> organization creation wizard for pending users.
- `/dashboard` -> role-based dashboard (admin/employee variants).
- `/profile` -> current user profile and self-service updates.
- `/settings/*` -> organization/general settings and leave policy management.
- `/recruitment/*` -> jobs, forms, details, and candidate board.
- `/training/*` -> course catalog, my learning, and course management.
- `/employees` -> employee directory and employee CRUD.
- `/employees/:id` -> employee detail (profile, financial, lifecycle, docs, education).
- `/leave-requests` -> leave request and approval workflows.
- `/attendance` -> self attendance.
- `/attendance/team` -> team attendance and trust-event review.
- `/core-hr/*` -> promotions/transfers/awards/warnings/resignations/terminations/complaints/travel.
- `/organization/*` -> departments/designations/locations/user linking/chart/settings.
- `/payroll` -> run list and approvals.
- `/payroll/:id` -> payroll run processing/finalization/delete.
- `/payroll/slip/:id` -> payslip view (ownership-aware access).
- `/reports` -> report index.
- `/reports/attendance|analytics|payroll|tax` -> module reports.
- `/super-admin` -> platform-level organization administration.
- `/demo/*`, `/6` -> demo/showcase surfaces (candidate for explicit deprecation).
- `/auth/login|register|forgot-password` -> auth entry points.

### Feature modules present in `src/app/features`
- `attendance`, `auth`, `core-hr`, `dashboard`, `demo`, `employees`, `leave-requests`, `organization`, `payroll`, `pending`, `profile`, `recruitment`, `reports`, `settings`, `showcase`, `super-admin`, `training`.

## Access Control Contracts to Preserve
- Auth guard redirects unauthenticated users to `/auth/login`.
- `pending` users are redirected to `/pending` for non-pending routes.
- Non-pending users accessing `/pending` are redirected to `/dashboard`.
- Role-restricted route groups:
  - Recruitment: `super_admin`, `admin`, `hr_manager`, `manager`.
  - Employees + employee detail: `super_admin`, `admin`, `hr_manager`, `manager`.
  - Core HR: `super_admin`, `admin`, `hr_manager`.
  - Organization: `super_admin`, `admin`, `hr_manager`.
  - Reports: `super_admin`, `admin`, `hr_manager`.
  - Payroll admin routes: `super_admin`, `admin`, `hr_manager`.
  - Super Admin: `super_admin`.
  - Attendance team routes: `super_admin`, `admin`, `hr_manager`, `manager`.

## Frontend -> Convex Function Surface (In Use)

### Core and shared
- `users.viewer`, `org_context.getOrganizationContext`, `org_context.setActiveOrganization`.
- `notifications.list`, `notifications.unreadCount`, `notifications.markAsRead`, `notifications.markAllAsRead`, `notifications.clearAll`.

### Dashboard and onboarding
- `dashboard.getStats`, `dashboard.getEmployeeStats`.
- `onboarding.listOrganizations`, `onboarding.getMatchingOrganizations`, `onboarding.getMyJoinRequests`, `onboarding.createJoinRequest`, `onboarding.cancelJoinRequest`, `onboarding.approveJoinRequest`, `onboarding.rejectJoinRequest`, `onboarding.createOrganizationWithSetup`.

### People and org
- `employees.list`, `employees.get`, `employees.create`, `employees.update`, `employees.updateStatus`, `employees.remove`, `employees.getMyProfile`, `employees.updateMyProfile`, `employees.getOrgChart`, `employees.updateCompensation`.
- `employee_details.*` emergency contacts, banking, statutory, education, documents, upload URL.
- `organization.*` departments/designations/locations CRUD.
- `users.getUnlinkedUsers`, `users.getUnlinkedEmployees`, `users.linkUserToEmployee`, `users.createEmployeeForUser`.
- `settings.getSettings`, `settings.updateSettings`, `settings.listLeavePolicies`, `settings.createLeavePolicy`, `settings.updateLeavePolicy`, `settings.deleteLeavePolicy`, `settings.seedDefaultPolicies`.

### Attendance and leave
- `attendance.getTodayStatus`, `attendance.getAttendanceSummary`, `attendance.getMyAttendance`, `attendance.getTeamAttendance`.
- `attendance.clockIn`, `attendance.clockOut`, `attendance.manualEntry`.
- `attendance.listHeldTrustEvents`, `attendance.reviewHeldTrustEvent`.
- `leave_requests.list`, `leave_requests.create`, `leave_requests.updateStatus`.

### Payroll and reports
- `payroll.listRuns`, `payroll.getRun`, `payroll.getRunSlips`, `payroll.createRun`, `payroll.processRun`, `payroll.finalizeRun`, `payroll.deleteRun`.
- `payroll.listPendingSensitiveChanges`, `payroll.reviewSensitiveChange`.
- `payroll.getPayslip`, `payroll.getEmployeePayslips`, `payroll.getEmployeeAdjustments`, `payroll.addCredit`, `payroll.addDebit`, `payroll.toggleAdjustmentStatus`.
- `reports.getAttendanceReport`, `reports.getPayrollReport`, `reports.getTaxReport`, `reports.getDepartments`, `reports.getPayrollRuns`.
- `reporting_ops.getCanonicalMetrics`, `reporting_ops.runDueReportSchedules`.

### Core HR, recruitment, training, super admin
- `core_hr.*` promotions/transfers/resignations/terminations/warnings/awards/complaints/travel queries and mutations.
- `recruitment.listJobs`, `recruitment.getJob`, `recruitment.createJob`, `recruitment.updateJob`, `recruitment.submitApplication`, `recruitment.listApplications`, `recruitment.updateApplicationStatus`.
- `training.listCourses`, `training.getCourse`, `training.createCourse`, `training.updateCourse`, `training.getMyEnrollments`, `training.enrollEmployee`.
- `super_admin.listOrganizations`, `super_admin.getSystemStats`, `super_admin.createOrganization`, `super_admin.updateOrganization`, `super_admin.updateOrganizationStatus`.

## Backend Domains Present (Convex)
- Active in UI: `attendance`, `core_hr`, `dashboard`, `employee_details`, `employees`, `leave_requests`, `notifications`, `onboarding`, `org_context`, `organization`, `payroll`, `recruitment`, `reporting_ops`, `reports`, `settings`, `super_admin`, `training`, `users`.
- Present but currently partial/non-UI-heavy: `workflow_engine`, `operations`, `compliance`, `tax_calculator`, `seed`, `seed_tax`.

## Test Baseline (Current)
- Unit specs:
  - `src/app/app.component.spec.ts`
  - `src/app/core/auth/auth.service.spec.ts`
  - `src/app/features/dashboard/dashboard.component.spec.ts`
  - `src/app/shared/components/dynamic-form/dynamic-form.component.spec.ts`
- E2E specs:
  - `e2e/attendance-functional.spec.ts`
  - `e2e/compensation-security.spec.ts`
  - `e2e/negative-auth.spec.ts`
  - `e2e/regression.spec.ts`
  - additional visual/deep-dive checks.

## Legacy Archival Strategy (`.old`)
Current compile includes `src/**/*.ts`. If legacy TypeScript remains under `src`, it may still compile.

### Safe approach
1. Archive current app under a non-active path (example: `legacy/app.old/`) or exclude archived paths in TypeScript/Vitest config.
2. Keep route manifests and API usage manifests in docs for traceability.
3. Keep legacy code read-only during early rebuild to avoid accidental drift.

### Naming convention
- Legacy file suffixing for route clarity: `*.routes.old.ts`.
- Legacy top-level folder examples:
  - `legacy/app.old/...`
  - `legacy/convex-usage.old.md` (generated manifest)

## Rebuild Execution Plan

### Phase 1: Freeze + parity manifests
1. Generate machine-readable manifests:
   - Route inventory + guards.
   - Frontend API usage inventory.
   - Role matrix by route/action.
   - High-risk flows and owning tests.
2. Lock deprecation decisions up front (`demo`/`showcase` keep vs retire).

### Phase 2: Archive current frontend
1. Move existing frontend implementation to `.old` archive location.
2. Confirm archive is excluded from active compile/test.
3. Keep only minimal boot files needed for new build entry.

### Phase 3: Rebuild foundation
1. New app shell, auth layout, main layout.
2. Guards and role contracts.
3. Org context switcher + notification stream.
4. Baseline tests (auth redirects + role denial + dashboard load).

### Phase 4: Rebuild by dependency order
1. Organization masters + employee directory/detail core.
2. Attendance + leave.
3. Payroll and sensitive-change approvals.
4. Core HR lifecycle.
5. Recruitment + training.
6. Reports and reporting operations.
7. Super admin.

### Phase 5: Parity and cutover
1. Route parity: every approved old route replaced or explicitly deprecated.
2. API parity: all in-use functions accounted for.
3. Security parity: negative auth + compensation security tests green.
4. Role parity: per-role access matrix verified.
5. Data parity: schema compatibility validated for live environments.

## Critical Risks and Mitigations
- Risk: Archived code still compiled.
  - Mitigation: archive outside `src` or explicit tsconfig excludes.
- Risk: permission regressions in payroll/compensation.
  - Mitigation: move security e2e to required release gate.
- Risk: onboarding/pending flow regressions.
  - Mitigation: guard behavior tests first in Phase 3.
- Risk: employee detail feature loss.
  - Mitigation: tab-by-tab parity checklist tied to API calls.

## Definition of Done for Rebuild
- All approved routes replaced with passing tests.
- All active API contracts mapped and exercised by automated tests.
- Role and auth behavior equivalent or stricter than current.
- High-risk payroll/attendance/security tests pass in CI.
- Legacy `.old` archive retained and excluded from runtime build.
