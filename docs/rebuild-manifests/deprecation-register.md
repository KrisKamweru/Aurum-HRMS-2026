# Deprecation Register (Rebuild Program)

Date: 2026-02-21  
Status key: `keep`, `deprecate`, `tbd`

## Route-Level Decisions

| Route | Current purpose | Decision | Notes |
|---|---|---|---|
| `/pending` | Pending user hub and join request management | `keep` | Required onboarding contract |
| `/create-organization` | New org setup wizard | `keep` | Required onboarding contract |
| `/dashboard` | Primary home by role | `keep` | Rebuild shell anchor route |
| `/profile` | Self profile management | `keep` | Employee self-service |
| `/employees` | Employee directory and management | `keep` | Core HR foundational |
| `/employees/:id` | Employee deep profile and HR actions | `keep` | High-risk parity surface |
| `/leave-requests` | Leave request and approval flow | `keep` | Core operational workflow |
| `/attendance` | Employee attendance operations | `keep` | Core operational workflow |
| `/attendance/team` | Manager/admin attendance oversight | `keep` | Includes trust-event review |
| `/core-hr/*` | Lifecycle actions | `keep` | Core module |
| `/organization/*` | Org masters and linking | `keep` | Core module |
| `/payroll*` | Payroll runs/payslips/sensitive approvals | `keep` | Financial high-risk surface |
| `/reports*` | Reporting and analytics | `keep` | MVP-complete module |
| `/recruitment/*` | ATS flows | `keep` | Completed module |
| `/training/*` | Learning flows | `keep` | Completed module |
| `/settings/*` | Org settings and leave policy | `keep` | Core configuration |
| `/super-admin` | Cross-org administration | `keep` | Platform-level capability |
| `/auth/*` | Public authentication entry | `keep` | Required |
| `/demo/*` | UI demo pages | `tbd` | Candidate deprecation if non-product |
| `/6` | Showcase page | `tbd` | Candidate deprecation if non-product |

## Decision Rule
- Any route marked `tbd` must be resolved before Phase 2 archive/cutover activities begin.

