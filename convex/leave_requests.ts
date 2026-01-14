import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// List all leave requests
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const requests = await ctx.db.query("leave_requests").collect();

    // Enrich with employee details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const employee = await ctx.db.get(request.employeeId);
        return {
          ...request,
          employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
          employeeDepartment: employee ? employee.department : "Unknown"
        };
      })
    );

    return enrichedRequests;
  },
});

// Create a new leave request
export const create = mutation({
  args: {
    employeeId: v.id("employees"),
    type: v.union(v.literal("vacation"), v.literal("sick"), v.literal("personal")),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const requestId = await ctx.db.insert("leave_requests", {
      ...args,
      status: "pending",
    });
    return requestId;
  },
});

// Update leave request status
export const updateStatus = mutation({
  args: {
    id: v.id("leave_requests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});
