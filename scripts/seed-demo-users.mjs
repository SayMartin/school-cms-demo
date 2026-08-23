#!/usr/bin/env node
// Creates four demo accounts (one per role) via the real sign-up endpoint,
// so that Better Auth hashes the passwords correctly. Then activates the
// accounts and sets the correct role via a direct SQL update (role/status
// can't be set via the public API).
//
// Run against local preview: npm run seed:demo-users:local (requires npm run preview in another terminal)
// Run against deployed demo: npm run seed:demo-users:remote -- --base-url https://<your-demo>.workers.dev
//
// NOTE: /api/auth/sign-up/email is blocked by the auth route whenever DEMO_LOCKDOWN is
// anything other than "false" (the default), so seeding a *deployed* demo means
// temporarily setting "DEMO_LOCKDOWN": "false" in wrangler.jsonc, deploying,
// running this script, then setting it back and deploying again. That is
// deliberate: the endpoint creates real User rows with password hashes, and a
// public demo should not leave it open just to make re-seeding convenient.

import { execSync } from "child_process";

const args = process.argv.slice(2);
const target = args.includes("--remote") ? "--remote" : "--local";
const baseUrlArg = args.find((a) => a.startsWith("--base-url="));
const BASE_URL = baseUrlArg
  ? baseUrlArg.split("=")[1]
  : target === "--remote"
    ? "https://school-cms-demo.appfinningar.se"
    : "http://localhost:8787";

const DEMO_PASSWORD = "Demokonto123!";

const ACCOUNTS = [
  { name: "Demo Admin", email: "admin@example.com", role: "admin" },
  { name: "Demo Staff", email: "staff@example.com", role: "staff" },
  { name: "Demo Restaurant", email: "restaurant@example.com", role: "restaurant" },
  { name: "Demo Facilities", email: "facilities@example.com", role: "facilities" },
];

async function signUp(account) {
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({
      name: account.name,
      email: account.email,
      password: DEMO_PASSWORD,
    }),
  });
  if (!res.ok && res.status !== 422) {
    // 422 = already registered, fine to re-run the script
    throw new Error(`Sign-up failed for ${account.email}: ${res.status} ${await res.text()}`);
  }
}

function activate(account) {
  const sql = `UPDATE "User" SET role = '${account.role}', status = 'active', emailVerified = 1 WHERE email = '${account.email}';`;
  execSync(
    `npx wrangler d1 execute school-cms-demo-db ${target} --command "${sql.replace(/"/g, '\\"')}"`,
    { stdio: "inherit" },
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Creating demo accounts against ${BASE_URL} (${target})...\n`);
  for (const account of ACCOUNTS) {
    process.stdout.write(`  ${account.email} (${account.role})... `);
    await signUp(account);
    activate(account);
    console.log("done");
    await sleep(3000); // Better Auth rate-limits the sign-up endpoint
  }
  console.log(`\n✅ Done. Password for all demo accounts: ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
