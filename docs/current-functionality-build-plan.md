# Aurum Reset Build Plan

Date: 2026-03-06

## Premise

This plan replaces the earlier parity-oriented rebuild plan.

The new assumption is stricter:

- keep documentation only
- delete all current implementation code
- rebuild the product from first principles
- treat Convex as the primary system to design correctly before feature UI work
- preserve product intent, security requirements, and platform roles, not the current code shape

The only app workstream allowed to outrank Convex is the shared component foundation, because the frontend needs a stable primitive layer before feature screens can be rebuilt.

## Phase 0. Hard Reset

### 0.1 Files To Keep

Keep exactly these tracked file paths:

- `AGENTS.md`
- `ROADMAP.md`
- `DESIGN LANGUAGE.md`
- `ANGULAR BEST PRACTICES.md`
- `CONVEX RULES.md`
- `README.md`
- `convex/README.md`
- `docs/current-functionality-build-plan.md`

Content handling rules for kept files:

- `ROADMAP.md`: keep the file path, wipe the contents, replace later with the new roadmap
- `DESIGN LANGUAGE.md`: keep the file path, wipe the contents, replace later with the new design system guidance
- all other kept files: preserve as-is unless explicitly replaced later

Delete `CLAUDE.md` entirely.

Everything else is disposable.

### 0.2 Files To Delete

Delete all other tracked and untracked implementation artifacts, including:

- all Angular source under `src/`
- all Convex source under `convex/` except `convex/README.md`
- all tests
- all scripts
- all configs and toolchain files that describe the current app shape
- all assets and public files
- all previous rebuild docs and manifests under `docs/` except this file
- all generated test and regression outputs

This is a real reset, not an archive-and-carry-forward exercise.

### 0.3 Convex Dev Deployment Cleanup

Target deployment to wipe:

- dev deployment: `usable-firefly-689`

Do not touch:

- prod deployment: `flippant-anteater-747` (read-only in this session)

### 0.4 Live Dev Data Snapshot

Current dev data observed on 2026-03-06:

- `organizations`: 2
- `users`: 10
- `employees`: 9
- `departments`: 5
- `designations`: 9
- `locations`: 2
- `change_requests`: 33
- `attendance_records`: 6
- `attendance_trust_events`: 2
- `payroll_runs`: 1
- `salary_slips`: 8
- `authAccounts`: 10
- `authSessions`: 304
- `authRefreshTokens`: 304
- `authVerifiers`: 1
- `user_org_permissions`: 0
- `approval_workflows`: 0
- `workflow_instances`: 0
- `workflow_actions`: 0
- `notifications`: 0
- `leave_requests`: 0
- `jobs`: 0
- `applications`: 0
- `training_courses`: 0
- `training_enrollments`: 0
- `tax_regions`: 1
- `tax_rules`: 8

Observed tenant sample:

- orgs include `Aurum Test Org` and `Aurum Test Corp`
- current `super_admin` users are stored as ordinary tenant users
- one `super_admin` is linked to an employee record inside a tenant org

That confirms the current backend is mixing platform identity and tenant identity. The reset should deliberately break that pattern.

### 0.5 Dev Data Reset Decision

Wipe the dev backend completely.

Delete all records from:

- platform and tenant business tables
- auth/session/token tables
- workflow and approval tables
- reporting and notification tables
- seeded tax and statutory config tables
- any storage objects linked to resumes, documents, certificates, or uploads

After the wipe, reseed only what the new architecture requires:

- one platform super-admin account for you
- no tenant orgs by default, or one deterministic fixture tenant pack created by the new seed system

No legacy test data should be migrated.

## What The Reset Must Preserve

The reset is not preserving code, but it is preserving product scope and risk posture.

Must survive into the new architecture:

- multi-tenant HRMS/ERP scope
- outsourced HR / delegated cross-org operations
- strict tenant isolation
- maker-checker and approval workflows for sensitive changes
- payroll and compensation guardrails
- attendance trust review model
- super-admin platform control plane
- rich shared component system
- Angular standalone + signals + modern patterns

## Core Architecture Decisions

## 1. Identity Is Not Membership

The current model collapses too much into `users`.

The rebuild should separate:

- identity
- tenant membership
- delegated access
- platform administration
- active session context

Recommended core tables:

- `users`
- `user_org_memberships`
- `provider_organizations`
- `provider_teams`
- `provider_team_memberships`
- `permission_profiles`
- `delegated_org_grants`
- `grant_approvals`
- `audit_events`
- `access_reviews`
- `support_sessions`
- `platform_role_assignments`

`users` should be identity only. It should not be the source of truth for org authority.

## 2. Super-Admin Is A Platform Role, Not A Tenant Role

The super-admin must not need to belong to a tenant org.

Rules for the rebuild:

- a super-admin is a platform principal
- a super-admin does not need `orgId`
- a super-admin does not need an employee profile
- a super-admin is not automatically a member of every org
- tenant access by a super-admin must happen through an explicit support session or platform action path
- there is no break-glass authorization bypass in the product

Super-admin capabilities:

- create, suspend, archive, and restore tenant orgs
- create provider orgs and provider teams
- manage platform-wide permission profiles and delegated-access templates
- manage statutory/tax packs
- manage feature flags and platform config
- inspect platform telemetry, audit streams, and access reviews
- open time-boxed support sessions into tenant orgs

Support-session rules:

- explicit target org
- explicit reason
- explicit duration
- default read-only unless elevated
- fully audited
- cannot silently masquerade as tenant membership
- cannot grant or extend their own access
- cannot bypass tenant authorization rules; they only create a temporary access context evaluated by the same policy engine

## 2.1 Platform Access Model

The rebuild should use three platform access modes only:

1. `platform_super_admin`
2. `support_session.read_only`
3. `support_session.limited_write`

There is no `break_glass` mode.

### `platform_super_admin`

This role governs the platform, not tenant business data.

Allowed:

- tenant lifecycle management
- provider org and provider team management
- platform configuration
- feature flags
- tax/statutory pack management
- platform audit and telemetry review
- support-session creation requests

Not allowed by default:

- direct employee-data browsing
- payroll data browsing
- compensation visibility
- banking/statutory visibility
- tenant impersonation
- ad hoc cross-org data queries

### `support_session.read_only`

This is the default tenant support mode.

Allowed examples:

- inspect org settings
- inspect permission assignments
- inspect workflow states
- inspect non-sensitive employee metadata
- inspect operational health and processing state
- inspect masked summaries for attendance, payroll, and reporting

Not allowed:

- sensitive field reads unless separately approved by policy
- any data mutation
- any export of sensitive data
- impersonation

### `support_session.limited_write`

This exists for support operations that genuinely require intervention.

Allowed examples:

- fix broken configuration
- retry or repair operational workflows
- correct non-sensitive metadata where policy permits
- assist with delegated-access and membership problems

Not allowed:

- payroll finalization
- compensation changes
- banking-detail changes
- statutory-ID changes
- document deletion
- audit-log modification
- permission self-escalation
- extending the same session beyond policy

### Support Session Rules

Every support session must be:

- single-org scoped
- time-boxed
- reason-coded
- ticket-linked
- customer-visible in audit history
- fully attributed to the real actor
- terminated automatically at expiry

Recommended session policy:

- `read_only`: short-lived, optionally auto-approved under tenant policy
- `limited_write`: stronger approval and shorter lifetime

### Tenant Approval Policy

Each tenant should choose one of these policies:

- `notify_only`
- `approval_required`

Policy should be configurable separately for:

- read-only support access
- limited-write support access
- sensitive-data visibility during support

### Sensitive Data Policy

Support access should classify data into bands:

1. operational metadata
2. standard tenant data
3. sensitive HR data
4. restricted financial/identity data

Support sessions should not automatically unlock all bands.

Default recommendation:

- read-only support can access 1 and limited parts of 2
- limited-write support can modify only approved subsets of 2
- 3 and 4 require explicit tenant policy and stronger approval

### Explicitly Forbidden Platform Capabilities

The rebuild should not include:

- any universal authorization bypass
- any all-org support session
- permanent standing tenant-data access for platform admins
- hidden impersonation
- silent support access
- self-approved support elevation
- unrestricted raw database browsing from support tools

## 3. Outsourced HR Must Be A First-Class Authorization Model

Do not implement outsourced HR as a user allow-list array.

Use explicit grant records with:

- provider org
- provider team
- client org
- permission profile
- scope restrictions
- effective dates
- approval state
- revocation state

Permissions must be capability-based, not role-label based.

Examples:

- `employee.read`
- `employee.write`
- `leave.manage`
- `attendance.manage`
- `payroll.read`
- `payroll.run`
- `compliance.manage`
- `reports.read`
- `org.settings.manage`

Scope must also be explicit:

- all employees
- selected departments
- selected legal entities
- exclude executives
- exclude compensation
- no settings access
- read-only

## 4. Every Request Acts In One Org Context

Every request must resolve an explicit `actingOrgId`.

Authorization flow for every Convex function:

1. authenticate user
2. resolve platform role if applicable
3. resolve requested `actingOrgId`
4. verify direct membership, delegated grant, or support-session access
5. verify the required permission
6. verify every referenced record belongs to the acting org unless the workflow explicitly models cross-org linkage
7. audit the action

No function should trust `activeOrgId ?? orgId` from a user document as a security boundary.

## 5. Public Convex Surface Must Be Thin

Public Convex functions should:

- validate args
- validate returns
- resolve auth and org context
- call internal orchestration helpers

Internal helpers should contain shared business logic and invariant checks.

This is necessary to eliminate the fragmented authorization patterns currently scattered across the backend.

## 6. Data Access Must Be Index-First

The reset should not carry forward scan-heavy patterns.

Rules:

- no broad `collect()` for operational lists
- no critical filtering in JavaScript after a weak index read
- paginate all non-trivial list queries
- use summary/materialized tables for dashboard and reporting workloads
- add indexes for actual access paths, not idealized ones

## Current Backend Lessons To Carry Forward

These are the concrete issues the rebuild must close:

- current notification creation is too open
- current leave-request handling allows bad cross-org linkage
- many writes trust foreign IDs without same-org validation
- org/auth resolution is duplicated and inconsistent
- several queries swallow errors and return fake empty states
- schema and function validation discipline is too weak
- reports, attendance, and super-admin flows overuse scan/filter patterns
- current super-admin records are tenant-bound when they should be platform-bound
- current multi-org support is not backed by actual membership/delegation data

## Rebuild Order

## Phase 1. Workspace Bootstrap

Recreate the minimum viable project skeleton after the reset:

- fresh Angular workspace and app shell scaffolding
- fresh Convex project scaffolding
- package manager and scripts
- lint, test, and build configuration
- environment/config handling
- CI baseline and coverage gates
- artifact and seed script structure

This phase exists because phase 0 intentionally deletes the current toolchain along with the app code. No feature or component work should start until the new workspace is buildable and testable.

## Phase 2. Shared Component Spine

Build only the primitive layer needed to support everything else:

- design tokens and app shell primitives
- button
- form field
- input controls
- modal
- confirm dialog
- stepper
- toast
- table
- empty/error/loading states
- navigation primitives

This phase is not about feature pages. It is about creating the visual and interaction contract all rebuilt screens will use.

## Phase 3. Convex Platform Control Plane

Build the backend foundation before tenant features:

- identity model
- platform role model
- super-admin model
- support-session model
- audit-event model
- error model
- permission profile model
- tenant support-approval policy model
- sensitive-data classification model

Deliverables:

- canonical auth helpers
- canonical permission helpers
- canonical org-context helpers
- canonical audit writer
- typed error surface
- support-session policy engine
- support-session audit surface

## Phase 4. Convex Tenant Access Model

Build the tenant access backbone:

- `user_org_memberships`
- provider org/team model
- delegated grant model
- grant approvals
- access reviews

Deliverables:

- direct membership checks
- delegated access checks
- support-session checks
- scope evaluation engine
- expiry and revocation handling

This phase closes the outsourced-HR problem correctly.

## Phase 5. Convex Organization And People Core

Rebuild the tenant data model with strict invariants:

- organizations
- departments
- designations
- locations
- employees
- employee details
- org settings
- leave policies

Rules:

- every tenant-owned record has `orgId`
- every foreign ID is validated against `actingOrgId`
- optimistic concurrency is designed in where needed

## Phase 6. Convex Daily Operations

Rebuild the operational modules in this order:

1. onboarding and org creation
2. leave
3. attendance
4. attendance trust review
5. notifications
6. recruitment
7. training

Requirements:

- tenant-safe self-service
- tenant-safe manager/admin workflows
- delegated operator support where explicitly allowed
- no public privileged mutations without permission checks
- external or applicant-facing flows must be isolated from tenant-admin flows
- training enrollment and course-management permissions must be distinct

## Phase 7. Convex Sensitive HR And Payroll

Rebuild high-risk modules next:

1. compensation and employee financial controls
2. change requests and maker-checker
3. payroll runs
4. payslips
5. core HR lifecycle actions
6. compliance services
7. workflow engine

Requirements:

- approval-aware flows
- anti-self-approval where applicable
- required reasons on destructive or sensitive actions
- full audit coverage
- explicit permission separation for payroll read vs payroll run vs payroll approval

## Phase 8. Convex Reporting And Admin Services

Rebuild the read-heavy and platform-heavy backend services:

1. reports
2. analytics and canonical metrics
3. report scheduling and delivery
4. super-admin platform APIs
5. provider-admin APIs
6. dashboard summary services

Requirements:

- summary tables where appropriate
- pagination everywhere
- platform vs tenant boundaries kept explicit

## Phase 9. Angular Shell And Access Flows

Only after the Convex model is stable:

- app shell
- auth flows
- org-context UX
- support-session UX for super-admin
- provider/delegated-access UX
- profile
- pending/join/create-org flows

## Phase 10. Angular Feature Rebuild

Rebuild feature UIs against the new Convex contracts in this order:

1. organization masters
2. employees
3. settings
4. leave
5. attendance
6. payroll
7. core HR lifecycle
8. reports
9. recruitment
10. training
11. super-admin control plane
12. dashboard

Notification shell wiring and workflow admin screens should only be added after the backend contracts are stable.

## Phase 11. Seed, Test, And Cutover

Build deterministic seed packs for:

- platform super-admin bootstrap
- single-tenant baseline org
- provider-org with delegated access to a client org
- payroll-ready org
- attendance-trust org

Then add test gates:

- tenant isolation tests
- delegated access tests
- support-session tests
- super-admin platform tests
- approval workflow tests
- payroll negative-path tests
- reporting performance tests

Only after those pass should broader frontend polish begin.

## Dev Cleanup Plan

When the reset starts, wipe the dev deployment in this order:

1. storage objects
2. auth tables
3. workflow and audit derivative tables
4. tenant business tables
5. tax/statutory seed tables
6. platform tables introduced during transition

Then apply the new schema and seed only the new baseline fixtures.

The current dev data is useful only as evidence of design problems, not as migration input.

## Acceptance Criteria For The Reset

- repo contains only the retained docs before rebuild work begins
- dev Convex deployment is empty except for intentional new bootstrap data
- super-admin exists as a platform role without tenant membership requirements
- there is no break-glass or universal authorization-bypass path
- all tenant access by platform operators happens through explicit support sessions
- outsourced HR is implemented through explicit delegated grants, not ad hoc org lists
- every backend mutation validates org ownership of referenced records
- every public Convex function has arg and return validators
- no module defines its own auth model independently
- no critical list/report path relies on scan-first access patterns
- high-risk HR and payroll actions are approval-aware and audited

## Bottom Line

The rebuild is no longer a parity port of the current app.

It is a controlled restart with these priorities:

1. shared component primitives
2. enterprise-grade Convex authorization and data model
3. platform super-admin and delegated outsourced-HR support
4. strict tenant-safe business workflows
5. feature UI rebuild on top of those contracts

That is the only path that fixes the current cross-org weaknesses without sacrificing the outsourced-HR requirement.
