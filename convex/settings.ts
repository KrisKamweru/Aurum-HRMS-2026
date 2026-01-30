import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get viewer info
async function getViewerInfo(ctx: QueryCtx | any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

function isPrivileged(role: string) {
  return ["super_admin", "admin", "hr_manager"].includes(role);
}

// --- Organization Settings ---

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    const settings = await ctx.db
      .query("organization_settings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .unique();

    if (!settings) {
      // Return defaults if not set
      return {
        currency: "USD",
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY",
        workDays: [1, 2, 3, 4, 5], // Mon-Fri
      };
    }

    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    currency: v.string(),
    timezone: v.string(),
    dateFormat: v.string(),
    workDays: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const existing = await ctx.db
      .query("organization_settings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: new Date().toISOString(),
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("organization_settings", {
        orgId,
        ...args,
        updatedAt: new Date().toISOString(),
        updatedBy: user._id,
      });
    }
  },
});

// --- Leave Policies ---

export const listLeavePolicies = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    const policies = await ctx.db
      .query("leave_policies")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // If no policies exist, we could return defaults or let the frontend prompt to seed
    if (policies.length === 0 && isPrivileged(user.role)) {
        // Optional: Maybe we should seed defaults here?
        // For now, let's just return empty and let UI handle "No policies defined"
    }

    return policies;
  },
});

export const createLeavePolicy = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    type: v.union(
        v.literal("vacation"),
        v.literal("sick"),
        v.literal("personal"),
        v.literal("maternity"),
        v.literal("paternity"),
        v.literal("other")
    ),
    daysPerYear: v.number(),
    accrualFrequency: v.union(v.literal("annual"), v.literal("monthly")),
    carryOverDays: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // Check unique code
    const existing = await ctx.db
        .query("leave_policies")
        .withIndex("by_org", q => q.eq("orgId", orgId))
        .filter(q => q.eq(q.field("code"), args.code))
        .first();

    if (existing) {
        throw new Error(`Policy with code '${args.code}' already exists`);
    }

    await ctx.db.insert("leave_policies", {
      orgId,
      ...args,
      isActive: true,
    });
  },
});

export const updateLeavePolicy = mutation({
  args: {
    id: v.id("leave_policies"),
    updates: v.object({
        name: v.optional(v.string()),
        daysPerYear: v.optional(v.number()),
        accrualFrequency: v.optional(v.union(v.literal("annual"), v.literal("monthly"))),
        carryOverDays: v.optional(v.number()),
        description: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    })
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const policy = await ctx.db.get(args.id);
    if (!policy || policy.orgId !== orgId) {
        throw new Error("Policy not found");
    }

    await ctx.db.patch(args.id, args.updates);
  },
});

export const deleteLeavePolicy = mutation({
    args: { id: v.id("leave_policies") },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const orgId = user.orgId!;

        if (!isPrivileged(user.role)) {
            throw new Error("Unauthorized: Insufficient permissions");
        }

        const policy = await ctx.db.get(args.id);
        if (!policy || policy.orgId !== orgId) {
            throw new Error("Policy not found");
        }

        // Check if any leave requests use this type?
        // Our leave requests use a string 'type' (vacation, sick, etc.) which matches the policy type.
        // We aren't linking by ID yet. The schema says 'type' is one of the literals.
        // If we delete a policy, existing requests remain but new ones can't be validated against it if validation logic depends on policy existence.
        // For now, allow delete.

        await ctx.db.delete(args.id);
    }
});

// Seed default policies (helper)
export const seedDefaultPolicies = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await getViewerInfo(ctx);
        const orgId = user.orgId!;

        if (!isPrivileged(user.role)) {
            throw new Error("Unauthorized");
        }

        const defaults = [
            { name: "Annual Vacation", code: "AL", type: "vacation", daysPerYear: 15, accrualFrequency: "annual" },
            { name: "Sick Leave", code: "SL", type: "sick", daysPerYear: 10, accrualFrequency: "annual" },
            { name: "Personal Leave", code: "PL", type: "personal", daysPerYear: 5, accrualFrequency: "annual" },
            { name: "Maternity Leave", code: "ML", type: "maternity", daysPerYear: 90, accrualFrequency: "annual" },
            { name: "Paternity Leave", code: "PtL", type: "paternity", daysPerYear: 14, accrualFrequency: "annual" },
        ];

        for (const p of defaults) {
            // Check if exists by type to avoid dupes on re-seed
            const exists = await ctx.db
                .query("leave_policies")
                .withIndex("by_org", q => q.eq("orgId", orgId))
                .filter(q => q.eq(q.field("type"), p.type))
                .first();

            if (!exists) {
                await ctx.db.insert("leave_policies", {
                    orgId,
                    name: p.name,
                    code: p.code,
                    type: p.type as any,
                    daysPerYear: p.daysPerYear,
                    accrualFrequency: p.accrualFrequency as any,
                    isActive: true,
                });
            }
        }
    }
});
