# Grid + Light Mode Audit

Date: 2026-02-08

## Goals
- Unified `dash-frame` + `ui-grid` / `ui-grid-tile` across all primary routes (excluding `/6` showcase).
- Standardized grid header styling (neutral, slightly darker than body).
- Reusable `ui-data-table` where practical.
- Light mode contrast/saturation uplift without losing neutrality.
- Remove hover tooltip titles on grid tiles.

## In Progress
- Route audit for legacy layouts and non-unified grids.

## Completed
- Global grid frame styles: `src/styles.css` (`.dash-frame`, `.tile-body`, `--surface-header`).
- `ui-grid-tile` tooltip removal by clearing `title` attribute.
- Light mode neutral palette + background gradient adjustments.
- Desktop header background alignment (removed top bar border on main layout).
- Admin dashboard: activity table moved to `ui-data-table`, pending panels aligned with `tile-body`.
- Employee detail: payroll tab + history tab to grid tiles.
- Core HR + Organization pages: unified grids (departments, designations, locations, resignations, terminations, org chart, org settings, user linking).
- HR pages: employees, leave requests, reports (base and attendance report), training (course list/form, my learning), recruitment (job list/detail/form, candidate board), settings (leave policy list, general settings).
- Profile: restored template and aligned to grid tiles (My Info + Settings).
- Pending + Org Wizard: replaced `ui-card` with `dash-frame` + `ui-grid` tiles.

## Pending
- Confirm remaining routes with `UiCardComponent` usage for non-demo pages (course cards/job cards ok).
- Re-audit payroll header area alignment vs grid (run view header still standalone).
- Visual pass for light-mode contrast/neutrality tweaks after route fixes.
