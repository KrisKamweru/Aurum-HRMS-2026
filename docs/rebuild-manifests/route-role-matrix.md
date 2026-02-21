# Route and Role Matrix

Date: 2026-02-21

## Global Guard Contracts
- Unauthenticated users are redirected to `/auth/login`.
- Authenticated users with role `pending` are forced to `/pending` when navigating elsewhere.
- Non-pending users are redirected away from `/pending` to `/dashboard`.

## Route Family Access Matrix

| Route family | Guard contract | Allowed roles (effective) | Source |
|---|---|---|---|
| `/pending` | `authGuard` | any authenticated role, with pending logic redirect behavior | `src/app/app.routes.ts` |
| `/create-organization` | `authGuard` | any authenticated role (used by pending onboarding flow) | `src/app/app.routes.ts` |
| App shell (`/dashboard`, `/profile`) | parent `authGuard` | any authenticated non-pending role for normal navigation | `src/app/app.routes.ts` |
| `/settings/*` | `roleGuard([...])` | `super_admin`, `admin`, `hr_manager` | `src/app/features/settings/settings.routes.ts` |
| `/recruitment/*` | parent + child role guards | `super_admin`, `admin`, `hr_manager`, `manager` | `src/app/app.routes.ts`, `src/app/features/recruitment/recruitment.routes.ts` |
| `/training/*` | child role guards on create/edit | read: broad authenticated; write: `super_admin`, `admin`, `hr_manager`, `manager` | `src/app/features/training/training.routes.ts` |
| `/employees`, `/employees/:id` | `roleGuard([...])` | `super_admin`, `admin`, `hr_manager`, `manager` | `src/app/app.routes.ts` |
| `/leave-requests` | no explicit role guard | authenticated users (component enforces action-level checks) | `src/app/app.routes.ts` |
| `/attendance` | no explicit role guard | authenticated users | `src/app/features/attendance/attendance.routes.ts` |
| `/attendance/team` | `roleGuard([...])` | `super_admin`, `admin`, `hr_manager`, `manager` | `src/app/features/attendance/attendance.routes.ts` |
| `/core-hr/*` | `roleGuard([...])` | `super_admin`, `admin`, `hr_manager` | `src/app/app.routes.ts` |
| `/organization/*` | `roleGuard([...])` | `super_admin`, `admin`, `hr_manager` | `src/app/app.routes.ts` |
| `/payroll` and `/payroll/:id` | `roleGuard([...])` | `super_admin`, `admin`, `hr_manager` | `src/app/features/payroll/payroll.routes.ts` |
| `/payroll/slip/:id` | `authGuard` + ownership check in component | authenticated users; must own slip or be privileged | `src/app/features/payroll/payroll.routes.ts` |
| `/reports*` | `roleGuard([...])` | `super_admin`, `admin`, `hr_manager` | `src/app/features/reports/reports.routes.ts` |
| `/super-admin` | `roleGuard(['super_admin'])` | `super_admin` | `src/app/app.routes.ts` |
| `/demo/*`, `/6` | no role guard in route | currently open route surface | `src/app/app.routes.ts`, `src/app/features/demo/demo.routes.ts` |
| `/auth/*` | auth layout routes | public entry routes | `src/app/app.routes.ts` |

## Rebuild Gate
- Every row above must be represented in the new router or explicitly marked deprecated in `deprecation-register.md`.

