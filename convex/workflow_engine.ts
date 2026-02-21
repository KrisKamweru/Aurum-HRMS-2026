import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewerInfo } from "./sensitive_changes";

const WORKFLOW_ADMIN_ROLES = new Set(["super_admin", "admin", "hr_manager"]);

function ensureWorkflowAdmin(role: string) {
  if (!WORKFLOW_ADMIN_ROLES.has(role)) {
    throw new Error("Unauthorized: Workflow administration requires admin or HR manager role");
  }
}

function canOperateWorkflow(role: string) {
  return WORKFLOW_ADMIN_ROLES.has(role) || role === "manager";
}

function addHours(baseIso: string, hours?: number) {
  if (!hours || !Number.isFinite(hours) || hours <= 0) return undefined;
  const dt = new Date(baseIso);
  dt.setTime(dt.getTime() + Math.floor(hours * 60 * 60 * 1000));
  return dt.toISOString();
}

export const listWorkflows = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    ensureWorkflowAdmin(user.role);

    return await ctx.db
      .query("approval_workflows")
      .withIndex("by_org", (q) => q.eq("orgId", user.orgId!))
      .collect();
  },
});

export const createWorkflow = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    targetTable: v.string(),
    minApprovals: v.number(),
    steps: v.any(),
    escalationHours: v.optional(v.number()),
    resolutionHours: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureWorkflowAdmin(user.role);

    const existing = await ctx.db
      .query("approval_workflows")
      .withIndex("by_org_key", (q) => q.eq("orgId", user.orgId!).eq("key", args.key))
      .first();
    if (existing) {
      throw new Error(`Workflow key '${args.key}' already exists`);
    }

    const nowIso = new Date().toISOString();
    return await ctx.db.insert("approval_workflows", {
      orgId: user.orgId!,
      key: args.key,
      name: args.name,
      targetTable: args.targetTable,
      minApprovals: Math.max(1, Math.floor(args.minApprovals)),
      steps: args.steps,
      escalationHours: args.escalationHours,
      resolutionHours: args.resolutionHours,
      isActive: args.isActive ?? true,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: user._id,
    });
  },
});

export const startWorkflowInstance = mutation({
  args: {
    workflowKey: v.string(),
    targetTable: v.string(),
    targetId: v.string(),
    currentAssigneeUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!canOperateWorkflow(user.role)) {
      throw new Error("Unauthorized: Cannot start workflow instance");
    }

    const workflow = await ctx.db
      .query("approval_workflows")
      .withIndex("by_org_key", (q) => q.eq("orgId", user.orgId!).eq("key", args.workflowKey))
      .first();
    if (!workflow || !workflow.isActive) {
      throw new Error("Workflow not found or inactive");
    }

    const nowIso = new Date().toISOString();
    const dueAt = addHours(nowIso, workflow.resolutionHours);
    const escalationDueAt = addHours(nowIso, workflow.escalationHours);

    return await ctx.db.insert("workflow_instances", {
      orgId: user.orgId!,
      workflowId: workflow._id,
      targetTable: args.targetTable,
      targetId: args.targetId,
      status: "pending",
      pendingStep: 1,
      dueAt,
      escalationDueAt,
      escalationCount: 0,
      currentAssigneeUserId: args.currentAssigneeUserId,
      requestedBy: user._id,
      requestedAt: nowIso,
      updatedAt: nowIso,
    });
  },
});

export const actOnWorkflowInstance = mutation({
  args: {
    instanceId: v.id("workflow_instances"),
    action: v.union(v.literal("approve"), v.literal("reject"), v.literal("delegate"), v.literal("escalate")),
    comment: v.optional(v.string()),
    delegatedToUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!canOperateWorkflow(user.role)) {
      throw new Error("Unauthorized: Cannot act on workflow instance");
    }

    const instance = await ctx.db.get(args.instanceId);
    if (!instance || instance.orgId !== user.orgId) {
      throw new Error("Workflow instance not found");
    }
    if (instance.status !== "pending") {
      throw new Error("Workflow instance is already resolved");
    }

    const nowIso = new Date().toISOString();
    await ctx.db.insert("workflow_actions", {
      orgId: user.orgId!,
      instanceId: instance._id,
      actorUserId: user._id,
      action: args.action,
      stepNumber: instance.pendingStep,
      comment: args.comment,
      delegatedToUserId: args.delegatedToUserId,
      actedAt: nowIso,
    });

    if (args.action === "approve") {
      await ctx.db.patch(instance._id, {
        status: "approved",
        resolvedAt: nowIso,
        updatedAt: nowIso,
      });
      return { status: "approved" as const };
    }

    if (args.action === "reject") {
      await ctx.db.patch(instance._id, {
        status: "rejected",
        resolvedAt: nowIso,
        updatedAt: nowIso,
      });
      return { status: "rejected" as const };
    }

    if (args.action === "delegate") {
      await ctx.db.patch(instance._id, {
        currentAssigneeUserId: args.delegatedToUserId,
        updatedAt: nowIso,
      });
      return { status: "pending" as const };
    }

    await ctx.db.patch(instance._id, {
      escalationCount: (instance.escalationCount ?? 0) + 1,
      escalatedAt: nowIso,
      updatedAt: nowIso,
    });
    return { status: "pending" as const };
  },
});

export const listPendingSlaBreaches = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    if (!canOperateWorkflow(user.role)) {
      throw new Error("Unauthorized: Cannot inspect workflow SLA state");
    }

    const limit = Math.min(Math.max(args.limit ?? 200, 1), 1000);
    const nowIso = new Date().toISOString();
    const pending = await ctx.db
      .query("workflow_instances")
      .withIndex("by_org_status", (q) => q.eq("orgId", user.orgId!).eq("status", "pending"))
      .collect();

    return pending
      .filter((instance) => {
        const dueBreached = instance.dueAt ? instance.dueAt < nowIso : false;
        const escalationDue = instance.escalationDueAt ? instance.escalationDueAt < nowIso : false;
        const escalationMissing = escalationDue && !instance.escalatedAt;
        return dueBreached || escalationMissing;
      })
      .sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
      .slice(0, limit);
  },
});

export const processDueEscalations = mutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureWorkflowAdmin(user.role);

    const nowIso = new Date().toISOString();
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    const pending = await ctx.db
      .query("workflow_instances")
      .withIndex("by_org_status", (q) => q.eq("orgId", user.orgId!).eq("status", "pending"))
      .collect();

    let escalated = 0;
    const escalatedInstanceIds: string[] = [];
    for (const instance of pending) {
      if (escalated >= limit) break;
      if (!instance.escalationDueAt || instance.escalationDueAt > nowIso || instance.escalatedAt) continue;

      await ctx.db.insert("workflow_actions", {
        orgId: user.orgId!,
        instanceId: instance._id,
        actorUserId: user._id,
        action: "escalate",
        stepNumber: instance.pendingStep,
        comment: "Automatic escalation due to SLA threshold breach",
        actedAt: nowIso,
      });

      await ctx.db.patch(instance._id, {
        escalatedAt: nowIso,
        escalationCount: (instance.escalationCount ?? 0) + 1,
        updatedAt: nowIso,
      });
      escalated++;
      escalatedInstanceIds.push(String(instance._id));
    }

    return {
      escalated,
      escalatedInstanceIds,
      processedAt: nowIso,
    };
  },
});

export const getWorkflowTimeline = query({
  args: {
    instanceId: v.id("workflow_instances"),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const instance = await ctx.db.get(args.instanceId);
    if (!instance || instance.orgId !== user.orgId) {
      throw new Error("Workflow instance not found");
    }

    const actions = await ctx.db
      .query("workflow_actions")
      .withIndex("by_instance", (q) => q.eq("instanceId", args.instanceId))
      .collect();

    return {
      instance,
      actions: actions.sort((a, b) => a.actedAt.localeCompare(b.actedAt)),
    };
  },
});
