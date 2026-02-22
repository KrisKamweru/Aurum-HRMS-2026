# Deprecation Register (Rebuild Program)

Date: 2026-02-22  
Status key: `keep`, `deprecate`, `tbd`

## Route-Level Decisions

| Route | Current purpose | Decision | Notes |
|---|---|---|---|
| `/pending` | Pending user hub and join request management | `keep` | Rebuilt on 2026-02-22 (Phase 5 onboarding slice) |
| `/create-organization` | New org setup wizard | `keep` | Rebuilt on 2026-02-22 (Phase 5 onboarding slice) |
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
| `/auth/*` | Public authentication entry | `keep` | `login`, `register`, and `forgot-password` rebuilt on 2026-02-22; `forgot-password` currently ships an explicit degraded fallback pending reset backend support |
| `/demo/*` | UI demo pages | `tbd` | Candidate deprecation if non-product |
| `/6` | Showcase page | `tbd` | Candidate deprecation if non-product |

## Decision Rule
- Any route marked `tbd` must be resolved before Phase 5 final cutover sign-off.

## Phase 5 Notes (2026-02-22)
- Remaining placeholder-backed keep routes:
  - None
- Placeholder-backed `tbd` routes still awaiting deprecation decision:
  - `/demo/*`
  - `/6`
- Known parity caveat:
  - Password reset backend flow still exists only in `src/app.old` auth service/backend usage; rebuilt `auth/forgot-password` now provides an explicit degraded fallback UX until backend support is restored.
