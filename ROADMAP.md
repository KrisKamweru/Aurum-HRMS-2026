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
- ⏳ **Basic Reports**: Simple list views and exportable CSVs.

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

#### 6. Basic Reports ⏳ PENDING
- **Scope**: Simple list views and exportable CSVs for Attendance logs and Payroll history.

---

### 📦 Release 1: Enhancements & Integration
**Objective**: Expand input methods and broaden the functional scope to Talent Acquisition and Development.

#### 1. Advanced Time & Attendance
- **Biometric Integration**: API endpoints to receive data from hardware devices.
- **Web Attendance**: Browser-based clock-in with IP restriction.
- **Geo-fencing**: Mobile/Browser location check for remote workers.

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

## Current Sprint & Immediate Priorities

### 🎯 Primary Focus
1. **Basic Reports (MVP Final Item)**
   - Implementation of CSV exports for Attendance and Payroll.
   - Simple list views for critical data.
2. **Payslip PDF Export**
   - Generate downloadable/printable PDF payslips.
3. **Tax Configuration UI**
   - Admin interface to view/edit tax rules without database access.
4. **System Polish & Bug Fixes**
   - Review all forms for consistency with "Form Prerequisites" system.
   - Ensure Dark Mode is consistent across all new modules.
   - E2E Test coverage for new Recruitment and Training modules.

### ✅ Recently Completed
1. **Tax Configuration System**: Extensible, config-driven tax calculation engine.
   - Kenya 2024 tax rules (PAYE, NSSF, NHIF, Housing Levy) seeded.
   - Supports progressive brackets, capped percentages, tiered fixed amounts.
   - Tracks employee vs employer contributions separately.
2. **Time and Attendance**: Manual clock-in/clock-out and timesheet entry.
3. **Payroll Foundation**: Salary structures, payslip generation, and run management.
4. **Form Prerequisites**: System to block actions when dependencies are missing.
5. **Recruitment & Training**: Full modules delivered ahead of schedule.
6. **Notifications**: System-wide alert infrastructure.
7. **Security Hardening**: Cross-org validation on all sensitive queries/mutations.

---

## Previous Development Log
1. ~~**Database Schema**: Update `convex/schema.ts` to support "Core HR" entities.~~ ✅ DONE
2. ~~**Self-Service User Onboarding**:~~ ✅ DONE
3. ~~**Core HR Module**: Build the UI/UX for recording Lifecycle events.~~ ✅ DONE
4. ~~**Dashboard Role-Based Views**: Admin vs Employee dashboards.~~ ✅ DONE
5. ~~**Organization Onboarding Wizard**: Guided setup for new orgs.~~ ✅ DONE
6. ~~**User-Employee Linking**: UI at `/organization/user-linking`.~~ ✅ DONE
7. ~~**Access Control**: Foundational RBAC.~~ ✅ DONE
8. ~~**Super Admin Dashboard**: Management of multiple organizations.~~ ✅ DONE
9. ~~**Test Environment**: Automated seeding.~~ ✅ DONE
10. ~~**Time and Attendance**: Manual clock-in/clock-out.~~ ✅ DONE
11. ~~**Form Prerequisites**: Disable action buttons when prerequisites are missing.~~ ✅ DONE

---

## Known Issues & Improvements

### Dashboard - Role-Based Views (Priority: High)
*Status: ✅ Implemented*
The dashboard now correctly displays Admin vs Employee views based on the user's role.

### Form Prerequisites & Validation (Priority: Medium)
*Status: ✅ Implemented*
The `[prerequisitesMet]` system is now in place on `UiButtonComponent` and widely used.

### Organization Management & Super Admin (Priority: High)
*Status: ✅ Implemented*
Super Admin dashboard and multi-tenancy invitation flows are complete.

### First-Time Organization Onboarding (Priority: High)
*Status: ✅ Implemented*
Onboarding wizard is active for new organizations.

### User-Employee Linking (Priority: High)
*Status: ✅ Implemented*
User linking interface is available.

---

## Roadmap Audit - Identified Gaps

### Missing from Current Roadmap (Previously Identified)

#### 1. Employee Schema Expansion (Priority: Critical)
*Status: ✅ Implemented*
Full employee schema with personal, banking, education, documents, and skills has been implemented.

#### 2. Notifications & Alerts System (Priority: High)
*Status: ✅ Implemented*
Backend and UI for notifications are now complete.

#### 3. Document Management (Priority: Medium)
*Status: 🚧 Partially Implemented*
Employee document storage is available. Company-wide library and digital signatures are pending.

#### 4. Audit Trail / Activity Logging (Priority: High)
Critical for compliance and debugging.

**Required:**
- Track all data changes (who, when, what changed)
- Login/logout history
- Sensitive data access logs
- Export audit reports
- Retention policies

#### 5. Data Import/Export (Priority: Medium)
Not covered for initial setup or migration.

**Required:**
- Bulk employee import (CSV/Excel)
- Data validation and error reporting
- Export to CSV/Excel/PDF
- Backup/restore capabilities

#### 6. Settings & Configuration (Priority: Medium)
*Status: ✅ Implemented*
Organization settings and leave policies are now configurable.

#### 7. Mobile Responsiveness (Priority: Medium)
Not explicitly addressed.

**Required:**
- Responsive design audit for all screens
- Mobile-optimized forms
- Touch-friendly interactions
- Consider PWA or native app (future)

#### 8. Localization / i18n (Priority: Low - Future)
Not addressed for international orgs.

**Required:**
- Multi-language UI support
- Date/time format localization
- Currency formatting
- Right-to-left (RTL) language support

#### 9. Integrations (Priority: Low - Future)
Limited integration coverage.

**Consider:**
- SSO providers (Okta, Azure AD)
- Calendar sync (Google Calendar, Outlook)
- Slack/Teams notifications
- Accounting software (QuickBooks, Xero)
- Background check services
- Job boards (LinkedIn, Indeed)

#### 10. Expense Management (Priority: Medium)
Referenced in dashboard but not in releases.

**Required:**
- Expense submission with receipt upload
- Expense categories and policies
- Approval workflow
- Reimbursement tracking
- Integration with payroll
