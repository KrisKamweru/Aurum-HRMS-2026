import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

// Helper to get viewer info including role and employeeId
async function getViewerInfo(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");

  const user = await ctx.db.get(userId);
  if (!user || !user.orgId) throw new Error("User has no organization");

  return user;
}

// List all employees for the current organization
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    try {
      const user = await getViewerInfo(ctx);
      const orgId = user.orgId!;
      const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

      const employees = await ctx.db
        .query("employees")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();

      // Enrich with Department and Designation names
      const enriched = await Promise.all(
        employees.map(async (emp) => {
          let departmentName: string | undefined = undefined;
          if (emp.departmentId) {
            const dept = await ctx.db.get(emp.departmentId);
            if (dept) departmentName = dept.name;
          }

          let designationName: string | undefined = undefined;
          if (emp.designationId) {
            const desig = await ctx.db.get(emp.designationId);
            if (desig) designationName = desig.title;
          }

          let locationName = "";
          if (emp.locationId) {
            const loc = await ctx.db.get(emp.locationId);
            if (loc) locationName = loc.name;
          }

          const isOwnProfile = user.employeeId === emp._id;

          // Redact PII for non-privileged users viewing others
          const safeEmp = { ...emp };
          if (!isPrivileged && !isOwnProfile) {
            delete safeEmp.phone;
            delete safeEmp.address;
            delete safeEmp.dob;
            delete safeEmp.gender;
          }

          return {
            ...safeEmp,
            department: departmentName,
            position: designationName, // Map to 'position' for frontend compatibility
            location: locationName
          };
        })
      );

      return enriched;

    } catch (e) {
      return [];
    }
  },
});

// Get single employee
export const get = query({
  args: { id: v.id("employees") },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

    const employee = await ctx.db.get(args.id);

    if (!employee || employee.orgId !== orgId) {
      return null;
    }

    // Redact PII if needed
    const isOwnProfile = user.employeeId === args.id;
    if (!isPrivileged && !isOwnProfile) {
       // We can just set these to undefined, or delete them
       // @ts-ignore
       employee.phone = undefined;
       // @ts-ignore
       employee.address = undefined;
       // @ts-ignore
       employee.dob = undefined;
       // @ts-ignore
       employee.gender = undefined;
    }

    // Enrich with Department, Designation, Location
    let departmentName: string | undefined = undefined;
    if (employee.departmentId) {
        const dept = await ctx.db.get(employee.departmentId);
        if (dept) departmentName = dept.name;
    }

    let designationName: string | undefined = undefined;
    if (employee.designationId) {
        const desig = await ctx.db.get(employee.designationId);
        if (desig) designationName = desig.title;
    }

    let locationName = "";
    if (employee.locationId) {
        const loc = await ctx.db.get(employee.locationId);
        if (loc) locationName = loc.name;
    }

    // Also fetch manager name if managerId exists
    let managerName = "";
    if (employee.managerId) {
        const manager = await ctx.db.get(employee.managerId);
        if (manager) managerName = `${manager.firstName} ${manager.lastName}`;
    }

    return {
        ...employee,
        department: departmentName,
        position: designationName,
        location: locationName,
        managerName
    };
  },
});

// Create a new employee
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    locationId: v.optional(v.id("locations")),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("terminated"), v.literal("on-leave"), v.literal("resigned")),
    startDate: v.string(),
    managerId: v.optional(v.id("employees")),
    // Personal Info
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    gender: v.optional(v.string()),
    dob: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const employeeId = await ctx.db.insert("employees", {
      orgId,
      ...args,
    });
    return employeeId;
  },
});

// Update employee status
export const updateStatus = mutation({
  args: {
    id: v.id("employees"),
    status: v.union(v.literal("active"), v.literal("terminated"), v.literal("on-leave"), v.literal("resigned")),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const employee = await ctx.db.get(args.id);

    if (!employee || employee.orgId !== orgId) {
      throw new Error("Employee not found or unauthorized");
    }

    await ctx.db.patch(args.id, { status: args.status });
  },
});

// Update employee details
export const update = mutation({
  args: {
    id: v.id("employees"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    departmentId: v.optional(v.id("departments")),
    designationId: v.optional(v.id("designations")),
    locationId: v.optional(v.id("locations")),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    startDate: v.string(),
    managerId: v.optional(v.id("employees")),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    gender: v.optional(v.string()),
    dob: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

    // Regular users can update their own profile? Maybe limited fields?
    // For now, let's restrict full update to privileged users.
    // If we want self-service, we should probably make a separate 'updateProfile' mutation with strict allowlist.
    const isSelf = user.employeeId === args.id;

    if (!isPrivileged) {
       // If allowing self-update, we'd check isSelf here.
       // But usually employees can't change their own designation/salary/etc.
       // We'll block it for now.
       throw new Error("Unauthorized: Insufficient permissions");
    }

    const employee = await ctx.db.get(args.id);

    if (!employee || employee.orgId !== orgId) {
      throw new Error("Employee not found or unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete employee
export const remove = mutation({
  args: {
    id: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);
    const orgId = user.orgId!;
    const isPrivileged = ["super_admin", "admin", "hr_manager", "manager"].includes(user.role);

    if (!isPrivileged) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    const employee = await ctx.db.get(args.id);

    if (!employee || employee.orgId !== orgId) {
      throw new Error("Employee not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Update own profile (self-service) - limited to personal info only
export const updateMyProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    gender: v.optional(v.string()),
    dob: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getViewerInfo(ctx);

    if (!user.employeeId) {
      throw new Error("No employee profile linked to this account");
    }

    const employee = await ctx.db.get(user.employeeId);
    if (!employee) {
      throw new Error("Employee profile not found");
    }

    await ctx.db.patch(user.employeeId, {
      phone: args.phone,
      address: args.address,
      gender: args.gender,
      dob: args.dob,
    });
  },
});

// Get current user's employee profile
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewerInfo(ctx);

    if (!user.employeeId) {
      return null;
    }

    const employee = await ctx.db.get(user.employeeId);
    if (!employee) {
      return null;
    }

    // Enrich with Department, Designation, Location
    let departmentName: string | undefined = undefined;
    if (employee.departmentId) {
      const dept = await ctx.db.get(employee.departmentId);
      if (dept) departmentName = dept.name;
    }

    let designationName: string | undefined = undefined;
    if (employee.designationId) {
      const desig = await ctx.db.get(employee.designationId);
      if (desig) designationName = desig.title;
    }

    let locationName = "";
    if (employee.locationId) {
      const loc = await ctx.db.get(employee.locationId);
      if (loc) locationName = loc.name;
    }

    let managerName = "";
    if (employee.managerId) {
      const manager = await ctx.db.get(employee.managerId);
      if (manager) managerName = `${manager.firstName} ${manager.lastName}`;
    }

    // Calculate tenure
    const startDate = new Date(employee.startDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor(((now.getTime() - startDate.getTime()) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    const tenure = years > 0 ? `${years}y ${months}m` : `${months}m`;

    return {
      ...employee,
      department: departmentName,
      position: designationName,
      location: locationName,
      managerName,
      tenure,
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }
    };
  },
});
