#!/usr/bin/env node
/**
 * Create or reset a SupervisorOperator (production login uses DB, not env vars).
 *
 * Usage:
 *   node scripts/seed-supervisor-operator.mjs
 *
 * Env (from .env):
 *   SUPERVISOR_USERNAME, SUPERVISOR_PASSWORD
 * Optional:
 *   SUPERVISOR_OPERATOR_NAME (display name, default: Supervisor)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

function loadDotEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional .env
  }
}

loadDotEnv();

const username = (process.env.SUPERVISOR_USERNAME ?? "").trim().toLowerCase();
const password = process.env.SUPERVISOR_PASSWORD ?? "";
const name = (process.env.SUPERVISOR_OPERATOR_NAME ?? "Supervisor").trim();

if (!username || !password) {
  console.error("Set SUPERVISOR_USERNAME and SUPERVISOR_PASSWORD in .env");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const row = await prisma.supervisorOperator.upsert({
    where: { username },
    create: { username, name, passwordHash, active: true },
    update: { name, passwordHash, active: true },
  });
  console.log(`Supervisor operator ready: ${row.username} (${row.name})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
