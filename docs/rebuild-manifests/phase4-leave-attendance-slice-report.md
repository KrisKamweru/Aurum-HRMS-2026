# Phase 4 Leave + Attendance Slice Report

Date: 2026-02-21  
Status: Completed for baseline leave and attendance rebuild

## Scope
- Replace placeholder route surfaces for leave and attendance with rebuilt pages.
- Add typed data/store orchestration for leave workflows and attendance trust-aware flows.
- Preserve baseline parity for personal and team attendance operations.

## Delivered Routes
- `/leave-requests` -> `src/app/features/leave/pages/leave-requests-rebuild.component.ts`
- `/attendance` -> `src/app/features/attendance/pages/attendance-rebuild.component.ts`
- `/attendance/team` -> `src/app/features/attendance/pages/team-attendance-rebuild.component.ts`

## Delivered Functionality
- Leave requests:
  - request creation with modal dynamic-form stepper flow
  - role-aware employee selection (manager/admin vs self-service submitter)
  - pending request actioning: approve, reject (reason required), cancel
- Personal attendance:
  - clock in/out actions with trust-error handling (`reason_required`, held/denied messaging)
  - current-day status card + monthly summary + 30-day history table
- Team attendance:
  - daily team roster status table
  - manual attendance correction flow (multi-step modal form)
  - held trust events queue with approve/reject review actions

## Convex API Surface Used
- `users.viewer`
- `leave_requests.list`
- `leave_requests.create`
- `leave_requests.updateStatus`
- `attendance.getTodayStatus`
- `attendance.getMyAttendance`
- `attendance.getAttendanceSummary`
- `attendance.clockIn`
- `attendance.clockOut`
- `attendance.getTeamAttendance`
- `attendance.manualEntry`
- `attendance.listHeldTrustEvents`
- `attendance.reviewHeldTrustEvent`
- `employees.list`

## Test Coverage Added
- `src/app/features/leave/data/leave-requests-rebuild.data.service.spec.ts`
- `src/app/features/leave/data/leave-requests-rebuild.store.spec.ts`
- `src/app/features/leave/pages/leave-requests-rebuild.component.spec.ts`
- `src/app/features/attendance/data/attendance-rebuild.data.service.spec.ts`
- `src/app/features/attendance/data/attendance-rebuild.store.spec.ts`
- `src/app/features/attendance/pages/attendance-rebuild.component.spec.ts`
- `src/app/features/attendance/pages/team-attendance-rebuild.component.spec.ts`
- `src/app/app.routes.spec.ts` (route parity updates)

## Carry-Forward Parity Backlog (Leave + Attendance Domain)
- Attendance trust-policy administration UX (`attendance.getTrustPolicy`, `attendance.upsertTrustPolicy`).
- Expanded trust-event investigation surfaces (`attendance.listTrustEvents` with filters).
- Team manual-entry guardrails for richer validation and reason-code presets.
- Leave balance preview UI before submit (policy-entitlement insight preflight).
