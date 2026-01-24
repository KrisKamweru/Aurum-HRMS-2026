# Aurum HRMS Roadmap

## Project Vision
Aurum HRMS is a modern, comprehensive, and scalable **SaaS** Human Resource Management System. Built with the latest web technologies (Angular 21 & Convex), it aims to streamline HR operations through real-time data synchronization, intuitive user experiences, and robust automation.

## Technical Architecture
- **Frontend**: Angular 21 (Standalone Components, Signals, Control Flow)
- **Backend/Database**: Convex (Real-time database, Server functions, Auth)
- **Styling**: Tailwind CSS
- **Testing**: Vitest (Unit), Playwright (E2E)
- **State Management**: Signals + Convex Reactivity
- **Multi-tenancy**: Native support via Convex schema organization (by `organizationId`)

## Current Status
**Existing Modules:**
- ✅ Authentication (Login, Register, Forgot Password)
- ✅ Dashboard (Basic Layout)
- ✅ Organization Management (Departments, Designations, Locations)
- ✅ Employee Management (Basic listing and profile)
- ✅ Leave Requests (Basic workflow)
- ✅ Shared UI Library (Robust set of reusable components)

---

## Strategic Roadmap

### 🚧 Foundations (Cross-Cutting Concerns)
*These elements are developed continuously alongside feature releases.*
- **Multi-tenancy**: Ensure all data queries are scoped to the active Organization.
- **RBAC (Role-Based Access Control)**:
  - *Phase 1 (MVP)*: Hardcoded roles (Super Admin, HR Admin, Employee, Manager).
  - *Phase 2 (Release 3)*: Dynamic/Customizable roles and permission sets.
- **Security**: Row-level security policies in Convex.

---

### 🚀 MVP Release: Core HR & Essential Functions
**Objective**: Establish the system foundation and deliver essential HR functionalities to allow early adoption.

#### 1. Core HR Operations
- **Lifecycle Events**: Promotion, Award, Travel, Transfer, Resignations, Complaints, Warnings, Terminations.
- **Data Models**: Create schemas for tracking these events against employee records.

#### 2. Info Modules (Enhancement of Current State)
- **Organization**: Polish Company, Department, and Location management.
- **Employees**: Complete the "Hire to Retire" basic data entry (Personal info, Banking, Emergency contacts).

#### 3. Leave Management
- **Workflow**: Request submission, Manager approval/rejection, Cancellation.
- **Balances**: Tracking leave entitlements and consumption.

#### 4. Time and Attendance (Basic)
- **Manual Entry**: Simple clock-in/clock-out or timesheet entry interface.
- **Tracking**: Basic daily/weekly logs.
- *Note*: No hardware integrations in this phase.

#### 5. Payroll (Semi-Automatic)
- **Processing**: Interface for HR to manually input variable pay/deductions.
- **Calculation**: Basic logic for Gross-to-Net (including basic Tax rules).
- **Output**: PDF Payslip generation and download.

#### 6. Basic Reports
- **Scope**: Simple list views and exportable CSVs for Attendance logs and Payroll history.

---

### 📦 Release 1: Enhancements & Integration
**Objective**: Expand input methods and broaden the functional scope to Talent Acquisition and Development.

#### 1. Advanced Time & Attendance
- **Biometric Integration**: API endpoints to receive data from hardware devices.
- **Web Attendance**: Browser-based clock-in with IP restriction.
- **Geo-fencing**: Mobile/Browser location check for remote workers.

#### 2. Recruitment (ATS)
- **Job Board**: Internal/External job posting management.
- **Candidate Pipeline**: Kanban view for tracking applicants.

#### 3. Training & Development
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

## Immediate Development Focus (Next Steps)
1. ~~**Database Schema**: Update `convex/schema.ts` to support "Core HR" entities (Promotions, Transfers, etc.).~~ ✅ DONE
2. ~~**Self-Service User Onboarding**:~~ ✅ DONE
   - ~~Add `pending` role to users schema~~
   - ~~Create `org_join_requests` table~~
   - ~~Build pending user landing page (`/pending`)~~
   - ~~Implement join request flow with domain matching~~
   - ~~Admin approval UI for pending users~~
3. ~~**Core HR Module**: Build the UI/UX for recording Lifecycle events (Promotions, Transfers, Awards, Warnings, etc.).~~ ✅ DONE
4. ~~**Dashboard Role-Based Views**: Admin vs Employee dashboards with personalized content.~~ ✅ DONE
5. ~~**Organization Onboarding Wizard**: Guided setup for new orgs (departments, designations, first employee).~~ ✅ DONE
6. ~~**User-Employee Linking**: UI at `/organization/user-linking` to connect user accounts to employee records.~~ ✅ DONE
7. ~~**Access Control**: Foundational RBAC with route guards and backend authorization checks.~~ ✅ DONE
8. ~~**Super Admin Dashboard**: Management of multiple organizations at `/super-admin` (create, view, suspend orgs).~~ ✅ DONE
9. ~~**Test Environment**: Automated seeding of test organization, profiles, and user linking (`docs/SEED_INSTRUCTIONS.md`).~~ ✅ DONE
10. **Time and Attendance**: Manual clock-in/clock-out or timesheet entry interface.
11. **Form Prerequisites**: Disable action buttons when prerequisites are missing, with tooltips explaining what's needed.

---

## Known Issues & Improvements

### Dashboard - Role-Based Views (Priority: High)
The current dashboard displays admin-oriented statistics (Total Employees, Departments, On Leave counts) to all users. This is inappropriate for employee roles.

**Required Changes:**

#### Admin/HR Dashboard
Keep current stats plus:
- Pending approvals count (leave, resignations, etc.)
- Recent activity feed
- Alerts (expiring certifications, incomplete onboarding, etc.)
- Quick actions (Add Employee, Run Payroll, etc.)

#### Employee Dashboard
Personalized, actionable content organized by category:

**Personal & Profile**
- Profile completeness indicator ("Your profile is 75% complete")
- Work anniversary countdown/celebration
- Time at company milestone
- Birthday reminder (yours + team's this week)

**Leave & Time Off**
- Leave balance breakdown by type (vacation, sick, personal)
- Pending requests with status and quick cancel
- Upcoming approved leave
- Team availability ("3 teammates out today")
- Next public holiday countdown

**Payroll & Compensation** (when payroll module is implemented)
- Last payslip summary (gross, net, date)
- Next pay date
- Year-to-date earnings
- Tax documents download

**Tasks & Action Items**
- Documents requiring acknowledgment
- Expiring/expired certifications
- Incomplete mandatory training
- Performance review due dates
- Pending approvals (if manager)

**Team & Social**
- Team calendar widget (who's in/out)
- Recent company announcements
- New joiners in department
- Recognition feed (recent awards given)
- Quick kudos button to recognize colleagues

**Career Development** (when training module is implemented)
- Goals/OKR progress bars
- Recommended training
- Internal job openings
- Skills development suggestions

**Quick Actions (prominent buttons)**
- Request Leave
- Clock In/Out (when attendance module is implemented)
- View Payslip
- Update Profile
- Submit Expense (when expense module is implemented)

**Engagement & Wellness** (optional/future)
- Pulse survey (1-question check-in)
- Wellness tips
- Anonymous feedback submission

**Implementation**: Create separate dashboard components (`AdminDashboard`, `EmployeeDashboard`) and route based on user role.

### Form Prerequisites & Validation (Priority: Medium)
Forms that depend on other data existing should not allow submission (or even opening) when prerequisites are missing.

**Dependency Matrix:**

| Form | Prerequisites Required |
|------|----------------------|
| Add Employee | Department + Designation must exist |
| Edit Employee | Department, Designation, Location, Manager dropdowns need data |
| Leave Request | User must have `employeeId` linked |
| Promotion | Employee + at least 2 Designations (from → to) |
| Transfer | Employee + at least 2 Departments (from → to), optionally 2 Locations |
| Resignation | Employee must exist |
| Termination | Employee must exist |
| Warning | Employee must exist |
| Complaint | Employee (complainant) must exist |
| Award | Employee must exist |
| Travel Request | Employee must exist |

**Required Changes:**
- Disable action buttons when prerequisites are missing
- Show tooltip or inline message explaining what's needed
- Provide quick links to create missing prerequisite data
- Apply pattern consistently across all dependent forms

---

### Organization Management & Super Admin (Priority: High)
Super admins need the ability to manage multiple organizations (multi-tenancy administration).

**Current Gap:**
- No UI for creating organizations
- No way to assign users to organizations
- New users register but have no `orgId` until manually set in database
- No org admin invitation flow

**Required Features:**

1. **Super Admin Dashboard** (separate from org-level dashboard):
   - List all organizations
   - Create new organization
   - View org stats (user count, employee count, subscription status)
   - Suspend/activate organizations

2. **Organization Creation Flow**:
   - Super admin creates org with: name, domain (optional), subscription plan
   - Assign initial org admin by email address
   - System sends invitation or auto-links if user already registered with that email

3. **Org Admin Assignment**:
   - Super admin can assign/revoke org admin role by email
   - If email matches existing user → update their `orgId` and `role`
   - If email doesn't exist → create pending invitation record
   - When user registers with that email → auto-link to org with assigned role

4. **User-Organization Linking**:
   - Option A: Domain-based auto-join (users with `@company.com` auto-join that org)
   - Option B: Invitation-based (explicit invite required)
   - Option C: Approval-based (user requests access, admin approves)

**Schema Changes Needed:**
```typescript
// New table for pending invitations
invitations: defineTable({
  email: v.string(),
  orgId: v.id("organizations"),
  role: v.union(...),
  invitedBy: v.id("users"),
  status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
  expiresAt: v.string(),
})
```

---

### First-Time Organization Onboarding (Priority: High)
New organizations need a guided setup flow to establish required data before the system is usable.

**Onboarding Wizard Steps:**

1. **Organization Profile**
   - Company name, logo, domain
   - Subscription plan selection (if self-service)

2. **Create Departments** (required - at least 1)
   - Inline creation with "Add another" option
   - Explain why this is needed

3. **Create Designations** (required - at least 1)
   - Inline creation with "Add another" option
   - Explain why this is needed

4. **Create Locations** (optional)
   - Skip option available

5. **Add First Employee** (recommended)
   - Pre-populate with org admin's details
   - Link user account to employee record

6. **Setup Complete**
   - Summary of what was created
   - Quick links to common next actions

**Implementation Notes:**
- Track onboarding completion status on organization record
- Show onboarding wizard on first login if incomplete
- Allow skipping with warning about limited functionality
- Provide "Resume Setup" option from dashboard

---

### User-Employee Linking (Priority: High)
Users need to be linked to Employee records for self-service features to work.

**Current Gap:**
- Users have optional `employeeId` field
- No UI to link users to employees
- New registrations have no employee record
- Leave requests fail silently for unlinked users

**Required Features:**

1. **Admin: Link User to Employee**
   - From employee detail page: "Link to User Account" action
   - Search/select from users with matching email or manual selection
   - From user management: "Link to Employee" action

2. **Auto-Linking Options:**
   - When creating employee, option to "Create user account" (sends invite)
   - When user registers, auto-link if email matches existing employee
   - Bulk import: option to create user accounts for employees

3. **Self-Service Validation:**
   - If user has no `employeeId`, show clear message on Leave Request page
   - "Your account is not linked to an employee profile. Please contact HR."
   - Admin notification: "X users are not linked to employee records"

---

### Self-Service User Onboarding (Priority: High)
Users should be able to register themselves and request to join an organization, reducing friction for org admins.

**Current Gap:**
- New users register but have no way to request org access
- No "pending" state for users awaiting approval
- Org admins must manually create/assign users
- No landing page for users without an organization

**User Journey:**
1. User registers (email/password or OAuth)
2. Lands on "Pending" page - no org assigned yet
3. Options available:
   - **Domain match**: System suggests orgs matching their email domain (e.g., `@acme.com` → "Acme Corp")
   - **Request to join**: User searches/selects an org to request access
   - **Wait**: Remain in pending state until an admin adds them
4. Org admin sees pending requests in dashboard, approves/rejects
5. On approval → user gets assigned org + role (default: "employee")

**Schema Changes Needed:**

```typescript
// users table - add new role
role: v.union(
  v.literal("super_admin"),
  v.literal("admin"),
  v.literal("hr_manager"),
  v.literal("manager"),
  v.literal("employee"),
  v.literal("pending")  // NEW - registered but no org access yet
)

// New table for join requests
org_join_requests: defineTable({
  userId: v.id("users"),
  orgId: v.id("organizations"),
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  requestedAt: v.string(),
  processedAt: v.optional(v.string()),
  processedBy: v.optional(v.id("users")),
  note: v.optional(v.string()),  // User's message to admin
}).index("by_org", ["orgId"])
  .index("by_user", ["userId"])
  .index("by_org_status", ["orgId", "status"])
```

**Required Features:**

1. **Pending User Landing Page** (`/pending`):
   - Welcome message explaining the pending state
   - Show any pending join requests and their status
   - Option to request access to an organization
   - Domain-based org suggestions (if email domain matches an org)
   - Logout option

2. **Join Request Flow:**
   - Search organizations (public/discoverable ones)
   - See orgs matching user's email domain (highlighted)
   - Submit request with optional note
   - View request status (pending/approved/rejected)

3. **Admin: Pending Users Management:**
   - Dashboard widget: "X users awaiting approval"
   - List of pending join requests for their org
   - Approve (assign role) or reject (with reason)
   - Bulk approve option

4. **Domain Matching Logic:**
   - Organizations can set their email domain(s)
   - Users with matching domain see those orgs suggested
   - Optional: Auto-approve users with matching verified email domain

**Route Guards:**
- Users with `role: "pending"` are redirected to `/pending` page
- Cannot access any org-specific routes until approved

---

### Multi-Organization Management / HR Outsourcing (Priority: High)
Support for HR service providers who manage multiple client organizations.

**Business Context:**
HR outsourcing companies need to manage payroll, leave, and employee data for multiple client organizations from a single user account. This is different from super_admin (who has system-wide access) - these are operational users who work across specific assigned organizations.

**Current Gap:**
- Users have a single `orgId` field
- No concept of "affiliated" or "managed" organizations
- HR outsourcing users would need separate logins per client
- No way to switch between organizations

**Required Schema Changes:**

```typescript
// Updated users table
users: defineTable({
  // ... existing fields ...

  // Primary organization (where the user "belongs")
  primaryOrgId: v.optional(v.id("organizations")),

  // Role in primary organization
  role: v.union(
    v.literal("super_admin"),
    v.literal("admin"),
    v.literal("hr_manager"),
    v.literal("manager"),
    v.literal("employee")
  ),

  // Additional organizations this user can manage (for HR outsourcing)
  affiliatedOrgIds: v.optional(v.array(v.id("organizations"))),

  // Employee record link (in primary org)
  employeeId: v.optional(v.id("employees")),

  // Active organization context (can be primary or affiliated)
  activeOrgId: v.optional(v.id("organizations")),
})

// Optional: Granular permissions per affiliated org
user_org_permissions: defineTable({
  userId: v.id("users"),
  orgId: v.id("organizations"),

  // Role in THIS specific org (may differ from primary role)
  role: v.union(
    v.literal("admin"),
    v.literal("hr_manager"),
    v.literal("manager"),
    v.literal("viewer")  // Read-only access
  ),

  // Granular permissions (optional, for fine-tuning)
  permissions: v.optional(v.object({
    canManageEmployees: v.boolean(),
    canApproveLeave: v.boolean(),
    canRunPayroll: v.boolean(),
    canViewReports: v.boolean(),
    canManageSettings: v.boolean(),
  })),

  // When the affiliation was granted
  grantedAt: v.string(),
  grantedBy: v.id("users"),

}).index("by_user", ["userId"])
  .index("by_org", ["orgId"])
```

**Required Features:**

1. **Organization Switcher (UI)**
   - Dropdown in header showing current active org
   - List of all accessible orgs (primary + affiliated)
   - Switch context without logging out
   - Visual indicator of current org context

2. **Affiliation Management (Admin)**
   - Super admin or org admin can grant affiliation
   - Specify role/permissions for affiliated user
   - Revoke affiliation
   - View all affiliated users for an org

3. **Context-Aware Queries**
   - All backend queries use `activeOrgId` instead of just `orgId`
   - User can only access data from orgs they have access to
   - Switching org updates `activeOrgId` on user record

4. **Audit Trail**
   - Track which org context actions were performed in
   - Track affiliation grants/revokes
   - Important for HR outsourcing compliance

**Use Cases:**

1. **HR Outsourcing Company**
   - User works for "HR Services Ltd" (primary org)
   - Has affiliation to "Client Company A", "Client Company B"
   - Can switch between orgs to manage their respective employees/payroll

2. **Franchise/Group Companies**
   - Corporate HR manages multiple subsidiary companies
   - Single login with access to all subsidiaries
   - Consolidated reporting across orgs (future feature)

3. **Consultant Access**
   - External consultant needs temporary access to client org
   - Granted viewer or limited role affiliation
   - Easily revoked when engagement ends

---

## Roadmap Audit - Identified Gaps

### Missing from Current Roadmap

#### 1. Employee Schema Expansion (Priority: Critical)
Current employee schema is minimal. A full HRMS needs comprehensive employee data.

**Proposed Convex Schema:**

```typescript
// ===========================================
// EXPANDED EMPLOYEE (core record)
// ===========================================
employees: defineTable({
  orgId: v.id("organizations"),

  // --- Identification ---
  employeeNumber: v.optional(v.string()), // Company-assigned ID (e.g., "EMP-001")

  // --- Personal Information ---
  firstName: v.string(),
  middleName: v.optional(v.string()),
  lastName: v.string(),
  preferredName: v.optional(v.string()), // Nickname
  title: v.optional(v.union(v.literal("Mr"), v.literal("Ms"), v.literal("Mrs"), v.literal("Dr"), v.literal("Prof"))),
  dateOfBirth: v.optional(v.string()),
  gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"), v.literal("prefer_not_to_say"))),
  maritalStatus: v.optional(v.union(v.literal("single"), v.literal("married"), v.literal("divorced"), v.literal("widowed"))),
  nationality: v.optional(v.string()),
  profilePhotoId: v.optional(v.id("_storage")), // Convex file storage

  // --- Contact Information ---
  emailWork: v.string(),
  emailPersonal: v.optional(v.string()),
  phoneWork: v.optional(v.string()),
  phonePersonal: v.optional(v.string()),
  phoneExtension: v.optional(v.string()),

  // --- Address ---
  addressLine1: v.optional(v.string()),
  addressLine2: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  postalCode: v.optional(v.string()),
  country: v.optional(v.string()),

  // --- Employment Details ---
  departmentId: v.optional(v.id("departments")),
  designationId: v.optional(v.id("designations")),
  locationId: v.optional(v.id("locations")),
  managerId: v.optional(v.id("employees")),

  employmentType: v.optional(v.union(
    v.literal("full_time"),
    v.literal("part_time"),
    v.literal("contractor"),
    v.literal("intern"),
    v.literal("temporary")
  )),
  contractType: v.optional(v.union(
    v.literal("permanent"),
    v.literal("fixed_term"),
    v.literal("probation")
  )),

  startDate: v.string(),
  endDate: v.optional(v.string()), // For fixed-term contracts
  probationEndDate: v.optional(v.string()),
  confirmationDate: v.optional(v.string()), // When probation was confirmed

  shiftId: v.optional(v.id("shifts")),

  status: v.union(
    v.literal("active"),
    v.literal("on_leave"),
    v.literal("suspended"),
    v.literal("resigned"),
    v.literal("terminated"),
    v.literal("retired")
  ),

  // --- Compensation (base - details in separate table for history) ---
  baseSalary: v.optional(v.number()),
  currency: v.optional(v.string()), // e.g., "KES", "USD"
  payFrequency: v.optional(v.union(
    v.literal("monthly"),
    v.literal("bi_weekly"),
    v.literal("weekly")
  )),

}).index("by_org", ["orgId"])
  .index("by_email", ["emailWork"])
  .index("by_department", ["departmentId"])
  .index("by_manager", ["managerId"])
  .index("by_employee_number", ["employeeNumber"]),

// ===========================================
// STATUTORY INFORMATION (country-specific)
// ===========================================
employee_statutory: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),
  country: v.string(), // "KE", "US", "UK", etc.

  // Generic fields - interpretation depends on country
  taxId: v.optional(v.string()),           // KRA PIN (Kenya), SSN (US), NI Number (UK)
  nationalId: v.optional(v.string()),      // ID Number
  socialSecurityId: v.optional(v.string()), // NSSF (Kenya), Social Security (US)
  healthInsuranceId: v.optional(v.string()), // NHIF (Kenya), NHS (UK)

  // Additional country-specific fields as needed
  additionalIds: v.optional(v.object({
    // Flexible object for other IDs
  })),

}).index("by_employee", ["employeeId"]),

// ===========================================
// BANKING DETAILS (sensitive - separate table)
// ===========================================
employee_banking: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  bankName: v.string(),
  bankBranch: v.optional(v.string()),
  bankCode: v.optional(v.string()), // SWIFT, routing number, sort code
  accountNumber: v.string(),
  accountName: v.optional(v.string()),
  accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"))),

  isPrimary: v.boolean(), // For multiple accounts

}).index("by_employee", ["employeeId"]),

// ===========================================
// EMERGENCY CONTACTS
// ===========================================
emergency_contacts: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  name: v.string(),
  relationship: v.string(), // "Spouse", "Parent", "Sibling", etc.
  phone: v.string(),
  phoneAlt: v.optional(v.string()),
  email: v.optional(v.string()),
  address: v.optional(v.string()),

  isPrimary: v.boolean(),

}).index("by_employee", ["employeeId"]),

// ===========================================
// EDUCATION HISTORY
// ===========================================
employee_education: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  institution: v.string(),
  degree: v.string(), // "Bachelor's", "Master's", "PhD", "Diploma", etc.
  fieldOfStudy: v.string(),
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
  grade: v.optional(v.string()), // GPA, Class, etc.

}).index("by_employee", ["employeeId"]),

// ===========================================
// CERTIFICATIONS & SKILLS
// ===========================================
employee_certifications: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  name: v.string(),
  issuingOrganization: v.string(),
  issueDate: v.string(),
  expiryDate: v.optional(v.string()),
  credentialId: v.optional(v.string()),
  credentialUrl: v.optional(v.string()),

}).index("by_employee", ["employeeId"])
  .index("by_expiry", ["expiryDate"]),

employee_skills: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  skill: v.string(),
  proficiency: v.optional(v.union(
    v.literal("beginner"),
    v.literal("intermediate"),
    v.literal("advanced"),
    v.literal("expert")
  )),
  yearsExperience: v.optional(v.number()),

}).index("by_employee", ["employeeId"]),

// ===========================================
// PAYROLL: CREDITS (Additions to salary)
// ===========================================
payroll_credits: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  name: v.string(), // "Housing Allowance", "Transport", "Bonus", etc.
  amount: v.number(),
  description: v.optional(v.string()),

  itemType: v.union(
    v.literal("allowance"),
    v.literal("bonus"),
    v.literal("commission"),
    v.literal("reimbursement"),
    v.literal("other")
  ),

  isTaxable: v.boolean(),
  isPermanent: v.boolean(), // Recurring vs one-time
  isActive: v.boolean(),

  effectiveFrom: v.optional(v.string()),
  effectiveTo: v.optional(v.string()),

  // Processing info
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  requestDate: v.string(),
  processedDate: v.optional(v.string()),
  processedBy: v.optional(v.id("users")),

}).index("by_employee", ["employeeId"])
  .index("by_org_status", ["orgId", "status"]),

// ===========================================
// PAYROLL: DEBITS (Deductions from salary)
// ===========================================
payroll_debits: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  name: v.string(), // "Salary Advance", "Loan", "Penalty", etc.
  amount: v.number(),
  description: v.optional(v.string()),

  itemType: v.union(
    v.literal("loan"),
    v.literal("advance"),
    v.literal("penalty"),
    v.literal("tax"),
    v.literal("statutory"), // NSSF, NHIF, PAYE, etc.
    v.literal("other")
  ),

  isPermanent: v.boolean(),
  isActive: v.boolean(),

  // For installment-based deductions (loans, advances)
  totalAmount: v.optional(v.number()),       // Original loan amount
  instalmentAmount: v.optional(v.number()),  // Per-period deduction
  instalmentsPaid: v.optional(v.number()),   // How many paid so far
  instalmentsTotal: v.optional(v.number()),  // Total installments
  isCompleted: v.optional(v.boolean()),

  effectiveFrom: v.optional(v.string()),
  effectiveTo: v.optional(v.string()),

  // Processing info
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  requestDate: v.string(),
  processedDate: v.optional(v.string()),
  processedBy: v.optional(v.id("users")),

}).index("by_employee", ["employeeId"])
  .index("by_org_status", ["orgId", "status"]),

// ===========================================
// WORK SHIFTS (referenced by employees)
// ===========================================
shifts: defineTable({
  orgId: v.id("organizations"),

  name: v.string(), // "Day Shift", "Night Shift", "Flexible"
  code: v.optional(v.string()),

  startTime: v.optional(v.string()), // "09:00"
  endTime: v.optional(v.string()),   // "17:00"
  breakDuration: v.optional(v.number()), // minutes

  workDays: v.optional(v.array(v.string())), // ["Mon", "Tue", "Wed", "Thu", "Fri"]

}).index("by_org", ["orgId"]),

// ===========================================
// EMPLOYEE DOCUMENTS
// ===========================================
employee_documents: defineTable({
  orgId: v.id("organizations"),
  employeeId: v.id("employees"),

  name: v.string(),
  type: v.union(
    v.literal("contract"),
    v.literal("id_copy"),
    v.literal("resume"),
    v.literal("certificate"),
    v.literal("performance_review"),
    v.literal("other")
  ),
  fileId: v.id("_storage"),

  expiryDate: v.optional(v.string()),
  uploadedAt: v.string(),
  uploadedBy: v.id("users"),

}).index("by_employee", ["employeeId"]),

// ===========================================
// USER ORG PERMISSIONS (for HR outsourcing)
// ===========================================
user_org_permissions: defineTable({
  userId: v.id("users"),
  orgId: v.id("organizations"),

  // Role in THIS specific org (may differ from primary role)
  role: v.union(
    v.literal("admin"),
    v.literal("hr_manager"),
    v.literal("manager"),
    v.literal("viewer")
  ),

  // Granular permissions (optional, for fine-tuning)
  permissions: v.optional(v.object({
    canManageEmployees: v.optional(v.boolean()),
    canApproveLeave: v.optional(v.boolean()),
    canRunPayroll: v.optional(v.boolean()),
    canViewReports: v.optional(v.boolean()),
    canManageSettings: v.optional(v.boolean()),
  })),

  grantedAt: v.string(),
  grantedBy: v.id("users"),

}).index("by_user", ["userId"])
  .index("by_org", ["orgId"]),
```

**Key Design Decisions:**

1. **Separate tables for related data** - Emergency contacts, education, certifications, banking are separate tables (1:many relationship, independent lifecycle, sensitive data isolation)

2. **Statutory info is country-flexible** - Generic field names that map to country-specific requirements (KRA PIN in Kenya = SSN in US)

3. **Credits/Debits have full workflow** - Status tracking, processing info, installment support for loans

4. **Shifts are a separate entity** - Can be assigned to employees, reused across org

5. **Documents use Convex file storage** - `v.id("_storage")` for actual file references

6. **Multi-org support via user_org_permissions** - Enables HR outsourcing where users manage multiple client organizations with potentially different roles in each

**Note on Users Table:**
The existing `users` table (managed by Convex Auth) needs these additional fields:
- `primaryOrgId` - replaces current `orgId`
- `affiliatedOrgIds` - array of additional orgs user can access
- `activeOrgId` - currently selected organization context
- Backend queries should use `activeOrgId` for data scoping

---

#### 2. Notifications & Alerts System (Priority: High)
No notification system exists in the roadmap.

**Required:**
- In-app notification center
- Email notifications (configurable per user)
- Push notifications (future, for mobile)
- Notification preferences management

**Trigger Events:**
- Leave request submitted/approved/rejected
- Document requires signature
- Certification expiring
- Performance review due
- New announcement posted
- Birthday/anniversary reminders
- Approval pending (for managers)

---

#### 3. Document Management (Priority: Medium)
Not explicitly covered in releases.

**Required:**
- Employee document storage (per employee)
- Company-wide document library
- Document templates (offer letters, contracts)
- Digital signature integration
- Version control for documents
- Expiry tracking (contracts, certifications)

---

#### 4. Audit Trail / Activity Logging (Priority: High)
Critical for compliance and debugging.

**Required:**
- Track all data changes (who, when, what changed)
- Login/logout history
- Sensitive data access logs
- Export audit reports
- Retention policies

---

#### 5. Data Import/Export (Priority: Medium)
Not covered for initial setup or migration.

**Required:**
- Bulk employee import (CSV/Excel)
- Data validation and error reporting
- Export to CSV/Excel/PDF
- Backup/restore capabilities

---

#### 6. Settings & Configuration (Priority: Medium)
Limited org-level configuration options.

**Required:**
- Leave policy configuration (types, accrual rules, carry-over)
- Public holiday calendar (per location/country)
- Work week definition (which days, hours)
- Approval workflow configuration
- Email template customization
- Branding (logo, colors)

---

#### 7. Mobile Responsiveness (Priority: Medium)
Not explicitly addressed.

**Required:**
- Responsive design audit for all screens
- Mobile-optimized forms
- Touch-friendly interactions
- Consider PWA or native app (future)

---

#### 8. Localization / i18n (Priority: Low - Future)
Not addressed for international orgs.

**Required:**
- Multi-language UI support
- Date/time format localization
- Currency formatting
- Right-to-left (RTL) language support

---

#### 9. Integrations (Priority: Low - Future)
Limited integration coverage.

**Consider:**
- SSO providers (Okta, Azure AD)
- Calendar sync (Google Calendar, Outlook)
- Slack/Teams notifications
- Accounting software (QuickBooks, Xero)
- Background check services
- Job boards (LinkedIn, Indeed)

---

#### 10. Expense Management (Priority: Medium)
Referenced in dashboard but not in releases.

**Required:**
- Expense submission with receipt upload
- Expense categories and policies
- Approval workflow
- Reimbursement tracking
- Integration with payroll

