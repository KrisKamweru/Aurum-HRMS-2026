# Rebuild Phase 1 Manifests

Date: 2026-02-21

## Purpose
This folder is the Phase 1 parity baseline for the full frontend rebuild program. It indexes current functionality so rebuild work can be validated against explicit coverage and security gates.

## Baseline Counts
- Route files: `10`
- Components: `85`
- E2E specs: `10`
- Frontend Convex functions referenced: `138`
- Frontend Convex call sites: `189`
- Exported Convex functions (query/mutation/action): `180`

## Generated Artifacts
- `api-usage-summary.csv`
  - Unique frontend `api.module.function` usage with usage count and owning files.
- `api-usage-by-file.csv`
  - Every detected `api.module.function` usage with file and line.
- `route-guard-snapshot.txt`
  - Route path and guard declarations extracted from all `*.routes.ts` files.
- `convex-function-surface.csv`
  - Exported Convex function surface by module and function type.

## Curated Artifacts
- `functionality-index.md`
  - Domain-level functionality inventory and required parity scope.
- `route-role-matrix.md`
  - Route-to-role contracts and guard behavior to preserve.
- `high-risk-flow-map.md`
  - Regression-critical flows mapped to backend functions and tests.
- `deprecation-register.md`
  - Explicit keep/deprecate decisions for legacy routes during rebuild.

## Usage in Rebuild
1. Treat this folder as the parity source of truth before moving any code to `.old`.
2. Any route removal requires an approved update in `deprecation-register.md`.
3. Any missing function in `api-usage-summary.csv` is a parity gap unless intentionally deprecated.
4. Cutover is blocked until high-risk flows in `high-risk-flow-map.md` pass.

