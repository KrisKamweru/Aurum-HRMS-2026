import { spawnSync } from 'node:child_process';

const STEPS = [
  { name: 'Role/Route audit', command: 'npm run audit:roles' },
  { name: 'Pay-data authorization audit', command: 'npm run audit:pay-data' },
  { name: 'Negative auth Playwright checks', command: 'npm run test:auth-negative' },
  { name: 'Compensation security regression checks', command: 'npm run test:compensation-regression' },
];

function runStep(step) {
  // eslint-disable-next-line no-console
  console.log(`\n[guard-suite] ${step.name}`);
  const result = spawnSync(step.command, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`${step.name} failed`);
  }
}

function main() {
  for (const step of STEPS) {
    runStep(step);
  }
  // eslint-disable-next-line no-console
  console.log('\n[guard-suite] All local guard checks passed.');
}

try {
  main();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
