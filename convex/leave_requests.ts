import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createNotification } from "./notifications";

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

    // --- Validate Balance ---

    // 1. Get Policy for this type
    const policy = await ctx.db
        .query("leave_policies")
        .withIndex("by_org", q => q.eq("orgId", orgId))
        .filter(q => q.eq(q.field("type"), args.type))
        .first();

    // If policy exists, validate balance
    if (policy && policy.isActive) {
        // Calculate requested days if not provided
        let requestedDays = args.days;
        if (!requestedDays) {
            const start = new Date(args.startDate);
            const end = new Date(args.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        // Get used days this year
        const now = new Date();
        const startOfYear = `${now.getFullYear()}-01-01`;
        const endOfYear = `${now.getFullYear()}-12-31`;

        const existingRequests = await ctx.db
            .query("leave_requests")
            .withIndex("by_employee", q => q.eq("employeeId", args.employeeId))
            .collect();

        const usedDays = existingRequests
            .filter(r =>
                r.type === args.type &&
                r.status === 'approved' &&
                r.startDate >= startOfYear
            )
            .reduce((sum, r) => sum + (r.days || 0), 0);

        const pendingDays = existingRequests
            .filter(r =>
                r.type === args.type &&
                r.status === 'pending' &&
                r.startDate >= startOfYear
            )
            .reduce((sum, r) => sum + (r.days || 0), 0);

        // Check entitlement
        const entitlement = policy.daysPerYear;
        // Logic: Entitlement - Used - Pending - Requested >= 0
        // Or strictly: Used + Pending + Requested <= Entitlement?
        // Usually we block if (Used + Requested > Entitlement). Pending is tricky, often it blocks too.

        if (usedDays + pendingDays + requestedDays > entitlement) {
            throw new Error(`Insufficient leave balance. Entitlement: ${entitlement}, Used: ${usedDays}, Pending: ${pendingDays}, Requested: ${requestedDays}`);
        }

        // Ensure days is saved
        args.days = requestedDays;
    }

    const requestId = await ctx.db.insert("leave_requests", {
      orgId,
      ...args,
      status: "pending",
    });

    // Notify user of successful submission (if self)
    if (isSelf) {
       await createNotification(ctx, {
           userId: user._id,
           title: "Leave Request Submitted",
           message: `Your ${args.type} leave request has been submitted for approval.`,
           type: "info",
           relatedId: requestId,
           relatedTable: "leave_requests"
       });
    }

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

    // Notify Employee
    const targetUser = await ctx.db.query("users").withIndex("by_org", q => q.eq("orgId", orgId)).filter(q => q.eq(q.field("employeeId"), request.employeeId)).first();

    if (targetUser) {
        let title = "";
        let message = "";
        let type: "info" | "success" | "warning" | "error" = "info";

        if (args.status === "approved") {
            title = "Leave Request Approved";
            message = "Your leave request has been approved.";
            type = "success";
        } else if (args.status === "rejected") {
            title = "Leave Request Rejected";
            message = `Your leave request was rejected. ${args.rejectionReason ? `Reason: ${args.rejectionReason}` : ''}`;
            type = "error";
        } else if (args.status === "cancelled") {
            title = "Leave Request Cancelled";
            message = "Your leave request has been cancelled.";
            type = "warning";
        }

        await createNotification(ctx, {
            userId: targetUser._id,
            title,
            message,
            type,
            relatedId: args.id,
            relatedTable: "leave_requests",
            link: "/leave-requests"
        });
    }
  },
});

