import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
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

// --- Departments ---

export const listDepartments = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getViewerInfo(ctx);
      const orgId = user.orgId!;
      return await ctx.db
        .query("departments")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    } catch (e) {
      return [];
    }
  },
});

export const createDepartment = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    return await ctx.db.insert("departments", { orgId, ...args });
  },
});

export const updateDepartment = mutation({
  args: {
    id: v.id("departments"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    managerId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.orgId !== orgId) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteDepartment = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.orgId !== orgId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

// --- Designations ---

export const listDesignations = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getViewerInfo(ctx);
      const orgId = user.orgId!;
      return await ctx.db
        .query("designations")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    } catch (e) {
      return [];
    }
  },
});

export const createDesignation = mutation({
  args: {
    title: v.string(),
    code: v.string(),
    level: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    return await ctx.db.insert("designations", { orgId, ...args });
  },
});

export const updateDesignation = mutation({
  args: {
    id: v.id("designations"),
    title: v.string(),
    code: v.string(),
    level: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.orgId !== orgId) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteDesignation = mutation({
  args: { id: v.id("designations") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.orgId !== orgId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

// --- Locations ---

export const listLocations = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getViewerInfo(ctx);
      const orgId = user.orgId!;
      return await ctx.db
        .query("locations")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    } catch (e) {
      return [];
    }
  },
});

export const createLocation = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    return await ctx.db.insert("locations", { orgId, ...args });
  },
});

export const updateLocation = mutation({
  args: {
    id: v.id("locations"),
    name: v.string(),
    address: v.string(),
    city: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.orgId !== orgId) throw new Error("Unauthorized");

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteLocation = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.orgId !== orgId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});
