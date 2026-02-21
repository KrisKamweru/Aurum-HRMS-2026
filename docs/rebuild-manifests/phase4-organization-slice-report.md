# Phase 4 Organization Slice Report

Date: 2026-02-21  
Status: In progress (Convex-backed organization module baseline expanded through shared list-shell composition)

## Slice Delivered
- Replaced generic placeholders with rebuilt organization pages:
  - `src/app/features/organization/pages/departments-rebuild.component.ts`
  - `src/app/features/organization/pages/designations-rebuild.component.ts`
  - `src/app/features/organization/pages/locations-rebuild.component.ts`
  - `src/app/features/organization/pages/user-linking-rebuild.component.ts`
  - `src/app/features/organization/pages/organization-chart-rebuild.component.ts`
  - `src/app/features/organization/pages/organization-settings-rebuild.component.ts`
- Route wired with existing auth and role guards in:
  - `src/app/app.routes.ts`
- Introduced shared feature store and Convex data adapter:
  - `src/app/features/organization/data/organization-rebuild.store.ts`
  - `src/app/features/organization/data/organization-rebuild.data.service.ts`
  - `src/app/features/organization/data/organization-rebuild.models.ts`
  - data adapter now uses shared authenticated Convex HTTP client context from rebuild auth foundation

## Current Capability
- Convex-backed list + create + update + remove interactions for:
  - Departments (`organization.list/create/update/deleteDepartment`)
  - Designations (`organization.list/create/update/deleteDesignation`)
  - Locations (`organization.list/create/update/deleteLocation`)
- Departments, designations, and locations now support:
  - create modal flow
  - edit modal flow
  - destructive confirmation dialog on remove
- Department manager assignment now supports:
  - employee lookup sourced from `employees.list`
  - manager selection in create/edit modal flow
  - manager name projection in department table rows
  - active-manager validation before write
  - stale-manager fallback labels for orphaned manager ids in department rows
- Organization page-state standardization now supports:
  - shared error treatment via `organization-page-state`
  - shared initial loading treatment (no-data load phase)
  - shared empty-state treatment for no-data screens
  - applied across departments, designations, locations, user-linking, org chart, and org settings
- Organization list screens now use shared action controls:
  - common `organization-table-actions` component used for edit/remove cell controls
  - applied across departments, designations, and locations page tables
  - shared disabled-state handling for in-flight save operations
- Organization page-state now supports shared retry actions:
  - common retry button on error surfaces
  - reusable `retryRequested` output for parent-driven reload behavior
  - wired for departments, designations, locations, user-linking, org chart, and org settings
- Organization page-state now supports loading skeleton variants:
  - `table` variant for departments, designations, and locations
  - `linking` variant for user-linking load surfaces
  - `chart` variant for organization chart hierarchy loading
  - `detail` variant for organization settings summary loading
- Organization list screens now use a shared list-shell wrapper:
  - common `organization-list-shell` component now owns heading + action-bar composition
  - applied across departments, designations, and locations page layouts
  - shared content slots preserve per-page page-state and table-content flexibility
- Organization list screens now use shared inline empty-state actions:
  - `organization-page-state` now supports configurable empty primary/secondary CTA labels
  - shared outputs wire list empty states to page-level create and refresh flows
  - applied across departments, designations, and locations pages
- User-linking rebuilt flow now uses:
  - `users.getUnlinkedUsers`
  - `users.getUnlinkedEmployees`
  - `users.linkUserToEmployee`
- User-linking UX includes:
  - per-row employee selection
  - auto-suggestion matching (email/full-name)
  - linked-count telemetry
- Organization chart page now provides:
  - live hierarchy visualization from `employees.getOrgChart`
  - depth-indented reporting rows with report-count visibility
- Organization settings page now provides:
  - live organization snapshot from `organization.getOrganizationSettings`
  - modal-based edit flow via `organization.updateOrganizationSettings`
  - step-based form sections for identity and subscription controls
  - optimistic settings projection during in-flight saves
  - stale-write conflict handling via `expectedUpdatedAt` and latest-state reload
- Duplicate guardrails active:
  - Department: unique by name.
  - Designation: unique by title.
  - Location: unique by name + city.
- Design system alignment updates applied on rebuilt organization surfaces (stone/burgundy palette, glass dark-mode cards, typography scale).

## TDD Coverage
- `src/app/features/organization/data/organization-rebuild.store.spec.ts`
  - verifies service-driven load behavior
  - verifies manager lookup load and manager-assignment write paths for departments
  - verifies inactive manager and stale manager-id validation errors before writes
  - verifies unique-create and duplicate guards across all three entities
  - verifies update + remove actions by id across all three entities
  - verifies user-linking load, auto-suggested pairings, and link action behavior
  - verifies error-state propagation
- `src/app/features/organization/pages/departments-rebuild.component.spec.ts`
  - verifies init load trigger and create/remove interactions
  - verifies manager lookup option projection for dynamic form select fields
  - verifies manager label fallback treatment for inactive/stale manager references
  - verifies shared table action control rendering per row
- `src/app/features/organization/pages/designations-rebuild.component.spec.ts`
  - verifies init load trigger and create/remove interactions
  - verifies shared table action control rendering per row
- `src/app/features/organization/pages/locations-rebuild.component.spec.ts`
  - verifies init load trigger and create/remove interactions
  - verifies shared table action control rendering per row
- `src/app/features/organization/components/organization-table-actions.component.spec.ts`
  - verifies edit/remove event emission
  - verifies disabled-state behavior for both action buttons
- `src/app/features/organization/pages/user-linking-rebuild.component.spec.ts`
  - verifies init load trigger
  - verifies link action and linked-count increment
  - verifies selection change propagation
- `src/app/features/organization/pages/organization-chart-rebuild.component.spec.ts`
  - verifies init load + hierarchy flattening behavior
  - verifies error handling on load failure
- `src/app/features/organization/pages/organization-settings-rebuild.component.spec.ts`
  - verifies init load trigger
  - verifies modal initialization from current settings
  - verifies settings update submission path
  - verifies optimistic in-flight projection behavior
  - verifies stale-write conflict fallback and reload behavior
- `src/app/features/organization/components/organization-page-state.component.spec.ts`
  - verifies error-state rendering
  - verifies retry action rendering and retry event emission
  - verifies optional retry suppression (`showRetry = false`)
  - verifies loading skeleton variants (`table`, `chart`)
  - verifies no-data loading-state rendering
  - verifies empty-state rendering
  - verifies empty-state action rendering and action output emissions
- `src/app/features/organization/pages/departments-rebuild.component.spec.ts`
  - verifies page-state retry event triggers data reload
- `src/app/features/organization/pages/designations-rebuild.component.spec.ts`
  - verifies page-state retry event triggers data reload
- `src/app/features/organization/pages/locations-rebuild.component.spec.ts`
  - verifies page-state retry event triggers data reload
- `src/app/features/organization/pages/user-linking-rebuild.component.spec.ts`
  - verifies page-state retry event triggers data reload
- `src/app/features/organization/pages/organization-chart-rebuild.component.spec.ts`
  - verifies page-state retry event triggers chart reload
- `src/app/features/organization/pages/organization-settings-rebuild.component.spec.ts`
  - verifies page-state retry event triggers settings reload
  - verifies page-level loading skeleton variant assignment
- `src/app/features/organization/components/organization-list-shell.component.spec.ts`
  - verifies heading + action copy rendering
  - verifies slot projection for page-state, toolbar actions, and table content
- `src/app/features/organization/pages/departments-rebuild.component.spec.ts`
  - verifies shared list-shell usage for page heading/action composition
  - verifies empty-state action wiring for create + refresh
- `src/app/features/organization/pages/designations-rebuild.component.spec.ts`
  - verifies shared list-shell usage for page heading/action composition
  - verifies empty-state action wiring for create + refresh
- `src/app/features/organization/pages/locations-rebuild.component.spec.ts`
  - verifies shared list-shell usage for page heading/action composition
  - verifies empty-state action wiring for create + refresh

## Validation
- `npm run build` passed.
- `npm run test` passed (`35` files, `128` tests).

## Next in This Track
1. Add uniform table header metadata patterns (count + last refreshed) across organization list pages.
2. Apply shared table-column metadata helpers for repeated list table heading definitions.
3. Extend shared list-shell slots to support reusable list-level status chips and badges.
