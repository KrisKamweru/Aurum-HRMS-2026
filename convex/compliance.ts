import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getViewerInfo } from "./sensitive_changes";

const COMPLIANCE_ROLES = new Set(["super_admin", "admin", "hr_manager"]);
const CHANGE_REQUEST_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
const FINALIZED_STATUSES = ["approved", "rejected", "cancelled"] as const;

type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];
type ComplianceCtx = QueryCtx | MutationCtx;

function ensureComplianceAccess(role: string) {
  if (!COMPLIANCE_ROLES.has(role)) {
    throw new Error("Unauthorized: Compliance access requires admin or HR manager role");
  }
}

function parseIso(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function isWithinDateWindow(value: string, from?: string, to?: string) {
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

function mapChangeRequest(request: Doc<"change_requests">) {
  return {
    _id: request._id,
    orgId: request.orgId,
    requesterUserId: request.requesterUserId,
    approverUserId: request.approverUserId,
    targetTable: request.targetTable,
    targetId: request.targetId,
    operation: request.operation,
    status: request.status,
    reason: request.reason,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    rejectionReason: request.rejectionReason,
  };
}

async function collectByStatuses(
  ctx: ComplianceCtx,
  orgId: Doc<"change_requests">["orgId"],
  statuses: readonly ChangeRequestStatus[],
) {
  const all: Doc<"change_requests">[] = [];
  for (const status of statuses) {
    const items = await ctx.db
      .query("change_requests")
      .withIndex("by_org_status", (q) => q.eq("orgId", orgId).eq("status", status))
      .collect();
    all.push(...items);
  }
  return all;
}

export const listChangeRequestAudit = query({
  args: {
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled"),
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureComplianceAccess(user.role);

    const statuses = args.status ? [args.status] : CHANGE_REQUEST_STATUSES;
    const limit = Math.min(Math.max(args.limit ?? 500, 1), 5000);

    const collected = await collectByStatuses(ctx, user.orgId!, statuses);
    const filtered = collected
      .filter((r) => isWithinDateWindow(r.createdAt, args.from, args.to))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    return {
      orgId: user.orgId,
      from: args.from ?? null,
      to: args.to ?? null,
      status: args.status ?? "all",
      total: filtered.length,
      items: filtered.map(mapChangeRequest),
    };
  },
});

export const listAccessReviewAssignments = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    ensureComplianceAccess(user.role);

    const assignments = await ctx.db
      .query("user_org_permissions")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();

    const rows = await Promise.all(
      assignments.map(async (assignment) => {
        const assignedUser = await ctx.db.get(assignment.userId);
        return {
          assignmentId: assignment._id,
          userId: assignment.userId,
          email: assignedUser?.email ?? null,
          userName: assignedUser?.name ?? null,
          role: assignment.role,
          permissions: assignment.permissions ?? null,
          grantedAt: assignment.grantedAt,
          grantedBy: assignment.grantedBy,
        };
      }),
    );

    rows.sort((a, b) => {
      const roleOrder = a.role.localeCompare(b.role);
      if (roleOrder !== 0) return roleOrder;
      const aName = a.userName ?? a.email ?? "";
      const bName = b.userName ?? b.email ?? "";
      return aName.localeCompare(bName);
    });

    return {
      orgId: user.orgId,
      totalAssignments: rows.length,
      generatedAt: new Date().toISOString(),
      assignments: rows,
    };
  },
});

export const previewChangeRequestRetention = query({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureComplianceAccess(user.role);

    if (!Number.isFinite(args.olderThanDays) || args.olderThanDays < 1) {
      throw new Error("olderThanDays must be >= 1");
    }

    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - Math.floor(args.olderThanDays));
    const cutoffIso = cutoffDate.toISOString();
    const cutoffMs = cutoffDate.getTime();

    const matchesByStatus: Record<(typeof FINALIZED_STATUSES)[number], number> = {
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    const candidates: Doc<"change_requests">[] = [];
    const records = await collectByStatuses(ctx, user.orgId!, FINALIZED_STATUSES);
    for (const record of records) {
      const updatedMs = parseIso(record.updatedAt);
      if (updatedMs === null || updatedMs > cutoffMs) continue;
      candidates.push(record);
      if (record.status === "approved" || record.status === "rejected" || record.status === "cancelled") {
        matchesByStatus[record.status]++;
      }
    }

    candidates.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

    return {
      orgId: user.orgId,
      cutoffIso,
      olderThanDays: args.olderThanDays,
      totalCandidates: candidates.length,
      byStatus: matchesByStatus,
      oldestCandidates: candidates.slice(0, 25).map(mapChangeRequest),
    };
  },
});

export const purgeExpiredChangeRequests = mutation({
  args: {
    olderThanDays: v.number(),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureComplianceAccess(user.role);

    if (!Number.isFinite(args.olderThanDays) || args.olderThanDays < 1) {
      throw new Error("olderThanDays must be >= 1");
    }

    const cutoffDate = new Date();
    cutoffDate.setUTCDate(cutoffDate.getUTCDate() - Math.floor(args.olderThanDays));
    const cutoffIso = cutoffDate.toISOString();
    const cutoffMs = cutoffDate.getTime();
    const dryRun = args.dryRun ?? true;

    const candidates: Doc<"change_requests">[] = [];
    const records = await collectByStatuses(ctx, user.orgId!, FINALIZED_STATUSES);
    for (const record of records) {
      const updatedMs = parseIso(record.updatedAt);
      if (updatedMs === null || updatedMs > cutoffMs) continue;
      candidates.push(record);
    }

    const deleteIds = candidates.map((c) => c._id);
    if (!dryRun) {
      for (const id of deleteIds) {
        await ctx.db.delete(id);
      }
    }

    return {
      orgId: user.orgId,
      cutoffIso,
      olderThanDays: args.olderThanDays,
      dryRun,
      candidateCount: deleteIds.length,
      deletedCount: dryRun ? 0 : deleteIds.length,
      candidateIds: deleteIds,
    };
  },
});
