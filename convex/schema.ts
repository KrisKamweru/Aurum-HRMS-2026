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
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    locationId: v.optional(v.id("locations")),
    startDate: v.string(),
    status: v.union(v.literal("active"), v.literal("terminated"), v.literal("on-leave"), v.literal("resigned")),
    managerId: v.optional(v.id("employees")),
    // Personal Info
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    gender: v.optional(v.string()),
    dob: v.optional(v.string()),
  }).index("by_org", ["orgId"]).index("by_email", ["email"]),

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
