import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewerInfo } from "./sensitive_changes";
import { Id } from "./_generated/dataModel";

const REPORT_ADMIN_ROLES = new Set(["super_admin", "admin", "hr_manager", "manager"]);

function ensureReportAdmin(role: string) {
  if (!REPORT_ADMIN_ROLES.has(role)) {
    throw new Error("Unauthorized: Report scheduling requires admin, HR manager, or manager role");
  }
}

function isoDate(value: Date) {
  return value.toISOString().split("T")[0];
}

function resolvePeriodWindow(
  period: "daily" | "weekly" | "monthly" | "quarterly",
  startDate?: string,
  endDate?: string,
) {
  if (startDate && endDate) {
    return { startDate, endDate };
  }

  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  if (period === "daily") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else if (period === "weekly") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    start.setUTCDate(start.getUTCDate() - 6);
  } else if (period === "monthly") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  } else {
    const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
    start = new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1));
  }

  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function nextRunAt(cadence: "daily" | "weekly" | "monthly", nowIso: string) {
  const dt = new Date(nowIso);
  if (cadence === "daily") dt.setUTCDate(dt.getUTCDate() + 1);
  if (cadence === "weekly") dt.setUTCDate(dt.getUTCDate() + 7);
  if (cadence === "monthly") dt.setUTCMonth(dt.getUTCMonth() + 1);
  return dt.toISOString();
}

async function computeCanonicalMetrics(
  ctx: any,
  orgId: Id<"organizations">,
  startDate: string,
  endDate: string,
) {
  const employees = await ctx.db
    .query("employees")
    .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
    .collect();

  const activeStatuses = new Set(["active", "on-leave"]);
  const activeHeadcount = employees.filter((employee: any) => activeStatuses.has(employee.status)).length;

  const attritionCandidates = employees.filter((employee: any) => {
    if (employee.status !== "resigned" && employee.status !== "terminated") return false;
    if (!employee.endDate) return false;
    return employee.endDate >= startDate && employee.endDate <= endDate;
  });
  const attritionCount = attritionCandidates.length;
  const attritionRate = activeHeadcount > 0 ? attritionCount / activeHeadcount : 0;

  const leaveRequests = await ctx.db
    .query("leave_requests")
    .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
    .collect();
  const leaveLiabilityDays = leaveRequests
    .filter((leave: any) => leave.status === "approved" || leave.status === "pending")
    .filter((leave: any) => leave.endDate >= startDate && leave.startDate <= endDate)
    .reduce((total: number, leave: any) => total + (leave.days ?? 0), 0);

  const completedRuns = (await ctx.db
    .query("payroll_runs")
    .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
    .collect())
    .filter((run: any) => run.status === "completed")
    .sort((a: any, b: any) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  const latestRun = completedRuns[0];
  const previousRun = completedRuns[1];
  const latestNet = latestRun?.totalNetPay ?? 0;
  const previousNet = previousRun?.totalNetPay ?? 0;
  const payrollVarianceAmount = latestNet - previousNet;
  const payrollVariancePercent = previousNet > 0 ? payrollVarianceAmount / previousNet : 0;

  return {
    headcount: activeHeadcount,
    attritionCount,
    attritionRate,
    leaveLiabilityDays,
    payrollVarianceAmount,
    payrollVariancePercent,
  };
}

async function buildScheduleSnapshot(ctx: any, orgId: Id<"organizations">, reportType: string) {
  if (reportType === "attendance") {
    const today = isoDate(new Date());
    const attendance = await ctx.db
      .query("attendance_records")
      .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
      .collect();
    const todayRecords = attendance.filter((record: any) => record.date === today);
    return { recordCount: todayRecords.length };
  }

  if (reportType === "payroll" || reportType === "tax") {
    const runs = await ctx.db
      .query("payroll_runs")
      .withIndex("by_org", (q: any) => q.eq("orgId", orgId))
      .collect();
    const latest = runs
      .filter((run: any) => run.status === "completed")
      .sort((a: any, b: any) => (a.year === b.year ? b.month - a.month : b.year - a.year))[0];
    return {
      runId: latest?._id ?? null,
      year: latest?.year ?? null,
      month: latest?.month ?? null,
      totalNetPay: latest?.totalNetPay ?? 0,
      employeeCount: latest?.employeeCount ?? 0,
    };
  }

  const window = resolvePeriodWindow("monthly");
  return await computeCanonicalMetrics(ctx, orgId, window.startDate, window.endDate);
}

export const getCanonicalMetrics = query({
  args: {
    period: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("quarterly")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureReportAdmin(user.role);

    const { startDate, endDate } = resolvePeriodWindow(args.period, args.startDate, args.endDate);
    const metrics = await computeCanonicalMetrics(ctx, user.orgId!, startDate, endDate);
    return {
      period: args.period,
      startDate,
      endDate,
      ...metrics,
    };
  },
});

export const listReportSchedules = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    ensureReportAdmin(user.role);

    return await ctx.db
      .query("report_schedules")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();
  },
});

export const createReportSchedule = mutation({
  args: {
    name: v.string(),
    reportType: v.union(
      v.literal("attendance"),
      v.literal("payroll"),
      v.literal("tax"),
      v.literal("headcount"),
      v.literal("attrition"),
      v.literal("leave_liability"),
      v.literal("payroll_variance"),
    ),
    cadence: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    format: v.union(v.literal("csv"), v.literal("json")),
    recipients: v.array(v.string()),
    filters: v.optional(v.any()),
    nextRunAt: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureReportAdmin(user.role);

    const nowIso = new Date().toISOString();
    return await ctx.db.insert("report_schedules", {
      orgId: user.orgId!,
      name: args.name,
      reportType: args.reportType,
      cadence: args.cadence,
      format: args.format,
      recipients: args.recipients,
      isActive: true,
      filters: args.filters,
      nextRunAt: args.nextRunAt,
      timezone: args.timezone,
      createdBy: user._id,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  },
});

export const setReportScheduleActive = mutation({
  args: {
    scheduleId: v.id("report_schedules"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureReportAdmin(user.role);

    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule || schedule.orgId !== user.orgId) {
      throw new Error("Report schedule not found");
    }

    await ctx.db.patch(schedule._id, {
      isActive: args.isActive,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(schedule._id);
  },
});

export const runDueReportSchedules = mutation({
  args: {
    limit: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureReportAdmin(user.role);

    const nowIso = new Date().toISOString();
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 500);
    const dryRun = args.dryRun ?? false;

    const schedules = await ctx.db
      .query("report_schedules")
      .withIndex("by_org_active", (q) => q.eq("orgId", user.orgId!).eq("isActive", true))
      .collect();

    const due = schedules
      .filter((schedule) => !schedule.nextRunAt || schedule.nextRunAt <= nowIso)
      .sort((a, b) => (a.nextRunAt ?? "").localeCompare(b.nextRunAt ?? ""))
      .slice(0, limit);

    const processed: Array<{ scheduleId: string; status: "success" | "failed"; periodKey: string; error?: string }> = [];
    for (const schedule of due) {
      const period = schedule.cadence === "daily" ? "daily" : schedule.cadence === "weekly" ? "weekly" : "monthly";
      const window = resolvePeriodWindow(period);
      const periodKey = `${period}:${window.startDate}:${window.endDate}`;

      try {
        const snapshot = await buildScheduleSnapshot(ctx, user.orgId!, schedule.reportType);
        if (!dryRun) {
          await ctx.db.insert("report_delivery_logs", {
            orgId: user.orgId!,
            scheduleId: schedule._id,
            reportType: schedule.reportType,
            status: "success",
            trigger: "scheduled",
            periodKey,
            generatedAt: nowIso,
            generatedBy: user._id,
            recipientCount: schedule.recipients.length,
            artifactPath: `scheduled://${schedule.reportType}/${periodKey}`,
            error: undefined,
          });

          await ctx.db.patch(schedule._id, {
            lastAttemptAt: nowIso,
            lastRunAt: nowIso,
            nextRunAt: nextRunAt(schedule.cadence, nowIso),
            updatedAt: nowIso,
            filters: {
              ...(schedule.filters ?? {}),
              _lastSnapshot: snapshot,
            },
          });
        }
        processed.push({ scheduleId: String(schedule._id), status: "success", periodKey });
      } catch (error: any) {
        if (!dryRun) {
          await ctx.db.insert("report_delivery_logs", {
            orgId: user.orgId!,
            scheduleId: schedule._id,
            reportType: schedule.reportType,
            status: "failed",
            trigger: "scheduled",
            periodKey,
            generatedAt: nowIso,
            generatedBy: user._id,
            recipientCount: schedule.recipients.length,
            artifactPath: undefined,
            error: error?.message || "Unknown scheduler error",
          });
          await ctx.db.patch(schedule._id, {
            lastAttemptAt: nowIso,
            nextRunAt: nextRunAt(schedule.cadence, nowIso),
            updatedAt: nowIso,
          });
        }
        processed.push({
          scheduleId: String(schedule._id),
          status: "failed",
          periodKey,
          error: error?.message || "Unknown scheduler error",
        });
      }
    }

    return {
      dryRun,
      processedCount: processed.length,
      processed,
      processedAt: nowIso,
    };
  },
});

export const logReportDelivery = mutation({
  args: {
    scheduleId: v.optional(v.id("report_schedules")),
    reportType: v.string(),
    status: v.union(v.literal("success"), v.literal("failed")),
    trigger: v.optional(v.union(v.literal("manual"), v.literal("scheduled"), v.literal("retry"))),
    periodKey: v.optional(v.string()),
    recipientCount: v.number(),
    artifactPath: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureReportAdmin(user.role);

    const nowIso = new Date().toISOString();
    const logId = await ctx.db.insert("report_delivery_logs", {
      orgId: user.orgId!,
      scheduleId: args.scheduleId,
      reportType: args.reportType,
      status: args.status,
      trigger: args.trigger ?? "manual",
      periodKey: args.periodKey,
      generatedAt: nowIso,
      generatedBy: user._id,
      recipientCount: Math.max(0, Math.floor(args.recipientCount)),
      artifactPath: args.artifactPath,
      error: args.error,
    });

    if (args.scheduleId) {
      const schedule = await ctx.db.get(args.scheduleId);
      if (schedule && schedule.orgId === user.orgId) {
        await ctx.db.patch(schedule._id, {
          lastAttemptAt: nowIso,
          lastRunAt: args.status === "success" ? nowIso : schedule.lastRunAt,
          updatedAt: nowIso,
        });
      }
    }

    return logId;
  },
});

export const listReportDeliveryLogs = query({
  args: {
    status: v.optional(v.union(v.literal("success"), v.literal("failed"))),
    reportType: v.optional(v.string()),
    trigger: v.optional(v.union(v.literal("manual"), v.literal("scheduled"), v.literal("retry"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureReportAdmin(user.role);

    const limit = Math.min(Math.max(args.limit ?? 200, 1), 1000);
    const logs = await ctx.db
      .query("report_delivery_logs")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();

    return logs
      .filter((log) => {
        if (args.status && log.status !== args.status) return false;
        if (args.reportType && log.reportType !== args.reportType) return false;
        if (args.trigger && log.trigger !== args.trigger) return false;
        return true;
      })
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
      .slice(0, limit);
  },
});
