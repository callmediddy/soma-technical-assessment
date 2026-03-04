#!/usr/bin/env node
/**
 * Seed script for the todo app.
 * Usage:  node scripts/seed.js [N]   (default N=12)
 *         node scripts/seed.js 20 --clear   (delete all existing todos first)
 *
 * Generates N realistic software-project tasks arranged in phases so that
 * dependencies always flow forward (phase 0 → 1 → 2 → 3), guaranteeing no cycles.
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Load PEXELS_API_KEY from .env.local (Next.js convention)
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  try {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  } catch {
    // No .env.local — that's fine
  }
}
loadEnv();

// ─── Task pool ──────────────────────────────────────────────────────────────
// Each entry: { title, phase (0-3), daysFromNow (due date offset) }
// Phase 0 = foundation (no deps), Phase 3 = delivery (depends on earlier phases)

const TASK_POOL = [
  // Phase 0 — Research & setup
  { title: "Define project requirements",      phase: 0, days: 3  },
  { title: "Set up development environment",   phase: 0, days: 2  },
  { title: "Create repository and CI pipeline",phase: 0, days: 2  },
  { title: "Design system architecture",       phase: 0, days: 5  },
  { title: "Audit existing codebase",          phase: 0, days: 4  },
  { title: "Write technical specification",    phase: 0, days: 6  },
  { title: "Conduct stakeholder interviews",   phase: 0, days: 3  },

  // Phase 1 — Design & planning
  { title: "Create wireframes",                phase: 1, days: 8  },
  { title: "Design database schema",           phase: 1, days: 7  },
  { title: "Define API contracts",             phase: 1, days: 9  },
  { title: "Plan sprint backlog",              phase: 1, days: 6  },
  { title: "Set up staging environment",       phase: 1, days: 8  },
  { title: "Choose third-party integrations",  phase: 1, days: 7  },
  { title: "Write component design docs",      phase: 1, days: 10 },

  // Phase 2 — Implementation
  { title: "Implement authentication",         phase: 2, days: 14 },
  { title: "Build REST API endpoints",         phase: 2, days: 16 },
  { title: "Develop core UI components",       phase: 2, days: 15 },
  { title: "Integrate payment gateway",        phase: 2, days: 18 },
  { title: "Write unit tests",                 phase: 2, days: 13 },
  { title: "Implement data migrations",        phase: 2, days: 14 },
  { title: "Add logging and monitoring",       phase: 2, days: 17 },

  // Phase 3 — QA & delivery
  { title: "Perform end-to-end testing",       phase: 3, days: 22 },
  { title: "Security audit and pen testing",   phase: 3, days: 24 },
  { title: "Write user documentation",         phase: 3, days: 20 },
  { title: "Conduct performance benchmarks",   phase: 3, days: 21 },
  { title: "Deploy to production",             phase: 3, days: 28 },
  { title: "Set up feature flags",             phase: 3, days: 23 },
  { title: "Post-launch monitoring review",    phase: 3, days: 30 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString(); // full ISO-8601 DateTime
}

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ─── Pexels ─────────────────────────────────────────────────────────────────

async function fetchPexelsImage(query) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.medium ?? null;
  } catch {
    return null;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes("--clear");
  const nArg = args.find((a) => /^\d+$/.test(a));
  const N = Math.min(100, Math.max(1, nArg ? parseInt(nArg, 10) : 12));

  if (shouldClear) {
    await prisma.todoDependency.deleteMany();
    await prisma.todo.deleteMany();
    console.log("Cleared existing todos.");
  }

  // Select N tasks from the pool, preserving phase proportions
  const perPhase = Math.max(1, Math.floor(N / 4));
  const byPhase = [0, 1, 2, 3].map((p) =>
    pick(TASK_POOL.filter((t) => t.phase === p), perPhase)
  );

  // Flatten: top up to exactly N by pulling from phase 0 extras
  let selected = byPhase.flat();
  if (selected.length < N) {
    const extras = TASK_POOL.filter((t) => !selected.includes(t));
    selected = selected.concat(pick(extras, N - selected.length));
  }
  selected = selected.slice(0, N);

  // Shuffle within phases for variety, but keep phase ordering
  selected.sort((a, b) => a.phase - b.phase);

  // Create todos
  const created = [];
  for (const task of selected) {
    const todo = await prisma.todo.create({
      data: { title: task.title, dueDate: daysFromNow(task.days) },
    });
    created.push({ ...todo, phase: task.phase });
  }

  // Fetch Pexels images in parallel and update todos
  const apiKey = process.env.PEXELS_API_KEY;
  if (apiKey) {
    process.stdout.write(`Fetching images for ${created.length} todos...`);
    await Promise.all(
      created.map(async (todo) => {
        const imageUrl = await fetchPexelsImage(todo.title);
        if (imageUrl) {
          await prisma.todo.update({ where: { id: todo.id }, data: { imageUrl } });
        }
      })
    );
    console.log(" done.");
  } else {
    console.log("No PEXELS_API_KEY found — skipping images.");
  }

  // Build phase buckets by DB id
  const phases = [0, 1, 2, 3].map((p) => created.filter((t) => t.phase === p));

  // Wire dependencies: each task in phase P gets 1-2 deps from phase P-1
  const deps = [];
  for (let p = 1; p <= 3; p++) {
    const sources = phases[p - 1];
    if (sources.length === 0) continue;
    for (const task of phases[p]) {
      const count = Math.random() < 0.4 ? 2 : 1;
      const chosen = pick(sources, count);
      for (const dep of chosen) {
        deps.push({ dependentId: task.id, dependencyId: dep.id });
      }
    }
  }

  // Deduplicate (safety net)
  const seen = new Set();
  const uniqueDeps = deps.filter((d) => {
    const key = `${d.dependentId}:${d.dependencyId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueDeps.length > 0) {
    await prisma.todoDependency.createMany({ data: uniqueDeps });
  }

  console.log(`\nSeeded ${created.length} todos across ${phases.filter((p) => p.length).length} phases.`);
  console.log(`Created ${uniqueDeps.length} dependencies.\n`);

  for (let p = 0; p <= 3; p++) {
    if (phases[p].length === 0) continue;
    console.log(`Phase ${p}: ${phases[p].map((t) => `"${t.title}"`).join(", ")}`);
  }
  console.log();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
