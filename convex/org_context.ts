import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const PRIVILEGED_ROLES = new Set(["super_admin", "admin", "hr_manager"]);

function mapMembershipRoleToUserRole(role: "admin" | "hr_manager" | "manager" | "viewer") {
  if (role === "viewer") return "employee" as const;
  return role;
}

export const getOrganizationContext = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const memberships = await ctx.db
      .query("user_org_permissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const membershipOrgIds = new Set(memberships.map((m) => m.orgId));
    const allOrgIds = [...membershipOrgIds];
    if (user.orgId && !membershipOrgIds.has(user.orgId)) {
      allOrgIds.push(user.orgId);
    }

    const organizations = await Promise.all(
      allOrgIds.map(async (orgId) => {
        const org = await ctx.db.get(orgId);
        const membership = memberships.find((m) => m.orgId === orgId);
        return {
          orgId,
          orgName: org?.name ?? "Unknown Organization",
          orgStatus: org?.status ?? "suspended",
          role: membership ? mapMembershipRoleToUserRole(membership.role) : user.role,
          membershipRole: membership?.role ?? null,
          grantedAt: membership?.grantedAt ?? null,
          isLegacyPrimaryOrg: user.orgId === orgId,
        };
      }),
    );

    const requestedActive = user.activeOrgId ?? user.orgId ?? null;
    const resolvedActive =
      (requestedActive && organizations.some((o) => o.orgId === requestedActive) && requestedActive) ||
      user.orgId ||
      organizations[0]?.orgId ||
      null;

    return {
      userId,
      activeOrgId: resolvedActive,
      legacyOrgId: user.orgId ?? null,
      memberships: organizations,
      canSwitch: organizations.length > 1 || PRIVILEGED_ROLES.has(user.role),
    };
  },
});

export const setActiveOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const targetOrg = await ctx.db.get(args.orgId);
    if (!targetOrg || targetOrg.status !== "active") {
      throw new Error("Organization not found or inactive");
    }

    const membership = await ctx.db
      .query("user_org_permissions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("orgId"), args.orgId))
      .first();

    const isLegacyOrg = user.orgId === args.orgId;
    if (!membership && !isLegacyOrg) {
      throw new Error("Unauthorized: No membership for target organization");
    }

    const patch: {
      activeOrgId: typeof args.orgId;
      role?: typeof user.role;
    } = {
      activeOrgId: args.orgId,
    };

    if (membership && user.role !== "super_admin") {
      patch.role = mapMembershipRoleToUserRole(membership.role);
    }

    await ctx.db.patch(userId, patch);

    return {
      activeOrgId: args.orgId,
      role: patch.role ?? user.role,
      orgName: targetOrg.name,
    };
  },
});
