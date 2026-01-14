import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("employee")),
    employeeId: v.optional(v.id("employees")),
  }).index("email", ["email"]),

  employees: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    department: v.string(),
    position: v.string(),
    startDate: v.string(),
    status: v.union(v.literal("active"), v.literal("terminated"), v.literal("on-leave")),
    managerId: v.optional(v.id("employees")),
  }),

  leave_requests: defineTable({
    employeeId: v.id("employees"),
    type: v.union(v.literal("vacation"), v.literal("sick"), v.literal("personal")),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  }).index("by_employee", ["employeeId"]),

  departments: defineTable({
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
  }),

  designations: defineTable({
    title: v.string(),
    code: v.string(),
    level: v.optional(v.number()),
    description: v.optional(v.string()),
  }),

  locations: defineTable({
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
  }),
});
