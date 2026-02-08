import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createNotification } from "./notifications";

// --- Helpers ---

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

// --- Promotions ---

export const getPromotions = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    // If specific employee requested
    if (args.employeeId) {
      // Access check: Must be privileged OR requesting own records
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }

      return await ctx.db
        .query("promotions")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    // If listing all
    if (!privileged) {
      // Regular users only see their own
      if (!user.employeeId) return [];

      return await ctx.db
        .query("promotions")
        .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("promotions")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const createPromotion = mutation({
  args: {
    employeeId: v.id("employees"),
    fromDesignationId: v.id("designations"),
    toDesignationId: v.id("designations"),
    promotionDate: v.string(),
    salaryIncrement: v.optional(v.number()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // 1. Record the promotion
    const promotionId = await ctx.db.insert("promotions", {
      orgId,
      ...args,
    });

    // 2. Update the employee's current designation
    await ctx.db.patch(args.employeeId, {
      designationId: args.toDesignationId,
    });

    // 3. Notify Employee
    const targetEmployee = await ctx.db.get(args.employeeId);
    // Find user associated with employee
    const targetUser = await ctx.db.query("users").withIndex("by_org", q => q.eq("orgId", orgId)).filter(q => q.eq(q.field("employeeId"), args.employeeId)).first();

    if (targetUser) {
        await createNotification(ctx, {
            userId: targetUser._id,
            title: "Promotion!",
            message: `Congratulations! You have been promoted.`,
            type: "success",
            relatedId: promotionId,
            relatedTable: "promotions",
            link: "/profile"
        });
    }

    return promotionId;
  },
});

// --- Transfers ---

export const getTransfers = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    if (args.employeeId) {
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }

      return await ctx.db
        .query("transfers")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (!privileged) {
      if (!user.employeeId) return [];

      return await ctx.db
        .query("transfers")
        .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("transfers")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const createTransfer = mutation({
  args: {
    employeeId: v.id("employees"),
    fromDepartmentId: v.id("departments"),
    toDepartmentId: v.id("departments"),
    fromLocationId: v.optional(v.id("locations")),
    toLocationId: v.optional(v.id("locations")),
    transferDate: v.string(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const transferId = await ctx.db.insert("transfers", {
      orgId,
      ...args,
    });

    // Update employee record
    await ctx.db.patch(args.employeeId, {
      departmentId: args.toDepartmentId,
      locationId: args.toLocationId, // updates location if provided, or keeps old one if logic requires (here we assume strict update if passed)
    });

    // Notify Employee
    const targetUser = await ctx.db.query("users").withIndex("by_org", q => q.eq("orgId", orgId)).filter(q => q.eq(q.field("employeeId"), args.employeeId)).first();
    if (targetUser) {
        await createNotification(ctx, {
            userId: targetUser._id,
            title: "Department Transfer",
            message: `You have been transferred to a new department/location.`,
            type: "info",
            relatedId: transferId,
            relatedTable: "transfers",
            link: "/profile"
        });
    }
  },
});

// --- Resignations ---

export const submitResignation = mutation({
  args: {
    employeeId: v.id("employees"),
    noticeDate: v.string(),
    lastWorkingDay: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    // Can submit if privileged OR if submitting for self
    const isSelf = user.employeeId === args.employeeId;
    if (!isPrivileged(user.role) && !isSelf) {
      throw new Error("Unauthorized: Can only submit resignation for self");
    }

    const resId = await ctx.db.insert("resignations", {
      orgId,
      ...args,
      status: "pending",
    });

    // Notify Admins
    // TODO: Ideally find all admins in org and notify them. For MVP, maybe not critical or can do later.
    // Let's notify user it was submitted
    await createNotification(ctx, {
        userId: user._id,
        title: "Resignation Submitted",
        message: "Your resignation has been submitted for review.",
        type: "info",
        relatedId: resId,
        relatedTable: "resignations"
    });

    return resId;
  },
});

export const updateResignationStatus = mutation({
  args: {
    resignationId: v.id("resignations"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const resignation = await ctx.db.get(args.resignationId);

    if (!resignation || resignation.orgId !== orgId) {
      throw new Error("Resignation not found or unauthorized");
    }

    await ctx.db.patch(args.resignationId, { status: args.status });

    // Notify Employee
    const targetUser = await ctx.db.query("users").withIndex("by_org", q => q.eq("orgId", orgId)).filter(q => q.eq(q.field("employeeId"), resignation.employeeId)).first();
    if (targetUser) {
        await createNotification(ctx, {
            userId: targetUser._id,
            title: `Resignation ${args.status === 'approved' ? 'Accepted' : 'Rejected'}`,
            message: `Your resignation request has been ${args.status}.`,
            type: args.status === 'approved' ? 'info' : 'warning',
            relatedId: args.resignationId,
            relatedTable: "resignations",
            link: "/profile"
        });
    }
  },
});

export const getResignations = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    if (args.employeeId) {
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }
      return await ctx.db
        .query("resignations")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (!privileged) {
      if (!user.employeeId) return [];
      return await ctx.db
        .query("resignations")
        .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("resignations")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// --- Warnings ---

export const issueWarning = mutation({
  args: {
    employeeId: v.id("employees"),
    subject: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    issueDate: v.string(),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const warningId = await ctx.db.insert("warnings", {
      orgId,
      ...args,
    });

    // Notify Employee
    const targetUser = await ctx.db.query("users").withIndex("by_org", q => q.eq("orgId", orgId)).filter(q => q.eq(q.field("employeeId"), args.employeeId)).first();
    if (targetUser) {
        await createNotification(ctx, {
            userId: targetUser._id,
            title: "Warning Issued",
            message: `You have received a warning: ${args.subject}`,
            type: "warning",
            relatedId: warningId,
            relatedTable: "warnings",
            link: "/profile"
        });
    }

    return warningId;
  },
});

export const getWarnings = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    if (args.employeeId) {
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }
      return await ctx.db
        .query("warnings")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (!privileged) {
      if (!user.employeeId) return [];
      return await ctx.db
        .query("warnings")
        .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("warnings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// --- Awards ---

export const giveAward = mutation({
  args: {
    employeeId: v.id("employees"),
    title: v.string(),
    gift: v.optional(v.string()),
    cashPrice: v.optional(v.number()),
    date: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const awardId = await ctx.db.insert("awards", {
      orgId,
      ...args,
    });

    // Notify Employee
    const targetUser = await ctx.db.query("users").withIndex("by_org", q => q.eq("orgId", orgId)).filter(q => q.eq(q.field("employeeId"), args.employeeId)).first();
    if (targetUser) {
        await createNotification(ctx, {
            userId: targetUser._id,
            title: "You Received an Award!",
            message: `Congratulations! You have been awarded: ${args.title}`,
            type: "success",
            relatedId: awardId,
            relatedTable: "awards",
            link: "/profile"
        });
    }

    return awardId;
  },
});

export const getAwards = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    if (args.employeeId) {
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }
      return await ctx.db
        .query("awards")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (!privileged) {
      if (!user.employeeId) return [];
      return await ctx.db
        .query("awards")
        .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("awards")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// --- Terminations ---

export const terminateEmployee = mutation({
  args: {
    employeeId: v.id("employees"),
    terminationDate: v.string(),
    type: v.union(v.literal("voluntary"), v.literal("involuntary")),
    reason: v.string(),
    noticeGiven: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // 1. Record termination
    const terminationId = await ctx.db.insert("terminations", {
      orgId,
      ...args,
    });

    // 2. Update employee status
    await ctx.db.patch(args.employeeId, {
      status: "terminated",
    });

    return terminationId;
  },
});

export const getTerminations = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    if (args.employeeId) {
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }
      return await ctx.db
        .query("terminations")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (!privileged) {
      if (!user.employeeId) return [];
      return await ctx.db
        .query("terminations")
        .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("terminations")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// --- Complaints ---

export const fileComplaint = mutation({
  args: {
    complainantId: v.id("employees"),
    accusedId: v.optional(v.id("employees")),
    subject: v.string(),
    description: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    // Can file if privileged OR if filing for self (complainant)
    const isSelf = user.employeeId === args.complainantId;
    if (!isPrivileged(user.role) && !isSelf) {
      throw new Error("Unauthorized: Can only file complaint for self");
    }

    return await ctx.db.insert("complaints", {
      orgId,
      ...args,
      status: "pending",
    });
  },
});

export const getComplaints = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    if (args.employeeId) {
      // If looking up specific employee's complaints (as complainant)
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }
      return await ctx.db
        .query("complaints")
        .withIndex("by_complainant", (q) => q.eq("complainantId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (!privileged) {
      if (!user.employeeId) return [];
      return await ctx.db
        .query("complaints")
        .withIndex("by_complainant", (q) => q.eq("complainantId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("complaints")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

// --- Travel Requests ---

export const createTravelRequest = mutation({
  args: {
    employeeId: v.id("employees"),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    purpose: v.string(),
    budget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    const isSelf = user.employeeId === args.employeeId;
    if (!isPrivileged(user.role) && !isSelf) {
      throw new Error("Unauthorized: Can only request travel for self");
    }

    return await ctx.db.insert("travel_requests", {
      orgId,
      ...args,
      status: "pending",
    });
  },
});

export const getTravelRequests = query({
  args: { employeeId: v.optional(v.id("employees")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const privileged = isPrivileged(user.role);

    if (args.employeeId) {
      if (!privileged && args.employeeId !== user.employeeId) {
        return [];
      }
      return await ctx.db
        .query("travel_requests")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (!privileged) {
      if (!user.employeeId) return [];
      return await ctx.db
        .query("travel_requests")
        .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
        .collect();
    }

    return await ctx.db
      .query("travel_requests")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
  },
});
