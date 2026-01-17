import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get viewer info including role
async function getViewerInfo(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

function isPrivileged(role: string) {
  return ["super_admin", "admin", "hr_manager"].includes(role);
}

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

// Get users in org who don't have an employeeId linked
export const getUnlinkedUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);

    if (!isPrivileged(user.role ?? "")) {
      return [];
    }

    const orgId = user.orgId!;

    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("employeeId"), undefined))
      .collect();

    return users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      image: u.image,
      role: u.role,
    }));
  },
});

// Get employees in org who don't have a linked user
export const getUnlinkedEmployees = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);

    if (!isPrivileged(user.role ?? "")) {
      return [];
    }

    const orgId = user.orgId!;

    // Get all users' employeeIds
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const linkedEmployeeIds = new Set(
      users.filter(u => u.employeeId).map(u => u.employeeId!.toString())
    );

    // Get all employees
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Filter to unlinked
    return employees
      .filter(emp => !linkedEmployeeIds.has(emp._id.toString()))
      .map(emp => ({
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        status: emp.status,
      }));
  },
});

// Link a user to an employee
export const linkUserToEmployee = mutation({
  args: {
    userId: v.id("users"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const admin = await getViewerInfo(ctx);

    if (!isPrivileged(admin.role ?? "")) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const orgId = admin.orgId!;

    // Verify user belongs to same org
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.orgId !== orgId) {
      throw new Error("User not found or not in your organization");
    }

    // Verify employee belongs to same org
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.orgId !== orgId) {
      throw new Error("Employee not found or not in your organization");
    }

    // Check if employee is already linked to another user
    const existingLink = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("employeeId"), args.employeeId))
      .first();

    if (existingLink) {
      throw new Error("This employee is already linked to another user");
    }

    // Link them
    await ctx.db.patch(args.userId, {
      employeeId: args.employeeId,
    });

    // Update employee email to match user email if different
    if (employee.email !== targetUser.email) {
      await ctx.db.patch(args.employeeId, {
        email: targetUser.email,
      });
    }
  },
});

// Unlink a user from their employee record
export const unlinkUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await getViewerInfo(ctx);

    if (!isPrivileged(admin.role ?? "")) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const orgId = admin.orgId!;

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.orgId !== orgId) {
      throw new Error("User not found or not in your organization");
    }

    await ctx.db.patch(args.userId, {
      employeeId: undefined,
    });
  },
});

// Create an employee and link it to a user in one operation
export const createEmployeeForUser = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getViewerInfo(ctx);

    if (!isPrivileged(admin.role ?? "")) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const orgId = admin.orgId!;

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.orgId !== orgId) {
      throw new Error("User not found or not in your organization");
    }

    if (targetUser.employeeId) {
      throw new Error("User already has an employee record");
    }

    // Create employee
    const employeeId = await ctx.db.insert("employees", {
      orgId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: targetUser.email,
      departmentId: args.departmentId,
      designationId: args.designationId,
      startDate: args.startDate,
      status: "active",
    });

    // Link to user
    await ctx.db.patch(args.userId, {
      employeeId,
    });

    return employeeId;
  },
});
