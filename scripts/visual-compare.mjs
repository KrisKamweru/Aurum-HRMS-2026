import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BASELINE_DIR = getArg("--baseline") || process.env.VISUAL_BASELINE_DIR || "e2e/visual-baseline";
const CANDIDATE_DIR = getArg("--candidate") || process.env.VISUAL_CANDIDATE_DIR || "artifacts/visual-smoke-current";

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return "";
  return process.argv[idx + 1];
}

async function listPngFiles(rootDir) {
  const out = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".png")) {
        out.push(path.relative(rootDir, full));
      }
    }
  }
  await walk(rootDir);
  out.sort();
  return out;
}

async function readManifestCaptureSet(rootDir) {
  const manifestPath = path.join(rootDir, 'manifest.json');
  if (!(await exists(manifestPath))) return null;
  const raw = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  if (!Array.isArray(manifest.captures) || manifest.captures.length === 0) return null;

  const set = new Set();
  for (const capture of manifest.captures) {
    if (!capture?.file) continue;
    const normalized = String(capture.file).replace(/\\/g, '/');
    const marker = `${rootDir.replace(/\\/g, '/')}/`;
    const idx = normalized.indexOf(marker);
    if (idx >= 0) {
      set.add(normalized.slice(idx + marker.length));
      continue;
    }
    // Fallback for relative paths embedded in manifest.
    const rel = path.relative(rootDir, path.resolve(capture.file)).replace(/\\/g, '/');
    set.add(rel);
  }
  return set;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  if (!(await exists(BASELINE_DIR))) {
    throw new Error(`Baseline directory not found: ${BASELINE_DIR}`);
  }
  if (!(await exists(CANDIDATE_DIR))) {
    throw new Error(`Candidate directory not found: ${CANDIDATE_DIR}`);
  }

  const baseFiles = await listPngFiles(BASELINE_DIR);
  const candFiles = await listPngFiles(CANDIDATE_DIR);
  const baselineManifestSet = await readManifestCaptureSet(BASELINE_DIR);
  const candidateManifestSet = await readManifestCaptureSet(CANDIDATE_DIR);

  let baseFiltered = baseFiles;
  let candFiltered = candFiles;

  if (baselineManifestSet && candidateManifestSet) {
    baseFiltered = baseFiles.filter((f) => baselineManifestSet.has(f));
    candFiltered = candFiles.filter((f) => candidateManifestSet.has(f));
  }

  const all = Array.from(new Set([...baseFiltered, ...candFiltered])).sort();

  const missingInCandidate = [];
  const missingInBaseline = [];
  const changed = [];
  const unchanged = [];

  for (const rel of all) {
    const bPath = path.join(BASELINE_DIR, rel);
    const cPath = path.join(CANDIDATE_DIR, rel);
    const hasB = await exists(bPath);
    const hasC = await exists(cPath);

    if (!hasB && hasC) {
      missingInBaseline.push(rel);
      continue;
    }
    if (hasB && !hasC) {
      missingInCandidate.push(rel);
      continue;
    }

    const [bBuf, cBuf] = await Promise.all([fs.readFile(bPath), fs.readFile(cPath)]);
    if (Buffer.compare(bBuf, cBuf) === 0) {
      unchanged.push(rel);
    } else {
      changed.push(rel);
    }
  }

  console.log(`Baseline: ${BASELINE_DIR}`);
  console.log(`Candidate: ${CANDIDATE_DIR}`);
  console.log(`Unchanged: ${unchanged.length}`);
  console.log(`Changed: ${changed.length}`);
  console.log(`Missing in candidate: ${missingInCandidate.length}`);
  console.log(`Missing in baseline: ${missingInBaseline.length}`);

  if (changed.length) {
    console.log("\nChanged files:");
    for (const f of changed) console.log(`- ${f}`);
  }
  if (missingInCandidate.length) {
    console.log("\nMissing in candidate:");
    for (const f of missingInCandidate) console.log(`- ${f}`);
  }
  if (missingInBaseline.length) {
    console.log("\nMissing in baseline:");
    for (const f of missingInBaseline) console.log(`- ${f}`);
  }

  if (changed.length || missingInCandidate.length || missingInBaseline.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("visual-compare failed:", err?.message || err);
  process.exit(1);
});
