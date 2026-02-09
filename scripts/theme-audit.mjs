import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'src', 'app');
const OUTPUT = path.join(process.cwd(), 'docs', 'THEME-AUDIT.md');
const STRICT = process.argv.includes('--strict') || process.env.THEME_AUDIT_STRICT === '1';

const TARGETS = [
  { token: 'bg-white', requires: ['dark:bg-'] },
  { token: 'bg-stone-50', requires: ['dark:bg-'] },
  { token: 'text-stone-900', requires: ['dark:text-'] },
  { token: 'text-stone-800', requires: ['dark:text-'] },
  { token: 'border-stone-200', requires: ['dark:border-'] },
  { token: 'border-stone-100', requires: ['dark:border-'] },
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.html'))) {
      files.push(full);
    }
  }
  return files;
}

function findClassLiterals(text) {
  const matches = [];
  const regex = /class\s*=\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ classes: match[1], index: match.index });
  }
  return matches;
}

function findLine(text, index) {
  return text.slice(0, index).split('\n').length;
}

async function run() {
  const files = await walk(ROOT);
  const findings = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const classLiterals = findClassLiterals(content);

    for (const literal of classLiterals) {
      for (const target of TARGETS) {
        if (!literal.classes.includes(target.token)) continue;
        if (target.requires.some((requiredToken) => literal.classes.includes(requiredToken))) continue;
        findings.push({
          file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
          line: findLine(content, literal.index),
          token: target.token,
          classes: literal.classes,
        });
      }
    }
  }

  const grouped = new Map();
  for (const finding of findings) {
    const key = finding.file;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(finding);
  }

  const lines = [];
  lines.push('# Theme Audit');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('This report flags class literals that include light-theme tokens without an obvious dark override in the same class string.');
  lines.push('');
  lines.push(`Total findings: ${findings.length}`);
  lines.push(`Files affected: ${grouped.size}`);
  lines.push('');

  for (const [file, fileFindings] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`## ${file}`);
    for (const finding of fileFindings.slice(0, 30)) {
      lines.push(`- L${finding.line}: missing dark override for \`${finding.token}\``);
    }
    if (fileFindings.length > 30) {
      lines.push(`- ... ${fileFindings.length - 30} more in this file`);
    }
    lines.push('');
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${lines.join('\n')}\n`, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`Theme audit complete. Findings: ${findings.length}. Report: ${path.relative(process.cwd(), OUTPUT)}`);
  if (STRICT && findings.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
