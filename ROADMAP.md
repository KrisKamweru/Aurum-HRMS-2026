# Aurum HRMS Roadmap

## Project Vision
Aurum HRMS is a modern, comprehensive, and scalable **SaaS** Human Resource Management System. Built with the latest web technologies (Angular 21 & Convex), it aims to streamline HR operations through real-time data synchronization, intuitive user experiences, and robust automation.

## Technical Architecture
- **Frontend**: Angular 21 (Standalone Components, Signals, Control Flow)
- **Backend/Database**: Convex (Real-time database, Server functions, Auth)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest (Unit), Playwright (E2E)
- **State Management**: Signals + Convex Reactivity
- **Multi-tenancy**: Native support via Convex schema organization (by `organizationId`)
- **Design System**: See `SHOWCASE-6-DESIGN.md` for the canonical visual language and Tailwind component patterns.

## Current Status
**Completed Modules:**
- ✅ **Authentication**: Login, Register, Forgot Password, RBAC.
- ✅ **Dashboard**: Role-based views (Admin vs Employee).
- ✅ **Core HR**: Departments, Designations, Locations, Full Employee Profile.
- ✅ **Lifecycle Events**: Promotions, Transfers, Awards, Warnings, Complaints, Resignations, Terminations, Travel.
- ✅ **Leave Management**: Full workflow with balances and accruals.
- ✅ **Time & Attendance**: Manual clock-in/out, team view, manual entry/correction.
- ✅ **Payroll**: Semi-automatic processing, salary slip generation, credits/debits, Kenya tax rules.
- ✅ **Tax Configuration**: Extensible region-based tax system (Kenya 2024 active).
- ✅ **Recruitment (ATS)**: Job postings, candidate pipeline, applications.
- ✅ **Training**: Course catalog, enrollments, completion tracking.
- ✅ **Settings**: Organization settings, leave policies.
- ✅ **System**: Notifications, Dark Mode, Form Prerequisites.

**Pending MVP Items:**
- ✅ **Basic Reports**: List views and exportable CSV flows completed.

---

## Completed Work Summary (Condensed)
The following backlog themes are complete and now tracked in git history rather than maintained as long in-file checklists:
- Security baseline: maker-checker, anti-self-approval, irreversible-action confirmation UX, sensitive-change audit trail.
- Payroll/pay-data hardening: role boundaries validated, negative-path auth coverage added, compensation and adjustment flows implemented.
- Form/design system upgrades: dynamic multi-column + stepper support, key flow migrations, grid/table/tailwind unification.
- Quality gates and MVP closeout: build green, role/pay audits integrated, basic attendance/payroll reporting and CSV exports completed.
- Backlog hygiene: older checklist docs demoted/archived to reduce duplicate planning surfaces.

---

## Platform Execution Plan (Prioritized)
This section is the active sequencing guide and supersedes ad-hoc backlog ordering.

### P-1. Full Frontend Rebuild Reset Program (Planned)
Status: Planned on 2026-02-21.  
Reference: `docs/rebuild-parity-plan.md`

- Objective:
  - Archive the current frontend as legacy (`.old`) and rebuild from a clean structure while preserving functional/security parity.
- Guardrails:
  - No route, role rule, or critical mutation flow is removed without explicit deprecation tracking.
  - Legacy archive must be excluded from active TypeScript compile and test runs.
- Delivery phases:
  - Phase 1: parity manifests (routes, guards, API usage, role matrix, high-risk flow map).
  - Phase 2: archive current frontend to `.old`.
  - Phase 3: rebuild shell + auth/guard/org-context foundations.
  - Phase 4: rebuild modules in dependency order (org/people -> attendance/leave -> payroll -> core HR -> recruitment/training -> reports -> super admin).
  - Phase 5: parity gates and cutover.
- Required cutover gates:
  - Route parity complete (or explicit deprecation entries approved).
  - API parity complete for all currently used frontend Convex calls.
  - Security parity complete (`negative-auth`, `compensation-security`, attendance/payroll regression paths).
- Progress update (2026-02-21):
  - Phase 1 parity manifests generated under `docs/rebuild-manifests/`:
    - `README.md`
    - `functionality-index.md`
    - `route-role-matrix.md`
    - `high-risk-flow-map.md`
    - `deprecation-register.md`
    - generated inventories: `api-usage-summary.csv`, `api-usage-by-file.csv`, `route-guard-snapshot.txt`, `convex-function-surface.csv`
  - Phase 2 archive completed:
    - legacy frontend moved to `src/app.old/`
    - new clean shell created in `src/app/`
    - compile/test isolation set via `tsconfig.app.json` and `tsconfig.spec.json` excludes
    - execution report: `docs/rebuild-manifests/phase2-archive-report.md`
  - Phase 3 foundation started:
    - rebuild router now maps legacy path surface in the new shell using placeholder pages
    - route contract test added in `src/app/app.routes.spec.ts`
  - Phase 3 foundation progress (auth/routing baseline):
    - auth session service and role/auth guards added in `src/app/core/auth/`
    - login bootstrap route added (`src/app/features/auth/login/login.component.ts`)
    - role-aware guard mapping applied to rebuilt route matrix (`src/app/app.routes.ts`)
    - vitest active-scope exclusion added for archive path (`vitest.config.ts`)
    - report: `docs/rebuild-manifests/phase3-foundation-report.md`
  - Phase 4 organization module expansion:
    - rebuilt pages mapped for `organization/departments`, `organization/designations`, `organization/locations`, and `organization/user-linking`
    - shared in-memory organization rebuild store added for cross-page scaffold state
    - add/remove interactions implemented with TDD coverage for store + organization rebuild pages
    - report: `docs/rebuild-manifests/phase4-organization-slice-report.md`

### P0. Immediate Stabilization and Context Hygiene (Now)
Status: Substantially completed on 2026-02-09.
- [x] Ensure seeded environments are payroll-ready:
  - compensation fields (`baseSalary`, `currency`, `payFrequency`) present for seeded employees
  - idempotent compensation backfill when test org already exists
- [x] Reduce Markdown/doc sprawl to keep active context minimal:
  - canonical docs retained (`README`, `ROADMAP`, `CLAUDE`, Design docs, `convex/README`)
  - non-essential status/checklist markdown artifacts removed
- [ ] Optional follow-up: final pass to archive or remove stale non-Markdown generated artifacts if needed

### P1. Reliability and Regression Safety (Highest Product Risk)
- Expand automated coverage for high-risk flows:
  - payroll calculations and finalization
  - maker-checker approvals and anti-self-approval
  - leave and attendance edge cases
  - cross-role and cross-org negative authorization paths
- Define risk-based quality gates for critical modules before release.
- Execute a Tailwind-first custom CSS elimination sweep (one-time hardening pass):
  - audit all Angular components for inline `styles` blocks and component stylesheet files
  - migrate component-local styling to Tailwind utilities/design tokens in templates
  - keep only explicitly justified exceptions (rare cases like print-only rules or unavoidable third-party overrides)
  - Definition of done: every component has empty `styles` and empty component stylesheet content (or is on the explicit exception list)
- Run an overflow-containment UX hardening sweep (tables, containers, modals):
  - prevent child overflow from forcing page-level horizontal scroll
  - ensure wide tables/grid content scroll within their owning container (`overflow-x-auto` at the correct boundary)
  - ensure modals cap height to viewport and scroll internally instead of overflowing the page
  - Definition of done: no unintended global horizontal scroll at supported breakpoints; modals remain fully usable with internal vertical scrolling on short viewports
- Progress update (2026-02-09): visual regression workflow, multi-profile baseline, and comparison tooling added.
- Progress update (2026-02-10): hotspot hardening pass completed for table/modal/dialog/payslip/recruitment board; `npm run build` and `npm run ci:security` passing.

**Audit Heatmaps (2026-02-09)**

1. Tailwind-first custom CSS elimination sweep
- Current footprint: `23` component style references (`styles` / `styleUrl`) in `src/app` after the 2026-02-10 hotspot pass (down from `28`).
- Distribution:
  - `features`: `14`
  - `shared`: `12`
  - `layouts`: `1`
  - `app root`: `1` (currently empty `app.css`)
- Hotspots to tackle first:
  - `src/app/shared/components/ui-data-table/ui-data-table.component.ts`
  - `src/app/shared/components/ui-modal/ui-modal.component.ts`
  - `src/app/shared/components/ui-confirm-dialog/ui-confirm-dialog.component.ts`
  - `src/app/features/payroll/payslip-view.component.ts`
  - `src/app/features/recruitment/components/candidate-board/candidate-board.component.ts`
- Hotspot status (2026-02-10):
  - `src/app/shared/components/ui-data-table/ui-data-table.component.ts`: `done` (component-local styles removed; Tailwind overflow boundary retained).
  - `src/app/shared/components/ui-modal/ui-modal.component.ts`: `done` (component-local styles removed; viewport-capped modal with internal scroll).
  - `src/app/shared/components/ui-confirm-dialog/ui-confirm-dialog.component.ts`: `done` (component-local styles removed; viewport-capped dialog with internal scroll).
  - `src/app/features/payroll/payslip-view.component.ts`: `done` (migrated to Tailwind utility classes; local stylesheet removed).
  - `src/app/features/recruitment/components/candidate-board/candidate-board.component.ts`: `done` (local scrollbar CSS removed; detail modal overflow hardened).

2. Overflow-containment sweep (tables, containers, modals)
- `ui-data-table` usage audit: `24` files found, only `2` explicitly wrapped with `overflow-x-auto`, `22` require boundary review.
- Missing-wrapper hotspot groups:
  - `core-hr`: `8`
  - `features-other`: `8`
  - `organization`: `3`
  - `reports`: `3`
- Custom modal/overlay hotspot files (non-`ui-modal`) needing viewport-height/internal-scroll verification:
  - `src/app/shared/components/ui-confirm-dialog/ui-confirm-dialog.component.ts`
  - `src/app/features/recruitment/components/candidate-board/candidate-board.component.ts`
- Next checkpoint action: continue overflow wrapper verification across all `ui-data-table` embedding pages and record each page as `done` / `exception`.

**Plan-Wide Audit Snapshot (2026-02-09)**

1. `P0` Immediate stabilization/context hygiene
- Status: mostly complete.
- Evidence: seed compensation/backfill implemented; markdown context reduced and canonical docs retained.

2. `P1` Reliability/regression safety
- Status: in progress.
- Evidence: visual regression workflow + baseline in place; CSS and overflow heatmaps now tracked.

3. `P2` Compliance/data governance
- Status: baseline completed.
- Evidence: `change_requests` + sensitive change controls exist.
- New artifacts (2026-02-10):
  - `convex/compliance.ts` (audit export, access review snapshot, retention preview/purge controls)
  - `docs/COMPLIANCE-BASELINE.md` (retention, PII handling, backup/restore drill, incident workflow)
- Gaps: retention/backup drills still require environment-specific runtime scheduling in hosted production.

4. `P3` Multi-org operator model
- Status: baseline completed.
- New artifacts (2026-02-10):
  - `convex/schema.ts` adds optional `users.activeOrgId` for active-org context.
  - `convex/org_context.ts` adds `getOrganizationContext` and `setActiveOrganization`.
  - `convex/onboarding.ts` now sets `activeOrgId` when org membership is established.
  - `src/app/core/services/org-context.service.ts` + `src/app/layouts/main-layout/main-layout.component.*` add active-org switcher UX in desktop/mobile layout.
  - Core backend viewer helpers now resolve org context from `activeOrgId ?? orgId` to reduce single-org coupling during migration.
- Gaps: remaining low-risk modules still use legacy helper patterns and should be consolidated onto shared org-membership helper.

5. `P4` Attendance trust hardening (soft geofence/device signals)
- Status: Phase A/B/C baseline completed.
- New artifacts (2026-02-10):
  - `convex/schema.ts` adds `attendance_trust_events` and `attendance_trusted_devices`.
  - `convex/attendance.ts` captures observe-only trust signals on `clockIn`, `clockOut`, and `manualEntry`.
  - `convex/attendance.ts` adds `listTrustEvents` for manager/admin review surfaces.
  - `src/app/core/services/attendance-trust.service.ts` + attendance screens now send trust signals (device hash + user-agent hash + optional geolocation) into capture pipeline.
- Gaps: org-level policy administration UI can be expanded with map-driven geofence editing.

6. `P5` Workflow engine maturity
- Status: baseline completed.
- Evidence: maker-checker and approval/rejection flows exist for sensitive payroll changes.
- New artifacts (2026-02-10):
  - `convex/schema.ts` adds `approval_workflows`, `workflow_instances`, and `workflow_actions`.
  - `convex/workflow_engine.ts` adds workflow definition, instance start, action routing, and timeline query APIs.
- Gaps: escalation notifications can be extended to external channels.

7. `P6` Reporting/analytics foundation
- Status: baseline completed.
- Evidence: attendance/payroll/tax reports exist; report surface mentions scheduled delivery.
- New artifacts (2026-02-10):
  - `convex/schema.ts` adds `report_schedules` and `report_delivery_logs`.
  - `convex/reporting_ops.ts` adds schedule CRUD/toggle and delivery-log APIs.
- Gaps: scheduled delivery transport adapters (email/webhook) can be extended beyond current audit-log artifacts.

8. `P7` Platform operations/documentation
- Status: baseline completed.
- Evidence: roadmap and backend docs are now cleaner.
- New artifacts (2026-02-10):
  - `docs/PLATFORM-OPERATIONS-RUNBOOK.md` (SLOs, release gates, triage flow, alert priorities)
  - `docs/ROADMAP-EXECUTION-TRACKS.md` (P3-P6 executable tracks)
- Gaps: environment route values require final production target values and owner assignment.

### P2. Compliance and Data Governance Baseline
- Formalize and enforce:
  - audit log retention and exportability
  - PII handling policy and access logging
  - backup/restore and disaster-recovery drills
  - incident response and access review workflow

### P3. Multi-Org Operator Model (Outsourced HR Requirement)
- Move from single-org user binding to membership-based access:
  - user can belong to multiple organizations with org-scoped roles
  - explicit active-organization context in app session
  - organization switcher UX with clear current-org indicator
- Re-scope backend auth checks to membership + active org context.
- Add regression tests for cross-org data isolation and role boundaries.

### P4. Attendance Trust Hardening: Soft Geofencing + Browser/Device Signals
- Implement context-aware attendance trust as a phased rollout.
- Treat browser/device identity as a risk signal (not identity proof) and combine with location and behavior telemetry.

**Phase A - Observe-only**
- Capture geolocation, coarse IP/network metadata, and browser/device fingerprint telemetry.
- Compute trust/risk score without blocking punches.
- Build manager/admin review view and baseline false-positive rates.

**Phase B - Warn and Require Reason**
- Show user-facing warnings for suspicious punches:
  - outside configured radius
  - new/untrusted browser/device
  - impossible travel patterns
- Require reason codes for flagged punches.
- Route flagged events to supervisor queue with full audit trail.

**Phase C - Policy-Enforced Controls**
- Enable org-configurable enforcement policies:
  - allow with manager override
  - temporary hold for review
  - deny by policy for high-risk events
- Add exception workflows, SLA/escalation handling, and compliance reporting.

### P5. Workflow Engine Maturity
- Move from static role checks to configurable approval chains:
  - delegation
  - escalation rules
  - SLA-aware approval routing

### P6. Reporting and Analytics Foundation
- Standardize canonical metrics and reporting models:
  - headcount
  - attrition
  - payroll variance
  - leave liability
- Add scheduled exports and role-safe distribution.

### P7. Platform Operations and Documentation
- Define service-level objectives, alerting, and release criteria.
- Keep architecture, security model, and release playbooks current and actionable.

---

## Strategic Roadmap

### 🚧 Foundations (Cross-Cutting Concerns)
*These elements are developed continuously alongside feature releases.*
- ✅ **Multi-tenancy**: Ensure all data queries are scoped to the active Organization.
- ✅ **RBAC (Role-Based Access Control)**: Phase 1 (MVP) complete.
- ✅ **Security**: Row-level security policies in Convex.

---

### 🚀 MVP Release: Core HR & Essential Functions
**Objective**: Establish the system foundation and deliver essential HR functionalities to allow early adoption.

#### 1. Core HR Operations ✅ DONE
- **Lifecycle Events**: Promotion, Award, Travel, Transfer, Resignations, Complaints, Warnings, Terminations.
- **Data Models**: Create schemas for tracking these events against employee records.

#### 2. Info Modules (Enhancement of Current State) ✅ DONE
- **Organization**: Polish Company, Department, and Location management.
- **Employees**: Complete the "Hire to Retire" basic data entry (Personal info, Banking, Emergency contacts).

#### 3. Leave Management ✅ DONE
- **Workflow**: Request submission, Manager approval/rejection, Cancellation.
- **Balances**: Tracking leave entitlements and consumption.

#### 4. Time and Attendance (Basic) ✅ DONE
- **Manual Entry**: Simple clock-in/clock-out or timesheet entry interface.
- **Tracking**: Basic daily/weekly logs.
- *Note*: No hardware integrations in this phase.

#### 5. Payroll (Semi-Automatic) ✅ DONE
- **Processing**: Interface for HR to manually input variable pay/deductions.
- **Calculation**: Config-driven tax engine with Kenya 2024 rules (PAYE, NSSF, NHIF, Housing Levy).
- **Tax System**: Extensible architecture supporting multiple regions via database configuration.
- **Output**: Salary slip generation with earnings, deductions, and employer contributions.

#### 6. Basic Reports ✅ DONE
- **Scope**: Simple list views and exportable CSVs for Attendance logs and Payroll history.

---

### 📦 Release 1: Enhancements & Integration
**Objective**: Expand input methods and broaden the functional scope to Talent Acquisition and Development.

#### 1. Advanced Time & Attendance
- **Biometric Integration**: API endpoints to receive data from hardware devices.
- **Web Attendance**: Browser-based clock-in with IP restriction.
- **Geo-fencing**: Mobile/Browser location check for remote workers.
- **Soft Geofencing + Browser/Device Trust Signals**:
  - Phase A: Observe-only risk scoring and telemetry capture.
  - Phase B: User warnings + reason codes + supervisor review queue.
  - Phase C: Org-configurable policy enforcement with overrides/escalations.

#### 2. Recruitment (ATS) ✅ DONE (Ahead of Schedule)
- **Job Board**: Internal/External job posting management.
- **Candidate Pipeline**: Kanban view for tracking applicants.

#### 3. Training & Development ✅ DONE (Ahead of Schedule)
- **Management**: Course catalog and scheduling.
- **History**: Tracking employee completion and attendance.

#### 4. Enhanced Reporting
- **Analytics**: Visual dashboards for Recruitment stats (Time-to-hire) and Employee Performance trends.

---

### ⚙️ Release 2: Advanced Features & Automation
**Objective**: Reduce manual HR workload through intelligent automation and integrations.

#### 1. Automated Payroll
- **Integration**: Auto-calculate salary based on verified Attendance data (Lates, Overtime, Absences).
- **Accounting**: Export/Sync to external accounting software (e.g., Xero, QuickBooks).

#### 2. Performance Management
- **Appraisals**: Review cycles (Self, Manager, 360).
- **Goals**: OKR/KPI setting and progress tracking.

#### 3. Intelligent Scheduling
- **Rostering**: Automated shift scheduling based on rules/availability.
- **Calculations**: Auto-computation of Overtime and Leave Balances based on accrual rules.

#### 4. HR Calendar
- **Visualization**: Company holidays, Leave, Birthdays, and Events in a unified view.
- **Notifications**: Automated alerts for upcoming events.

---

### 🛠️ Release 3: Extended Functionality & Customization
**Objective**: Enterprise-readiness through deep customization and compliance tools.

#### 1. Advanced Customization (RBAC+)
- **Custom Fields**: Allow admins to add fields to Employee/Job profiles.
- **Dynamic Roles**: UI for defining custom permission sets (granular access control).
- **Workflows**: Configurable approval chains.

#### 2. Extended Training
- **LMS Integration**: Connection to external Learning Management Systems.
- **Certifications**: Expiry tracking and renewal reminders.

#### 3. Advanced Payroll
- **Flexibility**: Multiple payroll cycles (Weekly, Bi-weekly, Monthly).
- **Compliance**: Automated statutory reporting and compliance checks.

#### 4. Report Builder
- **Customization**: Drag-and-drop report creator for ad-hoc analysis.
- **Automation**: Scheduled report email delivery.

---

### ✨ Release 4: Final Features & Polishing
**Objective**: Complete the suite with employee engagement and project tracking tools.

#### 1. Helpdesk / Support
- **Ticketing**: Employee-to-HR query system with categories and status tracking.

#### 2. Events & Meetings
- **Management**: Company-wide event planning, RSVPs, and calendar invites.

#### 3. Project Management (Lite)
- **Tracking**: Basic project assignment and time allocation for billable hours.

#### 4. Comprehensive Analytics Suite
- **Data Export**: Full system export capabilities.
- **Insights**: AI-driven insights into attrition, engagement, and costs.

---

## Historical Notes (Condensed)
- Completed implementation details, old sprint logs, and historical gap audits have been intentionally condensed.
- The active source of truth is:
  1. `Platform Execution Plan (Prioritized)` for near/mid-term execution.
  2. `Strategic Roadmap` for release-level scope.
- Historical detail remains available in commit history and archived docs where needed.
