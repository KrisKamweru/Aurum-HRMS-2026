import { query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

// Helper to get viewer info including role
async function getViewerInfo(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getViewerInfo(ctx);
      const orgId = user.orgId!;
      const isPrivileged = (["super_admin", "admin", "hr_manager", "manager"] as const).includes(user.role as any);

      // 1. Employee Stats
      const employees = await ctx.db
        .query("employees")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();

      const totalEmployees = employees.length;
      const activeEmployees = employees.filter((e) => e.status === "active").length;
      const onLeaveEmployees = employees.filter((e) => e.status === "on-leave").length;

      // 2. Department Count
      const departments = await ctx.db
        .query("departments")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();

      // 3. Pending Leave Requests (Restricted)
      let pendingLeaves: Doc<"leave_requests">[] = [];
      let recentPendingLeaves: any[] = [];

      if (isPrivileged) {
        pendingLeaves = await ctx.db
          .query("leave_requests")
          .withIndex("by_org", (q) => q.eq("orgId", orgId))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();

        // Enrich pending leaves with employee names
        recentPendingLeaves = await Promise.all(
          pendingLeaves.slice(0, 5).map(async (req) => {
            const emp = await ctx.db.get(req.employeeId);
            return {
              ...req,
              employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown",
            };
          })
        );
      }

      // 4. Pending Resignations (Restricted)
      let pendingResignations: Doc<"resignations">[] = [];
      let recentResignations: any[] = [];

      if (isPrivileged) {
        pendingResignations = await ctx.db
          .query("resignations")
          .withIndex("by_org", (q) => q.eq("orgId", orgId))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .collect();

        recentResignations = await Promise.all(
          pendingResignations.slice(0, 5).map(async (res) => {
            const emp = await ctx.db.get(res.employeeId);
            return {
              ...res,
              employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown",
            };
          })
        );
      }

      // 5. Pending Join Requests (Restricted)
      let pendingJoinRequests: Doc<"org_join_requests">[] = [];
      let recentJoinRequests: any[] = [];

      if (isPrivileged) {
        pendingJoinRequests = await ctx.db
          .query("org_join_requests")
          .withIndex("by_org_status", (q) => q.eq("orgId", orgId).eq("status", "pending"))
          .collect();

        recentJoinRequests = await Promise.all(
          pendingJoinRequests.slice(0, 5).map(async (req) => {
            const requester = await ctx.db.get(req.userId) as { name?: string; email?: string; image?: string } | null;
            return {
              ...req,
              requesterName: requester?.name || "Unknown",
              requesterEmail: requester?.email || "",
              requesterImage: requester?.image,
            };
          })
        );
      }

      return {
        stats: {
          totalEmployees,
          activeEmployees,
          onLeave: onLeaveEmployees,
          departments: departments.length,
          pendingLeaveCount: pendingLeaves.length,
          pendingResignationCount: pendingResignations.length,
          pendingJoinRequestCount: pendingJoinRequests.length
        },
        pendingLeaves: recentPendingLeaves,
        pendingResignations: recentResignations,
        pendingJoinRequests: recentJoinRequests
      };

    } catch (e) {
      // Return empty stats if unauthorized or error (though auth check should throw)
      return {
        stats: {
          totalEmployees: 0,
          activeEmployees: 0,
          onLeave: 0,
          departments: 0,
          pendingLeaveCount: 0,
          pendingResignationCount: 0,
          pendingJoinRequestCount: 0
        },
        pendingLeaves: [],
        pendingResignations: [],
        pendingJoinRequests: []
      };
    }
  },
});

export const getEmployeeStats = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getViewerInfo(ctx);

      if (!user.employeeId) {
        return { hasEmployeeProfile: false, user };
      }

      const employeeId = user.employeeId;
      const employee = await ctx.db.get(employeeId);

      if (!employee) {
        return { hasEmployeeProfile: false, user };
      }

      // 1. Leave Balances (Dynamic from Policies)
      const policies = await ctx.db
        .query("leave_policies")
        .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Default entitlements if no policies defined
      const defaultEntitlements: Record<string, number> = {
        vacation: 15,
        sick: 10,
        personal: 5,
        maternity: 90,
        paternity: 14
      };

      const entitlements: Record<string, number> = { ...defaultEntitlements };

      // Override with actual policies if they exist
      if (policies.length > 0) {
        // Reset defaults first if we want strict policy adherence?
        // Or just override. Let's override matching types.
        // If policies exist, we should probably assume they cover what's needed.
        // But to avoid breaking UI that expects keys, let's keep defaults and overwrite.
        for (const p of policies) {
            entitlements[p.type] = p.daysPerYear;
        }
      }

      const leaveRequests = await ctx.db
        .query("leave_requests")
        .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
        .collect();

      // Calculate usage (only approved leaves count towards balance)
      const usage: Record<string, number> = {
        vacation: 0,
        sick: 0,
        personal: 0,
        maternity: 0,
        paternity: 0
      };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const pendingRequests: Doc<"leave_requests">[] = [];
      const upcomingLeave: Doc<"leave_requests">[] = [];

      for (const req of leaveRequests) {
        // Track usage
        if (req.status === "approved") {
          let days = req.days || 0;
          // Fallback calculation if days not stored
          if (!days && req.startDate && req.endDate) {
             const s = new Date(req.startDate);
             const e = new Date(req.endDate);
             const diffTime = Math.abs(e.getTime() - s.getTime());
             days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
          }

          const type = req.type as keyof typeof usage;
          if (usage[type] !== undefined) {
            usage[type] += days;
          }
        }

        // Pending requests
        if (req.status === "pending") {
          pendingRequests.push(req);
        }

        // Upcoming approved leave
        if (req.status === "approved" && req.startDate > today) {
          upcomingLeave.push(req);
        }
      }

      // Sort by date
      pendingRequests.sort((a, b) => a.startDate.localeCompare(b.startDate));
      upcomingLeave.sort((a, b) => a.startDate.localeCompare(b.startDate));

      // 4. Recent Requests (All statuses, sorted by date desc)
      const recentRequests = [...leaveRequests]
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .slice(0, 5);

      // 2. Teammates on Leave
      let teammatesOnLeave = 0;
      if (employee.departmentId) {
        const deptEmployees = await ctx.db
          .query("employees")
          .withIndex("by_org", (q) => q.eq("orgId", user.orgId!)) // Optimized if we had by_dept index, but using by_org + filter for now as schema lacks by_dept
          .filter(q => q.eq(q.field("departmentId"), employee.departmentId))
          .collect();

        teammatesOnLeave = deptEmployees.filter(e =>
          e._id !== employee._id && e.status === "on-leave"
        ).length;
      }

      // 3. Recent Awards
      const awards = await ctx.db
        .query("awards")
        .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
        .order("desc")
        .take(3);

      const warnings = await ctx.db
        .query("warnings")
        .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
        .order("desc")
        .take(3);

      // 4. Latest Payslip
      const latestPayslip = await ctx.db
        .query("salary_slips")
        .withIndex("by_employee", (q) => q.eq("employeeId", employee._id))
        .order("desc")
        .first();

      let enrichedPayslip = null;
      if (latestPayslip) {
        // Ensure the run is completed (though generally slips are only created/finalized in completed runs,
        // unless we allow viewing drafts. Let's verify run status just in case.)
        const run = await ctx.db.get(latestPayslip.runId);
        if (run && run.status === "completed") {
            enrichedPayslip = {
                ...latestPayslip,
                month: run.month,
                year: run.year
            };
        }
      }

      // Enrich employee data
      let designationName = "";
      if (employee.designationId) {
        const des = await ctx.db.get(employee.designationId);
        if (des) designationName = des.title;
      }

      let departmentName = "";
      if (employee.departmentId) {
        const dept = await ctx.db.get(employee.departmentId);
        if (dept) departmentName = dept.name;
      }

      let managerName = "";
      if (employee.managerId) {
        const mgr = await ctx.db.get(employee.managerId);
        if (mgr) managerName = `${mgr.firstName} ${mgr.lastName}`;
      }

      // Calculate profile completeness
      const optionalFields = ["phone", "address", "gender", "dob"];
      const filledFields = optionalFields.filter((f) => !!(employee as any)[f]);
      const completeness = Math.round((filledFields.length / optionalFields.length) * 100);

      // Calculate tenure
      const startDate = new Date(employee.startDate);
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      const tenure = years > 0 ? `${years}y ${months}m` : `${months}m`;

      return {
        hasEmployeeProfile: true,
        user,
        employee: {
          ...employee,
          designationName,
          departmentName,
          managerName,
          completeness,
          tenure,
          tenureDays: diffDays
        },
        leaveBalance: {
          vacation: { entitled: entitlements['vacation'], taken: usage["vacation"], remaining: Math.max(0, entitlements['vacation'] - usage["vacation"]) },
          sick: { entitled: entitlements['sick'], taken: usage["sick"], remaining: Math.max(0, entitlements['sick'] - usage["sick"]) },
          personal: { entitled: entitlements['personal'], taken: usage["personal"], remaining: Math.max(0, entitlements['personal'] - usage["personal"]) }
        },
        pendingRequests,
        upcomingLeave,
        recentRequests,
        teammatesOnLeave,
        recentAwards: awards,
        recentWarnings: warnings,
        latestPayslip: enrichedPayslip
      };
    } catch (e) {
      console.error("Error in getEmployeeStats:", e);
      return { hasEmployeeProfile: false };
    }
  },
});
