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
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

function isPrivileged(role: string) {
  return ["super_admin", "admin", "hr_manager", "manager"].includes(role);
}

// --- Jobs ---

export const listJobs = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("open"), v.literal("closed")))
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    let q = ctx.db
      .query("jobs")
      .withIndex("by_org_status", (q) => q.eq("orgId", orgId));

    if (args.status) {
        q = q.filter((q) => q.eq(q.field("status"), args.status));
    }

    // If not privileged, only show open jobs?
    // Usually internal employees can see open jobs.
    // If we want a public career page later, we'd need an unauthenticated query.
    // For now, this is for logged-in users.

    const jobs = await q.collect();

    // Enrich with department and location names
    return await Promise.all(jobs.map(async (job) => {
        let departmentName = "Unassigned";
        if (job.departmentId) {
            const dept = await ctx.db.get(job.departmentId);
            if (dept) departmentName = dept.name;
        }

        let locationName = "Remote";
        if (job.locationId) {
            const loc = await ctx.db.get(job.locationId);
            if (loc) locationName = loc.name;
        }

        return {
            ...job,
            departmentName,
            locationName
        };
    }));
  },
});

export const getJob = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const job = await ctx.db.get(args.id);

    if (!job || job.orgId !== user.orgId) {
      return null;
    }

    let departmentName = "Unassigned";
    if (job.departmentId) {
        const dept = await ctx.db.get(job.departmentId);
        if (dept) departmentName = dept.name;
    }

    let locationName = "Remote";
    if (job.locationId) {
        const loc = await ctx.db.get(job.locationId);
        if (loc) locationName = loc.name;
    }

    return {
        ...job,
        departmentName,
        locationName
    };
  },
});

export const createJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    departmentId: v.optional(v.id("departments")),
    locationId: v.optional(v.id("locations")),
    employmentType: v.union(
      v.literal("full_time"),
      v.literal("part_time"),
      v.literal("contract"),
      v.literal("intern"),
      v.literal("temporary")
    ),
    salaryRange: v.optional(v.string()),
    closingDate: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const jobId = await ctx.db.insert("jobs", {
      orgId,
      createdBy: user._id,
      createdAt: new Date().toISOString(),
      ...args,
    });

    return jobId;
  },
});

export const updateJobStatus = mutation({
  args: {
    id: v.id("jobs"),
    status: v.union(v.literal("draft"), v.literal("open"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized");
    }

    const job = await ctx.db.get(args.id);
    if (!job || job.orgId !== orgId) {
        throw new Error("Job not found");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updateJob = mutation({
  args: {
    id: v.id("jobs"),
    updates: v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        departmentId: v.optional(v.id("departments")),
        locationId: v.optional(v.id("locations")),
        employmentType: v.optional(v.union(
            v.literal("full_time"),
            v.literal("part_time"),
            v.literal("contract"),
            v.literal("intern"),
            v.literal("temporary")
        )),
        salaryRange: v.optional(v.string()),
        closingDate: v.optional(v.string()),
        status: v.optional(v.union(v.literal("draft"), v.literal("open"), v.literal("closed"))),
    })
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized");
    }

    const job = await ctx.db.get(args.id);
    if (!job || job.orgId !== orgId) {
        throw new Error("Job not found");
    }

    await ctx.db.patch(args.id, args.updates);
  }
});

// --- Applications ---

// Submit application (Internal or External via some mechanism, currently assumes logged in user or admin entering it)
// For MVP, we'll allow logged-in users to apply (internal mobility) or Admins to manually add candidates.
export const submitApplication = mutation({
  args: {
    jobId: v.id("jobs"),
    // Candidate details
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    resumeId: v.optional(v.id("_storage")),
    source: v.optional(v.string()), // e.g. "Internal", "LinkedIn"
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    const job = await ctx.db.get(args.jobId);
    if (!job || job.orgId !== orgId) throw new Error("Job not found");

    // 1. Check if candidate exists by email, else create
    let candidate = await ctx.db
        .query("candidates")
        .withIndex("by_org_email", q => q.eq("orgId", orgId).eq("email", args.email))
        .first();

    if (!candidate) {
        const candidateId = await ctx.db.insert("candidates", {
            orgId,
            firstName: args.firstName,
            lastName: args.lastName,
            email: args.email,
            phone: args.phone,
            resumeId: args.resumeId,
            source: args.source || (user.role === 'employee' ? 'Internal' : 'Manual Entry'),
            createdAt: new Date().toISOString(),
        });
        candidate = await ctx.db.get(candidateId);
    } else {
        // Update resume if provided
        if (args.resumeId) {
            await ctx.db.patch(candidate._id, { resumeId: args.resumeId });
        }
    }

    if (!candidate) throw new Error("Failed to process candidate");

    // 2. Check if already applied
    const existingApp = await ctx.db
        .query("applications")
        .withIndex("by_job", q => q.eq("jobId", args.jobId))
        .filter(q => q.eq(q.field("candidateId"), candidate!._id))
        .first();

    if (existingApp) {
        throw new Error("Candidate has already applied for this position");
    }

    // 3. Create Application
    const appId = await ctx.db.insert("applications", {
        orgId,
        jobId: args.jobId,
        candidateId: candidate._id,
        status: "new",
        appliedAt: new Date().toISOString(),
        notes: args.notes,
    });

    // Notify Job Creator or HR?
    const jobCreator = await ctx.db.get(job.createdBy);
    if (jobCreator) {
         await createNotification(ctx, {
            userId: jobCreator._id,
            title: "New Application",
            message: `${args.firstName} ${args.lastName} applied for ${job.title}`,
            type: "info",
            relatedId: appId,
            relatedTable: "applications",
            link: `/recruitment/applications/${appId}` // Future route
        });
    }

    return appId;
  },
});

export const listApplications = query({
  args: { jobId: v.optional(v.id("jobs")) },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) {
      throw new Error("Unauthorized");
    }

    let apps;

    if (args.jobId) {
        const job = await ctx.db.get(args.jobId);
        if (!job || job.orgId !== orgId) {
            throw new Error("Job not found or unauthorized");
        }

        apps = await ctx.db
            .query("applications")
            .withIndex("by_job", q => q.eq("jobId", args.jobId!))
            .collect();
    } else {
        apps = await ctx.db
            .query("applications")
            .withIndex("by_org_status", q => q.eq("orgId", orgId))
            .collect();
    }

    // Enrich
    return await Promise.all(apps.map(async (app) => {
        if (app.orgId !== orgId) return null; // Should be filtered by index logic generally

        const candidate = await ctx.db.get(app.candidateId);
        const job = await ctx.db.get(app.jobId);

        return {
            ...app,
            candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : "Unknown",
            candidateEmail: candidate?.email,
            jobTitle: job?.title,
            resumeUrl: candidate?.resumeId ? await ctx.storage.getUrl(candidate.resumeId) : null
        };
    }));
  }
});

export const updateApplicationStatus = mutation({
  args: {
    id: v.id("applications"),
    status: v.union(
      v.literal("new"),
      v.literal("screening"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("hired"),
      v.literal("rejected")
    ),
    rating: v.optional(v.number()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;

    if (!isPrivileged(user.role)) throw new Error("Unauthorized");

    const app = await ctx.db.get(args.id);
    if (!app || app.orgId !== orgId) throw new Error("Application not found");

    await ctx.db.patch(args.id, {
        status: args.status,
        rating: args.rating,
        notes: args.notes
    });
  }
});

// --- Candidates ---

export const getCandidate = query({
    args: { id: v.id("candidates") },
    handler: async (ctx, args) => {
        const user = await getViewerInfo(ctx);
        const orgId = user.orgId!;
        if (!isPrivileged(user.role)) throw new Error("Unauthorized");

        const candidate = await ctx.db.get(args.id);
        if (!candidate || candidate.orgId !== orgId) return null;

        return {
            ...candidate,
            resumeUrl: candidate.resumeId ? await ctx.storage.getUrl(candidate.resumeId) : null
        };
    }
});
