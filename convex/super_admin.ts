import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Super admin only - no org scope required
async function getSuperAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || user.role !== "super_admin") {
    throw new Error("Unauthorized: Super admin access required");
  }

  return user;
}

// List all organizations with stats
export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    await getSuperAdmin(ctx);

    const orgs = await ctx.db.query("organizations").collect();

    const enrichedOrgs = await Promise.all(
      orgs.map(async (org) => {
        // Count users in this org
        const users = await ctx.db
          .query("users")
          .withIndex("by_org", (q) => q.eq("orgId", org._id))
          .collect();

        // Count employees in this org
        const employees = await ctx.db
          .query("employees")
          .withIndex("by_org", (q) => q.eq("orgId", org._id))
          .collect();

        // Count pending join requests
        const pendingRequests = await ctx.db
          .query("org_join_requests")
          .withIndex("by_org_status", (q) => q.eq("orgId", org._id).eq("status", "pending"))
          .collect();

        return {
          ...org,
          userCount: users.length,
          employeeCount: employees.length,
          pendingRequestCount: pendingRequests.length,
        };
      })
    );

    return enrichedOrgs;
  },
});

// Get system-wide stats for super admin dashboard
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    await getSuperAdmin(ctx);

    const orgs = await ctx.db.query("organizations").collect();
    const users = await ctx.db.query("users").collect();
    const employees = await ctx.db.query("employees").collect();

    const activeOrgs = orgs.filter((o) => o.status === "active").length;
    const suspendedOrgs = orgs.filter((o) => o.status === "suspended").length;

    const pendingUsers = users.filter((u) => u.role === "pending").length;
    const activeUsers = users.filter((u) => u.role !== "pending" && u.orgId).length;

    return {
      totalOrganizations: orgs.length,
      activeOrganizations: activeOrgs,
      suspendedOrganizations: suspendedOrgs,
      totalUsers: users.length,
      activeUsers,
      pendingUsers,
      totalEmployees: employees.length,
    };
  },
});

// Create a new organization (super admin only)
export const createOrganization = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    subscriptionPlan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    await getSuperAdmin(ctx);

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      domain: args.domain,
      subscriptionPlan: args.subscriptionPlan,
      status: "active",
    });

    return orgId;
  },
});

// Update organization status (suspend/activate)
export const updateOrganizationStatus = mutation({
  args: {
    orgId: v.id("organizations"),
    status: v.union(v.literal("active"), v.literal("suspended")),
  },
  handler: async (ctx, args) => {
    await getSuperAdmin(ctx);

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(args.orgId, { status: args.status });
  },
});

// Update organization details
export const updateOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    domain: v.optional(v.string()),
    subscriptionPlan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    await getSuperAdmin(ctx);

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(args.orgId, {
      name: args.name,
      domain: args.domain,
      subscriptionPlan: args.subscriptionPlan,
    });
  },
});

// Get organization details with full stats
export const getOrganization = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, args) => {
    await getSuperAdmin(ctx);

    const org = await ctx.db.get(args.orgId);
    if (!org) return null;

    // Get users
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get employees
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get departments
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Get pending requests
    const pendingRequests = await ctx.db
      .query("org_join_requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", args.orgId).eq("status", "pending"))
      .collect();

    return {
      ...org,
      users: users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        employeeId: u.employeeId,
      })),
      employeeCount: employees.length,
      departmentCount: departments.length,
      pendingRequestCount: pendingRequests.length,
    };
  },
});

// Assign a user to an organization (super admin can add anyone anywhere)
export const assignUserToOrg = mutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("hr_manager"), v.literal("manager"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    await getSuperAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const org = await ctx.db.get(args.orgId);
    if (!org) throw new Error("Organization not found");

    await ctx.db.patch(args.userId, {
      orgId: args.orgId,
      role: args.role,
    });
  },
});

// List all pending users (no org assigned)
export const listPendingUsers = query({
  args: {},
  handler: async (ctx) => {
    await getSuperAdmin(ctx);

    const users = await ctx.db.query("users").collect();

    return users
      .filter((u) => u.role === "pending" || !u.orgId)
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image,
      }));
  },
});
