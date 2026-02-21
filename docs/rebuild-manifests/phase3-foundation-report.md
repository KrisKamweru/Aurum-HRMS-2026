# Phase 3 Foundation Report

Date: 2026-02-21  
Status: In progress (auth/routing baseline upgraded to real Convex session bridge)

## Summary
Phase 3 foundation now includes a real Convex-backed auth session bridge, route guards that wait for auth readiness, and restored role-aware route mapping in the rebuilt shell.

## Implemented
- Convex client/auth bridge:
  - `src/app/core/services/convex-client.service.ts`
  - token persistence + restore
  - `auth:signIn` / `auth:signOut` integration for password/OAuth-capable flows
- Auth session model:
  - `src/app/core/auth/auth.types.ts`
  - `src/app/core/auth/auth-session.service.ts`
  - `users.viewer` subscription + refresh support
  - readiness wait helper for guard-safe resolution
- Guard contracts:
  - `src/app/core/auth/auth.guard.ts`
  - `src/app/core/auth/role.guard.ts`
- Rebuild auth entry:
  - `src/app/features/auth/login/login.component.ts`
  - role-picker scaffold replaced with email/password sign-in form
- Route matrix wiring:
  - `src/app/app.routes.ts`
  - role guards applied across payroll/reports/core-hr/organization/recruitment/etc.
  - auth guard applied to protected routes
  - pending-user redirect contract preserved

## Tests Added (TDD)
- `src/app/core/auth/auth-session.service.spec.ts`
- `src/app/core/auth/auth.guard.spec.ts`
- `src/app/core/auth/role.guard.spec.ts`
- `src/app/features/auth/login/login.component.spec.ts`
- existing route/placeholder shell tests retained:
  - `src/app/app.routes.spec.ts`
  - `src/app/features/placeholder/placeholder-page.component.spec.ts`
  - `src/app/features/rebuild-home/rebuild-home.component.spec.ts`

## Test Infrastructure Update
- Added `jsdom` to dev dependencies to satisfy Vitest environment.
- Updated `vitest.config.ts` to exclude `src/app.old/**` from active test discovery.

## Validation
- `npm run build` passed.
- `npm run test` passed (`32` files, `89` tests).
