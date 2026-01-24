import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Seed function to create a test organization with users for all roles.
 * This is intended for regression testing and development purposes.
 *
 * Run via Convex dashboard or CLI:
 *   npx convex run seed:seedTestOrganization
 *
 * IMPORTANT: This creates database records but NOT auth credentials.
 * Users must be registered through the UI first, then linked using
 * the linkTestUserByEmail mutation.
 */

// Test organization configuration
const TEST_ORG = {
  name: "Aurum Test Corp",
  domain: "aurumtest.local",
};

const TEST_DEPARTMENTS = [
  { name: "Engineering", code: "ENG", description: "Software Development" },
  { name: "Human Resources", code: "HR", description: "People Operations" },
  { name: "Operations", code: "OPS", description: "Business Operations" },
  { name: "Sales", code: "SALES", description: "Sales & Business Development" },
];

const TEST_DESIGNATIONS = [
  { title: "Chief Executive Officer", code: "CEO", level: 1 },
  { title: "Department Head", code: "HEAD", level: 2 },
  { title: "Senior Manager", code: "SR-MGR", level: 3 },
  { title: "Manager", code: "MGR", level: 4 },
  { title: "Senior Engineer", code: "SR-ENG", level: 5 },
  { title: "Engineer", code: "ENG", level: 6 },
  { title: "HR Specialist", code: "HR-SPEC", level: 5 },
  { title: "Associate", code: "ASSOC", level: 7 },
];

const TEST_LOCATION = {
  name: "Headquarters",
  address: "123 Test Street",
  city: "Test City",
  country: "Testland",
};

// Test employees with their roles
// Password for all accounts: TestPass123!
const TEST_EMPLOYEES = [
  {
    firstName: "Super",
    lastName: "Admin",
    email: "super.admin@aurumtest.local",
    role: "super_admin" as const,
    departmentCode: "ENG",
    designationCode: "CEO",
    phone: "+1-555-0100",
  },
  {
    firstName: "Alice",
    lastName: "Administrator",
    email: "admin@aurumtest.local",
    role: "admin" as const,
    departmentCode: "HR",
    designationCode: "HEAD",
    phone: "+1-555-0101",
  },
  {
    firstName: "Hannah",
    lastName: "HRManager",
    email: "hr.manager@aurumtest.local",
    role: "hr_manager" as const,
    departmentCode: "HR",
    designationCode: "SR-MGR",
    phone: "+1-555-0102",
  },
  {
    firstName: "Michael",
    lastName: "Manager",
    email: "manager@aurumtest.local",
    role: "manager" as const,
    departmentCode: "ENG",
    designationCode: "MGR",
    phone: "+1-555-0103",
  },
  {
    firstName: "Emma",
    lastName: "Employee",
    email: "employee@aurumtest.local",
    role: "employee" as const,
    departmentCode: "ENG",
    designationCode: "ENG",
    phone: "+1-555-0104",
  },
  // Additional employees for testing team structures
  {
    firstName: "James",
    lastName: "Junior",
    email: "james.junior@aurumtest.local",
    role: "employee" as const,
    departmentCode: "ENG",
    designationCode: "ASSOC",
    phone: "+1-555-0105",
  },
  {
    firstName: "Sarah",
    lastName: "Sales",
    email: "sarah.sales@aurumtest.local",
    role: "employee" as const,
    departmentCode: "SALES",
    designationCode: "SR-ENG",
    phone: "+1-555-0106",
  },
  {
    firstName: "Oliver",
    lastName: "Ops",
    email: "oliver.ops@aurumtest.local",
    role: "manager" as const,
    departmentCode: "OPS",
    designationCode: "MGR",
    phone: "+1-555-0107",
  },
];

/**
 * Main seed function - creates the test organization with all supporting data.
 * This should be run once to set up the test environment.
 */
export const seedTestOrganization = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if test org already exists
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", TEST_ORG.domain))
      .first();

    if (existingOrg) {
      return {
        success: false,
        message: "Test organization already exists",
        orgId: existingOrg._id,
      };
    }

    // 1. Create Organization
    const orgId = await ctx.db.insert("organizations", {
      name: TEST_ORG.name,
      domain: TEST_ORG.domain,
      subscriptionPlan: "enterprise",
      status: "active",
    });

    // 2. Create Departments
    const departmentMap: Record<string, Id<"departments">> = {};
    for (const dept of TEST_DEPARTMENTS) {
      const deptId = await ctx.db.insert("departments", {
        orgId,
        name: dept.name,
        code: dept.code,
        description: dept.description,
      });
      departmentMap[dept.code] = deptId;
    }

    // 3. Create Designations
    const designationMap: Record<string, Id<"designations">> = {};
    for (const desig of TEST_DESIGNATIONS) {
      const desigId = await ctx.db.insert("designations", {
        orgId,
        title: desig.title,
        code: desig.code,
        level: desig.level,
      });
      designationMap[desig.code] = desigId;
    }

    // 4. Create Location
    const locationId = await ctx.db.insert("locations", {
      orgId,
      name: TEST_LOCATION.name,
      address: TEST_LOCATION.address,
      city: TEST_LOCATION.city,
      country: TEST_LOCATION.country,
    });

    // 5. Create Employee Records (without user links initially)
    const employeeMap: Record<string, Id<"employees">> = {};
    const managerEmployeeId: Id<"employees"> | undefined = undefined;

    for (const emp of TEST_EMPLOYEES) {
      const employeeId = await ctx.db.insert("employees", {
        orgId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        departmentId: departmentMap[emp.departmentCode],
        designationId: designationMap[emp.designationCode],
        locationId,
        startDate: "2024-01-01",
        status: "active",
        phone: emp.phone,
      });
      employeeMap[emp.email] = employeeId;
    }

    // 6. Set up manager relationships
    // Michael Manager manages Emma and James
    const michaelId = employeeMap["manager@aurumtest.local"];
    if (michaelId) {
      await ctx.db.patch(employeeMap["employee@aurumtest.local"], {
        managerId: michaelId,
      });
      await ctx.db.patch(employeeMap["james.junior@aurumtest.local"], {
        managerId: michaelId,
      });
    }

    // Oliver Ops manages Sarah Sales
    const oliverId = employeeMap["oliver.ops@aurumtest.local"];
    if (oliverId) {
      await ctx.db.patch(employeeMap["sarah.sales@aurumtest.local"], {
        managerId: oliverId,
      });
    }

    // Set department managers
    await ctx.db.patch(departmentMap["ENG"], {
      managerId: michaelId,
    });
    await ctx.db.patch(departmentMap["HR"], {
      managerId: employeeMap["hr.manager@aurumtest.local"],
    });
    await ctx.db.patch(departmentMap["OPS"], {
      managerId: oliverId,
    });

    return {
      success: true,
      message: "Test organization created successfully",
      orgId,
      departmentCount: TEST_DEPARTMENTS.length,
      designationCount: TEST_DESIGNATIONS.length,
      employeeCount: TEST_EMPLOYEES.length,
      locationId,
    };
  },
});

/**
 * Link a registered user to their test employee record.
 * Run this after each test user registers through the UI.
 *
 * Usage: npx convex run seed:linkTestUserByEmail '{"email": "admin@aurumtest.local"}'
 */
export const linkTestUserByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return { success: false, message: `User with email ${args.email} not found` };
    }

    // Find the employee by email
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!employee) {
      return { success: false, message: `Employee with email ${args.email} not found` };
    }

    // Find the test employee config to get the role
    const testEmp = TEST_EMPLOYEES.find((e) => e.email === args.email);
    if (!testEmp) {
      return { success: false, message: `Email ${args.email} is not a test account` };
    }

    // Update the user with org, role, and employee link
    await ctx.db.patch(user._id, {
      orgId: employee.orgId,
      role: testEmp.role,
      employeeId: employee._id,
    });

    return {
      success: true,
      message: `User ${args.email} linked successfully`,
      role: testEmp.role,
      employeeId: employee._id,
    };
  },
});

/**
 * Batch link all registered test users to their employee records.
 * Useful after registering all test accounts.
 */
export const linkAllTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const results: Array<{ email: string; success: boolean; message: string }> = [];

    for (const testEmp of TEST_EMPLOYEES) {
      // Find the user by email
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", testEmp.email))
        .first();

      if (!user) {
        results.push({
          email: testEmp.email,
          success: false,
          message: "User not registered yet",
        });
        continue;
      }

      // Find the employee by email
      const employee = await ctx.db
        .query("employees")
        .withIndex("by_email", (q) => q.eq("email", testEmp.email))
        .first();

      if (!employee) {
        results.push({
          email: testEmp.email,
          success: false,
          message: "Employee record not found",
        });
        continue;
      }

      // Skip if already linked
      if (user.employeeId === employee._id && user.orgId === employee.orgId) {
        results.push({
          email: testEmp.email,
          success: true,
          message: "Already linked",
        });
        continue;
      }

      // Update the user
      await ctx.db.patch(user._id, {
        orgId: employee.orgId,
        role: testEmp.role,
        employeeId: employee._id,
      });

      results.push({
        email: testEmp.email,
        success: true,
        message: `Linked as ${testEmp.role}`,
      });
    }

    return results;
  },
});

/**
 * Delete the test organization and all associated data.
 * Use with caution - this is destructive!
 */
export const deleteTestOrganization = mutation({
  args: {
    confirmDeletion: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDeletion) {
      return { success: false, message: "Deletion not confirmed" };
    }

    // Find test org
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", TEST_ORG.domain))
      .first();

    if (!org) {
      return { success: false, message: "Test organization not found" };
    }

    const orgId = org._id;

    // Delete all related data
    const tables = [
      "employees",
      "departments",
      "designations",
      "locations",
      "leave_requests",
      "attendance_records",
      "promotions",
      "transfers",
      "resignations",
      "terminations",
      "warnings",
      "complaints",
      "awards",
      "travel_requests",
      "work_schedules",
      "org_join_requests",
    ] as const;

    let deletedCount = 0;

    for (const table of tables) {
      const records = await ctx.db
        .query(table)
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();

      for (const record of records) {
        await ctx.db.delete(record._id);
        deletedCount++;
      }
    }

    // Unlink users from this org
    const users = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    for (const user of users) {
      await ctx.db.patch(user._id, {
        orgId: undefined,
        employeeId: undefined,
        role: "pending",
      });
    }

    // Delete the organization
    await ctx.db.delete(orgId);

    return {
      success: true,
      message: "Test organization deleted",
      deletedRecords: deletedCount,
      unlinkedUsers: users.length,
    };
  },
});

/**
 * Get status of test organization setup
 */
export const getTestOrgStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", TEST_ORG.domain))
      .first();

    if (!org) {
      return { exists: false };
    }

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_org", (q) => q.eq("orgId", org._id))
      .collect();

    const linkedUsers: string[] = [];
    const unlinkedUsers: string[] = [];

    for (const testEmp of TEST_EMPLOYEES) {
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", testEmp.email))
        .first();

      if (user && user.employeeId) {
        linkedUsers.push(testEmp.email);
      } else {
        unlinkedUsers.push(testEmp.email);
      }
    }

    return {
      exists: true,
      orgId: org._id,
      orgName: org.name,
      employeeCount: employees.length,
      linkedUsers,
      unlinkedUsers,
    };
  },
});
