import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to get viewer info including role and employeeId
async function getViewerInfo(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

function isPrivileged(role: string) {
  return ["super_admin", "admin", "hr_manager", "manager"].includes(role);
}

// List leave requests with role-based visibility
export const list = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getViewerInfo(ctx);
      const orgId = user.orgId!;

      let requests;

      // If regular employee, only show their own requests
      if (user.role === "employee") {
        if (!user.employeeId) {
          return [];
        }
        requests = await ctx.db
          .query("leave_requests")
          .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
          .collect();
      } else {
        // Admins, HR, Managers see all requests in the org
        requests = await ctx.db
          .query("leave_requests")
          .withIndex("by_org", (q) => q.eq("orgId", orgId))
          .collect();
      }

      // Enrich with employee details
      const enrichedRequests = await Promise.all(
        requests.map(async (request) => {
          const employee = await ctx.db.get(request.employeeId);
          let employeeDepartment = "Unknown";
          if (employee?.departmentId) {
            const dept = await ctx.db.get(employee.departmentId);
            if (dept) employeeDepartment = dept.name;
          }
          return {
            ...request,
            employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
            employeeDepartment
          };
        })
      );

      return enrichedRequests;
    } catch (e) {
      return [];
    }
  },
});

// Create a new leave request
export const create = mutation({
  args: {
    employeeId: v.id("employees"),
    type: v.union(v.literal("vacation"), v.literal("sick"), v.literal("personal"), v.literal("maternity"), v.literal("paternity")),
    startDate: v.string(),
    endDate: v.string(),
    days: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    // Access Control:
    // 1. Privileged users can create requests for anyone in the org (technically, though usually they approve)
    // 2. Regular users can ONLY create requests for THEMSELVES
    const isSelf = user.employeeId === args.employeeId;
    if (!isPrivileged(user.role) && !isSelf) {
      throw new Error("Unauthorized: Can only submit leave requests for yourself");
    }

    const requestId = await ctx.db.insert("leave_requests", {
      orgId,
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
    status: v.union(v.literal("approved"), v.literal("rejected"), v.literal("cancelled")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const request = await ctx.db.get(args.id);

    if (!request || request.orgId !== orgId) {
      throw new Error("Unauthorized");
    }

    // Access Control:
    // 1. Privileged users can approve/reject
    // 2. Regular users can CANCEL their own PENDING requests (optional, but good feature)
    //    For now, we'll restrict approve/reject to privileged.

    if (args.status === 'cancelled') {
       // Allow self-cancellation if pending?
       const isSelf = user.employeeId === request.employeeId;
       if (!isPrivileged(user.role) && !isSelf) {
          throw new Error("Unauthorized");
       }
    } else {
       // Approve/Reject requires privilege
       if (!isPrivileged(user.role)) {
          throw new Error("Unauthorized: Insufficient permissions");
       }
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      rejectionReason: args.rejectionReason
    });
  },
});
