import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { sessions, users } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";

export const COOKIE = "pl_session";

export type SessionUser = {
  id: number;
  name: string;
  role: string;
  job: string;
  color: string;
  phone: string;
  active: boolean;
};

export function hashCode(code: string): string {
  return createHash("sha256").update(`planning-pl::${code.trim()}`).digest("hex");
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    await ensureBootstrap();
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const rows = await db
      .select({ s: sessions, u: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    const row = rows[0];
    if (!row || !row.u.active) return null;
    const { id, name, role, job, color, phone, active } = row.u;
    return { id, name, role, job, color, phone, active };
  } catch {
    return null;
  }
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  store.delete(COOKIE);
}

export async function killUserSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function randomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}