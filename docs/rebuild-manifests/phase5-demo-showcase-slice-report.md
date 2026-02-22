# Phase 5 Demo/Showcase Cutover Slice Report

Date: 2026-02-22

## Scope
- Resolved final route-level `tbd` decisions for:
  - `demo/*` (retain, rebuild)
  - `/6` (retain, 1:1 showcase port)
- Replaced placeholder-backed demo/showcase routes in active router.

## Delivered
- Added rebuilt nested demo route module:
  - `src/app/features/demo/demo.routes.ts`
  - `src/app/features/demo/demo-shell.component.ts`
- Added rebuilt demo pages on active shared components:
  - `src/app/features/demo/pages/buttons-demo.component.ts`
  - `src/app/features/demo/pages/forms-demo.component.ts`
  - `src/app/features/demo/pages/tables-demo.component.ts`
  - `src/app/features/demo/pages/modals-demo.component.ts`
  - `src/app/features/demo/pages/date-picker-demo.component.ts`
- Added `/6` retained showcase port (1:1 legacy design reference with Angular 21 compliance updates):
  - `src/app/features/showcase/design-six.component.ts`
- Updated route contracts in:
  - `src/app/app.routes.ts`
  - `src/app/app.routes.spec.ts`
- Removed obsolete placeholder route helper usage from active router setup.

## Notes
- `demo/*` pages intentionally use local state (including local `ui-toast` message arrays) instead of the legacy `ToastService`, which is not part of the rebuilt active scope.
- `/6` is retained as a design reference route and intentionally preserves legacy inline styling structure for 1:1 visual parity.

## Tests
- Added:
  - `src/app/features/demo/demo.routes.spec.ts`
  - `src/app/features/demo/demo-shell.component.spec.ts`
  - `src/app/features/demo/pages/buttons-demo.component.spec.ts`
  - `src/app/features/demo/pages/forms-demo.component.spec.ts`
  - `src/app/features/demo/pages/tables-demo.component.spec.ts`
  - `src/app/features/demo/pages/modals-demo.component.spec.ts`
  - `src/app/features/demo/pages/date-picker-demo.component.spec.ts`
  - `src/app/features/showcase/design-six.component.spec.ts`
- Updated:
  - `src/app/app.routes.spec.ts`

## Validation
- Targeted demo/showcase + route specs passed (`28` tests).
- `npm run build` passed.
- `npm test` passed (`101` files, `397` tests).
- Existing expected stderr remains in full suite from organization store negative-path test: `Convex unavailable`.
- Existing benign mocked fallback stderr object (`{}`) remains in onboarding fallback test.

## Phase 5 Route Decision Status (Post-slice)
- Route-level `tbd` decisions: resolved.
- Placeholder-backed keep routes: none.
- Remaining parity caveat:
  - Password reset backend flow remains unavailable in rebuilt auth backend surface; `auth/forgot-password` uses explicit degraded fallback messaging.
