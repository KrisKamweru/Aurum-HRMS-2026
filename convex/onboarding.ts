import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to check privileges
function isPrivileged(role: string) {
  return ["super_admin", "admin", "hr_manager"].includes(role);
}

// Queries

export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    // Publicly visible info for joining - only active orgs
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_status", q => q.eq("status", "active"))
      .collect();

    return orgs.map(org => ({
      _id: org._id,
      name: org.name,
      domain: org.domain,
    }));
  },
});

export const getMatchingOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || !user.email) return [];

    const parts = user.email.split('@');
    if (parts.length < 2) return [];
    const emailDomain = parts[1];

    // Find orgs with matching domain
    const orgs = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", emailDomain))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return orgs.map(org => ({
      _id: org._id,
      name: org.name,
      domain: org.domain,
    }));
  },
});

export const getMyJoinRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("org_join_requests")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const enriched = await Promise.all(requests.map(async (req) => {
        const org = await ctx.db.get(req.orgId);
        return {
            ...req,
            orgName: org?.name || "Unknown Organization"
        };
    }));

    return enriched;
  },
});

export const getPendingJoinRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user || !user.orgId || !isPrivileged(user.role ?? "")) {
        return [];
    }

    const requests = await ctx.db
      .query("org_join_requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", user.orgId!).eq("status", "pending"))
      .collect();

    const enriched = await Promise.all(requests.map(async (req) => {
        const requester = await ctx.db.get(req.userId);
        return {
            ...req,
            requesterName: requester?.name,
            requesterEmail: requester?.email,
            requesterImage: requester?.image
        };
    }));

    return enriched;
  },
});

// Mutations

export const createJoinRequest = mutation({
  args: {
    orgId: v.id("organizations"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (user?.orgId) throw new Error("User already belongs to an organization");

    // Check existing pending request for this org
    const existing = await ctx.db
        .query("org_join_requests")
        .withIndex("by_user", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("orgId"), args.orgId))
        .first();

    if (existing && existing.status === "pending") {
        throw new Error("You already have a pending request for this organization");
    }

    await ctx.db.insert("org_join_requests", {
        userId,
        orgId: args.orgId,
        status: "pending",
        requestedAt: new Date().toISOString(),
        note: args.note,
    });
  },
});

export const cancelJoinRequest = mutation({
    args: {
        requestId: v.id("org_join_requests")
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        if (request.userId !== userId) throw new Error("Unauthorized to cancel this request");
        if (request.status !== "pending") throw new Error("Cannot cancel a processed request");

        await ctx.db.delete(args.requestId);
    }
});

export const approveJoinRequest = mutation({
    args: {
        requestId: v.id("org_join_requests"),
        role: v.optional(v.union(v.literal("admin"), v.literal("hr_manager"), v.literal("employee"), v.literal("manager")))
    },
    handler: async (ctx, args) => {
        const adminId = await getAuthUserId(ctx);
        if (!adminId) throw new Error("Unauthorized");

        const admin = await ctx.db.get(adminId);
        if (!admin || !admin.orgId || !isPrivileged(admin.role ?? "")) {
            throw new Error("Unauthorized: Insufficient permissions");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        if (request.orgId !== admin.orgId) {
            throw new Error("Unauthorized: Request is for a different organization");
        }

        if (request.status !== "pending") throw new Error("Request is not pending");

        const targetUser = await ctx.db.get(request.userId);
        if (!targetUser) throw new Error("User not found");
        if (targetUser.orgId) throw new Error("User is already a member of an organization");

        // 1. Update Request
        await ctx.db.patch(args.requestId, {
            status: "approved",
            processedAt: new Date().toISOString(),
            processedBy: adminId
        });

        // 2. Update User
        await ctx.db.patch(request.userId, {
            orgId: admin.orgId,
            role: args.role ?? "employee"
        });
    }
});

export const rejectJoinRequest = mutation({
    args: {
        requestId: v.id("org_join_requests"),
        reason: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const adminId = await getAuthUserId(ctx);
        if (!adminId) throw new Error("Unauthorized");

        const admin = await ctx.db.get(adminId);
        if (!admin || !admin.orgId || !isPrivileged(admin.role ?? "")) {
            throw new Error("Unauthorized: Insufficient permissions");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request) throw new Error("Request not found");

        if (request.orgId !== admin.orgId) {
            throw new Error("Unauthorized: Request is for a different organization");
        }

        if (request.status !== "pending") throw new Error("Request is not pending");

        await ctx.db.patch(args.requestId, {
            status: "rejected",
            processedAt: new Date().toISOString(),
            processedBy: adminId,
            rejectionReason: args.reason
        });
    }
});

// --- Organization Creation Wizard ---

export const createOrganizationWithSetup = mutation({
    args: {
        // Step 1: Organization Details
        organization: v.object({
            name: v.string(),
            domain: v.optional(v.string()),
        }),
        // Step 2: Departments
        departments: v.array(v.object({
            name: v.string(),
            code: v.string(),
            description: v.optional(v.string()),
        })),
        // Step 3: Designations
        designations: v.array(v.object({
            title: v.string(),
            code: v.string(),
            level: v.optional(v.number()),
            description: v.optional(v.string()),
        })),
        // Step 4: First Admin (the creator)
        adminEmployee: v.object({
            firstName: v.string(),
            lastName: v.string(),
            phone: v.optional(v.string()),
            departmentIndex: v.optional(v.number()), // Index into departments array
            designationIndex: v.optional(v.number()), // Index into designations array
        }),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");
        if (user.orgId) throw new Error("User already belongs to an organization");

        // 1. Create Organization
        const orgId = await ctx.db.insert("organizations", {
            name: args.organization.name,
            domain: args.organization.domain,
            subscriptionPlan: "free",
            status: "active",
        });

        // 2. Create Departments
        const departmentIds: string[] = [];
        for (const dept of args.departments) {
            const deptId = await ctx.db.insert("departments", {
                orgId,
                name: dept.name,
                code: dept.code,
                description: dept.description,
            });
            departmentIds.push(deptId);
        }

        // 3. Create Designations
        const designationIds: string[] = [];
        for (const desig of args.designations) {
            const desigId = await ctx.db.insert("designations", {
                orgId,
                title: desig.title,
                code: desig.code,
                level: desig.level,
                description: desig.description,
            });
            designationIds.push(desigId);
        }

        // 4. Create Admin Employee Record
        const departmentId = args.adminEmployee.departmentIndex !== undefined
            ? departmentIds[args.adminEmployee.departmentIndex] as any
            : undefined;
        const designationId = args.adminEmployee.designationIndex !== undefined
            ? designationIds[args.adminEmployee.designationIndex] as any
            : undefined;

        const employeeId = await ctx.db.insert("employees", {
            orgId,
            firstName: args.adminEmployee.firstName,
            lastName: args.adminEmployee.lastName,
            email: user.email,
            departmentId,
            designationId,
            startDate: new Date().toISOString().split('T')[0],
            status: "active",
            phone: args.adminEmployee.phone,
        });

        // 5. Update User to be admin of this org
        await ctx.db.patch(userId, {
            orgId,
            role: "admin",
            employeeId,
        });

        return { orgId, employeeId };
    },
});
