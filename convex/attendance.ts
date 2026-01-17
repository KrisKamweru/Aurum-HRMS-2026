import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper to get viewer info including role and employeeId
async function getViewerInfo(ctx: QueryCtx | any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

// Helper to calculate minutes between two ISO timestamps
function calculateDurationMinutes(start: string, end: string, breakMinutes: number = 0): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  return Math.max(0, diffMinutes - breakMinutes);
}

// Helper to get day of week (0=Sunday, 1=Monday...) from YYYY-MM-DD
function getDayOfWeek(dateString: string): number {
  return new Date(dateString).getUTCDay();
}

// Helper to get schedule for a specific day
async function getWorkSchedule(ctx: QueryCtx, orgId: Id<"organizations">, employeeId: Id<"employees">, date: string) {
    const dayOfWeek = getDayOfWeek(date);

    // 1. Try to find specific employee schedule override
    // Note: We don't have a compound index for employee+day, so we filter
    const empSchedules = await ctx.db
        .query("work_schedules")
        .withIndex("by_employee", (q) => q.eq("employeeId", employeeId))
        .collect();

    const specificSchedule = empSchedules.find((s: any) => s.dayOfWeek === dayOfWeek);

    if (specificSchedule) return specificSchedule;

    // 2. Fallback to org default (employeeId is undefined/null)
    const orgSchedules = await ctx.db
        .query("work_schedules")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();

    // Find the schedule for this day where employeeId is missing
    const defaultSchedule = orgSchedules.find((s: any) => s.dayOfWeek === dayOfWeek && !s.employeeId);

    return defaultSchedule;
}

// Helper to determine status based on times
function determineStatus(
    clockIn: string,
    schedule: any
): "present" | "late" | "half-day" {
    if (!schedule || !schedule.startTime) return "present";

    // Simple comparison: Extract HH:MM from clockIn ISO string
    // Assuming ISO string is UTC and schedule is UTC for MVP simplicity
    // OR assuming schedule times are local and we simply parse the ISO to local
    // Given the ambiguity, we'll try to extract the time part.

    const clockInDate = new Date(clockIn);
    // Format as HH:MM
    const clockInTime = clockInDate.toISOString().substring(11, 16);

    if (clockInTime > schedule.startTime) {
        return "late";
    }

    return "present";
}

// --- Queries ---

export const getTodayStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);

    if (!user.employeeId) return null;

    // We define "today" as the current UTC date string YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const record = await ctx.db
      .query("attendance_records")
      .withIndex("by_employee_date", (q) => q.eq("employeeId", user.employeeId!).eq("date", today))
      .first();

    return record;
  },
});

export const getMyAttendance = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);

    if (!user.employeeId) return [];

    // Range query using index
    // Note: Convex doesn't support direct range queries on non-indexed fields nicely without full scan or careful indexing.
    // We have "by_employee_date" index: ["employeeId", "date"]
    // We can use this for range queries.

    const records = await ctx.db
      .query("attendance_records")
      .withIndex("by_employee_date", (q) =>
        q.eq("employeeId", user.employeeId!)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .collect();

    return records;
  },
});

export const getTeamAttendance = query({
  args: {
    date: v.string(), // YYYY-MM-DD
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // Get all employees in org (or just team if manager?)
    // Requirement says "For managers/HR: Get team attendance"
    // If Manager, filter by managerId. If HR/Admin, all.

    let employeesQuery = ctx.db.query("employees").withIndex("by_org", (q) => q.eq("orgId", orgId));

    // Ideally we filter active employees only

    const allEmployees = await employeesQuery.collect();

    // Filter for Managers (only their reports)
    let relevantEmployees = allEmployees;
    if (user.role === "manager" && user.employeeId) {
        relevantEmployees = allEmployees.filter(e => e.managerId === user.employeeId);
        // Also include the manager themselves? Usually yes.
        // relevantEmployees.push(allEmployees.find(e => e._id === user.employeeId)!);
    }

    const employeeIds = relevantEmployees.map(e => e._id);
    const employeeMap = new Map(relevantEmployees.map(e => [e._id, e]));

    // Get attendance for this date
    const attendanceRecords = await ctx.db
        .query("attendance_records")
        .withIndex("by_date", (q) => q.eq("date", args.date))
        .filter(q => q.eq(q.field("orgId"), orgId))
        .collect();

    // Map records to employees
    const result = relevantEmployees.map(emp => {
        const record = attendanceRecords.find(r => r.employeeId === emp._id);
        return {
            employee: {
                id: emp._id,
                name: `${emp.firstName} ${emp.lastName}`,
                email: emp.email,
                departmentId: emp.departmentId,
                designationId: emp.designationId,
                image: null // Add image if needed from user table link
            },
            attendance: record || null
        };
    });

    return result;
  },
});

export const getAttendanceSummary = query({
  args: {
    month: v.string(), // YYYY-MM
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!user.employeeId) return null;

    const startDate = `${args.month}-01`;
    // Simple end date calculation
    const [year, month] = args.month.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate(); // last day of month
    const endDate = `${args.month}-${lastDay}`;

    const records = await ctx.db
      .query("attendance_records")
      .withIndex("by_employee_date", (q) =>
        q.eq("employeeId", user.employeeId!)
         .gte("date", startDate)
         .lte("date", endDate)
      )
      .collect();

    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let totalWorkMinutes = 0;

    records.forEach(r => {
        if (r.status === 'present' || r.status === 'late' || r.status === 'half-day') {
            presentDays++;
        }
        if (r.status === 'absent') absentDays++;
        if (r.status === 'late') lateDays++;
        if (r.workMinutes) totalWorkMinutes += r.workMinutes;
    });

    const avgWorkMinutes = presentDays > 0 ? Math.round(totalWorkMinutes / presentDays) : 0;

    return {
        presentDays,
        absentDays,
        lateDays,
        totalWorkMinutes,
        avgWorkMinutes
    };
  },
});

// --- Mutations ---

export const clockIn = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    if (!user.employeeId) throw new Error("No employee profile found");

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString();

    // Check if already clocked in
    const existing = await ctx.db
        .query("attendance_records")
        .withIndex("by_employee_date", (q) => q.eq("employeeId", user.employeeId!).eq("date", dateStr))
        .first();

    if (existing) {
        throw new Error("Already has attendance record for today");
    }

    // Get schedule to determine status (late vs present)
    const schedule = await getWorkSchedule(ctx, user.orgId!, user.employeeId, dateStr);

    let status: "present" | "late" | "holiday" | "on-leave" = "present";

    // If it's not a work day, maybe mark as overtime or present?
    if (schedule && !schedule.isWorkDay) {
        // Warning or just allow it
    }

    // Determine if late
    if (schedule && schedule.startTime) {
        // Extract HH:MM
        const currentHHMM = timeStr.substring(11, 16);
        if (currentHHMM > schedule.startTime) {
            status = "late";
        }
    }

    const recordId = await ctx.db.insert("attendance_records", {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        date: dateStr,
        clockIn: timeStr,
        status: status,
    });

    return await ctx.db.get(recordId);
  },
});

export const clockOut = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    if (!user.employeeId) throw new Error("No employee profile found");

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString();

    const record = await ctx.db
        .query("attendance_records")
        .withIndex("by_employee_date", (q) => q.eq("employeeId", user.employeeId!).eq("date", dateStr))
        .first();

    if (!record) {
        throw new Error("No attendance record found for today. Please clock in first.");
    }

    if (record.clockOut) {
        throw new Error("Already clocked out for today");
    }

    // Calculate work minutes
    let workMinutes = 0;
    if (record.clockIn) {
        workMinutes = calculateDurationMinutes(record.clockIn, timeStr, record.breakMinutes || 0);
    }

    await ctx.db.patch(record._id, {
        clockOut: timeStr,
        workMinutes: workMinutes
    });

    return await ctx.db.get(record._id);
  },
});

export const manualEntry = mutation({
  args: {
    employeeId: v.id("employees"),
    date: v.string(), // YYYY-MM-DD
    clockIn: v.optional(v.string()), // ISO
    clockOut: v.optional(v.string()), // ISO
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("half-day"),
      v.literal("on-leave"),
      v.literal("holiday")
    ),
    notes: v.optional(v.string()),
    breakMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // Check if employee belongs to org
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.orgId !== orgId) {
        throw new Error("Employee not found");
    }

    // If manager, check if employee is in team
    if (user.role === "manager" && employee.managerId !== user.employeeId) {
        throw new Error("Unauthorized: Can only manage team members");
    }

    // Check if record exists
    const existing = await ctx.db
        .query("attendance_records")
        .withIndex("by_employee_date", (q) => q.eq("employeeId", args.employeeId).eq("date", args.date))
        .first();

    let workMinutes = undefined;
    if (args.clockIn && args.clockOut) {
        workMinutes = calculateDurationMinutes(args.clockIn, args.clockOut, args.breakMinutes || 0);
    }

    if (existing) {
        await ctx.db.patch(existing._id, {
            clockIn: args.clockIn,
            clockOut: args.clockOut,
            status: args.status,
            notes: args.notes,
            breakMinutes: args.breakMinutes,
            workMinutes: workMinutes,
            isManualEntry: true,
            approvedBy: user.employeeId,
        });
        return await ctx.db.get(existing._id);
    } else {
        const id = await ctx.db.insert("attendance_records", {
            orgId,
            employeeId: args.employeeId,
            date: args.date,
            clockIn: args.clockIn,
            clockOut: args.clockOut,
            status: args.status,
            notes: args.notes,
            breakMinutes: args.breakMinutes,
            workMinutes: workMinutes,
            isManualEntry: true,
            approvedBy: user.employeeId,
        });
        return await ctx.db.get(id);
    }
  },
});
