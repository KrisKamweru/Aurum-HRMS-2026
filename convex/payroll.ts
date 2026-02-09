import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { createNotification } from "./notifications";
import { calculateTaxDeductions, fetchActiveRules } from "./tax_calculator";
import {
  canApproveRequester,
  canMutatePayroll,
  finalizeApprovalMetadata,
  getViewerInfo,
  isApproverRole,
  queueChangeRequest,
} from "./sensitive_changes";

async function applyFinalizeRun(ctx: MutationCtx, runId: Id<"payroll_runs">, actorUserId: Id<"users">) {
  const run = await ctx.db.get(runId);
  if (!run) {
    throw new Error("Run not found");
  }
  await ctx.db.patch(runId, {
    status: "completed",
  });

  await createNotification(ctx, {
    userId: actorUserId,
    title: "Payroll Finalized",
    message: `Payroll run for ${run.month}/${run.year} has been finalized.`,
    type: "success",
    relatedId: runId,
    relatedTable: "payroll_runs",
    link: `/payroll/${runId}`,
  });
}

async function applyDeleteRun(ctx: MutationCtx, runId: Id<"payroll_runs">) {
  const run = await ctx.db.get(runId);
  if (!run) {
    throw new Error("Run not found");
  }
  if (run.status === "completed") {
    throw new Error("Cannot delete a completed payroll run");
  }

  const slips = await ctx.db
    .query("salary_slips")
    .withIndex("by_run", (q) => q.eq("runId", runId))
    .collect();

  for (const slip of slips) {
    await ctx.db.delete(slip._id);
  }

  await ctx.db.delete(runId);
}

// List payroll runs
export const listRuns = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = canMutatePayroll(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const runs = await ctx.db
      .query("payroll_runs")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .order("desc")
      .collect();

    return runs;
  },
});

// Get a single payroll run details
export const getRun = query({
  args: { id: v.id("payroll_runs") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = canMutatePayroll(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const run = await ctx.db.get(args.id);
    if (!run || run.orgId !== orgId) {
      return null;
    }

    return run;
  },
});

// Get slips for a run
export const getRunSlips = query({
  args: { runId: v.id("payroll_runs") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = canMutatePayroll(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const run = await ctx.db.get(args.runId);
    if (!run || run.orgId !== orgId) {
      throw new Error("Run not found or unauthorized");
    }

    const slips = await ctx.db
      .query("salary_slips")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    return slips;
  },
});

// Create a draft payroll run
export const createRun = mutation({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = canMutatePayroll(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // Check if run already exists for this month/year
    const existing = await ctx.db
      .query("payroll_runs")
      .withIndex("by_org_period", (q) =>
        q.eq("orgId", orgId).eq("year", args.year).eq("month", args.month)
      )
      .first();

    if (existing) {
      throw new Error(`Payroll run for ${args.month}/${args.year} already exists`);
    }

    const runId = await ctx.db.insert("payroll_runs", {
      orgId,
      month: args.month,
      year: args.year,
      status: "draft",
      runDate: new Date().toISOString(),
      processedBy: user._id,
    });

    return runId;
  },
});

// Process payroll (Generate Slips)
export const processRun = mutation({
  args: {
    runId: v.id("payroll_runs"),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = canMutatePayroll(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const run = await ctx.db.get(args.runId);
    if (!run || run.orgId !== orgId) {
      throw new Error("Run not found");
    }

    if (run.status === "completed") {
      throw new Error("Cannot re-process a completed run");
    }

    // 1. Fetch all active employees
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    const activeEmployees = employees.filter(e => e.status === "active" || e.status === "on-leave");

    // Fetch Tax Rules (Default to KE for MVP, or we could add taxRegion to org settings)
    const taxRules = await fetchActiveRules(ctx, "KE");

    // Fetch Personal Relief (Default KE value 2400 if not found, usually comes from tax_regions)
    const taxRegion = await ctx.db.query("tax_regions").withIndex("by_code", q => q.eq("code", "KE")).first();
    const personalRelief = taxRegion?.personalRelief ?? 2400;

    // Clear existing slips for this run if any (to allow re-processing)
    const existingSlips = await ctx.db
        .query("salary_slips")
        .withIndex("by_run", (q) => q.eq("runId", args.runId))
        .collect();

    for (const slip of existingSlips) {
        await ctx.db.delete(slip._id);
    }

    let totalGross = 0;
    let totalNet = 0;
    let count = 0;

    // 2. Calculate for each employee
    for (const emp of activeEmployees) {
      // Basic Salary
      const basic = emp.baseSalary || 0;

      // Fetch credits (Allowances)
      const credits = await ctx.db
        .query("payroll_credits")
        .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
        .collect();

      const activeCredits = credits.filter(c => c.isActive && c.status === "approved");

      // Fetch debits (Manual Deductions like loans)
      const debits = await ctx.db
        .query("payroll_debits")
        .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
        .collect();

      const activeDebits = debits.filter(d => d.isActive && d.status === "approved");

      // Calculate Gross & Taxable Income base
      let earningsTotal = basic;
      let taxableIncomeBase = basic; // Basic is always taxable

      const earningsList = [
        { name: "Basic Salary", amount: basic, type: "basic" }
      ];

      for (const credit of activeCredits) {
        earningsTotal += credit.amount;
        if (credit.isTaxable) {
            taxableIncomeBase += credit.amount;
        }
        earningsList.push({
            name: credit.name,
            amount: credit.amount,
            type: credit.itemType
        });
      }

      // Calculate Taxes & Statutory Deductions
      const taxResult = calculateTaxDeductions(
        earningsTotal,
        basic,
        taxableIncomeBase,
        taxRules,
        personalRelief
      );

      // Prepare Deductions List
      // Start with statutory
      let deductionsTotal = taxResult.totalEmployeeDeductions;
      const deductionsList = taxResult.deductions
        .filter(d => !d.isEmployerContribution)
        .map(d => ({
            name: d.name,
            amount: d.amount,
            type: d.type
        }));

      const employerContributionsList = taxResult.deductions
        .filter(d => d.isEmployerContribution)
        .map(d => ({
            name: d.name,
            amount: d.amount,
            type: d.type
        }));

      // Add Manual Debits (Loans, etc.)
      for (const debit of activeDebits) {
        deductionsTotal += debit.amount;
        deductionsList.push({
            name: debit.name,
            amount: debit.amount,
            type: debit.itemType
        });
      }

      const netSalary = earningsTotal - deductionsTotal;

      // 3. Create Slip
      await ctx.db.insert("salary_slips", {
        orgId,
        runId: args.runId,
        employeeId: emp._id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designationId ? (await ctx.db.get(emp.designationId))?.title : undefined,
        department: emp.departmentId ? (await ctx.db.get(emp.departmentId))?.name : undefined,
        joinDate: emp.startDate,
        basicSalary: basic,
        grossSalary: earningsTotal,
        netSalary: netSalary,
        earnings: earningsList,
        deductions: deductionsList,
        employerContributions: employerContributionsList,
        generatedAt: new Date().toISOString(),
      });

      totalGross += earningsTotal;
      totalNet += netSalary;
      count++;
    }

    // 4. Update Run
    await ctx.db.patch(args.runId, {
      status: "processing", // Or 'completed' if we want one-step. Let's keep it draft/processing until explicit finalize?
                            // Actually, let's mark it 'processing' to show calculations exist, user must 'Finalize' to lock it.
      totalGrossPay: totalGross,
      totalNetPay: totalNet,
      employeeCount: count,
    });
  },
});

// Finalize Run (Lock it)
export const finalizeRun = mutation({
    args: {
        runId: v.id("payroll_runs"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const orgId = user.orgId!;
        const isPrivileged = canMutatePayroll(user.role);

        if (!isPrivileged) throw new Error("Unauthorized");

        const run = await ctx.db.get(args.runId);
        if (!run || run.orgId !== orgId) throw new Error("Run not found");

        const oldData = { status: run.status };
        const newData = { status: "completed" };

        if (user.role === "super_admin") {
          await applyFinalizeRun(ctx, args.runId, user._id);
          const changeRequestId = await queueChangeRequest(ctx, {
            orgId,
            requesterUserId: user._id,
            approverUserId: user._id,
            targetTable: "payroll_runs",
            targetId: String(args.runId),
            operation: "update",
            oldData,
            newData,
            reason: args.reason,
            status: "approved",
          });
          return { mode: "applied" as const, changeRequestId };
        }

        const changeRequestId = await queueChangeRequest(ctx, {
          orgId,
          requesterUserId: user._id,
          targetTable: "payroll_runs",
          targetId: String(args.runId),
          operation: "update",
          oldData,
          newData,
          reason: args.reason,
          status: "pending",
        });
        return { mode: "pending" as const, changeRequestId };
    }
});

// Delete a draft run
export const deleteRun = mutation({
    args: {
        runId: v.id("payroll_runs"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const orgId = user.orgId!;
        const isPrivileged = canMutatePayroll(user.role);

        if (!isPrivileged) throw new Error("Unauthorized");

        const run = await ctx.db.get(args.runId);
        if (!run || run.orgId !== orgId) throw new Error("Run not found");

        const oldData = {
          run,
          slips: await ctx.db
            .query("salary_slips")
            .withIndex("by_run", (q) => q.eq("runId", args.runId))
            .collect(),
        };

        if (user.role === "super_admin") {
          await applyDeleteRun(ctx, args.runId);
          const changeRequestId = await queueChangeRequest(ctx, {
            orgId,
            requesterUserId: user._id,
            approverUserId: user._id,
            targetTable: "payroll_runs",
            targetId: String(args.runId),
            operation: "delete",
            oldData,
            reason: args.reason,
            status: "approved",
          });
          return { mode: "applied" as const, changeRequestId };
        }

        const changeRequestId = await queueChangeRequest(ctx, {
          orgId,
          requesterUserId: user._id,
          targetTable: "payroll_runs",
          targetId: String(args.runId),
          operation: "delete",
          oldData,
          reason: args.reason,
          status: "pending",
        });
        return { mode: "pending" as const, changeRequestId };
    }
});

export const listPendingSensitiveChanges = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerInfo(ctx);
    if (!isApproverRole(viewer.role)) {
      throw new Error("Unauthorized");
    }

    const pending = await ctx.db
      .query("change_requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", viewer.orgId!).eq("status", "pending"))
      .order("desc")
      .collect();

    return pending
      .filter((request) => request.requesterUserId !== viewer._id)
      .slice(0, 200);
  },
});

export const reviewSensitiveChange = mutation({
  args: {
    changeRequestId: v.id("change_requests"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const approver = await getViewerInfo(ctx);
    if (!isApproverRole(approver.role)) {
      throw new Error("Unauthorized");
    }

    const request = await ctx.db.get(args.changeRequestId);
    if (!request || request.orgId !== approver.orgId) {
      throw new Error("Change request not found");
    }
    if (request.status !== "pending") {
      throw new Error("Change request is not pending");
    }
    if (request.requesterUserId === approver._id) {
      throw new Error("Self-approval is not allowed");
    }

    const requester = await ctx.db.get(request.requesterUserId);
    if (!requester) {
      throw new Error("Requester account not found");
    }
    if (!canApproveRequester(requester.role, approver.role)) {
      throw new Error("Approval must be performed by an authorized dual-control role");
    }

    if (args.decision === "rejected") {
      await finalizeApprovalMetadata(
        ctx,
        request,
        approver._id,
        "rejected",
        args.rejectionReason ?? "Rejected by approver"
      );
      return { status: "rejected" as const };
    }

    if (request.targetTable === "employees" && request.operation === "update") {
      if (!request.targetId) throw new Error("Missing target employee");
      const employeeId = request.targetId as Id<"employees">;
      const employee = await ctx.db.get(employeeId);
      if (!employee || employee.orgId !== approver.orgId) {
        throw new Error("Target employee not found");
      }
      await ctx.db.patch(employeeId, request.newData as Partial<typeof employee>);
    } else if (request.targetTable === "payroll_credits" && request.operation === "create") {
      await ctx.db.insert("payroll_credits", {
        ...(request.newData as Record<string, unknown>),
        processedBy: approver._id,
        processedDate: new Date().toISOString(),
      } as any);
    } else if (request.targetTable === "payroll_debits" && request.operation === "create") {
      await ctx.db.insert("payroll_debits", {
        ...(request.newData as Record<string, unknown>),
        processedBy: approver._id,
        processedDate: new Date().toISOString(),
      } as any);
    } else if (request.targetTable === "payroll_credits" && request.operation === "update") {
      if (!request.targetId) throw new Error("Missing target credit");
      const creditId = request.targetId as Id<"payroll_credits">;
      const credit = await ctx.db.get(creditId);
      if (!credit || credit.orgId !== approver.orgId) {
        throw new Error("Target credit not found");
      }
      await ctx.db.patch(creditId, request.newData as Partial<typeof credit>);
    } else if (request.targetTable === "payroll_debits" && request.operation === "update") {
      if (!request.targetId) throw new Error("Missing target debit");
      const debitId = request.targetId as Id<"payroll_debits">;
      const debit = await ctx.db.get(debitId);
      if (!debit || debit.orgId !== approver.orgId) {
        throw new Error("Target debit not found");
      }
      await ctx.db.patch(debitId, request.newData as Partial<typeof debit>);
    } else if (request.targetTable === "payroll_runs" && request.operation === "update") {
      if (!request.targetId) throw new Error("Missing target payroll run");
      await applyFinalizeRun(ctx, request.targetId as Id<"payroll_runs">, approver._id);
    } else if (request.targetTable === "payroll_runs" && request.operation === "delete") {
      if (!request.targetId) throw new Error("Missing target payroll run");
      await applyDeleteRun(ctx, request.targetId as Id<"payroll_runs">);
    } else {
      throw new Error("Unsupported change request target");
    }

    await finalizeApprovalMetadata(ctx, request, approver._id, "approved");
    return { status: "approved" as const };
  },
});

// Get My Payslips (Employee View)
export const getMyPayslips = query({
    args: {},
    handler: async (ctx) => {
        const user = await getViewerInfo(ctx);
        if (!user.employeeId) return [];

        const slips = await ctx.db
            .query("salary_slips")
            .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
            .order("desc")
            .collect();

        // Join with run info to get month/year
        const enriched = await Promise.all(slips.map(async (slip) => {
            const run = await ctx.db.get(slip.runId);
            return {
                ...slip,
                month: run?.month,
                year: run?.year,
                status: run?.status
            };
        }));

        // Filter out drafts from employee view
        return enriched.filter(s => s.status === "completed");
    }
});

// Get Single Slip (with security check)
export const getPayslip = query({
    args: { slipId: v.id("salary_slips") },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);

        const slip = await ctx.db.get(args.slipId);
        if (!slip || slip.orgId !== user.orgId!) return null;

        const isOwner = user.employeeId === slip.employeeId;
        const isPrivileged = ["super_admin", "admin", "hr_manager"].includes(user.role);

        if (!isOwner && !isPrivileged) {
            throw new Error("Unauthorized");
        }

        const run = await ctx.db.get(slip.runId);

        // Employees can't see slips for draft runs
        if (isOwner && !isPrivileged && run?.status !== "completed") {
            return null;
        }

        return {
            ...slip,
            month: run?.month,
            year: run?.year,
        };
    }
});

// Get Payslips for a specific employee (Admin/HR view)
export const getEmployeePayslips = query({
    args: { employeeId: v.id("employees") },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const orgId = user.orgId!;
        const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

        // Allow if privileged or if it's the user's own data (though getMyPayslips covers that)
        if (!isPrivileged && user.employeeId !== args.employeeId) {
            throw new Error("Unauthorized");
        }

        const slips = await ctx.db
            .query("salary_slips")
            .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
            .order("desc")
            .collect();

        // Join with run info
        const enriched = await Promise.all(slips.map(async (slip) => {
            const run = await ctx.db.get(slip.runId);
            return {
                ...slip,
                month: run?.month,
                year: run?.year,
                status: run?.status
            };
        }));

        // Filter out drafts unless privileged
        if (isPrivileged) {
            return enriched;
        } else {
            return enriched.filter(s => s.status === "completed");
        }
    }
});

// ===========================================
// COMPENSATION MANAGEMENT (Credits/Debits)
// ===========================================

export const getEmployeeAdjustments = query({
    args: { employeeId: v.id("employees") },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const isPrivileged = ["super_admin", "admin", "hr_manager"].includes(user.role);

        // Employees can see their own
        if (!isPrivileged && user.employeeId !== args.employeeId) {
            throw new Error("Unauthorized");
        }

        const credits = await ctx.db
            .query("payroll_credits")
            .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
            .collect();

        const debits = await ctx.db
            .query("payroll_debits")
            .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
            .collect();

        return { credits, debits };
    }
});

export const addCredit = mutation({
    args: {
        employeeId: v.id("employees"),
        name: v.string(),
        amount: v.number(),
        type: v.union(v.literal("allowance"), v.literal("bonus"), v.literal("commission"), v.literal("reimbursement"), v.literal("other")),
        isTaxable: v.boolean(),
        isPermanent: v.boolean(), // recurring
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const isPrivileged = canMutatePayroll(user.role);
        if (!isPrivileged) throw new Error("Unauthorized");

        const employee = await ctx.db.get(args.employeeId);
        if (!employee || employee.orgId !== user.orgId!) {
          throw new Error("Employee not found or unauthorized");
        }

        const newData = {
            orgId: user.orgId!,
            employeeId: args.employeeId,
            name: args.name,
            amount: args.amount,
            itemType: args.type,
            isTaxable: args.isTaxable,
            isPermanent: args.isPermanent,
            isActive: true,
            status: "approved" as const,
            requestDate: new Date().toISOString(),
        };

        if (user.role === "super_admin") {
          const createdId = await ctx.db.insert("payroll_credits", {
            ...newData,
            processedBy: user._id,
          });
          const changeRequestId = await queueChangeRequest(ctx, {
            orgId: user.orgId!,
            requesterUserId: user._id,
            approverUserId: user._id,
            targetTable: "payroll_credits",
            targetId: String(createdId),
            operation: "create",
            newData,
            reason: args.reason,
            status: "approved",
          });
          return { mode: "applied" as const, changeRequestId };
        }

        const changeRequestId = await queueChangeRequest(ctx, {
            orgId: user.orgId!,
            requesterUserId: user._id,
            targetTable: "payroll_credits",
            operation: "create",
            newData,
            reason: args.reason,
            status: "pending",
        });
        return { mode: "pending" as const, changeRequestId };
    }
});

export const addDebit = mutation({
    args: {
        employeeId: v.id("employees"),
        name: v.string(),
        amount: v.number(),
        type: v.union(v.literal("loan"), v.literal("advance"), v.literal("penalty"), v.literal("tax"), v.literal("statutory"), v.literal("other")),
        isPermanent: v.boolean(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const isPrivileged = canMutatePayroll(user.role);
        if (!isPrivileged) throw new Error("Unauthorized");

        const employee = await ctx.db.get(args.employeeId);
        if (!employee || employee.orgId !== user.orgId!) {
          throw new Error("Employee not found or unauthorized");
        }

        const newData = {
            orgId: user.orgId!,
            employeeId: args.employeeId,
            name: args.name,
            amount: args.amount,
            itemType: args.type,
            isPermanent: args.isPermanent,
            isActive: true,
            status: "approved" as const,
            requestDate: new Date().toISOString(),
        };

        if (user.role === "super_admin") {
          const createdId = await ctx.db.insert("payroll_debits", {
            ...newData,
            processedBy: user._id
          });
          const changeRequestId = await queueChangeRequest(ctx, {
            orgId: user.orgId!,
            requesterUserId: user._id,
            approverUserId: user._id,
            targetTable: "payroll_debits",
            targetId: String(createdId),
            operation: "create",
            newData,
            reason: args.reason,
            status: "approved",
          });
          return { mode: "applied" as const, changeRequestId };
        }

        const changeRequestId = await queueChangeRequest(ctx, {
          orgId: user.orgId!,
          requesterUserId: user._id,
          targetTable: "payroll_debits",
          operation: "create",
          newData,
          reason: args.reason,
          status: "pending",
        });
        return { mode: "pending" as const, changeRequestId };
    }
});

export const toggleAdjustmentStatus = mutation({
    args: {
        id: v.string(), // ID of credit or debit
        type: v.union(v.literal("credit"), v.literal("debit")),
        isActive: v.boolean(),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const isPrivileged = canMutatePayroll(user.role);
        if (!isPrivileged) throw new Error("Unauthorized");

        if (args.type === "credit") {
            const record = await ctx.db.get(args.id as Id<"payroll_credits">);
            if (!record || record.orgId !== user.orgId!) throw new Error("Record not found or unauthorized");
            if (user.role === "super_admin") {
              await ctx.db.patch(args.id as Id<"payroll_credits">, { isActive: args.isActive });
              const changeRequestId = await queueChangeRequest(ctx, {
                orgId: user.orgId!,
                requesterUserId: user._id,
                approverUserId: user._id,
                targetTable: "payroll_credits",
                targetId: String(args.id),
                operation: "update",
                oldData: { isActive: record.isActive },
                newData: { isActive: args.isActive },
                reason: args.reason,
                status: "approved",
              });
              return { mode: "applied" as const, changeRequestId };
            }

            const changeRequestId = await queueChangeRequest(ctx, {
              orgId: user.orgId!,
              requesterUserId: user._id,
              targetTable: "payroll_credits",
              targetId: String(args.id),
              operation: "update",
              oldData: { isActive: record.isActive },
              newData: { isActive: args.isActive },
              reason: args.reason,
              status: "pending",
            });
            return { mode: "pending" as const, changeRequestId };
        } else {
            const record = await ctx.db.get(args.id as Id<"payroll_debits">);
            if (!record || record.orgId !== user.orgId!) throw new Error("Record not found or unauthorized");
            if (user.role === "super_admin") {
              await ctx.db.patch(args.id as Id<"payroll_debits">, { isActive: args.isActive });
              const changeRequestId = await queueChangeRequest(ctx, {
                orgId: user.orgId!,
                requesterUserId: user._id,
                approverUserId: user._id,
                targetTable: "payroll_debits",
                targetId: String(args.id),
                operation: "update",
                oldData: { isActive: record.isActive },
                newData: { isActive: args.isActive },
                reason: args.reason,
                status: "approved",
              });
              return { mode: "applied" as const, changeRequestId };
            }
            const changeRequestId = await queueChangeRequest(ctx, {
              orgId: user.orgId!,
              requesterUserId: user._id,
              targetTable: "payroll_debits",
              targetId: String(args.id),
              operation: "update",
              oldData: { isActive: record.isActive },
              newData: { isActive: args.isActive },
              reason: args.reason,
              status: "pending",
            });
            return { mode: "pending" as const, changeRequestId };
        }
    }
});
