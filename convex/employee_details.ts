import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper to get viewer info including role and permissions
async function getViewerInfo(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

// Helper to check access to specific employee data
async function checkAccess(ctx: QueryCtx, targetEmployeeId: Id<"employees">) {
  const user = await getViewerInfo(ctx);
  const orgId = user.orgId!;

  // Organization-level admins can view all employee records in their org.
  const isOrgAdmin = ["super_admin", "admin", "hr_manager"].includes(user.role as any);

  // Employee can view their own
  const isOwnProfile = user.employeeId === targetEmployeeId;

  // Manager can only view direct reports.
  let isManagerOfTarget = false;
  if (user.role === "manager" && user.employeeId) {
    const target = await ctx.db.get(targetEmployeeId);
    if (target && target.managerId === user.employeeId) {
      isManagerOfTarget = true;
    }
  }

  if (!isOrgAdmin && !isOwnProfile && !isManagerOfTarget) {
    throw new Error("Unauthorized access to employee data");
  }

  return { user, orgId, isOrgAdmin, isOwnProfile, isManagerOfTarget };
}

function assertCanWriteEmployeeData(access: { isOrgAdmin: boolean }) {
  if (!access.isOrgAdmin) {
    throw new Error("Unauthorized: Only organization admins can modify employee data");
  }
}

// ===========================================
// EMERGENCY CONTACTS
// ===========================================

export const listEmergencyContacts = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    await checkAccess(ctx, args.employeeId);
    return await ctx.db
      .query("emergency_contacts")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
  },
});

export const addEmergencyContact = mutation({
  args: {
    employeeId: v.id("employees"),
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    phoneAlt: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    const { user, orgId } = access;

    // If setting as primary, unset others
    if (args.isPrimary) {
      const existing = await ctx.db
        .query("emergency_contacts")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .filter((q) => q.eq(q.field("isPrimary"), true))
        .collect();

      for (const contact of existing) {
        await ctx.db.patch(contact._id, { isPrimary: false });
      }
    }

    return await ctx.db.insert("emergency_contacts", {
      orgId,
      ...args
    });
  },
});

export const updateEmergencyContact = mutation({
  args: {
    id: v.id("emergency_contacts"),
    employeeId: v.id("employees"), // Required for access check
    updates: v.object({
      name: v.optional(v.string()),
      relationship: v.optional(v.string()),
      phone: v.optional(v.string()),
      phoneAlt: v.optional(v.string()),
      email: v.optional(v.string()),
      address: v.optional(v.string()),
      isPrimary: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);

    if (args.updates.isPrimary) {
      const existing = await ctx.db
        .query("emergency_contacts")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .filter((q) => q.eq(q.field("isPrimary"), true))
        .collect();

      for (const contact of existing) {
        if (contact._id !== args.id) {
          await ctx.db.patch(contact._id, { isPrimary: false });
        }
      }
    }

    await ctx.db.patch(args.id, args.updates);
  },
});

export const deleteEmergencyContact = mutation({
  args: {
    id: v.id("emergency_contacts"),
    employeeId: v.id("employees")
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    await ctx.db.delete(args.id);
  },
});

// ===========================================
// BANKING DETAILS
// ===========================================

export const listBankingDetails = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    await checkAccess(ctx, args.employeeId);
    return await ctx.db
      .query("employee_banking")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
  },
});

export const addBankingDetail = mutation({
  args: {
    employeeId: v.id("employees"),
    bankName: v.string(),
    bankBranch: v.optional(v.string()),
    bankCode: v.optional(v.string()),
    accountNumber: v.string(),
    accountName: v.optional(v.string()),
    accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"))),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    const { orgId } = access;

    if (args.isPrimary) {
      const existing = await ctx.db
        .query("employee_banking")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .filter((q) => q.eq(q.field("isPrimary"), true))
        .collect();

      for (const record of existing) {
        await ctx.db.patch(record._id, { isPrimary: false });
      }
    }

    return await ctx.db.insert("employee_banking", {
      orgId,
      ...args
    });
  },
});

export const updateBankingDetail = mutation({
  args: {
    id: v.id("employee_banking"),
    employeeId: v.id("employees"),
    updates: v.object({
      bankName: v.optional(v.string()),
      bankBranch: v.optional(v.string()),
      bankCode: v.optional(v.string()),
      accountNumber: v.optional(v.string()),
      accountName: v.optional(v.string()),
      accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"))),
      isPrimary: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);

    if (args.updates.isPrimary) {
      const existing = await ctx.db
        .query("employee_banking")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
        .filter((q) => q.eq(q.field("isPrimary"), true))
        .collect();

      for (const record of existing) {
        if (record._id !== args.id) {
          await ctx.db.patch(record._id, { isPrimary: false });
        }
      }
    }

    await ctx.db.patch(args.id, args.updates);
  },
});

export const deleteBankingDetail = mutation({
  args: {
    id: v.id("employee_banking"),
    employeeId: v.id("employees")
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    await ctx.db.delete(args.id);
  },
});

// ===========================================
// EDUCATION HISTORY
// ===========================================

export const listEducation = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    await checkAccess(ctx, args.employeeId);
    return await ctx.db
      .query("employee_education")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
  },
});

export const addEducation = mutation({
  args: {
    employeeId: v.id("employees"),
    institution: v.string(),
    degree: v.string(),
    fieldOfStudy: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    grade: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    const { orgId } = access;
    return await ctx.db.insert("employee_education", {
      orgId,
      ...args
    });
  },
});

export const updateEducation = mutation({
  args: {
    id: v.id("employee_education"),
    employeeId: v.id("employees"),
    updates: v.object({
      institution: v.optional(v.string()),
      degree: v.optional(v.string()),
      fieldOfStudy: v.optional(v.string()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      grade: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    await ctx.db.patch(args.id, args.updates);
  },
});

export const deleteEducation = mutation({
  args: {
    id: v.id("employee_education"),
    employeeId: v.id("employees")
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    await ctx.db.delete(args.id);
  },
});

// ===========================================
// STATUTORY INFO
// ===========================================

export const getStatutoryInfo = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    await checkAccess(ctx, args.employeeId);
    return await ctx.db
      .query("employee_statutory")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .unique();
  },
});

export const upsertStatutoryInfo = mutation({
  args: {
    employeeId: v.id("employees"),
    country: v.string(),
    taxId: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    socialSecurityId: v.optional(v.string()),
    healthInsuranceId: v.optional(v.string()),
    additionalIds: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    const { orgId } = access;

    const existing = await ctx.db
      .query("employee_statutory")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        country: args.country,
        taxId: args.taxId,
        nationalId: args.nationalId,
        socialSecurityId: args.socialSecurityId,
        healthInsuranceId: args.healthInsuranceId,
        additionalIds: args.additionalIds,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("employee_statutory", {
        orgId,
        employeeId: args.employeeId,
        country: args.country,
        taxId: args.taxId,
        nationalId: args.nationalId,
        socialSecurityId: args.socialSecurityId,
        healthInsuranceId: args.healthInsuranceId,
        additionalIds: args.additionalIds,
      });
    }
  },
});

// ===========================================
// DOCUMENTS
// ===========================================

export const listDocuments = query({
  args: { employeeId: v.id("employees") },
  handler: async (ctx, args) => {
    await checkAccess(ctx, args.employeeId);
    const docs = await ctx.db
      .query("employee_documents")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();

    // Generate URLs for files
    return await Promise.all(docs.map(async (doc) => ({
      ...doc,
      url: await ctx.storage.getUrl(doc.fileId),
    })));
  },
});

export const addDocument = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);
    const { user, orgId } = access;

    return await ctx.db.insert("employee_documents", {
      orgId,
      employeeId: args.employeeId,
      name: args.name,
      type: args.type,
      fileId: args.fileId,
      expiryDate: args.expiryDate,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user._id,
    });
  },
});

export const deleteDocument = mutation({
  args: {
    id: v.id("employee_documents"),
    employeeId: v.id("employees")
  },
  handler: async (ctx, args) => {
    const access = await checkAccess(ctx, args.employeeId);
    assertCanWriteEmployeeData(access);

    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");

    // Delete file from storage
    await ctx.storage.delete(doc.fileId);
    // Delete record
    await ctx.db.delete(args.id);
  },
});

// Generate upload URL for documents
export const generateUploadUrl = mutation(async (ctx) => {
  const user = await getViewerInfo(ctx);
  if (!["super_admin", "admin", "hr_manager"].includes(user.role as any)) {
    throw new Error("Unauthorized: Only organization admins can upload employee documents");
  }
  return await ctx.storage.generateUploadUrl();
});
