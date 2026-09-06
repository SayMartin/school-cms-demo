#!/usr/bin/env node
// Generates docs/api-matrix.md — every API route handler mapped to the guard it
// runs behind, whether demoLockCheck() blocks it, and which tables it reads and
// writes. Re-run with `npm run docs:api`.
//
// The point of this file is the privacy invariant in CLAUDE.md: the Studio
// password is published, so anything in D1 is world-readable and no public
// endpoint may persist a visitor's personal data. That invariant lives across 59
// route files and cannot be seen by reading any one of them.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const API_DIR = "src/app/api";
const SCHEMA_PATH = "src/lib/db/schema.ts";
const DEMO_LOCK_PATH = "src/lib/auth/demo-lock.ts";
const OUT_PATH = "docs/api-matrix.md";

const HTTP_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const MUTATIONS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const GUARDS = [
  "requireStudioAccess",
  "requireAdminAccess",
  "requireRestaurantAccess",
  "requireFacilitiesAccess",
];

// ─── Lexing helpers ───────────────────────────────────────────────────────────

/**
 * Blanks out comments — and, with `maskStrings`, string/template contents too —
 * preserving every character position. Brace matching and identifier extraction
 * run against the fully masked text so that a `{` inside an HTML seed string or
 * a route path inside a comment can't throw the parse off. Import paths and
 * rate-limiter names are strings, so those are read from the comments-only pass.
 */
function mask(source, maskStrings = true) {
  const out = source.split("");
  let i = 0;
  const blank = (from, to) => {
    for (let k = from; k < to && k < out.length; k++) {
      if (out[k] !== "\n") out[k] = " ";
    }
  };
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === "//") {
      const end = source.indexOf("\n", i);
      const stop = end === -1 ? source.length : end;
      blank(i, stop);
      i = stop;
    } else if (two === "/*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      blank(i, stop);
      i = stop;
    } else if (maskStrings && (source[i] === '"' || source[i] === "'" || source[i] === "`")) {
      const quote = source[i];
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === "\\") j += 2;
        else if (source[j] === quote) break;
        else j++;
      }
      blank(i + 1, j);
      i = j + 1;
    } else {
      i++;
    }
  }
  return out.join("");
}

/** Index just past the delimiter pair opening at or after `from`. */
function matchDelimiter(text, from, open, close) {
  const start = text.indexOf(open, from);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      depth--;
      if (depth === 0) return { start, end: i };
    }
  }
  return null;
}

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else if (entry === "route.ts") found.push(full);
  }
  return found;
}

// ─── Which tables hold personal data ──────────────────────────────────────────

// Heuristic, deliberately visible in the output so it can be argued with: a
// column whose name looks like it identifies a person. `*Content` tables are
// excluded — their `email`/`phone` columns are the school's own published
// contact details, edited in the Studio, not anything a visitor typed.
const PERSONAL_COLUMN = /email|phone|address|personalid|identity|birth|ssn|firstname|lastname/i;

const schemaSource = readFileSync(SCHEMA_PATH, "utf8");
const dbNameOf = new Map(); // schema.ts variable -> actual table name
const personalData = new Map(); // varName -> { dbName, columns: [] }
for (const region of schemaSource.split(/^export const /m).slice(1)) {
  const header = region.match(/^(\w+)\s*=\s*sqliteTable\(\s*"([^"]+)"/);
  if (!header) continue;
  const [, varName, dbName] = header;
  dbNameOf.set(varName, dbName);
  if (dbName.endsWith("Content")) continue;
  const hits = [...region.matchAll(/^ {2}(\w+):\s*(?:text|integer|real|blob)\(/gm)]
    .map((m) => m[1])
    .filter((name) => PERSONAL_COLUMN.test(name));
  if (hits.length) personalData.set(varName, { dbName, columns: hits });
}

// ─── Analyse each route ───────────────────────────────────────────────────────

const routes = [];
const helperOps = new Map(); // route path -> tables touched outside any handler

for (const file of walk(API_DIR).sort()) {
  const source = readFileSync(file, "utf8");
  const masked = mask(source);
  const code = mask(source, false); // comments gone, strings intact
  const routePath = "/api/" + relative(API_DIR, dirname(file)).split(/[\\/]/).join("/");

  const importMatch = code.match(/import\s*\{([^}]+)\}\s*from\s*.@\/lib\/db\/schema/);
  const tableIdents = new Set(
    importMatch ? importMatch[1].split(",").map((s) => s.trim()).filter(Boolean) : [],
  );

  const usesR2 = /@\/lib\/r2\/client/.test(code);

  const collect = (slice) => {
    const writes = new Set();
    const reads = new Set();
    for (const m of slice.matchAll(/\.(insert|update|delete)\(\s*(\w+)/g)) {
      if (tableIdents.has(m[2])) writes.add(m[2]);
    }
    for (const m of slice.matchAll(/\.from\(\s*(\w+)/g)) {
      if (tableIdents.has(m[1])) reads.add(m[1]);
    }
    for (const m of slice.matchAll(/db\.query\.(\w+)/g)) {
      if (tableIdents.has(m[1])) reads.add(m[1]);
    }
    for (const m of slice.matchAll(/\.(?:left|right|inner|full)?[Jj]oin\(\s*(\w+)/g)) {
      if (tableIdents.has(m[1])) reads.add(m[1]);
    }
    return { writes: [...writes], reads: [...reads] };
  };

  // A handler reaches the router three ways: declared and exported at once, or
  // declared locally and re-exported under one or more method names. The auth
  // catch-all uses the second form (`export { handler as GET, handler as POST }`),
  // so matching only `export async function GET` would miss it entirely.
  const bodyOf = (name) => {
    const decl =
      masked.match(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`)) ??
      masked.match(new RegExp(`const\\s+${name}\\s*=`));
    if (!decl) return null;
    const params = matchDelimiter(masked, decl.index, "(", ")");
    const body = matchDelimiter(masked, params ? params.end : decl.index, "{", "}");
    return body;
  };

  const declared = new Map(); // method -> body range
  for (const method of HTTP_METHODS) {
    const direct = masked.match(
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(`),
    );
    if (direct) {
      const params = matchDelimiter(masked, direct.index, "(", ")");
      const body = params && matchDelimiter(masked, params.end, "{", "}");
      if (body) declared.set(method, body);
    }
  }
  for (const block of masked.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const entry of block[1].split(",")) {
      const parts = entry.trim().split(/\s+as\s+/);
      const method = (parts[1] ?? parts[0] ?? "").trim();
      const local = parts[0].trim();
      if (!HTTP_METHODS.includes(method) || declared.has(method)) continue;
      const body = bodyOf(local);
      if (body) declared.set(method, body);
    }
  }
  for (const method of HTTP_METHODS) {
    if (declared.has(method)) continue;
    const alias = masked.match(new RegExp(`export\\s+const\\s+${method}\\s*=\\s*(\\w+)`));
    if (alias) {
      const body = bodyOf(alias[1]);
      if (body) declared.set(method, body);
    }
  }

  const handlers = [];
  const covered = []; // character ranges belonging to a handler

  for (const method of HTTP_METHODS) {
    const body = declared.get(method);
    if (body) {
      covered.push([body.start, body.end]);

      const slice = masked.slice(body.start, body.end);
      const rawSlice = code.slice(body.start, body.end);
      const { writes, reads } = collect(slice);

      handlers.push({
        method,
        shared: [...declared].filter(([, b]) => b.start === body.start).length > 1,
        guards: GUARDS.filter((g) => slice.includes(`${g}(`)),
        demoLock: slice.includes("demoLockCheck("),
        limiters: [...new Set([...rawSlice.matchAll(/rateLimit\([^,]+,\s*"(\w+)"/g)].map((x) => x[1]))],
        writes,
        reads,
        usesR2,
      });
    }
  }

  // Table operations sitting outside every handler — module-level defaults and
  // shared helpers. Reported separately rather than silently attributed.
  const outside = masked
    .split("")
    .map((ch, i) => (covered.some(([a, b]) => i >= a && i <= b) ? " " : ch))
    .join("");
  const helper = collect(outside);
  if (helper.writes.length || helper.reads.length) {
    helperOps.set(routePath, helper);
  }

  routes.push({ routePath, file, handlers });
}

routes.sort((a, b) => a.routePath.localeCompare(b.routePath));

// ─── Findings ─────────────────────────────────────────────────────────────────

const allHandlers = routes.flatMap((r) => r.handlers.map((h) => ({ ...h, route: r.routePath })));

const unguardedMutations = allHandlers.filter(
  (h) => MUTATIONS.has(h.method) && !h.guards.length && !h.demoLock && !h.limiters.length,
);

const publicPersonalWrites = allHandlers.filter(
  (h) =>
    MUTATIONS.has(h.method) &&
    !h.demoLock &&
    h.writes.some((w) => personalData.has(w)),
);

// demo-lock.ts documents its own callers in a comment. Compare that list against
// what actually calls it, so the two can't drift apart unnoticed.
const documented = [
  ...readFileSync(DEMO_LOCK_PATH, "utf8").matchAll(/^\s*\*\s+(\/api\/\S+)/gm),
].map((m) => m[1]);
const actual = [...new Set(allHandlers.filter((h) => h.demoLock).map((h) => h.route))];
// `/api/auth/[...all]` serves `/api/auth/sign-up/email`, so compare on the
// prefix a catch-all segment stands for rather than the literal directory name.
const asPrefix = (route) => route.replace(/\[\.\.\..*$/, "");
const undocumented = actual.filter((r) => !documented.some((d) => d.startsWith(asPrefix(r))));
const stale = documented.filter((d) => !actual.some((r) => d.startsWith(asPrefix(r))));

// ─── Render ───────────────────────────────────────────────────────────────────

const tableName = (v) => dbNameOf.get(v) ?? v;
const fmt = (list) => (list.length ? list.map((t) => `\`${tableName(t)}\``).join(", ") : "—");

const lines = [];
lines.push("<!-- Generated by scripts/generate-api-matrix.mjs — do not edit by hand.");
lines.push("     Run `npm run docs:api` after changing anything under src/app/api. -->");
lines.push("");
lines.push("# API surface");
lines.push("");
lines.push(
  `${routes.length} route files, ${allHandlers.length} exported handlers ` +
    `(${allHandlers.filter((h) => MUTATIONS.has(h.method)).length} mutating). ` +
    `${allHandlers.filter((h) => h.guards.length).length} run behind a role guard, ` +
    `${allHandlers.filter((h) => h.demoLock).length} behind \`demoLockCheck()\`.`,
);
lines.push("");
lines.push("## Findings");
lines.push("");

lines.push("### Mutating handlers with no guard, lock or rate limit");
lines.push("");
if (unguardedMutations.length) {
  for (const h of unguardedMutations) {
    lines.push(`- \`${h.method} ${h.route}\` — writes ${fmt(h.writes)}`);
  }
} else {
  lines.push("None.");
}
lines.push("");

lines.push("### Public writes to tables holding personal data");
lines.push("");
lines.push(
  "Mutating handlers without `demoLockCheck()` that write a table carrying a " +
    "person-identifying column. Being listed here is not automatically a bug — a " +
    "Studio-guarded handler writing staff records belongs here — but every row " +
    "should be a deliberate decision. See *Privacy & Personal Data* in AGENTS.md.",
);
lines.push("");
if (publicPersonalWrites.length) {
  lines.push("| Handler | Guard | Table | Triggering columns |");
  lines.push("|---|---|---|---|");
  for (const h of publicPersonalWrites) {
    for (const w of h.writes.filter((x) => personalData.has(x))) {
      const info = personalData.get(w);
      lines.push(
        `| \`${h.method} ${h.route}\` | ${h.guards.join(", ") || "**none**"} ` +
          `| \`${info.dbName}\` | ${info.columns.map((c) => `\`${c}\``).join(", ")} |`,
      );
    }
  }
} else {
  lines.push("None.");
}
lines.push("");

lines.push("### demo-lock.ts docstring drift");
lines.push("");
if (!undocumented.length && !stale.length) {
  lines.push(
    `The caller list in [demo-lock.ts](../src/lib/auth/demo-lock.ts) matches the ` +
      `${actual.length} routes that actually call it.`,
  );
} else {
  for (const r of undocumented) lines.push(`- \`${r}\` calls \`demoLockCheck()\` but is not in the docstring.`);
  for (const d of stale) lines.push(`- \`${d}\` is documented as a caller but no handler calls \`demoLockCheck()\`.`);
}
lines.push("");

lines.push("## Matrix");
lines.push("");
lines.push(
  "\u2020 marks methods that share one function body, so their guards and table " +
    "access are identical by construction — the auth catch-all exports the same " +
    "handler as both GET and POST.",
);
lines.push("");
lines.push("| Route | Method | Guard | Demo lock | Rate limit | Writes | Reads |");
lines.push("|---|---|---|---|---|---|---|");
for (const route of routes) {
  if (!route.handlers.length) {
    lines.push(`| \`${route.routePath}\` | — | | | | | |`);
    continue;
  }
  for (const h of route.handlers) {
    const limiters = [
      ...h.limiters,
      ...(h.guards.length && MUTATIONS.has(h.method) ? ["WRITE_LIMITER (via guard)"] : []),
    ];
    const r2 = h.usesR2 ? " + R2" : "";
    const mutating = MUTATIONS.has(h.method);
    lines.push(
      `| \`${route.routePath}\` | ${h.method}${h.shared ? " †" : ""} ` +
        `| ${h.guards.join(", ") || "public"} | ${h.demoLock ? "yes" : ""} ` +
        `| ${limiters.join(", ") || ""} | ${fmt(h.writes)}${mutating ? r2 : ""} ` +
        `| ${fmt(h.reads)}${mutating ? "" : r2} |`,
    );
  }
}
lines.push("");

if (helperOps.size) {
  lines.push("## Table access outside a handler");
  lines.push("");
  lines.push(
    "Module-level defaults and shared helpers in these route files touch tables " +
      "outside any exported handler, so the matrix above does not attribute them " +
      "to a method.",
  );
  lines.push("");
  lines.push("| Route | Writes | Reads |");
  lines.push("|---|---|---|");
  for (const [route, ops] of [...helperOps].sort()) {
    lines.push(`| \`${route}\` | ${fmt(ops.writes)} | ${fmt(ops.reads)} |`);
  }
  lines.push("");
}

writeFileSync(OUT_PATH, lines.join("\n"));
console.log(
  `${OUT_PATH}: ${routes.length} routes, ${allHandlers.length} handlers, ` +
    `${unguardedMutations.length} unguarded mutations, ` +
    `${publicPersonalWrites.length} personal-data writes to review, ` +
    `${undocumented.length + stale.length} docstring drift`,
);
