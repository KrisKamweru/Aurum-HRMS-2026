# Aurum HRMS Project Guidelines

## Project Structure
- **Root Directory**: `aurum-hrms/`
- **Active Project**: Single application monorepo structure.
- **Commands**: Execute all commands from this directory.

## Tech Stack
- **Framework**: Angular 21 (Standalone Components, Signals)
- **Backend**: Convex (Real-time database, Auth, Server Functions)
- **Styling**: Tailwind CSS v4
- **Testing**: Playwright (E2E), Vitest (Unit)

## Development Commands
- `npm start`: Run Angular dev server (http://localhost:4200)
- `npx convex dev`: Run Convex backend dev server
- `ng test`: Run unit tests
- `ng e2e`: Run end-to-end tests

## Current Development Focus
- **MVP Release Phase**: Implementing Core HR features and Time/Attendance.
- **Roadmap**: See `ROADMAP.md` for the detailed release plan.
- **Immediate Priorities**:
  1. **Time & Attendance**: Manual timesheet entry interface.
  2. **Payroll**: Foundations and salary slip generation.
  3. **Employee Dashboard**: Additional widgets.

## Architecture & Patterns

### Feature Architecture
- **Location**: `src/app/features/`
- **Pattern**: Modular feature-based structure (e.g., `attendance`, `core-hr`, `dashboard`).
- **Shared UI**: Use components from `src/app/shared/components/`.
  - **Buttons**: `UiButtonComponent` handles actions, loading states, and prerequisites.
  - **Modals**: `UiModalComponent` for forms and dialogs.
  - **Forms**: `DynamicFormComponent` for standardized data entry.

### Data Access (Convex)
- **Service**: `ConvexClientService` (core/services/convex-client.service.ts).
- **Architecture**:
  - `ConvexClientService` is the singleton wrapper managing the raw `ConvexClient`, auth tokens, and connection state.
  - Components inject `ConvexClientService` and use `getClient()` to access the Convex instance.
  - Specialized services (like `AuthService`) wrap specific logic but rely on `ConvexClientService` for transport.
- **Queries**: Use `client.onUpdate(api.module.func, ...)` for real-time subscriptions in `ngOnInit`.
- **Mutations**: Use `await client.mutation(api.module.func, ...)` for actions.
- **Multi-tenancy**: All backend queries MUST filter by `orgId` (retrieved via `getViewerInfo`).

### State Management
- **Signals**: Use Angular Signals for local component state.
- **Resources**: Use Angular `resource` or manual subscriptions for async data.
- **Auth**: `AuthService` exposes signals like `getUser` and `hasRole`.

### Form Prerequisites System
- **Directive**: `[prerequisitesMet]` input on `UiButtonComponent`.
- **Behavior**: If false, button appears disabled but is clickable to show a toast explaining the missing requirement.
- **Usage**:
  ```html
  <ui-button
    (onClick)="action()"
    [prerequisitesMet]="condition"
    prerequisiteMessage="Reason for blocking"
    [prerequisiteAction]="{ label: 'Fix It', link: ['/path'] }"
  >
  ```

## UI & Visual Standards

### Dark Mode (Tailwind v4)
- **Strategy**: Class-based `.dark` on `<html>`.
- **Colors**:
  - **Brand**: `burgundy-*` (Primary), `gold-*` (Accent).
  - **Neutral**: `stone-*` (Backgrounds, Text).
- **Components**: MUST implement `dark:` variants for all colors.
  - Backgrounds: `bg-white dark:bg-stone-800`
  - Text: `text-stone-800 dark:text-stone-100`
  - Borders: `border-stone-200 dark:border-stone-700`

### Design System
- **Reference**: `SHOWCASE-6-DESIGN.md` is the canonical visual design + Tailwind system for the entire app.
- **Usage**: New components and screens MUST follow its color, typography, spacing, and component patterns.

### Icons
- **System**: SVG assets in `src/assets/icons/`.
- **Usage**: `<ui-icon name="icon-name"></ui-icon>`.
- **Note**: Ensure SVG files exist before using new icon names.

## Testing Guidelines

### E2E Testing (Playwright)
- **Credentials**: See `.test-credentials` (local only).
- **Tool Selection**:
  - **Snapshots**: Use `browser_snapshot` for inspecting the DOM and getting accessibility refs.
  - **Screenshots**: Use `browser_take_screenshot` when verifying visual layout, colors, alignment, or contrast.
- **Workflow**:
  1. Navigate: `browser_navigate`
  2. Inspect: `browser_snapshot` (preferred over screenshots for finding refs)
  3. Interact: `browser_click`, `browser_type` using snapshot refs.
  4. Verify: Check UI state updates.
- **Rule**: Never start a new feature before the current one is user-reviewed, unless explicitly instructed.

### Database Seeding
- **Command**: `npx convex run seed:seedTestOrganization`
- **Purpose**: Populates "Aurum Test Corp" with departments, employees, and designations.
- **User Linking**: `npx convex run seed:linkAllTestUsers` links auth users to employee records.

## Git Workflow
- **Commits**: Concise, descriptive messages. No AI signatures.
- **Cadence**: Commit frequently (e.g., after completing a single task or verifying a fix). Do not accumulate multiple features or fixes in one commit.
- **Message Content**: Focus on "why" and "what". Leave out implementation details that are obvious from the diff.
  - Good: "Fix attendance clock negative duration bug"
  - Bad: "Updated attendance.component.ts to use Math.max(0, diff)"
- **Scope**: Keep changes focused on the requested task.
