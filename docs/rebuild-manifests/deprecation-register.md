# Deprecation Register (Rebuild Program)

Date: 2026-02-22  
Status key: `keep`, `deprecate`, `tbd`

## Route-Level Decisions

| Route | Current purpose | Decision | Notes |
|---|---|---|---|
| `/pending` | Pending user hub and join request management | `keep` | Required onboarding contract |
| `/create-organization` | New org setup wizard | `keep` | Required onboarding contract |
| `/dashboard` | Primary home by role | `keep` | Rebuild shell anchor route |
| `/profile` | Self profile management | `keep` | Rebuilt on 2026-02-22 |
| `/employees` | Employee directory and management | `keep` | Core HR foundational |
| `/employees/:id` | Employee deep profile and HR actions | `keep` | High-risk parity surface |
| `/leave-requests` | Leave request and approval flow | `keep` | Core operational workflow |
| `/attendance` | Employee attendance operations | `keep` | Core operational workflow |
| `/attendance/team` | Manager/admin attendance oversight | `keep` | Includes trust-event review |
| `/core-hr/*` | Lifecycle actions | `keep` | Core module |
| `/organization/*` | Org masters and linking | `keep` | Core module; base alias now redirects to `/organization/departments` |
| `/payroll*` | Payroll runs/payslips/sensitive approvals | `keep` | Financial high-risk surface |
| `/reports*` | Reporting and analytics | `keep` | MVP-complete module |
| `/recruitment/*` | ATS flows | `keep` | Completed module |
| `/training/*` | Learning flows | `keep` | Completed module |
| `/settings/*` | Org settings and leave policy | `keep` | Rebuilt `general` + `leave-policies` on 2026-02-22 |
| `/super-admin` | Cross-org administration | `keep` | Platform-level capability |
| `/auth/*` | Public authentication entry | `keep` | `login` rebuilt; `register` and `forgot-password` still pending Phase 5 slice |
| `/demo/*` | UI demo pages | `tbd` | Candidate deprecation if non-product |
| `/6` | Showcase page | `tbd` | Candidate deprecation if non-product |

## Decision Rule
- Any route marked `tbd` must be resolved before Phase 5 final cutover sign-off.

## Phase 5 Notes (2026-02-22)
- Remaining placeholder-backed keep routes:
  - `/pending`
  - `/create-organization`
  - `/auth/register`
  - `/auth/forgot-password`
- Known parity caveat:
  - Password reset flow currently exists only in `src/app.old` auth service and is not yet represented in the rebuilt auth layer/backend surface.
