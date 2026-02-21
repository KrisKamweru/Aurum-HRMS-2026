import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper to get viewer info
async function getViewerInfo(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Unauthorized");

  const resolvedOrgId = user.activeOrgId ?? user.orgId;
  if (!resolvedOrgId) throw new Error("User has no organization");

  return { ...user, orgId: resolvedOrgId };
}

// List notifications for the current user
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return []; // Don't throw for simple UI poll

    const limit = args.limit || 20;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

// Get unread count
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    return unread.length;
  },
});

// Mark a single notification as read
export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or unauthorized");
    }

    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark all as read
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Clear all notifications (delete)
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    for (const notification of all) {
      await ctx.db.delete(notification._id);
    }
  },
});

// Internal helper mutation to create notification (can be called from other mutations)
// We export this as 'create' but mark it internal so it's not exposed to the client directly
// if we wanted to enforce strict server-side logic.
// However, since we want to call it from other files via 'ctx.runMutation' or direct logic?
// Actually, in Convex, if we want to call it from another mutation in the SAME transaction,
// we just import a helper function, NOT a mutation.
// BUT, if we want to trigger it, we usually just write the DB insert in the helper.

export async function createNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    link?: string;
    relatedId?: string;
    relatedTable?: string;
  }
) {
  const targetUser = await ctx.db.get(args.userId);
  if (!targetUser || !targetUser.orgId) return; // Silent fail if user invalid

  await ctx.db.insert("notifications", {
    orgId: targetUser.orgId,
    userId: args.userId,
    title: args.title,
    message: args.message,
    type: args.type,
    link: args.link,
    isRead: false,
    createdAt: new Date().toISOString(),
    relatedId: args.relatedId,
    relatedTable: args.relatedTable,
  });
}

// We can also keep the public mutation for testing or specific client-side triggers if needed,
// but usually notifications are system-generated.
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("error")),
    link: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    relatedTable: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Basic auth check to ensure only authenticated users can trigger (though typically this should be admin-only or system)
    const user = await getAuthUserId(ctx);
    if (!user) throw new Error("Unauthorized");

    await createNotification(ctx, args);
  },
});

