import { spawnSync } from 'node:child_process';

const COMMANDS = [
  'npx convex run seed:seedTestOrganization',
  'npx convex run seed:linkAllTestUsers',
  'npx convex run seed_tax:seedKenyaTaxRules',
  'npx convex run seed:getTestOrgStatus',
];

function run(command) {
  const result = spawnSync(command, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command}`);
  }
}

function main() {
  for (const command of COMMANDS) {
    // eslint-disable-next-line no-console
    console.log(`\n> ${command}`);
    run(command);
  }
  // eslint-disable-next-line no-console
  console.log('\nVisual fixtures are seeded and linked.');
}

try {
  main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
