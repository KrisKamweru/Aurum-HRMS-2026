import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getViewerInfo } from "./sensitive_changes";

const OPERATIONS_ADMIN_ROLES = new Set(["super_admin", "admin", "hr_manager"]);

function ensureOperationsAdmin(role: string) {
  if (!OPERATIONS_ADMIN_ROLES.has(role)) {
    throw new Error("Unauthorized: Operations controls require admin or HR manager role");
  }
}

function defaultIncidentMarkdown(args: {
  incidentKey: string;
  title: string;
  severity: "p1" | "p2" | "p3";
  environment: "development" | "staging" | "production";
  detectedAt: string;
  affectedModules: string[];
  affectedOrgs?: string[];
}) {
  const moduleLine = args.affectedModules.length > 0 ? args.affectedModules.join(", ") : "TBD";
  const orgLine = args.affectedOrgs && args.affectedOrgs.length > 0 ? args.affectedOrgs.join(", ") : "TBD";
  return [
    `# Incident ${args.incidentKey}`,
    ``,
    `- Title: ${args.title}`,
    `- Severity: ${args.severity.toUpperCase()}`,
    `- Environment: ${args.environment}`,
    `- Detected At: ${args.detectedAt}`,
    `- Affected Modules: ${moduleLine}`,
    `- Affected Orgs: ${orgLine}`,
    ``,
    `## Timeline`,
    `- Detection:`,
    `- Initial Mitigation:`,
    `- Customer Comms:`,
    `- Resolution:`,
    ``,
    `## Root Cause`,
    `-`,
    ``,
    `## Corrective Actions`,
    `- [ ]`,
    ``,
    `## Verification`,
    `- [ ] Build gate passed`,
    `- [ ] Security gate passed`,
    `- [ ] Monitoring restored`,
  ].join("\n");
}

export const listAlertRoutes = query({
  args: {
    environment: v.optional(v.union(v.literal("development"), v.literal("staging"), v.literal("production"))),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureOperationsAdmin(user.role);

    if (args.environment) {
      return await ctx.db
        .query("ops_alert_routes")
        .withIndex("by_environment", (q) => q.eq("environment", args.environment!))
        .collect();
    }
    return await ctx.db.query("ops_alert_routes").collect();
  },
});

export const upsertAlertRoute = mutation({
  args: {
    routeId: v.optional(v.id("ops_alert_routes")),
    environment: v.union(v.literal("development"), v.literal("staging"), v.literal("production")),
    severity: v.union(v.literal("p1"), v.literal("p2"), v.literal("p3")),
    service: v.string(),
    channel: v.union(v.literal("email"), v.literal("slack"), v.literal("pagerduty"), v.literal("webhook")),
    target: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureOperationsAdmin(user.role);

    const payload = {
      environment: args.environment,
      severity: args.severity,
      service: args.service,
      channel: args.channel,
      target: args.target,
      isActive: args.isActive,
      updatedBy: user._id,
      updatedAt: new Date().toISOString(),
    };

    if (args.routeId) {
      const existing = await ctx.db.get(args.routeId);
      if (!existing) throw new Error("Alert route not found");
      await ctx.db.patch(existing._id, payload);
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("ops_alert_routes", payload);
    return await ctx.db.get(id);
  },
});

export const generateIncidentTemplate = mutation({
  args: {
    incidentKey: v.string(),
    title: v.string(),
    severity: v.union(v.literal("p1"), v.literal("p2"), v.literal("p3")),
    environment: v.union(v.literal("development"), v.literal("staging"), v.literal("production")),
    detectedAt: v.optional(v.string()),
    affectedModules: v.array(v.string()),
    affectedOrgs: v.optional(v.array(v.id("organizations"))),
    ownerUserId: v.optional(v.id("users")),
    markdown: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureOperationsAdmin(user.role);

    const detectedAt = args.detectedAt ?? new Date().toISOString();
    const markdown =
      args.markdown ??
      defaultIncidentMarkdown({
        incidentKey: args.incidentKey,
        title: args.title,
        severity: args.severity,
        environment: args.environment,
        detectedAt,
        affectedModules: args.affectedModules,
        affectedOrgs: args.affectedOrgs?.map((id) => String(id)),
      });

    const nowIso = new Date().toISOString();
    const existing = await ctx.db
      .query("incident_templates")
      .withIndex("by_incident_key", (q) => q.eq("incidentKey", args.incidentKey))
      .first();

    const payload = {
      incidentKey: args.incidentKey,
      environment: args.environment,
      severity: args.severity,
      title: args.title,
      status: "open" as const,
      detectedAt,
      affectedModules: args.affectedModules,
      affectedOrgs: args.affectedOrgs,
      ownerUserId: args.ownerUserId ?? user._id,
      markdown,
      updatedAt: nowIso,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("incident_templates", {
      ...payload,
      createdAt: nowIso,
    });
    return await ctx.db.get(id);
  },
});

export const listIncidentTemplates = query({
  args: {
    environment: v.optional(v.union(v.literal("development"), v.literal("staging"), v.literal("production"))),
    status: v.optional(v.union(v.literal("open"), v.literal("mitigated"), v.literal("resolved"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    ensureOperationsAdmin(user.role);

    const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
    let rows;
    if (args.environment && args.status) {
      rows = await ctx.db
        .query("incident_templates")
        .withIndex("by_environment_status", (q) => q.eq("environment", args.environment!).eq("status", args.status!))
        .collect();
    } else if (args.environment) {
      rows = await ctx.db
        .query("incident_templates")
        .withIndex("by_environment_status", (q) => q.eq("environment", args.environment!))
        .collect();
    } else {
      rows = await ctx.db.query("incident_templates").collect();
    }

    return rows
      .filter((row) => (args.status ? row.status === args.status : true))
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
      .slice(0, limit);
  },
});
