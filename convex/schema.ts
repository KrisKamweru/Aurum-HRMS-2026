import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  organizations: defineTable({
    name: v.string(),
    domain: v.optional(v.string()),
    subscriptionPlan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("suspended")),
    updatedAt: v.optional(v.string()),
  }).index("by_domain", ["domain"]).index("by_status", ["status"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("hr_manager"), v.literal("employee"), v.literal("manager"), v.literal("pending")),
    orgId: v.optional(v.id("organizations")),
    activeOrgId: v.optional(v.id("organizations")),
    employeeId: v.optional(v.id("employees")),
  }).index("email", ["email"]).index("by_org", ["orgId"]),

  employees: defineTable({
    orgId: v.id("organizations"),

    // Identification
    employeeNumber: v.optional(v.string()),

    // Personal Info
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    emailPersonal: v.optional(v.string()),
    phonePersonal: v.optional(v.string()),
    address: v.optional(v.string()), // Line 1
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),

    gender: v.optional(v.string()), // "male", "female", "other", "prefer_not_to_say"
    dob: v.optional(v.string()), // Date of Birth
    maritalStatus: v.optional(v.union(v.literal("single"), v.literal("married"), v.literal("divorced"), v.literal("widowed"))),
    nationality: v.optional(v.string()),
    title: v.optional(v.union(v.literal("Mr"), v.literal("Ms"), v.literal("Mrs"), v.literal("Dr"), v.literal("Prof"))),
    profilePhotoId: v.optional(v.id("_storage")),

    // Employment Details
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    locationId: v.optional(v.id("locations")),
    managerId: v.optional(v.id("employees")),

    startDate: v.string(),
    endDate: v.optional(v.string()), // For fixed-term or termination
    probationEndDate: v.optional(v.string()),
    confirmationDate: v.optional(v.string()),

    status: v.union(
      v.literal("active"),
      v.literal("terminated"),
      v.literal("on-leave"),
      v.literal("resigned"),
      v.literal("suspended"),
      v.literal("retired")
    ),

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

    shiftId: v.optional(v.id("shifts")),

    // Compensation (Base)
    baseSalary: v.optional(v.number()),
    currency: v.optional(v.string()),
    payFrequency: v.optional(v.union(
      v.literal("monthly"),
      v.literal("bi_weekly"),
      v.literal("weekly")
    )),

  }).index("by_org", ["orgId"])
    .index("by_email", ["email"])
    .index("by_employee_number", ["employeeNumber"])
    .index("by_department", ["departmentId"])
    .index("by_manager", ["managerId"]),

  // --- Related Employee Tables ---

  employee_statutory: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    country: v.string(),
    taxId: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    socialSecurityId: v.optional(v.string()),
    healthInsuranceId: v.optional(v.string()),
    additionalIds: v.optional(v.any()), // Flexible object
  }).index("by_employee", ["employeeId"]),

  employee_banking: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    bankName: v.string(),
    bankBranch: v.optional(v.string()),
    bankCode: v.optional(v.string()),
    accountNumber: v.string(),
    accountName: v.optional(v.string()),
    accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"))),
    isPrimary: v.boolean(),
  }).index("by_employee", ["employeeId"]),

  emergency_contacts: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    phoneAlt: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    isPrimary: v.boolean(),
  }).index("by_employee", ["employeeId"]),

  employee_education: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    institution: v.string(),
    degree: v.string(),
    fieldOfStudy: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    grade: v.optional(v.string()),
  }).index("by_employee", ["employeeId"]),

  employee_certifications: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    name: v.string(),
    issuingOrganization: v.string(),
    issueDate: v.string(),
    expiryDate: v.optional(v.string()),
    credentialId: v.optional(v.string()),
    credentialUrl: v.optional(v.string()),
  }).index("by_employee", ["employeeId"]).index("by_expiry", ["expiryDate"]),

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

  // --- Payroll & Shifts ---

  payroll_credits: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    name: v.string(),
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
    isPermanent: v.boolean(),
    isActive: v.boolean(),
    effectiveFrom: v.optional(v.string()),
    effectiveTo: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    requestDate: v.string(),
    processedDate: v.optional(v.string()),
    processedBy: v.optional(v.id("users")),
  }).index("by_employee", ["employeeId"]).index("by_org_status", ["orgId", "status"]),

  payroll_debits: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    name: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
    itemType: v.union(
      v.literal("loan"),
      v.literal("advance"),
      v.literal("penalty"),
      v.literal("tax"),
      v.literal("statutory"),
      v.literal("other")
    ),
    isPermanent: v.boolean(),
    isActive: v.boolean(),
    // Installments
    totalAmount: v.optional(v.number()),
    instalmentAmount: v.optional(v.number()),
    instalmentsPaid: v.optional(v.number()),
    instalmentsTotal: v.optional(v.number()),
    isCompleted: v.optional(v.boolean()),
    effectiveFrom: v.optional(v.string()),
    effectiveTo: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    requestDate: v.string(),
    processedDate: v.optional(v.string()),
    processedBy: v.optional(v.id("users")),
  }).index("by_employee", ["employeeId"]).index("by_org_status", ["orgId", "status"]),

  shifts: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    code: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    breakDuration: v.optional(v.number()),
    workDays: v.optional(v.array(v.string())),
  }).index("by_org", ["orgId"]),

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

  user_org_permissions: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: v.union(
      v.literal("admin"),
      v.literal("hr_manager"),
      v.literal("manager"),
      v.literal("viewer")
    ),
    permissions: v.optional(v.object({
      canManageEmployees: v.optional(v.boolean()),
      canApproveLeave: v.optional(v.boolean()),
      canRunPayroll: v.optional(v.boolean()),
      canViewReports: v.optional(v.boolean()),
      canManageSettings: v.optional(v.boolean()),
    })),
    grantedAt: v.string(),
    grantedBy: v.id("users"),
  }).index("by_user", ["userId"]).index("by_org", ["orgId"]),

  departments: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
  }).index("by_org", ["orgId"]),

  designations: defineTable({
    orgId: v.id("organizations"),
    title: v.string(),
    code: v.string(),
    level: v.optional(v.number()),
    description: v.optional(v.string()),
  }).index("by_org", ["orgId"]),

  locations: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
  }).index("by_org", ["orgId"]),

  leave_requests: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    type: v.union(v.literal("vacation"), v.literal("sick"), v.literal("personal"), v.literal("maternity"), v.literal("paternity")),
    startDate: v.string(),
    endDate: v.string(),
    days: v.optional(v.number()),
    reason: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("cancelled")),
    managerId: v.optional(v.id("employees")),
    rejectionReason: v.optional(v.string()),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  // --- Core HR MVP Modules ---

  promotions: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    fromDesignationId: v.id("designations"),
    toDesignationId: v.id("designations"),
    promotionDate: v.string(),
    salaryIncrement: v.optional(v.number()),
    remarks: v.optional(v.string()),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  transfers: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    fromDepartmentId: v.id("departments"),
    toDepartmentId: v.id("departments"),
    fromLocationId: v.optional(v.id("locations")),
    toLocationId: v.optional(v.id("locations")),
    transferDate: v.string(),
    remarks: v.optional(v.string()),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  resignations: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    noticeDate: v.string(),
    lastWorkingDay: v.string(),
    reason: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  terminations: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    terminationDate: v.string(),
    type: v.union(v.literal("voluntary"), v.literal("involuntary")),
    reason: v.string(),
    noticeGiven: v.boolean(),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  warnings: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    subject: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    issueDate: v.string(),
    actionTaken: v.optional(v.string()),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  complaints: defineTable({
    orgId: v.id("organizations"),
    complainantId: v.id("employees"),
    accusedId: v.optional(v.id("employees")),
    subject: v.string(),
    description: v.string(),
    date: v.string(),
    status: v.union(v.literal("pending"), v.literal("investigating"), v.literal("resolved"), v.literal("dismissed")),
  }).index("by_org", ["orgId"]).index("by_complainant", ["complainantId"]).index("by_accused", ["accusedId"]),

  awards: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    title: v.string(),
    gift: v.optional(v.string()),
    cashPrice: v.optional(v.number()),
    date: v.string(),
    description: v.optional(v.string()),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  travel_requests: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    purpose: v.string(),
    budget: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  }).index("by_org", ["orgId"]).index("by_employee", ["employeeId"]),

  // --- User Onboarding ---

  org_join_requests: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    requestedAt: v.string(),
    processedAt: v.optional(v.string()),
    processedBy: v.optional(v.id("users")),
    note: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  }).index("by_org", ["orgId"]).index("by_user", ["userId"]).index("by_org_status", ["orgId", "status"]),

  // --- Time & Attendance ---

  attendance_records: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    date: v.string(), // YYYY-MM-DD format
    clockIn: v.optional(v.string()), // ISO timestamp
    clockOut: v.optional(v.string()), // ISO timestamp
    breakMinutes: v.optional(v.number()), // Total break time in minutes
    workMinutes: v.optional(v.number()), // Calculated work time in minutes
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("half-day"),
      v.literal("on-leave"),
      v.literal("holiday")
    ),
    notes: v.optional(v.string()),
    // For manual entry or corrections
    isManualEntry: v.optional(v.boolean()),
    approvedBy: v.optional(v.id("employees")),
  })
    .index("by_org", ["orgId"])
    .index("by_employee", ["employeeId"])
    .index("by_date", ["date"])
    .index("by_employee_date", ["employeeId", "date"]),

  attendance_trust_events: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    attendanceRecordId: v.optional(v.id("attendance_records")),
    eventType: v.union(
      v.literal("clock_in"),
      v.literal("clock_out"),
      v.literal("manual_entry")
    ),
    capturedAt: v.string(),
    riskScore: v.number(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    policyMode: v.union(
      v.literal("observe"),
      v.literal("warn"),
      v.literal("hold"),
      v.literal("deny")
    ),
    decision: v.union(
      v.literal("observed"),
      v.literal("allowed"),
      v.literal("warned"),
      v.literal("held"),
      v.literal("denied"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    requiresReason: v.boolean(),
    reasonCode: v.optional(v.string()),
    reasonText: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.string()),
    reviewNote: v.optional(v.string()),
    pendingAction: v.optional(v.object({
      type: v.string(),
      payload: v.any(),
    })),
    reasons: v.array(v.string()),
    signals: v.object({
      deviceIdHash: v.optional(v.string()),
      ipHash: v.optional(v.string()),
      userAgentHash: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      accuracyMeters: v.optional(v.number()),
      reasonCode: v.optional(v.string()),
    }),
  })
    .index("by_org", ["orgId"])
    .index("by_employee", ["employeeId"])
    .index("by_org_event_type", ["orgId", "eventType"])
    .index("by_org_decision", ["orgId", "decision"]),

  attendance_trusted_devices: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.id("employees"),
    deviceIdHash: v.string(),
    firstSeenAt: v.string(),
    lastSeenAt: v.string(),
    punchCount: v.number(),
    status: v.union(v.literal("active"), v.literal("revoked")),
  })
    .index("by_org_employee", ["orgId", "employeeId"])
    .index("by_employee_device", ["employeeId", "deviceIdHash"]),

  attendance_trust_policies: defineTable({
    orgId: v.id("organizations"),
    mode: v.union(v.literal("observe"), v.literal("warn"), v.literal("hold"), v.literal("deny")),
    warnThreshold: v.number(),
    holdThreshold: v.number(),
    denyThreshold: v.number(),
    requireReasonAtRisk: v.union(v.literal("medium"), v.literal("high")),
    impossibleTravelSpeedKph: v.number(),
    geofence: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      radiusMeters: v.number(),
    })),
    enabled: v.boolean(),
    updatedBy: v.id("users"),
    updatedAt: v.string(),
  }).index("by_org", ["orgId"]),

  // Work schedule configuration per employee (optional override of org defaults)
  work_schedules: defineTable({
    orgId: v.id("organizations"),
    employeeId: v.optional(v.id("employees")), // If null, this is the org default
    dayOfWeek: v.number(), // 0 = Sunday, 1 = Monday, etc.
    isWorkDay: v.boolean(),
    startTime: v.optional(v.string()), // HH:MM format
    endTime: v.optional(v.string()), // HH:MM format
    breakMinutes: v.optional(v.number()), // Expected break duration
  })
    .index("by_org", ["orgId"])
    .index("by_employee", ["employeeId"]),

  // --- Maker-Checker / Audit System ---

  payroll_runs: defineTable({
    orgId: v.id("organizations"),
    month: v.number(), // 1-12
    year: v.number(),
    status: v.union(v.literal("draft"), v.literal("processing"), v.literal("completed")),
    totalNetPay: v.optional(v.number()),
    totalGrossPay: v.optional(v.number()),
    employeeCount: v.optional(v.number()),
    runDate: v.string(),
    processedBy: v.optional(v.id("users")),
  }).index("by_org", ["orgId"]).index("by_org_period", ["orgId", "year", "month"]),

  salary_slips: defineTable({
    orgId: v.id("organizations"),
    runId: v.id("payroll_runs"),
    employeeId: v.id("employees"),

    // Snapshots of the employee state at the time of run
    employeeName: v.string(),
    designation: v.optional(v.string()),
    department: v.optional(v.string()),
    joinDate: v.string(),

    // Financials
    basicSalary: v.number(),
    grossSalary: v.number(),
    netSalary: v.number(),

    // Breakdown
    earnings: v.any(), // Array of { name, amount, type }
    deductions: v.any(), // Array of { name, amount, type }
    employerContributions: v.optional(v.any()), // Array of { name, amount, type }

    generatedAt: v.string(),
  }).index("by_run", ["runId"]).index("by_employee", ["employeeId"]),

  change_requests: defineTable({
    orgId: v.id("organizations"),

    // The "Maker" (Who initiated the request)
    requesterUserId: v.id("users"),

    // Target Resource
    targetTable: v.string(), // e.g., "employees", "employee_banking"
    targetId: v.optional(v.string()), // The ID of the record being modified (optional for 'create' ops)

    // The Operation
    operation: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("delete")
    ),

    // Data Snapshots
    newData: v.optional(v.any()), // The proposed state
    oldData: v.optional(v.any()), // The state at time of request (for diffing)

    // Context
    reason: v.optional(v.string()), // Justification for the change

    // The "Checker" Workflow
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),

    // Timestamps & Processing
    createdAt: v.string(),
    updatedAt: v.string(),

    approverUserId: v.optional(v.id("users")), // The Checker who finalized it
    rejectionReason: v.optional(v.string()),
  })
  .index("by_org_status", ["orgId", "status"])
  .index("by_target", ["orgId", "targetTable", "targetId"])
  .index("by_requester", ["orgId", "requesterUserId"]),

  approval_workflows: defineTable({
    orgId: v.id("organizations"),
    key: v.string(),
    name: v.string(),
    targetTable: v.string(),
    minApprovals: v.number(),
    steps: v.any(),
    escalationHours: v.optional(v.number()),
    resolutionHours: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
    createdBy: v.id("users"),
  })
    .index("by_org", ["orgId"])
    .index("by_org_key", ["orgId", "key"]),

  workflow_instances: defineTable({
    orgId: v.id("organizations"),
    workflowId: v.id("approval_workflows"),
    targetTable: v.string(),
    targetId: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"), v.literal("cancelled")),
    pendingStep: v.optional(v.number()),
    dueAt: v.optional(v.string()),
    escalationDueAt: v.optional(v.string()),
    escalatedAt: v.optional(v.string()),
    escalationCount: v.optional(v.number()),
    currentAssigneeUserId: v.optional(v.id("users")),
    requestedBy: v.id("users"),
    requestedAt: v.string(),
    resolvedAt: v.optional(v.string()),
    updatedAt: v.string(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"])
    .index("by_target", ["orgId", "targetTable", "targetId"])
    .index("by_org_status_due", ["orgId", "status", "dueAt"]),

  workflow_actions: defineTable({
    orgId: v.id("organizations"),
    instanceId: v.id("workflow_instances"),
    actorUserId: v.id("users"),
    action: v.union(v.literal("approve"), v.literal("reject"), v.literal("delegate"), v.literal("escalate")),
    stepNumber: v.optional(v.number()),
    comment: v.optional(v.string()),
    delegatedToUserId: v.optional(v.id("users")),
    actedAt: v.string(),
  })
    .index("by_instance", ["instanceId"])
    .index("by_org_actor", ["orgId", "actorUserId"]),

  report_schedules: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    reportType: v.union(
      v.literal("attendance"),
      v.literal("payroll"),
      v.literal("tax"),
      v.literal("headcount"),
      v.literal("attrition"),
      v.literal("leave_liability"),
      v.literal("payroll_variance")
    ),
    cadence: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    format: v.union(v.literal("csv"), v.literal("json")),
    recipients: v.array(v.string()),
    isActive: v.boolean(),
    filters: v.optional(v.any()),
    lastRunAt: v.optional(v.string()),
    lastAttemptAt: v.optional(v.string()),
    nextRunAt: v.optional(v.string()),
    timezone: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_active", ["orgId", "isActive"]),

  report_delivery_logs: defineTable({
    orgId: v.id("organizations"),
    scheduleId: v.optional(v.id("report_schedules")),
    reportType: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    trigger: v.union(v.literal("manual"), v.literal("scheduled"), v.literal("retry")),
    periodKey: v.optional(v.string()),
    generatedAt: v.string(),
    generatedBy: v.id("users"),
    recipientCount: v.number(),
    artifactPath: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"]),

  ops_alert_routes: defineTable({
    environment: v.union(v.literal("development"), v.literal("staging"), v.literal("production")),
    severity: v.union(v.literal("p1"), v.literal("p2"), v.literal("p3")),
    service: v.string(),
    channel: v.union(v.literal("email"), v.literal("slack"), v.literal("pagerduty"), v.literal("webhook")),
    target: v.string(),
    isActive: v.boolean(),
    updatedBy: v.id("users"),
    updatedAt: v.string(),
  })
    .index("by_environment", ["environment"])
    .index("by_environment_severity", ["environment", "severity"]),

  incident_templates: defineTable({
    incidentKey: v.string(),
    environment: v.union(v.literal("development"), v.literal("staging"), v.literal("production")),
    severity: v.union(v.literal("p1"), v.literal("p2"), v.literal("p3")),
    title: v.string(),
    status: v.union(v.literal("open"), v.literal("mitigated"), v.literal("resolved")),
    detectedAt: v.string(),
    affectedModules: v.array(v.string()),
    affectedOrgs: v.optional(v.array(v.id("organizations"))),
    ownerUserId: v.id("users"),
    markdown: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_environment_status", ["environment", "status"])
    .index("by_detected_at", ["detectedAt"])
    .index("by_incident_key", ["incidentKey"]),

  // --- Notifications ---

  notifications: defineTable({
    orgId: v.id("organizations"),
    userId: v.id("users"), // Recipient
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    link: v.optional(v.string()), // URL to navigate to
    isRead: v.boolean(),
    createdAt: v.string(),
    relatedId: v.optional(v.string()), // ID of related entity (e.g., leaveRequestId)
    relatedTable: v.optional(v.string()), // Table name of related entity
  })
  .index("by_user_read", ["userId", "isRead"])
  .index("by_user_date", ["userId", "createdAt"]),

  // --- Settings & Configuration ---

  organization_settings: defineTable({
    orgId: v.id("organizations"),
    currency: v.string(), // Default currency (e.g., "USD", "KES")
    timezone: v.string(), // e.g., "Africa/Nairobi"
    dateFormat: v.string(), // e.g., "DD/MM/YYYY"
    workDays: v.array(v.number()), // [1, 2, 3, 4, 5] for Mon-Fri
    updatedAt: v.string(),
    updatedBy: v.id("users"),
  }).index("by_org", ["orgId"]),

  leave_policies: defineTable({
    orgId: v.id("organizations"),
    name: v.string(), // e.g., "Standard Vacation", "Sick Leave"
    code: v.string(), // e.g., "AL", "SL" (must be unique per org)
    type: v.union(
        v.literal("vacation"),
        v.literal("sick"),
        v.literal("personal"),
        v.literal("maternity"),
        v.literal("paternity"),
        v.literal("other") // Allow custom types mapped to 'other' for now, or expand union
    ),
    daysPerYear: v.number(), // Entitlement
    accrualFrequency: v.union(v.literal("annual"), v.literal("monthly")),
    carryOverDays: v.optional(v.number()), // Max days to carry over
    description: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_org", ["orgId"]),

  // --- Tax & Statutory Configuration ---

  tax_regions: defineTable({
    code: v.string(), // "KE", "US", "UK", etc.
    name: v.string(), // "Kenya", "United States", etc.
    currency: v.string(), // "KES", "USD", etc.
    isActive: v.boolean(),
    personalRelief: v.optional(v.number()), // Monthly personal relief amount
    updatedAt: v.string(),
  }).index("by_code", ["code"]),

  tax_rules: defineTable({
    regionCode: v.string(), // Foreign key to tax_regions.code
    name: v.string(), // "PAYE", "NSSF Tier I", "NHIF", "Housing Levy"
    code: v.string(), // "PAYE", "NSSF_T1", "NHIF", "HOUSING_LEVY"
    type: v.union(
      v.literal("progressive_bracket"), // PAYE style
      v.literal("percentage"), // Simple percentage
      v.literal("tiered_fixed"), // NHIF style (band → fixed amount)
      v.literal("capped_percentage") // NSSF style (% up to cap)
    ),
    // For percentage/capped_percentage types
    rate: v.optional(v.number()), // e.g., 0.06 for 6%
    cap: v.optional(v.number()), // Max contribution
    // For bracket-based types, store as JSON array
    brackets: v.optional(v.any()), // Array of {min, max, rate, fixedAmount}
    // Calculation base
    appliesTo: v.union(
      v.literal("gross"),
      v.literal("basic"),
      v.literal("taxable") // After other deductions
    ),
    isEmployeeContribution: v.boolean(),
    isEmployerContribution: v.optional(v.boolean()),
    isActive: v.boolean(),
    order: v.number(), // Processing order
    effectiveFrom: v.string(),
    effectiveTo: v.optional(v.string()),
  }).index("by_region", ["regionCode"]).index("by_region_active", ["regionCode", "isActive"]),

  // --- Recruitment (ATS) ---

  jobs: defineTable({
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    departmentId: v.optional(v.id("departments")),
    locationId: v.optional(v.id("locations")),
    employmentType: v.union(
      v.literal("full_time"),
      v.literal("part_time"),
      v.literal("contract"),
      v.literal("intern"),
      v.literal("temporary")
    ),
    status: v.union(v.literal("draft"), v.literal("open"), v.literal("closed")),
    closingDate: v.optional(v.string()),
    salaryRange: v.optional(v.string()), // e.g. "50k-70k"
    createdBy: v.id("users"),
    createdAt: v.string(),
  }).index("by_org_status", ["orgId", "status"]),

  candidates: defineTable({
    orgId: v.id("organizations"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    resumeId: v.optional(v.id("_storage")),
    source: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_org_email", ["orgId", "email"]),

  applications: defineTable({
    orgId: v.id("organizations"),
    jobId: v.id("jobs"),
    candidateId: v.id("candidates"),
    status: v.union(
      v.literal("new"),
      v.literal("screening"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
    appliedAt: v.string(),
    rating: v.optional(v.number()), // 1-5
    notes: v.optional(v.string()),
  })
  .index("by_job", ["jobId"])
  .index("by_candidate", ["candidateId"])
  .index("by_org_status", ["orgId", "status"]),

  // --- Training & Development ---

  training_courses: defineTable({
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    instructor: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    type: v.union(
      v.literal("workshop"),
      v.literal("seminar"),
      v.literal("online"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("upcoming"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    capacity: v.optional(v.number()),
    createdBy: v.id("users"),
  }).index("by_org_status", ["orgId", "status"]),

  training_enrollments: defineTable({
    orgId: v.id("organizations"),
    courseId: v.id("training_courses"),
    employeeId: v.id("employees"),
    status: v.union(
      v.literal("enrolled"),
      v.literal("completed"),
      v.literal("dropped"),
      v.literal("failed")
    ),
    progress: v.optional(v.number()), // 0-100
    enrollmentDate: v.string(),
    completionDate: v.optional(v.string()),
    certificateId: v.optional(v.id("_storage")),
  })
  .index("by_course", ["courseId"])
  .index("by_employee", ["employeeId"])
  .index("by_employee_course", ["employeeId", "courseId"]),
});
