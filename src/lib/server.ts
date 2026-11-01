import { db } from "@/db";
import { ensureBootstrap } from "@/db/bootstrap";
import { settings, modules, notifications, auditLog, users, chantiers, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { MODULES, DEFAULT_DISABLED } from "./modules";
import type { SessionUser } from "./auth";

export type Settings = typeof settings.$inferSelect;

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  appName: "PLanning Pro",
  companyName: "Transports & Levage",
  logoData: "",
  primaryColor: "#F26A1B",
  accentColor: "#FFC400",
  depotName: "Dépôt principal — Corbas",
  depotAddress: "12 rue des Poids Lourds, 69960 Corbas",
  depotLat: 45.6675,
  depotLng: 4.9014,
  updatedAt: new Date(0),
};

export async function getSettings(): Promise<Settings> {
  await ensureBootstrap();
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (rows[0]) return rows[0];
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
  return { ...DEFAULT_SETTINGS, updatedAt: new Date() };
}

export async function getSettingsSafe(): Promise<Settings> {
  try {
    return await getSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getModulesState(): Promise<Record<string, boolean>> {
  const rows = await db.select().from(modules);
  const map: Record<string, boolean> = {};
  for (const m of MODULES) map[m.key] = m.locked ? true : !DEFAULT_DISABLED.includes(m.key);
  for (const r of rows) map[r.key] = r.enabled;
  for (const m of MODULES) if (m.locked) map[m.key] = true;
  return map;
}

export async function versionStamp(): Promise<string> {
  const s = await getSettingsSafe();
  let extra = "";
  try {
    const map = await getModulesState();
    const mods = Object.entries(map).map(([k, v]) => `${k}:${v ? 1 : 0}`).join("|");
    const us = await db.select({ id: users.id, name: users.name, active: users.active, color: users.color }).from(users);
    const cs = await db.select({ id: chantiers.id, name: chantiers.name, active: chantiers.active, travelMin: chantiers.travelMin, distanceKm: chantiers.distanceKm }).from(chantiers);
    const vs = await db.select({ id: vehicles.id, status: vehicles.status, name: vehicles.name }).from(vehicles);
    extra = [
      mods,
      us.map((u) => `${u.id}.${u.active ? 1 : 0}.${u.name}.${u.color}`).join(","),
      cs.map((c) => `${c.id}.${c.active ? 1 : 0}.${c.name}.${c.travelMin}.${c.distanceKm}`).join(","),
      vs.map((v) => `${v.id}.${v.status}.${v.name}`).join(","),
    ].join("#");
  } catch { /* db pas encore prête */ }
  return `${s.updatedAt?.getTime?.() ?? 0}#${extra}`;
}

/** Diffuse un message à TOUS les utilisateurs. */
export async function broadcast(
  type: "planning" | "panne" | "conges" | "systeme",
  title: string,
  body: string,
  by?: SessionUser | null
) {
  await db.insert(notifications).values({
    type,
    title,
    body,
    createdBy: by?.id ?? 0,
    createdByName: by?.name ?? "Système",
  });
}

export async function audit(action: string, details: string, by?: SessionUser | null) {
  try {
    await db.insert(auditLog).values({
      userId: by?.id ?? 0,
      userName: by?.name ?? "Système",
      action,
      details,
    });
  } catch { /* non bloquant */ }
}