import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export type AppCtx = QueryCtx | MutationCtx;

const PAYROLL_MUTATION_ROLES = ["super_admin", "admin", "hr_manager"] as const;
const APPROVER_ROLES = ["super_admin", "admin", "hr_manager", "manager"] as const;

export type PayrollRole = (typeof PAYROLL_MUTATION_ROLES)[number] | "employee" | "pending";

export async function getViewerInfo(ctx: AppCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Unauthorized");
  }

  const resolvedOrgId = user.activeOrgId ?? user.orgId;
  if (!resolvedOrgId) {
    throw new Error("User has no organization");
  }

  const memberships = await ctx.db
    .query("user_org_permissions")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  const activeMembership = memberships.find((membership) => membership.orgId === resolvedOrgId) ?? null;
  const isLegacyPrimaryOrg = user.orgId === resolvedOrgId;
  if (!activeMembership && !isLegacyPrimaryOrg) {
    throw new Error("Unauthorized: Active organization is not assigned to this user");
  }

  return {
    ...user,
    orgId: resolvedOrgId,
    membershipRole: activeMembership?.role ?? null,
  };
}

export function canMutatePayroll(role: string) {
  return PAYROLL_MUTATION_ROLES.includes(role as (typeof PAYROLL_MUTATION_ROLES)[number]);
}

export function isApproverRole(role: string) {
  return APPROVER_ROLES.includes(role as (typeof APPROVER_ROLES)[number]);
}

export type SensitiveActionResult = {
  mode: "applied" | "pending";
  changeRequestId: Id<"change_requests">;
};

type QueueChangeArgs = {
  orgId: Id<"organizations">;
  requesterUserId: Id<"users">;
  targetTable: string;
  targetId?: string;
  operation: "create" | "update" | "delete";
  oldData?: unknown;
  newData?: unknown;
  reason?: string;
  status?: "pending" | "approved";
  approverUserId?: Id<"users">;
};

function addHours(baseIso: string, hours?: number) {
  if (!hours || !Number.isFinite(hours) || hours <= 0) return undefined;
  const dt = new Date(baseIso);
  dt.setTime(dt.getTime() + Math.floor(hours * 60 * 60 * 1000));
  return dt.toISOString();
}

async function maybeStartWorkflowForChangeRequest(
  ctx: MutationCtx,
  changeRequestId: Id<"change_requests">,
  args: QueueChangeArgs,
) {
  const candidates = await ctx.db
    .query("approval_workflows")
    .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
    .collect();

  const active = candidates.filter((workflow) => workflow.isActive);
  if (active.length === 0) return null;

  const exactKey = `change_request:${args.targetTable}:${args.operation}`;
  const workflow =
    active.find((item) => item.key === exactKey) ||
    active.find((item) => item.targetTable === "change_requests") ||
    active.find((item) => item.targetTable === args.targetTable);
  if (!workflow) return null;

  const nowIso = new Date().toISOString();
  const dueAt = addHours(nowIso, workflow.resolutionHours);
  const escalationDueAt = addHours(nowIso, workflow.escalationHours);
  return await ctx.db.insert("workflow_instances", {
    orgId: args.orgId,
    workflowId: workflow._id,
    targetTable: "change_requests",
    targetId: String(changeRequestId),
    status: "pending",
    pendingStep: 1,
    dueAt,
    escalationDueAt,
    escalationCount: 0,
    currentAssigneeUserId: args.approverUserId,
    requestedBy: args.requesterUserId,
    requestedAt: nowIso,
    updatedAt: nowIso,
  });
}

export async function queueChangeRequest(ctx: MutationCtx, args: QueueChangeArgs) {
  const now = new Date().toISOString();
  const changeRequestId = await ctx.db.insert("change_requests", {
    orgId: args.orgId,
    requesterUserId: args.requesterUserId,
    targetTable: args.targetTable,
    targetId: args.targetId,
    operation: args.operation,
    oldData: args.oldData,
    newData: args.newData,
    reason: args.reason,
    status: args.status ?? "pending",
    createdAt: now,
    updatedAt: now,
    approverUserId: args.approverUserId,
  });

  if ((args.status ?? "pending") === "pending") {
    await maybeStartWorkflowForChangeRequest(ctx, changeRequestId, args);
  }

  return changeRequestId;
}

export function canApproveRequester(requesterRole: string, approverRole: string) {
  if (approverRole === "super_admin") {
    return true;
  }

  if (requesterRole === "admin" || requesterRole === "hr_manager") {
    return approverRole === "manager";
  }

  if (requesterRole === "manager") {
    return approverRole === "admin" || approverRole === "hr_manager";
  }

  return false;
}

export async function finalizeApprovalMetadata(
  ctx: MutationCtx,
  request: Doc<"change_requests">,
  approverUserId: Id<"users">,
  status: "approved" | "rejected",
  rejectionReason?: string
) {
  await ctx.db.patch(request._id, {
    status,
    approverUserId,
    rejectionReason,
    updatedAt: new Date().toISOString(),
  });
}
