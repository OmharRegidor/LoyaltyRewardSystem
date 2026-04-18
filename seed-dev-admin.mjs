// Seed a dev admin user.
// Usage: node seed-dev-admin.mjs <email> <password>
// Reads SUPABASE_URL + SERVICE_ROLE_KEY from apps/web/.env.local.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "apps", "web", ".env.local");

if (!fs.existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in apps/web/.env.local");
  process.exit(1);
}

const [, , emailArg, passwordArg] = process.argv;
const email = emailArg || "admin@dev.local";
const password = passwordArg || "DevAdmin123!";

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function findUserByEmail(email) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.users?.find((u) => u.email === email) || null;
}

async function createAuthUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`createAuthUser: ${await res.text()}`);
  return (await res.json()).id;
}

async function getAdminRoleId() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/roles?name=eq.admin&select=id`,
    { headers },
  );
  const rows = await res.json();
  if (rows[0]?.id) return rows[0].id;

  const ins = await fetch(`${SUPABASE_URL}/rest/v1/roles`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ name: "admin" }),
  });
  if (!ins.ok) throw new Error(`create admin role: ${await ins.text()}`);
  return (await ins.json())[0].id;
}

async function upsertUserRow(userId, email, roleId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=id`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id: userId, email, role_id: roleId }),
  });
  if (!res.ok) throw new Error(`upsert users row: ${await res.text()}`);
}

(async () => {
  console.log(`Seeding admin on ${SUPABASE_URL}`);
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}\n`);

  const existing = await findUserByEmail(email);
  const userId = existing ? existing.id : await createAuthUser(email, password);
  console.log(existing ? `Found existing auth user: ${userId}` : `Created auth user: ${userId}`);

  const roleId = await getAdminRoleId();
  console.log(`Admin role id: ${roleId}`);

  await upsertUserRow(userId, email, roleId);
  console.log(`\nDone. Log in at http://admin.localhost:3000/login`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
