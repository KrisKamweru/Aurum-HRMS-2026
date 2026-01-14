import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// --- Departments ---

export const listDepartments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").collect();
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
    return await ctx.db.insert("departments", args);
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
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteDepartment = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Designations ---

export const listDesignations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("designations").collect();
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
    return await ctx.db.insert("designations", args);
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
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteDesignation = mutation({
  args: { id: v.id("designations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Locations ---

export const listLocations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("locations").collect();
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
    return await ctx.db.insert("locations", args);
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
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteLocation = mutation({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
