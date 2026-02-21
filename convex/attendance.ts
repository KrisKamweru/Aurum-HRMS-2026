import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { getViewerInfo } from "./sensitive_changes";

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
async function getWorkSchedule(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  employeeId: Id<"employees">,
  date: string
) {
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

type TrustSignalsInput = {
  deviceIdHash?: string;
  ipHash?: string;
  userAgentHash?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  reasonCode?: string;
  reasonText?: string;
};

type TrustMode = "observe" | "warn" | "hold" | "deny";
type TrustDecision = "observed" | "allowed" | "warned" | "held" | "denied" | "approved" | "rejected";
type RiskLevel = "low" | "medium" | "high";

type TrustPolicy = {
  mode: TrustMode;
  warnThreshold: number;
  holdThreshold: number;
  denyThreshold: number;
  requireReasonAtRisk: "medium" | "high";
  impossibleTravelSpeedKph: number;
  geofence?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  enabled: boolean;
};

const DEFAULT_POLICY: TrustPolicy = {
  mode: "observe",
  warnThreshold: 35,
  holdThreshold: 65,
  denyThreshold: 85,
  requireReasonAtRisk: "medium",
  impossibleTravelSpeedKph: 900,
  enabled: true,
};

const TRUST_REVIEW_ROLES = new Set(["super_admin", "admin", "hr_manager", "manager"]);
const TRUST_POLICY_ADMIN_ROLES = new Set(["super_admin", "admin", "hr_manager"]);

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function riskRank(level: RiskLevel) {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  return 1;
}

function hasReason(signals: TrustSignalsInput | undefined) {
  return Boolean(signals?.reasonText && signals.reasonText.trim());
}

function normalizeReasonCode(value: string | undefined, fallback: string) {
  if (!value || value.trim().length === 0) return fallback;
  return value.trim().slice(0, 120);
}

function normalizeReasonText(value: string | undefined) {
  if (!value || value.trim().length === 0) return undefined;
  return value.trim().slice(0, 500);
}

async function fetchTrustPolicy(ctx: QueryCtx | MutationCtx, orgId: Id<"organizations">): Promise<TrustPolicy> {
  const existing = await ctx.db
    .query("attendance_trust_policies")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .first();

  if (!existing) return DEFAULT_POLICY;
  return {
    mode: existing.mode,
    warnThreshold: existing.warnThreshold,
    holdThreshold: existing.holdThreshold,
    denyThreshold: existing.denyThreshold,
    requireReasonAtRisk: existing.requireReasonAtRisk,
    impossibleTravelSpeedKph: existing.impossibleTravelSpeedKph,
    geofence: existing.geofence,
    enabled: existing.enabled,
  };
}

async function isTrustedDevice(
  ctx: MutationCtx,
  employeeId: Id<"employees">,
  deviceIdHash?: string,
) {
  if (!deviceIdHash) return false;

  const existing = await ctx.db
    .query("attendance_trusted_devices")
    .withIndex("by_employee_device", (q) => q.eq("employeeId", employeeId).eq("deviceIdHash", deviceIdHash))
    .first();

  return Boolean(existing && existing.status === "active");
}

async function markTrustedDeviceSeen(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  employeeId: Id<"employees">,
  deviceIdHash?: string,
) {
  if (!deviceIdHash) return;

  const existing = await ctx.db
    .query("attendance_trusted_devices")
    .withIndex("by_employee_device", (q) => q.eq("employeeId", employeeId).eq("deviceIdHash", deviceIdHash))
    .first();

  const nowIso = new Date().toISOString();
  if (!existing) {
    await ctx.db.insert("attendance_trusted_devices", {
      orgId,
      employeeId,
      deviceIdHash,
      firstSeenAt: nowIso,
      lastSeenAt: nowIso,
      punchCount: 1,
      status: "active",
    });
    return;
  }

  if (existing.status !== "active") {
    return;
  }

  await ctx.db.patch(existing._id, {
    lastSeenAt: nowIso,
    punchCount: (existing.punchCount || 0) + 1,
  });
}

async function getLastGeoTrustEvent(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  employeeId: Id<"employees">,
) {
  const events = await ctx.db
    .query("attendance_trust_events")
    .withIndex("by_employee", (q) => q.eq("employeeId", employeeId))
    .collect();

  return events
    .filter(
      (event) =>
        event.orgId === orgId &&
        typeof event.signals.latitude === "number" &&
        typeof event.signals.longitude === "number",
    )
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
}

async function evaluateGeoRiskContext(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  employeeId: Id<"employees">,
  signals: TrustSignalsInput | undefined,
  policy: TrustPolicy,
  capturedAt: string,
) {
  const hasGeo = typeof signals?.latitude === "number" && typeof signals?.longitude === "number";
  let outsideGeofence = false;
  let impossibleTravel = false;

  if (!hasGeo) {
    return { outsideGeofence, impossibleTravel };
  }

  if (policy.geofence) {
    const dist = distanceMeters(
      policy.geofence.latitude,
      policy.geofence.longitude,
      signals.latitude!,
      signals.longitude!,
    );
    const grace = typeof signals?.accuracyMeters === "number" ? Math.min(signals.accuracyMeters, 500) : 0;
    outsideGeofence = dist > policy.geofence.radiusMeters + grace;
  }

  const previous = await getLastGeoTrustEvent(ctx, orgId, employeeId);
  if (previous && policy.impossibleTravelSpeedKph > 0) {
    const previousMs = Date.parse(previous.capturedAt);
    const currentMs = Date.parse(capturedAt);
    if (!Number.isNaN(previousMs) && !Number.isNaN(currentMs) && currentMs > previousMs) {
      const hours = (currentMs - previousMs) / (1000 * 60 * 60);
      if (hours > 0) {
        const distKm = distanceMeters(
          previous.signals.latitude!,
          previous.signals.longitude!,
          signals.latitude!,
          signals.longitude!,
        ) / 1000;
        const speedKph = distKm / hours;
        if (speedKph > policy.impossibleTravelSpeedKph) {
          impossibleTravel = true;
        }
      }
    }
  }

  return { outsideGeofence, impossibleTravel };
}

function scoreAttendanceRisk(
  signals: TrustSignalsInput | undefined,
  isKnownDevice: boolean,
  isManualEntry: boolean,
  geoRisk: { outsideGeofence: boolean; impossibleTravel: boolean },
) {
  let riskScore = 0;
  const reasons: string[] = [];

  if (isManualEntry) {
    riskScore += 35;
    reasons.push("MANUAL_ENTRY");
  }

  if (!signals?.deviceIdHash) {
    riskScore += 25;
    reasons.push("MISSING_DEVICE_SIGNAL");
  } else if (!isKnownDevice) {
    riskScore += 35;
    reasons.push("NEW_DEVICE");
  }

  const hasGeo = typeof signals?.latitude === "number" && typeof signals?.longitude === "number";
  if (!hasGeo) {
    riskScore += 20;
    reasons.push("MISSING_GEO");
  }

  if (typeof signals?.accuracyMeters === "number" && signals.accuracyMeters > 200) {
    riskScore += 10;
    reasons.push("LOW_GEO_ACCURACY");
  }

  if (geoRisk.outsideGeofence) {
    riskScore += 25;
    reasons.push("OUTSIDE_GEOFENCE");
  }

  if (geoRisk.impossibleTravel) {
    riskScore += 35;
    reasons.push("IMPOSSIBLE_TRAVEL");
  }

  if (signals?.reasonCode) {
    reasons.push(`REASON_CODE:${signals.reasonCode}`);
  }

  const riskLevel: RiskLevel = riskScore >= 70 ? "high" : riskScore >= 35 ? "medium" : "low";
  return { riskScore, riskLevel, reasons };
}

function evaluateTrustDecision(policy: TrustPolicy, riskScore: number, riskLevel: RiskLevel, enforcePolicy: boolean) {
  const warnTriggered = riskScore >= policy.warnThreshold;
  const holdTriggered = riskScore >= policy.holdThreshold;
  const denyTriggered = riskScore >= policy.denyThreshold;

  const requiresReason =
    policy.enabled &&
    warnTriggered &&
    riskRank(riskLevel) >= riskRank(policy.requireReasonAtRisk === "high" ? "high" : "medium");

  if (!policy.enabled || policy.mode === "observe") {
    return { decision: "observed" as TrustDecision, requiresReason, blocked: false };
  }

  if (!warnTriggered) {
    return { decision: "allowed" as TrustDecision, requiresReason, blocked: false };
  }

  if (policy.mode === "warn") {
    return { decision: "warned" as TrustDecision, requiresReason, blocked: false };
  }

  if (policy.mode === "hold") {
    if (holdTriggered && enforcePolicy) {
      return { decision: "held" as TrustDecision, requiresReason, blocked: true };
    }
    return { decision: "warned" as TrustDecision, requiresReason, blocked: false };
  }

  if (denyTriggered && enforcePolicy) {
    return { decision: "denied" as TrustDecision, requiresReason, blocked: true };
  }
  if (holdTriggered && enforcePolicy) {
    return { decision: "held" as TrustDecision, requiresReason, blocked: true };
  }
  return { decision: "warned" as TrustDecision, requiresReason, blocked: false };
}

async function writeTrustEvent(
  ctx: MutationCtx,
  args: {
    orgId: Id<"organizations">;
    employeeId: Id<"employees">;
    attendanceRecordId?: Id<"attendance_records">;
    eventType: "clock_in" | "clock_out" | "manual_entry";
    policyMode: TrustMode;
    decision: TrustDecision;
    riskScore: number;
    riskLevel: RiskLevel;
    reasons: string[];
    requiresReason: boolean;
    signals?: TrustSignalsInput;
    pendingAction?: { type: string; payload: unknown };
    reviewNote?: string;
  }
) {
  return await ctx.db.insert("attendance_trust_events", {
    orgId: args.orgId,
    employeeId: args.employeeId,
    attendanceRecordId: args.attendanceRecordId,
    eventType: args.eventType,
    capturedAt: new Date().toISOString(),
    riskScore: args.riskScore,
    riskLevel: args.riskLevel,
    policyMode: args.policyMode,
    decision: args.decision,
    requiresReason: args.requiresReason,
    reasonCode: args.signals?.reasonCode,
    reasonText: normalizeReasonText(args.signals?.reasonText),
    reviewNote: args.reviewNote,
    pendingAction: args.pendingAction,
    reasons: args.reasons,
    signals: {
      deviceIdHash: args.signals?.deviceIdHash,
      ipHash: args.signals?.ipHash,
      userAgentHash: args.signals?.userAgentHash,
      latitude: args.signals?.latitude,
      longitude: args.signals?.longitude,
      accuracyMeters: args.signals?.accuracyMeters,
      reasonCode: args.signals?.reasonCode,
    },
  });
}

async function getManagerEmployeeIds(ctx: QueryCtx | MutationCtx, managerEmployeeId: Id<"employees">) {
  const reports = await ctx.db
    .query("employees")
    .withIndex("by_manager", (q) => q.eq("managerId", managerEmployeeId))
    .collect();
  return new Set([managerEmployeeId, ...reports.map((report) => report._id)]);
}

async function applyHeldPendingAction(ctx: MutationCtx, event: Doc<"attendance_trust_events">) {
  if (!event.pendingAction) {
    return event.attendanceRecordId;
  }

  if (event.pendingAction.type === "clock_in") {
    const payload = event.pendingAction.payload as { dateStr: string; timeStr: string; status: "present" | "late" };
    const existing = await ctx.db
      .query("attendance_records")
      .withIndex("by_employee_date", (q) => q.eq("employeeId", event.employeeId).eq("date", payload.dateStr))
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("attendance_records", {
      orgId: event.orgId,
      employeeId: event.employeeId,
      date: payload.dateStr,
      clockIn: payload.timeStr,
      status: payload.status,
    });
  }

  if (event.pendingAction.type === "clock_out") {
    const payload = event.pendingAction.payload as { recordId: Id<"attendance_records">; timeStr: string };
    const record = await ctx.db.get(payload.recordId);
    if (!record || record.orgId !== event.orgId || record.employeeId !== event.employeeId) {
      throw new Error("Held punch record no longer exists");
    }
    if (record.clockOut) {
      return record._id;
    }
    const workMinutes = record.clockIn ? calculateDurationMinutes(record.clockIn, payload.timeStr, record.breakMinutes || 0) : 0;
    await ctx.db.patch(record._id, {
      clockOut: payload.timeStr,
      workMinutes,
    });
    return record._id;
  }

  return event.attendanceRecordId;
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
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!TRUST_REVIEW_ROLES.has(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const allEmployees = await ctx.db
      .query("employees")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();

    let relevantEmployees = allEmployees;
    if (user.role === "manager") {
      if (!user.employeeId) return [];
      const managedIds = await getManagerEmployeeIds(ctx, user.employeeId);
      relevantEmployees = allEmployees.filter((employee) => managedIds.has(employee._id));
    }

    const attendanceRecords = await ctx.db
      .query("attendance_records")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .filter((q) => q.eq(q.field("orgId"), user.orgId!))
      .collect();

    const result = relevantEmployees.map((employee) => {
      const record = attendanceRecords.find((attendance) => attendance.employeeId === employee._id);
      return {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          image: null,
        },
        attendance: record || null,
      };
    });

    return result;
  },
});

export const getAttendanceSummary = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!user.employeeId) return null;

    const startDate = `${args.month}-01`;
    const [year, month] = args.month.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${args.month}-${String(lastDay).padStart(2, "0")}`;

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

export const getTrustPolicy = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    return await fetchTrustPolicy(ctx, user.orgId!);
  },
});

export const upsertTrustPolicy = mutation({
  args: {
    mode: v.union(v.literal("observe"), v.literal("warn"), v.literal("hold"), v.literal("deny")),
    warnThreshold: v.number(),
    holdThreshold: v.number(),
    denyThreshold: v.number(),
    requireReasonAtRisk: v.union(v.literal("medium"), v.literal("high")),
    impossibleTravelSpeedKph: v.number(),
    enabled: v.boolean(),
    geofence: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
      radiusMeters: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!TRUST_POLICY_ADMIN_ROLES.has(user.role)) {
      throw new Error("Unauthorized: Attendance trust policy requires admin or HR manager");
    }

    if (args.warnThreshold < 0 || args.holdThreshold < 0 || args.denyThreshold < 0) {
      throw new Error("Thresholds must be non-negative");
    }
    if (!(args.warnThreshold <= args.holdThreshold && args.holdThreshold <= args.denyThreshold)) {
      throw new Error("Thresholds must satisfy warn <= hold <= deny");
    }

    const existing = await ctx.db
      .query("attendance_trust_policies")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .first();

    const payload = {
      mode: args.mode,
      warnThreshold: args.warnThreshold,
      holdThreshold: args.holdThreshold,
      denyThreshold: args.denyThreshold,
      requireReasonAtRisk: args.requireReasonAtRisk,
      impossibleTravelSpeedKph: args.impossibleTravelSpeedKph,
      geofence: args.geofence,
      enabled: args.enabled,
      updatedBy: user._id,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("attendance_trust_policies", {
      orgId: user.orgId!,
      ...payload,
    });
    return await ctx.db.get(id);
  },
});

export const listTrustEvents = query({
  args: {
    startIso: v.optional(v.string()),
    endIso: v.optional(v.string()),
    riskLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    employeeId: v.optional(v.id("employees")),
    decision: v.optional(
      v.union(
        v.literal("observed"),
        v.literal("allowed"),
        v.literal("warned"),
        v.literal("held"),
        v.literal("denied"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!TRUST_REVIEW_ROLES.has(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const limit = Math.min(Math.max(args.limit ?? 200, 1), 1000);
    const records = await ctx.db
      .query("attendance_trust_events")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();

    let managerEmployeeIds: Set<Id<"employees">> | null = null;
    if (user.role === "manager") {
      if (!user.employeeId) return [];
      managerEmployeeIds = await getManagerEmployeeIds(ctx, user.employeeId);
    }

    return records
      .filter((record) => {
        if (args.employeeId && record.employeeId !== args.employeeId) return false;
        if (args.riskLevel && record.riskLevel !== args.riskLevel) return false;
        if (args.decision && record.decision !== args.decision) return false;
        if (args.startIso && record.capturedAt < args.startIso) return false;
        if (args.endIso && record.capturedAt > args.endIso) return false;
        if (managerEmployeeIds && !managerEmployeeIds.has(record.employeeId)) return false;
        return true;
      })
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
      .slice(0, limit);
  },
});

export const listHeldTrustEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!TRUST_REVIEW_ROLES.has(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    let managerEmployeeIds: Set<Id<"employees">> | null = null;
    if (user.role === "manager") {
      if (!user.employeeId) return [];
      managerEmployeeIds = await getManagerEmployeeIds(ctx, user.employeeId);
    }

    const heldEvents = await ctx.db
      .query("attendance_trust_events")
      .withIndex("by_org_decision", (q) => q.eq("orgId", user.orgId!).eq("decision", "held"))
      .collect();

    const limit = Math.min(Math.max(args.limit ?? 200, 1), 1000);
    const scopedEvents = heldEvents
      .filter((event) => (managerEmployeeIds ? managerEmployeeIds.has(event.employeeId) : true))
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
      .slice(0, limit);

    const employeeNames = new Map<string, string>();
    for (const event of scopedEvents) {
      const key = String(event.employeeId);
      if (employeeNames.has(key)) continue;
      const employee = await ctx.db.get(event.employeeId);
      employeeNames.set(key, employee ? `${employee.firstName} ${employee.lastName}` : "Unknown");
    }

    return scopedEvents.map((event) => ({
      ...event,
      employeeName: employeeNames.get(String(event.employeeId)) ?? "Unknown",
    }));
  },
});

export const reviewHeldTrustEvent = mutation({
  args: {
    eventId: v.id("attendance_trust_events"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!TRUST_REVIEW_ROLES.has(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event || event.orgId !== user.orgId!) {
      throw new Error("Trust event not found");
    }
    if (event.decision !== "held") {
      throw new Error("Trust event is not awaiting review");
    }

    if (user.role === "manager") {
      if (!user.employeeId) throw new Error("Unauthorized");
      const managed = await getManagerEmployeeIds(ctx, user.employeeId);
      if (!managed.has(event.employeeId)) {
        throw new Error("Unauthorized: Can only review team trust events");
      }
    }

    let attendanceRecordId = event.attendanceRecordId;
    if (args.decision === "approved") {
      attendanceRecordId = await applyHeldPendingAction(ctx, event);
    }

    await ctx.db.patch(event._id, {
      decision: args.decision,
      attendanceRecordId,
      reviewedBy: user._id,
      reviewedAt: new Date().toISOString(),
      reviewNote: normalizeReasonText(args.reviewNote),
      pendingAction: undefined,
    });

    return await ctx.db.get(event._id);
  },
});

// --- Mutations ---

export const clockIn = mutation({
  args: {
    trustSignals: v.optional(v.object({
      deviceIdHash: v.optional(v.string()),
      ipHash: v.optional(v.string()),
      userAgentHash: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      accuracyMeters: v.optional(v.number()),
      reasonCode: v.optional(v.string()),
      reasonText: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
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

    let status: "present" | "late" = "present";

    if (schedule && schedule.startTime) {
        const currentHHMM = timeStr.substring(11, 16);
        if (currentHHMM > schedule.startTime) {
            status = "late";
        }
    }

    const normalizedSignals: TrustSignalsInput | undefined = args.trustSignals
      ? {
          ...args.trustSignals,
          reasonCode: normalizeReasonCode(args.trustSignals.reasonCode, "clock_in_ui"),
          reasonText: normalizeReasonText(args.trustSignals.reasonText),
        }
      : undefined;

    const policy = await fetchTrustPolicy(ctx, user.orgId!);
    const isKnownDevice = await isTrustedDevice(ctx, user.employeeId, normalizedSignals?.deviceIdHash);
    const geoRisk = await evaluateGeoRiskContext(ctx, user.orgId!, user.employeeId, normalizedSignals, policy, timeStr);
    const scored = scoreAttendanceRisk(normalizedSignals, isKnownDevice, false, geoRisk);
    const decision = evaluateTrustDecision(policy, scored.riskScore, scored.riskLevel, true);

    if (decision.requiresReason && !hasReason(normalizedSignals)) {
      await writeTrustEvent(ctx, {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        eventType: "clock_in",
        policyMode: policy.mode,
        decision: "denied",
        riskScore: scored.riskScore,
        riskLevel: scored.riskLevel,
        reasons: [...scored.reasons, "REASON_REQUIRED_MISSING"],
        requiresReason: true,
        signals: normalizedSignals,
        reviewNote: "Punch denied because reason was required.",
      });
      throw new Error("ATTENDANCE_REASON_REQUIRED:This punch was flagged and needs a reason.");
    }

    if (decision.decision === "held") {
      await writeTrustEvent(ctx, {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        eventType: "clock_in",
        policyMode: policy.mode,
        decision: "held",
        riskScore: scored.riskScore,
        riskLevel: scored.riskLevel,
        reasons: scored.reasons,
        requiresReason: decision.requiresReason,
        signals: normalizedSignals,
        pendingAction: {
          type: "clock_in",
          payload: { dateStr, timeStr, status },
        },
        reviewNote: "Punch held for supervisor review.",
      });
      throw new Error("ATTENDANCE_PUNCH_HELD:Clock-in is pending supervisor review.");
    }

    if (decision.decision === "denied") {
      await writeTrustEvent(ctx, {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        eventType: "clock_in",
        policyMode: policy.mode,
        decision: "denied",
        riskScore: scored.riskScore,
        riskLevel: scored.riskLevel,
        reasons: scored.reasons,
        requiresReason: decision.requiresReason,
        signals: normalizedSignals,
        reviewNote: "Punch denied by trust policy.",
      });
      throw new Error("ATTENDANCE_PUNCH_DENIED:Clock-in denied by attendance trust policy.");
    }

    const recordId = await ctx.db.insert("attendance_records", {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        date: dateStr,
        clockIn: timeStr,
        status,
    });

    await markTrustedDeviceSeen(ctx, user.orgId!, user.employeeId, normalizedSignals?.deviceIdHash);

    await writeTrustEvent(ctx, {
      orgId: user.orgId!,
      employeeId: user.employeeId,
      attendanceRecordId: recordId,
      eventType: "clock_in",
      policyMode: policy.mode,
      decision: decision.decision,
      riskScore: scored.riskScore,
      riskLevel: scored.riskLevel,
      reasons: scored.reasons,
      requiresReason: decision.requiresReason,
      signals: normalizedSignals,
    });

    const record = await ctx.db.get(recordId);
    return {
      ...record,
      trustDecision: decision.decision,
      trustRiskLevel: scored.riskLevel,
      trustReasons: scored.reasons,
    };
  },
});

export const clockOut = mutation({
  args: {
    trustSignals: v.optional(v.object({
      deviceIdHash: v.optional(v.string()),
      ipHash: v.optional(v.string()),
      userAgentHash: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      accuracyMeters: v.optional(v.number()),
      reasonCode: v.optional(v.string()),
      reasonText: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
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

    const normalizedSignals: TrustSignalsInput | undefined = args.trustSignals
      ? {
          ...args.trustSignals,
          reasonCode: normalizeReasonCode(args.trustSignals.reasonCode, "clock_out_ui"),
          reasonText: normalizeReasonText(args.trustSignals.reasonText),
        }
      : undefined;

    const policy = await fetchTrustPolicy(ctx, user.orgId!);
    const isKnownDevice = await isTrustedDevice(ctx, user.employeeId, normalizedSignals?.deviceIdHash);
    const geoRisk = await evaluateGeoRiskContext(ctx, user.orgId!, user.employeeId, normalizedSignals, policy, timeStr);
    const scored = scoreAttendanceRisk(normalizedSignals, isKnownDevice, false, geoRisk);
    const decision = evaluateTrustDecision(policy, scored.riskScore, scored.riskLevel, true);

    if (decision.requiresReason && !hasReason(normalizedSignals)) {
      await writeTrustEvent(ctx, {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        attendanceRecordId: record._id,
        eventType: "clock_out",
        policyMode: policy.mode,
        decision: "denied",
        riskScore: scored.riskScore,
        riskLevel: scored.riskLevel,
        reasons: [...scored.reasons, "REASON_REQUIRED_MISSING"],
        requiresReason: true,
        signals: normalizedSignals,
        reviewNote: "Clock-out denied because reason was required.",
      });
      throw new Error("ATTENDANCE_REASON_REQUIRED:This punch was flagged and needs a reason.");
    }

    if (decision.decision === "held") {
      await writeTrustEvent(ctx, {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        attendanceRecordId: record._id,
        eventType: "clock_out",
        policyMode: policy.mode,
        decision: "held",
        riskScore: scored.riskScore,
        riskLevel: scored.riskLevel,
        reasons: scored.reasons,
        requiresReason: decision.requiresReason,
        signals: normalizedSignals,
        pendingAction: {
          type: "clock_out",
          payload: { recordId: record._id, timeStr },
        },
        reviewNote: "Clock-out held for supervisor review.",
      });
      throw new Error("ATTENDANCE_PUNCH_HELD:Clock-out is pending supervisor review.");
    }

    if (decision.decision === "denied") {
      await writeTrustEvent(ctx, {
        orgId: user.orgId!,
        employeeId: user.employeeId,
        attendanceRecordId: record._id,
        eventType: "clock_out",
        policyMode: policy.mode,
        decision: "denied",
        riskScore: scored.riskScore,
        riskLevel: scored.riskLevel,
        reasons: scored.reasons,
        requiresReason: decision.requiresReason,
        signals: normalizedSignals,
        reviewNote: "Clock-out denied by trust policy.",
      });
      throw new Error("ATTENDANCE_PUNCH_DENIED:Clock-out denied by attendance trust policy.");
    }

    let workMinutes = 0;
    if (record.clockIn) {
      workMinutes = calculateDurationMinutes(record.clockIn, timeStr, record.breakMinutes || 0);
    }

    await ctx.db.patch(record._id, {
        clockOut: timeStr,
        workMinutes
    });

    await markTrustedDeviceSeen(ctx, user.orgId!, user.employeeId, normalizedSignals?.deviceIdHash);

    await writeTrustEvent(ctx, {
      orgId: user.orgId!,
      employeeId: user.employeeId,
      attendanceRecordId: record._id,
      eventType: "clock_out",
      policyMode: policy.mode,
      decision: decision.decision,
      riskScore: scored.riskScore,
      riskLevel: scored.riskLevel,
      reasons: scored.reasons,
      requiresReason: decision.requiresReason,
      signals: normalizedSignals,
    });

    const updated = await ctx.db.get(record._id);
    return {
      ...updated,
      trustDecision: decision.decision,
      trustRiskLevel: scored.riskLevel,
      trustReasons: scored.reasons,
    };
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
    trustSignals: v.optional(v.object({
      deviceIdHash: v.optional(v.string()),
      ipHash: v.optional(v.string()),
      userAgentHash: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      accuracyMeters: v.optional(v.number()),
      reasonCode: v.optional(v.string()),
      reasonText: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!TRUST_REVIEW_ROLES.has(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.orgId !== user.orgId!) {
        throw new Error("Employee not found");
    }

    if (user.role === "manager" && employee.managerId !== user.employeeId) {
        throw new Error("Unauthorized: Can only manage team members");
    }

    const existing = await ctx.db
        .query("attendance_records")
        .withIndex("by_employee_date", (q) => q.eq("employeeId", args.employeeId).eq("date", args.date))
        .first();

    let workMinutes = undefined;
    if (args.clockIn && args.clockOut) {
        workMinutes = calculateDurationMinutes(args.clockIn, args.clockOut, args.breakMinutes || 0);
    }

    let recordId: Id<"attendance_records">;
    if (existing) {
        await ctx.db.patch(existing._id, {
            clockIn: args.clockIn,
            clockOut: args.clockOut,
            status: args.status,
            notes: args.notes,
            breakMinutes: args.breakMinutes,
            workMinutes,
            isManualEntry: true,
            approvedBy: user.employeeId,
        });
        recordId = existing._id;
    } else {
        recordId = await ctx.db.insert("attendance_records", {
            orgId: user.orgId!,
            employeeId: args.employeeId,
            date: args.date,
            clockIn: args.clockIn,
            clockOut: args.clockOut,
            status: args.status,
            notes: args.notes,
            breakMinutes: args.breakMinutes,
            workMinutes,
            isManualEntry: true,
            approvedBy: user.employeeId,
        });
    }

    const normalizedSignals: TrustSignalsInput | undefined = args.trustSignals
      ? {
          ...args.trustSignals,
          reasonCode: normalizeReasonCode(args.trustSignals.reasonCode, "manual_entry_ui"),
          reasonText: normalizeReasonText(args.trustSignals.reasonText ?? args.notes),
        }
      : undefined;

    const policy = await fetchTrustPolicy(ctx, user.orgId!);
    const isKnownDevice = await isTrustedDevice(ctx, args.employeeId, normalizedSignals?.deviceIdHash);
    const geoRisk = await evaluateGeoRiskContext(
      ctx,
      user.orgId!,
      args.employeeId,
      normalizedSignals,
      policy,
      new Date().toISOString(),
    );
    const scored = scoreAttendanceRisk(normalizedSignals, isKnownDevice, true, geoRisk);
    const decision = evaluateTrustDecision(policy, scored.riskScore, scored.riskLevel, false);

    await markTrustedDeviceSeen(ctx, user.orgId!, args.employeeId, normalizedSignals?.deviceIdHash);

    await writeTrustEvent(ctx, {
      orgId: user.orgId!,
      employeeId: args.employeeId,
      attendanceRecordId: recordId,
      eventType: "manual_entry",
      policyMode: policy.mode,
      decision: decision.decision,
      riskScore: scored.riskScore,
      riskLevel: scored.riskLevel,
      reasons: scored.reasons,
      requiresReason: decision.requiresReason,
      signals: normalizedSignals,
    });

    return await ctx.db.get(recordId);
  },
});
