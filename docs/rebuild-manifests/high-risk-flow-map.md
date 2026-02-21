# High-Risk Flow Map

Date: 2026-02-21

## Regression-Critical Flows

| Flow | Why high risk | Key routes/components | Key Convex functions | Existing tests to keep green |
|---|---|---|---|---|
| Payroll run processing and finalization | Financial correctness and irreversible workflow actions | `/payroll`, `/payroll/:id`, `payroll-list.component.ts`, `payroll-run.component.ts` | `payroll.createRun`, `payroll.processRun`, `payroll.finalizeRun`, `payroll.deleteRun` | `e2e/regression.spec.ts`, `e2e/compensation-security.spec.ts` |
| Compensation and financial control boundaries | Sensitive pay-data authorization and maker-checker behavior | `employee-detail.component.ts`, payroll approval surfaces | `employees.updateCompensation`, `payroll.addCredit`, `payroll.addDebit`, `payroll.toggleAdjustmentStatus`, `payroll.reviewSensitiveChange` | `e2e/negative-auth.spec.ts`, `e2e/compensation-security.spec.ts` |
| Attendance trust and manual correction | Attendance integrity and fraud/risk handling | `/attendance`, `/attendance/team`, manual entry modal | `attendance.clockIn`, `attendance.clockOut`, `attendance.manualEntry`, `attendance.listHeldTrustEvents`, `attendance.reviewHeldTrustEvent` | `e2e/attendance-functional.spec.ts`, `e2e/regression.spec.ts` |
| Guard and role authorization behavior | Unauthorized access prevention and routing correctness | global routes + `authGuard` + `roleGuard` | `users.viewer` (auth context), guarded route surface | `e2e/negative-auth.spec.ts`, `e2e/regression.spec.ts` |
| Pending onboarding and org creation | User onboarding continuity and tenant isolation entry path | `/pending`, `/create-organization`, onboarding dialogs | `onboarding.getMyJoinRequests`, `onboarding.getMatchingOrganizations`, `onboarding.createJoinRequest`, `onboarding.cancelJoinRequest`, `onboarding.createOrganizationWithSetup` | `e2e/regression.spec.ts` |
| Employee detail data domains | Highest density of sub-features and cross-module coupling | `/employees/:id`, `employee-detail.component.ts` | `employees.get`, `employee_details.*`, `core_hr.*`, `payroll.getEmployeePayslips`, `payroll.getEmployeeAdjustments` | `e2e/compensation-security.spec.ts`, `e2e/regression.spec.ts` |

## Mandatory Cutover Criteria
1. All listed flows pass automated tests in CI.
2. Any rewritten flow without existing tests must add tests before cutover.
3. Authorization-sensitive mutations must have negative-path tests.

