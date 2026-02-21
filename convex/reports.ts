import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper to get viewer info including role and employeeId
async function getViewerInfo(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Unauthorized");

  const resolvedOrgId = user.activeOrgId ?? user.orgId;
  if (!resolvedOrgId) throw new Error("User has no organization");

  return { ...user, orgId: resolvedOrgId };
}

// Helper to check if user has report access
function hasReportAccess(role: string): boolean {
  return ["super_admin", "admin", "hr_manager"].includes(role);
}

// --- Report Queries ---

/**
 * Get attendance records for a date range with optional department filter
 */
export const getAttendanceReport = query({
  args: {
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!hasReportAccess(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions to view reports");
    }

    const orgId = user.orgId!;

    // Get all employees in org (with optional department filter)
    let employees = await ctx.db
      .query("employees")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    if (args.departmentId) {
      employees = employees.filter(e => e.departmentId === args.departmentId);
    }

    const employeeMap = new Map(employees.map(e => [e._id, e]));
    const employeeIds = new Set(employees.map(e => e._id));

    // Get departments for display
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();
    const deptMap = new Map(departments.map(d => [d._id, d.name]));

    // Get attendance records for the org and filter by date range
    const allRecords = await ctx.db
      .query("attendance_records")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Filter by date range and employee filter
    const records = allRecords.filter(r =>
      r.date >= args.startDate &&
      r.date <= args.endDate &&
      employeeIds.has(r.employeeId)
    );

    // Calculate summary stats
    const statusCounts = {
      present: 0,
      late: 0,
      absent: 0,
      "half-day": 0,
      "on-leave": 0,
      holiday: 0,
    };

    records.forEach(r => {
      if (r.status in statusCounts) {
        statusCounts[r.status as keyof typeof statusCounts]++;
      }
    });

    // Map records to include employee info
    const reportData = records.map(r => {
      const emp = employeeMap.get(r.employeeId);
      return {
        _id: r._id,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown",
        employeeNumber: emp?.employeeNumber || "",
        department: emp?.departmentId ? deptMap.get(emp.departmentId) || "" : "",
        date: r.date,
        status: r.status,
        clockIn: r.clockIn || null,
        clockOut: r.clockOut || null,
        workMinutes: r.workMinutes || 0,
        notes: r.notes || "",
      };
    });

    // Sort by date desc, then by employee name
    reportData.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.employeeName.localeCompare(b.employeeName);
    });

    return {
      records: reportData,
      summary: {
        totalRecords: records.length,
        ...statusCounts,
      },
    };
  },
});

/**
 * Get payroll report for a specific payroll run
 */
export const getPayrollReport = query({
  args: {
    runId: v.id("payroll_runs"),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!hasReportAccess(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions to view reports");
    }

    const orgId = user.orgId!;

    // Verify the run belongs to this org
    const run = await ctx.db.get(args.runId);
    if (!run || run.orgId !== orgId) {
      throw new Error("Payroll run not found");
    }

    // Get salary slips for this run
    let slips = await ctx.db
      .query("salary_slips")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    // Filter by department if provided
    if (args.departmentId) {
      // Get department name for comparison
      const dept = await ctx.db.get(args.departmentId);
      if (dept) {
        slips = slips.filter(s => s.department === dept.name);
      }
    }

    // Calculate summary stats
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;

    const reportData = slips.map(s => {
      totalGross += s.grossSalary;
      totalNet += s.netSalary;
      totalDeductions += s.grossSalary - s.netSalary;

      return {
        _id: s._id,
        employeeName: s.employeeName,
        designation: s.designation || "",
        department: s.department || "",
        basicSalary: s.basicSalary,
        grossSalary: s.grossSalary,
        deductions: s.grossSalary - s.netSalary,
        netSalary: s.netSalary,
      };
    });

    // Sort by employee name
    reportData.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    return {
      run: {
        month: run.month,
        year: run.year,
        status: run.status,
        runDate: run.runDate,
      },
      records: reportData,
      summary: {
        employeeCount: slips.length,
        totalGross,
        totalDeductions,
        totalNet,
      },
    };
  },
});

/**
 * Get tax report for a specific payroll run
 * Extracts PAYE, NSSF, NHIF, Housing Levy from salary slips
 */
export const getTaxReport = query({
  args: {
    runId: v.id("payroll_runs"),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!hasReportAccess(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions to view reports");
    }

    const orgId = user.orgId!;

    // Verify the run belongs to this org
    const run = await ctx.db.get(args.runId);
    if (!run || run.orgId !== orgId) {
      throw new Error("Payroll run not found");
    }

    // Get salary slips for this run
    const slips = await ctx.db
      .query("salary_slips")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .collect();

    // Get employee statutory info for KRA PINs
    const employeeIds = [...new Set(slips.map(s => s.employeeId))];
    const statutoryRecords = await Promise.all(
      employeeIds.map(async (empId) => {
        const record = await ctx.db
          .query("employee_statutory")
          .withIndex("by_employee", (q) => q.eq("employeeId", empId))
          .first();
        return { employeeId: empId, statutory: record };
      })
    );
    const statutoryMap = new Map(
      statutoryRecords.map(r => [r.employeeId, r.statutory])
    );

    // Summary totals
    let totalPaye = 0;
    let totalNssfEmployee = 0;
    let totalNssfEmployer = 0;
    let totalNhif = 0;
    let totalHousingLevy = 0;

    // Process each slip
    const reportData = slips.map(slip => {
      const deductions = (slip.deductions as Array<{ name: string; amount: number; code?: string }>) || [];
      const employerContribs = (slip.employerContributions as Array<{ name: string; amount: number; code?: string }>) || [];

      // Extract statutory deductions by code or name
      const findDeduction = (codes: string[], names: string[]) => {
        return deductions.find(d =>
          (d.code && codes.includes(d.code)) ||
          names.some(n => d.name.toLowerCase().includes(n.toLowerCase()))
        );
      };

      const findEmployerContrib = (codes: string[], names: string[]) => {
        return employerContribs.find(c =>
          (c.code && codes.includes(c.code)) ||
          names.some(n => c.name.toLowerCase().includes(n.toLowerCase()))
        );
      };

      const paye = findDeduction(["PAYE"], ["paye", "income tax"])?.amount || 0;
      const nssfEmp = findDeduction(["NSSF", "NSSF_T1", "NSSF_T2"], ["nssf"])?.amount || 0;
      const nhif = findDeduction(["NHIF"], ["nhif", "health insurance"])?.amount || 0;
      const housingLevy = findDeduction(["HOUSING_LEVY", "HOUSING"], ["housing levy"])?.amount || 0;
      const nssfEr = findEmployerContrib(["NSSF", "NSSF_ER"], ["nssf"])?.amount || 0;

      totalPaye += paye;
      totalNssfEmployee += nssfEmp;
      totalNssfEmployer += nssfEr;
      totalNhif += nhif;
      totalHousingLevy += housingLevy;

      const statutory = statutoryMap.get(slip.employeeId);

      // Calculate taxable income (gross minus exempt items)
      // For simplicity, we use gross minus NSSF employee contribution
      const taxableIncome = slip.grossSalary - nssfEmp;

      return {
        _id: slip._id,
        employeeName: slip.employeeName,
        kraPin: statutory?.taxId || "",
        nhifNumber: statutory?.healthInsuranceId || "",
        nssfNumber: statutory?.socialSecurityId || "",
        grossSalary: slip.grossSalary,
        taxableIncome,
        paye,
        nssfEmployee: nssfEmp,
        nssfEmployer: nssfEr,
        nhif,
        housingLevy,
      };
    });

    // Sort by employee name
    reportData.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    return {
      run: {
        month: run.month,
        year: run.year,
        status: run.status,
        runDate: run.runDate,
      },
      records: reportData,
      summary: {
        employeeCount: slips.length,
        totalPaye,
        totalNssfEmployee,
        totalNssfEmployer,
        totalNhif,
        totalHousingLevy,
        totalStatutory: totalPaye + totalNssfEmployee + totalNssfEmployer + totalNhif + totalHousingLevy,
      },
    };
  },
});

/**
 * Get all departments for filter dropdowns
 */
export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    if (!hasReportAccess(user.role)) {
      throw new Error("Unauthorized");
    }

    const departments = await ctx.db
      .query("departments")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();

    return departments.map(d => ({
      _id: d._id,
      name: d.name,
      code: d.code,
    }));
  },
});

/**
 * Get completed payroll runs for report selection
 */
export const getPayrollRuns = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    if (!hasReportAccess(user.role)) {
      throw new Error("Unauthorized");
    }

    const runs = await ctx.db
      .query("payroll_runs")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();

    // Only show completed runs, sorted by date desc
    const completedRuns = runs
      .filter(r => r.status === "completed")
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    return completedRuns.map(r => ({
      _id: r._id,
      month: r.month,
      year: r.year,
      label: `${getMonthName(r.month)} ${r.year}`,
      employeeCount: r.employeeCount || 0,
      totalNetPay: r.totalNetPay || 0,
    }));
  },
});

// Helper function to get month name
function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}
