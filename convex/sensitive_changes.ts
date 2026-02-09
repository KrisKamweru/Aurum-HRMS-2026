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
  if (!user || !user.orgId) {
    throw new Error("User has no organization");
  }

  return user;
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

export async function queueChangeRequest(ctx: MutationCtx, args: QueueChangeArgs) {
  const now = new Date().toISOString();
  return await ctx.db.insert("change_requests", {
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
