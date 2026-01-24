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
  }).index("by_domain", ["domain"]).index("by_status", ["status"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("hr_manager"), v.literal("employee"), v.literal("manager"), v.literal("pending")),
    orgId: v.optional(v.id("organizations")),
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
});
