# Database Seeding Instructions

This document explains how to populate the database with test data for regression testing and development.

## The Seed Function

We have a dedicated Convex mutation `seedTestOrganization` located in `convex/seed.ts` that handles the creation of a complete test environment.

### What it Creates

Running the seed function generates the "Aurum Test Corp" organization with:
- **4 Departments**: Engineering, HR, Sales, Operations
- **8 Designations**: From CEO down to Associate
- **1 Location**: Headquarters
- **8 Employee Profiles**: A complete team hierarchy

### How to Run It

1. **Create the Data**:
   ```bash
   npx convex run seed:seedTestOrganization
   ```

2. **Register User Accounts**:
   You must manually register the user accounts through the UI (http://localhost:4200/register).
   See `aurum-hrms/.test-credentials` for the list of email addresses and passwords to use.

3. **Link Users to Profiles**:
   After registering the users, run this command to link them to their employee records:
   ```bash
   npx convex run seed:linkAllTestUsers
   ```

4. **Verify Setup**:
   Check the status of the test organization:
   ```bash
   npx convex run seed:getTestOrgStatus
   ```

### Resetting the Environment

If you need to start fresh (e.g., after breaking schema changes), you can delete the test organization:

```bash
npx convex run seed:deleteTestOrganization '{"confirmDeletion": true}'
```

**Note**: This deletes the organization and all related data (employees, departments, etc.), but it **does not** delete the user accounts from the authentication system. The `linkAllTestUsers` command will simply re-link the existing user accounts to the new employee records when you re-seed.

## Test Credentials

For a list of all test accounts, roles, and passwords, see the local file:
`aurum-hrms/.test-credentials` (This file is git-ignored for security)
