# Convex Backend Guide

This folder contains all backend functions, schema, and seed helpers used by Aurum HRMS.

## Core Seed Workflow

### Fast path (recommended for local regression work)

```bash
npm run seed:visual
```

This runs:
- `seed:seedTestOrganization`
- `seed:linkAllTestUsers`
- `seed_tax:seedKenyaTaxRules`
- `seed:getTestOrgStatus`

### Manual path

1. Create or refresh the seeded test organization:

```bash
npx convex run seed:seedTestOrganization
```

Note:
- The seed mutation is idempotent.
- If the org already exists, it now backfills missing employee compensation (`baseSalary`, `currency`, `payFrequency`) to keep payroll test data usable.

2. Register test users in the app UI (`/register`) using `.test-credentials`.

3. Link registered users to seeded employees:

```bash
npx convex run seed:linkAllTestUsers
```

4. Verify status:

```bash
npx convex run seed:getTestOrgStatus
```

## Reset Seeded Environment

```bash
npx convex run seed:deleteTestOrganization '{"confirmDeletion": true}'
```

This deletes seeded org data but does not remove auth user accounts; re-seeding + relinking restores test state.

## Tax Rules Seed

```bash
npx convex run seed_tax:seedKenyaTaxRules
```

## Useful Convex Commands

```bash
npx convex dev
npx convex run <module:function> '<jsonArgs>'
npx convex codegen
```
