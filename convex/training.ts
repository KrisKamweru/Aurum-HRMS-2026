import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { createNotification } from "./notifications";

// --- Helpers ---

async function getViewerInfo(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Unauthorized");

  const resolvedOrgId = user.activeOrgId ?? user.orgId;
  if (!resolvedOrgId) throw new Error("User has no organization");

  return { ...user, orgId: resolvedOrgId };
}

function isPrivileged(role: string) {
  return ["super_admin", "admin", "hr_manager", "manager"].includes(role);
}

// --- Courses ---

export const listCourses = query({
  args: {
    status: v.optional(v.union(
      v.literal("upcoming"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ))
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    let courses;

    if (args.status) {
       courses = await ctx.db
        .query("training_courses")
        .withIndex("by_org_status", (q) => q.eq("orgId", orgId).eq("status", args.status!))
        .collect();
    } else {
        // List all for the org if no status filter (requires a different index or filtering)
        // Since we don't have a pure by_org index on training_courses in the schema I defined previously,
        // we might rely on by_org_status and query for all statuses or add a by_org index.
        // Actually, schema has: .index("by_org_status", ["orgId", "status"])
        // We can't strictly query *just* orgId efficiently with that index without a range or multiple queries.
        // However, for MVP, let's just query for "upcoming" and "in_progress" if no status provided (Active courses)?
        // Or fetch all by iterating statuses? Or just add the index?
        // Let's assume for the list view we usually want "Active" ones.
        // If I want ALL, I can't easily do it with just "by_org_status".
        // Let's filter in memory for now if the dataset is small, or fetch by specific statuses parallel.

        const statuses = ["upcoming", "in_progress", "completed", "cancelled"] as const;
        const promises = statuses.map(s =>
            ctx.db.query("training_courses")
            .withIndex("by_org_status", q => q.eq("orgId", orgId).eq("status", s))
            .collect()
        );

        const results = await Promise.all(promises);
        courses = results.flat();
    }

    return courses.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  },
});

export const getCourse = query({
  args: { id: v.id("training_courses") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const course = await ctx.db.get(args.id);

    if (!course || course.orgId !== user.orgId) return null;
    return course;
  },
});

export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    instructor: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    type: v.union(v.literal("workshop"), v.literal("seminar"), v.literal("online"), v.literal("other")),
    status: v.union(v.literal("upcoming"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled")),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const courseId = await ctx.db.insert("training_courses", {
      orgId,
      createdBy: user._id,
      ...args,
    });

    return courseId;
  },
});

export const updateCourse = mutation({
  args: {
    id: v.id("training_courses"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      instructor: v.optional(v.string()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      type: v.optional(v.union(v.literal("workshop"), v.literal("seminar"), v.literal("online"), v.literal("other"))),
      status: v.optional(v.union(v.literal("upcoming"), v.literal("in_progress"), v.literal("completed"), v.literal("cancelled"))),
      capacity: v.optional(v.number()),
    })
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) throw new Error("Unauthorized");

    const course = await ctx.db.get(args.id);
    if (!course || course.orgId !== orgId) throw new Error("Course not found");

    await ctx.db.patch(args.id, args.updates);
  },
});

// --- Enrollments ---

export const getMyEnrollments = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);
    if (!user.employeeId) return [];

    const enrollments = await ctx.db
      .query("training_enrollments")
      .withIndex("by_employee", (q) => q.eq("employeeId", user.employeeId!))
      .collect();

    // Enrich with course details
    return await Promise.all(enrollments.map(async (e) => {
      const course = await ctx.db.get(e.courseId);
      return {
        ...e,
        courseTitle: course?.title || "Unknown Course",
        courseStartDate: course?.startDate,
        courseEndDate: course?.endDate,
        courseStatus: course?.status
      };
    }));
  },
});

export const getCourseEnrollments = query({
  args: { courseId: v.id("training_courses") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    // Basic access check: ensure course belongs to org
    const course = await ctx.db.get(args.courseId);
    if (!course || course.orgId !== orgId) return [];

    if (!isPrivileged(user.role)) return []; // Only admins/managers view full enrollment list

    const enrollments = await ctx.db
      .query("training_enrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Enrich with employee details
    return await Promise.all(enrollments.map(async (e) => {
      const employee = await ctx.db.get(e.employeeId);
      return {
        ...e,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : "Unknown",
        employeeEmail: employee?.email
      };
    }));
  },
});

export const enrollEmployee = mutation({
  args: {
    courseId: v.id("training_courses"),
    employeeId: v.optional(v.id("employees")), // Optional if self-enrolling
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    const targetEmployeeId = args.employeeId || user.employeeId;
    if (!targetEmployeeId) throw new Error("Employee ID required");

    const employee = await ctx.db.get(targetEmployeeId);
    if (!employee || employee.orgId !== orgId) {
      throw new Error("Employee not found or unauthorized");
    }

    // Access check
    const isSelf = targetEmployeeId === user.employeeId;
    if (!isSelf && !isPrivileged(user.role)) {
      throw new Error("Unauthorized");
    }

    const course = await ctx.db.get(args.courseId);
    if (!course || course.orgId !== orgId) throw new Error("Course not found");

    if (course.status === "completed" || course.status === "cancelled") {
      throw new Error("Cannot enroll in closed/cancelled course");
    }

    // Check existing
    const existing = await ctx.db
      .query("training_enrollments")
      .withIndex("by_employee_course", (q) => q.eq("employeeId", targetEmployeeId).eq("courseId", args.courseId))
      .first();

    if (existing) throw new Error("Already enrolled");

    // Check capacity
    if (course.capacity) {
      const currentCount = (await ctx.db
        .query("training_enrollments")
        .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
        .collect()).length;

      if (currentCount >= course.capacity) {
        throw new Error("Course is full");
      }
    }

    const enrollmentId = await ctx.db.insert("training_enrollments", {
      orgId,
      courseId: args.courseId,
      employeeId: targetEmployeeId,
      status: "enrolled",
      enrollmentDate: new Date().toISOString(),
      progress: 0,
    });

    // Notify employee (if enrolled by someone else)
    if (!isSelf) {
        const targetUser = await ctx.db.query("users")
            .withIndex("by_org", q => q.eq("orgId", orgId))
            .filter(q => q.eq(q.field("employeeId"), targetEmployeeId))
            .first();

        if (targetUser) {
            await createNotification(ctx, {
                userId: targetUser._id,
                title: "Course Enrollment",
                message: `You have been enrolled in: ${course.title}`,
                type: "info",
                relatedId: enrollmentId,
                relatedTable: "training_enrollments",
                link: "/training/my-learning"
            });
        }
    }

    return enrollmentId;
  },
});

export const updateEnrollment = mutation({
  args: {
    id: v.id("training_enrollments"),
    status: v.optional(v.union(
      v.literal("enrolled"),
      v.literal("completed"),
      v.literal("dropped"),
      v.literal("failed")
    )),
    progress: v.optional(v.number()),
    completionDate: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    const enrollment = await ctx.db.get(args.id);
    if (!enrollment || enrollment.orgId !== orgId) throw new Error("Enrollment not found");

    const isSelf = user.employeeId === enrollment.employeeId;

    // Self can only update progress? Or drop?
    // Admin can update status (completed/failed).

    if (args.status && args.status !== "dropped" && !isPrivileged(user.role)) {
       throw new Error("Unauthorized to change status");
    }

    const patch: any = {};
    if (args.status) patch.status = args.status;
    if (args.progress !== undefined) patch.progress = args.progress;
    if (args.completionDate) patch.completionDate = args.completionDate;

    // Auto-set completion date if status is completed
    if (args.status === "completed" && !args.completionDate) {
        patch.completionDate = new Date().toISOString();
        patch.progress = 100;
    }

    await ctx.db.patch(args.id, patch);

    // Notify if completed by admin
    if (args.status === "completed" && !isSelf) {
         const targetUser = await ctx.db.query("users")
            .withIndex("by_org", q => q.eq("orgId", orgId))
            .filter(q => q.eq(q.field("employeeId"), enrollment.employeeId))
            .first();

        if (targetUser) {
            const course = await ctx.db.get(enrollment.courseId);
            await createNotification(ctx, {
                userId: targetUser._id,
                title: "Course Completed",
                message: `Congratulations! You have completed: ${course?.title}`,
                type: "success",
                relatedId: args.id,
                relatedTable: "training_enrollments",
                link: "/training/my-learning"
            });
        }
    }
  },
});
