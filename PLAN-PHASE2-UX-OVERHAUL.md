# UI/UX Overhaul Plan - Phase 2

## Context

After the initial Design Six overhaul, several issues were identified:
1. Light mode lacks visual depth (flat white, no shadows/borders visible)
2. Admin dashboard layout issues (misalignment, empty space)
3. Pages inconsistently styled (payroll, reports, system console, settings, employee detail)
4. Forms lack modern UX (single column, no steppers, endless scroll)
5. UX issues (org settings location, scroll containers, delete dialogs, date pickers, modal styling)

This plan addresses all 14 issues systematically with parallel agent execution where possible.

---

## Phase 1: Foundation Components (Parallel)

### 1.1 Light Mode Depth System
**Issue**: #1 - Light mode is a "sea of white"
**Agent**: `pixel-perfect` (Sonnet)
**Files**:
- `src/app/shared/components/ui-card/ui-card.component.ts`
- `src/app/layouts/main-layout/main-layout.component.ts`

**Changes**:
- Add subtle `bg-stone-50` page background in light mode
- Cards: Add `shadow-sm` and `border-stone-200` in light mode
- Section headers: Add `bg-stone-50/80` background
- Stat cards: Add colored left border accent in light mode
- Table rows: Add `hover:bg-burgundy-50/50` in light mode

### 1.2 Confirmation Dialog Component (NEW)
**Issue**: #12 - Delete actions use browser alerts
**Agent**: `frontend-plan-executor` (Sonnet)
**Files**:
- `src/app/shared/components/ui-confirm-dialog/ui-confirm-dialog.component.ts` (NEW)
- `src/app/shared/services/confirm-dialog.service.ts` (NEW)

**Design**:
```typescript
interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}
```
- Matches modal design but with `rounded-xl` (blockier)
- Danger variant: red accent, destructive button styling
- Returns Promise<boolean>

### 1.3 Modal Styling Update
**Issue**: #13 - Modals too rounded
**Agent**: `pixel-perfect` (Haiku)
**Files**:
- `src/app/shared/components/ui-modal/ui-modal.component.ts`

**Changes**:
- Change `rounded-2xl` → `rounded-xl` (16px → 12px)
- Sharper, blockier aesthetic to match Design Six

### 1.4 Date Range Picker Component (NEW)
**Issue**: #11 - Date ranges should be combined selector
**Agent**: `frontend-plan-executor` (Sonnet)
**Files**:
- `src/app/shared/components/ui-date-range/ui-date-range.component.ts` (NEW)

**Design**:
- **Inline dual-month calendar** (always visible, not dropdown)
- Two months displayed side-by-side
- Click start date, click end date to select range
- Visual highlighting of selected range
- Quick presets bar: "This Month", "Last Month", "Last 30 Days", "This Year"
- Used for leave requests, report filters

---

## Phase 2: Form System Overhaul (Sequential)

### 2.1 Multi-Column Form Support
**Issue**: #6 - Forms single column only
**Agent**: `frontend-plan-executor` (Sonnet)
**Files**:
- `src/app/shared/components/dynamic-form/dynamic-form.component.ts`
- `src/app/shared/services/form-helper.service.ts`

**Changes**:
- Add `columns?: 1 | 2 | 3` to FieldConfig
- Add `colspan?: number` for full-width fields in multi-column
- Add `section?: string` for field grouping with headers
- Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 2.2 Form Stepper Component (NEW)
**Issue**: #6 - No steppers for long forms
**Agent**: `frontend-plan-executor` (Sonnet)
**Files**:
- `src/app/shared/components/ui-stepper/ui-stepper.component.ts` (NEW)
- `src/app/shared/components/ui-stepper/ui-step.component.ts` (NEW)

**Design**:
```html
<ui-stepper [currentStep]="step" (stepChange)="onStepChange($event)">
  <ui-step title="Basic Info" [completed]="step > 1">
    <!-- form fields -->
  </ui-step>
  <ui-step title="Employment" [completed]="step > 2">
    <!-- form fields -->
  </ui-step>
</ui-stepper>
```
- Horizontal step indicators with burgundy accent
- Step validation before proceeding
- Back/Next/Submit buttons

---

## Phase 3: Page Updates (Parallel - 4 agents)

### 3.1 Employee Detail Page Overhaul
**Issue**: #8, #9 - Old design, missing pay data editing, field inconsistency
**Agent**: `frontend-plan-executor` (Sonnet)
**Files**:
- `src/app/features/employees/employee-detail/employee-detail.component.ts`
- `convex/employees.ts` (add updateCompensation mutation)

**Changes**:
- Apply dash-frame pattern to all sections
- Add "Compensation" tab with pay data editing:
  - **HR/Admin can edit**: baseSalary, currency, payFrequency
  - **View-only for employees**: their own compensation data
  - Role-based field visibility using `hasRole()` checks
- Align edit form fields with view page fields
- Use new multi-column form layout
- Replace `:host-context(.dark)` with Tailwind `dark:`

**Compensation Fields (from schema)**:
- `baseSalary` (number) - Base monthly/weekly salary
- `currency` (string) - e.g., "USD", "EUR", "GBP"
- `payFrequency` (enum) - "monthly", "bi_weekly", "weekly"

### 3.2 Payroll/Reports/System Console Update
**Issue**: #4 - Pages not updated to new layout
**Agent**: `frontend-plan-executor` (Sonnet)
**Files**:
- `src/app/features/payroll/payroll-run.component.ts`
- `src/app/features/reports/reports.component.ts`
- `src/app/features/reports/pages/attendance-report.component.ts`
- `src/app/features/super-admin/super-admin.component.ts`

**Changes**:
- Wrap tables in dash-frame pattern
- Add proper light mode styling
- Replace CSS variables with Tailwind utilities

### 3.3 Settings Pages Update
**Issue**: #4, #5 - Settings not updated, org settings in wrong place
**Agent**: `frontend-plan-executor` (Sonnet)
**Files**:
- `src/app/features/settings/settings.component.ts`
- `src/app/features/settings/components/general-settings/general-settings.component.ts`
- `src/app/features/organization/organization.routes.ts`
- `src/app/features/organization/pages/org-settings/org-settings.component.ts` (NEW)
- `src/app/layouts/main-layout/main-layout.component.ts` (sidebar nav)

**Changes**:
- Move organization-specific settings to `/organization/settings`
- Keep app-level settings (currency, timezone) in general settings
- Apply dash-frame pattern to settings sections
- Add "Settings" nav item under Organization section in sidebar
- Update sidebar navigation structure to include org settings link

### 3.4 Admin Dashboard Fixes
**Issue**: #2, #3 - Misalignment, empty space
**Agent**: `pixel-perfect` (Haiku)
**Files**:
- `src/app/features/dashboard/admin-dashboard.component.ts`

**Changes**:
- Fix grid alignment between "Today's Activity" and "Pending Leave" headers
- Make section heights equal using `min-h-` constraints
- Add conditional layout: hide empty sections, expand others to fill
- Add "Quick Actions" widget to fill empty space

---

## Phase 4: UX Fixes (Parallel - 2 agents)

### 4.1 Scroll Container Fixes
**Issue**: #7 - Chain of command scrolls whole page
**Agent**: `janitor-refactorer` (Haiku)
**Files**:
- `src/app/features/organization/pages/org-chart/org-chart.component.ts`
- `src/app/shared/components/ui-data-table/ui-data-table.component.ts`

**Changes**:
- Add `max-w-full` and constrained height to org chart container
- Ensure tables don't break page layout on narrow screens
- Add scroll shadows/indicators for horizontal scroll

### 4.2 Replace Browser Confirms with Dialog
**Issue**: #12 - Delete actions use browser alerts
**Agent**: `janitor-refactorer` (Haiku)
**Files**: (18+ files using `confirm()`)
- `src/app/features/employees/employees.component.ts`
- `src/app/features/organization/pages/departments.component.ts`
- `src/app/features/organization/pages/designations.component.ts`
- `src/app/features/payroll/payroll-run.component.ts`
- (and others)

**Changes**:
- Import `ConfirmDialogService`
- Replace `confirm('...')` with `await this.confirmDialog.confirm({...})`
- Add proper danger styling for delete operations

---

## Phase 5: Integration & Polish (Sequential)

### 5.1 Update Leave Request Form with Date Range Picker
**Agent**: `frontend-plan-executor` (Haiku)
**Files**:
- `src/app/features/leave-requests/leave-requests.component.ts`

**Changes**:
- Replace separate start/end date inputs with `ui-date-range`
- Update form validation

### 5.2 Update Report Filters with Date Range Picker
**Agent**: `frontend-plan-executor` (Haiku)
**Files**:
- `src/app/features/reports/components/report-filters.component.ts`

**Changes**:
- Replace separate date inputs with `ui-date-range`

---

## Agent Execution Strategy

### Wave 1 (Parallel - Foundation)
| Agent | Type | Model | Task |
|-------|------|-------|------|
| A1 | pixel-perfect | sonnet | Light mode depth system |
| A2 | frontend-plan-executor | sonnet | Confirmation dialog component |
| A3 | pixel-perfect | haiku | Modal border radius fix |
| A4 | frontend-plan-executor | sonnet | Date range picker component |

### Wave 2 (Sequential - Forms)
| Agent | Type | Model | Task |
|-------|------|-------|------|
| B1 | frontend-plan-executor | sonnet | Multi-column form support |
| B2 | frontend-plan-executor | sonnet | Stepper component (after B1) |

### Wave 3 (Parallel - Pages)
| Agent | Type | Model | Task |
|-------|------|-------|------|
| C1 | frontend-plan-executor | sonnet | Employee detail overhaul |
| C2 | frontend-plan-executor | sonnet | Payroll/Reports/System Console |
| C3 | frontend-plan-executor | sonnet | Settings + org settings move |
| C4 | pixel-perfect | haiku | Admin dashboard fixes |

### Wave 4 (Parallel - UX)
| Agent | Type | Model | Task |
|-------|------|-------|------|
| D1 | janitor-refactorer | haiku | Scroll container fixes |
| D2 | janitor-refactorer | haiku | Replace browser confirms |

### Wave 5 (Parallel - Integration)
| Agent | Type | Model | Task |
|-------|------|-------|------|
| E1 | frontend-plan-executor | haiku | Leave request date range |
| E2 | frontend-plan-executor | haiku | Report filters date range |

---

## Verification Plan

After each wave:
1. Run `npm start` and `npx convex dev`
2. Use Playwright MCP to screenshot key pages in both light and dark mode
3. Verify:
   - Light mode has visual depth (shadows, borders, subtle backgrounds)
   - Modals are blockier (rounded-xl)
   - Delete actions show custom dialog
   - Forms support multi-column where applicable
   - Scroll containers work correctly
   - Admin dashboard has no layout issues

### Key Test Scenarios
1. **Light Mode**: Dashboard, Employees, Payroll - should have depth, not flat white
2. **Delete Flow**: Delete an employee - should show custom dialog, not browser alert
3. **Date Range**: Create leave request - should use combined date picker
4. **Settings**: Org settings should be under `/organization/settings`
5. **Employee Detail**: Should have Compensation tab with pay data

---

## Files Summary

### New Files (6)
- `src/app/shared/components/ui-confirm-dialog/ui-confirm-dialog.component.ts`
- `src/app/shared/services/confirm-dialog.service.ts`
- `src/app/shared/components/ui-date-range/ui-date-range.component.ts`
- `src/app/shared/components/ui-stepper/ui-stepper.component.ts`
- `src/app/shared/components/ui-stepper/ui-step.component.ts`
- `src/app/features/organization/pages/org-settings/org-settings.component.ts`

### Modified Files (20+)
- UI components: ui-card, ui-modal, dynamic-form
- Pages: employee-detail, admin-dashboard, payroll-run, reports, super-admin, settings
- 18+ files with `confirm()` calls

---

## Estimated Effort

| Wave | Agents | Estimated Time |
|------|--------|----------------|
| Wave 1 | 4 parallel | 15-20 min |
| Wave 2 | 2 sequential | 20-25 min |
| Wave 3 | 4 parallel | 25-30 min |
| Wave 4 | 2 parallel | 10-15 min |
| Wave 5 | 2 parallel | 10-15 min |
| **Total** | | **~80-105 min** |

Using Haiku for simpler tasks (modal radius, scroll fixes, confirm replacements, integration) and Sonnet for complex component creation and page overhauls.
