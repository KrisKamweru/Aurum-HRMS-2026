import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// List all employees
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      // In a real app, we might return empty or throw, but for now let's return empty
      return [];
    }
    return await ctx.db.query("employees").collect();
  },
});

// Create a new employee
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    department: v.string(),
    position: v.string(),
    status: v.union(v.literal("active"), v.literal("terminated"), v.literal("on-leave")),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const employeeId = await ctx.db.insert("employees", args);
    return employeeId;
  },
});

// Update employee status
export const updateStatus = mutation({
  args: {
    id: v.id("employees"),
    status: v.union(v.literal("active"), v.literal("terminated"), v.literal("on-leave")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});

// Update employee details
export const update = mutation({
  args: {
    id: v.id("employees"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    department: v.string(),
    position: v.string(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete employee
export const remove = mutation({
  args: {
    id: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
