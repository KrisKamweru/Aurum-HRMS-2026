# Functionality Index

Date: 2026-02-21  
Status: Active baseline for rebuild parity

## Domain Inventory

| Domain | Primary routes | Required capabilities to preserve | Primary Convex modules |
|---|---|---|---|
| Authentication | `/auth/login`, `/auth/register`, `/auth/forgot-password` | Sign-in, registration, reset flow, OAuth entry, viewer hydration | `auth`, `users` |
| Route access and role control | Global + feature guarded routes | `authGuard`, `roleGuard`, pending-user redirect contracts, unauthorized deny path | `users` |
| Pending onboarding | `/pending`, `/create-organization` | Browse orgs, create join request, cancel request, create org setup | `onboarding` |
| Dashboard | `/dashboard` | Admin dashboard stats and employee dashboard stats with attendance quick-actions | `dashboard`, `attendance`, `onboarding` |
| Profile | `/profile` | Self profile query and update | `employees` |
| Employees | `/employees`, `/employees/:id` | Employee CRUD, status, compensation, profile financial/statutory/docs/education data domains | `employees`, `employee_details`, `payroll`, `core_hr`, `organization` |
| Leave | `/leave-requests` | Leave creation, list, approvals/status transitions | `leave_requests` |
| Attendance | `/attendance`, `/attendance/team` | Clock in/out, personal logs, summary, team view, manual entry, held trust review | `attendance` |
| Core HR lifecycle | `/core-hr/*` | Promotions, transfers, awards, warnings, resignations, terminations, complaints, travel | `core_hr` |
| Organization masters | `/organization/*` | Departments/designations/locations CRUD, user linking, org chart, org settings | `organization`, `users`, `settings`, `employees` |
| Payroll | `/payroll`, `/payroll/:id`, `/payroll/slip/:id` | Run create/process/finalize/delete, payslip access, sensitive change approval flow | `payroll` |
| Reports | `/reports*` | Attendance/payroll/tax reports, analytics metrics, schedule trigger path | `reports`, `reporting_ops` |
| Recruitment | `/recruitment/*` | Job CRUD, application submission, candidate board transitions | `recruitment`, `organization`, `employee_details` |
| Training | `/training/*` | Course CRUD, enrollment, my-learning views | `training` |
| Settings | `/settings/*` | Organization settings, leave policies CRUD + seeding | `settings` |
| Super Admin | `/super-admin` | Organization lifecycle and system stats | `super_admin` |
| Notifications | Shell-level panel | List, unread count, mark read/all read, clear | `notifications` |
| Demo/showcase | `/demo/*`, `/6` | UI pattern demo surfaces | Frontend only |

## Coverage Anchors
- Route declarations and guards: `route-guard-snapshot.txt`
- Frontend function usage: `api-usage-summary.csv`, `api-usage-by-file.csv`
- Backend exported surface: `convex-function-surface.csv`
- High-risk regression map: `high-risk-flow-map.md`

