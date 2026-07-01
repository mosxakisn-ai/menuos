import bcrypt from "bcryptjs";
import { prisma } from "@menuos/db";

export type SupervisorOperatorRow = {
  id: string;
  username: string;
  name: string;
  active: boolean;
  createdAt: string;
};

export async function listSupervisorOperators(): Promise<SupervisorOperatorRow[]> {
  const rows = await prisma.supervisorOperator.findMany({
    select: { id: true, username: true, name: true, active: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    name: row.name,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function addSupervisorOperator(input: {
  username: string;
  name: string;
  password: string;
}): Promise<SupervisorOperatorRow> {
  const username = input.username.trim().toLowerCase();
  if (envSupervisorUsername() === username) throw new Error("username_reserved");

  const existing = await prisma.supervisorOperator.findUnique({ where: { username } });
  if (existing) throw new Error("username_taken");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const row = await prisma.supervisorOperator.create({
    data: {
      username,
      name: input.name.trim(),
      passwordHash,
    },
    select: { id: true, username: true, name: true, active: true, createdAt: true },
  });

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function updateSupervisorOperator(
  id: string,
  patch: { password?: string; active?: boolean; name?: string },
): Promise<SupervisorOperatorRow> {
  const existing = await prisma.supervisorOperator.findUnique({ where: { id } });
  if (!existing) throw new Error("not_found");

  const data: { passwordHash?: string; active?: boolean; name?: string } = {};
  if (patch.password) data.passwordHash = await bcrypt.hash(patch.password, 12);
  if (patch.active !== undefined) data.active = patch.active;
  if (patch.name !== undefined) data.name = patch.name.trim();

  const row = await prisma.supervisorOperator.update({
    where: { id },
    data,
    select: { id: true, username: true, name: true, active: true, createdAt: true },
  });

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function findSupervisorOperatorByUsername(username: string) {
  return prisma.supervisorOperator.findUnique({
    where: { username: username.trim().toLowerCase() },
    select: { id: true, username: true, name: true, active: true, passwordHash: true, createdAt: true },
  });
}

export async function findSupervisorOperatorById(id: string) {
  return prisma.supervisorOperator.findUnique({
    where: { id },
    select: { id: true, username: true, name: true, active: true, createdAt: true },
  });
}

export async function verifySupervisorOperatorPassword(
  username: string,
  password: string,
): Promise<boolean> {
  const row = await findSupervisorOperatorByUsername(username);
  if (!row?.active) return false;
  return bcrypt.compare(password, row.passwordHash);
}

/** DB-backed operators must stay active; env-only usernames pass without a row in dev only. */
export async function isSupervisorOperatorSessionAllowed(username: string): Promise<boolean> {
  const normalized = username.trim().toLowerCase();
  const row = await findSupervisorOperatorByUsername(normalized);
  if (!row) {
    if (process.env.NODE_ENV === "production") return false;
    const envUser = process.env.SUPERVISOR_USERNAME?.trim().toLowerCase();
    return Boolean(envUser && envUser === normalized);
  }
  return row.active;
}

export function envSupervisorUsername(): string | null {
  const value = process.env.SUPERVISOR_USERNAME?.trim();
  return value ? value.toLowerCase() : null;
}

/** Usernames never shown in /supervisor/users (owner / stealth ops accounts). */
export function supervisorHiddenUsernames(): Set<string> {
  const hidden = new Set<string>();
  const fromEnv = process.env.SUPERVISOR_HIDDEN_USERNAMES?.trim();
  if (fromEnv) {
    for (const part of fromEnv.split(",")) {
      const u = part.trim().toLowerCase();
      if (u) hidden.add(u);
    }
  }
  const owner = envSupervisorUsername();
  if (owner) hidden.add(owner);
  return hidden;
}

export function isSupervisorHiddenUsername(username: string): boolean {
  return supervisorHiddenUsernames().has(username.trim().toLowerCase());
}

export function listVisibleSupervisorOperators(
  operators: SupervisorOperatorRow[],
): SupervisorOperatorRow[] {
  const hidden = supervisorHiddenUsernames();
  if (hidden.size === 0) return operators;
  return operators.filter((op) => !hidden.has(op.username));
}

export async function changeSupervisorOperatorOwnPassword(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const row = await findSupervisorOperatorByUsername(username);
  if (!row) throw new Error("env_only");
  if (!row.active) throw new Error("inactive");

  const valid = await bcrypt.compare(currentPassword, row.passwordHash);
  if (!valid) throw new Error("wrong_password");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.supervisorOperator.update({
    where: { id: row.id },
    data: { passwordHash },
  });
}
