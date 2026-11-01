import { db } from "@/db";
import {
  missions, chantiers, vehicles, alerts, contacts, maintenance,
  fuelLogs, checklists, leaves, users, auditLog,
} from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { broadcast, audit } from "./server";
import type { SessionUser } from "./auth";
import { fmtFr, fmtDateTime, VEHICLE_TYPES } from "./utils";

type Row = Record<string, unknown>;

export type ResourceConfig = {
  table: any; // table Drizzle
  label: string;
  create: "admin" | "auth";
  mutate: "admin" | "ownerOrAdmin";
  ownerField?: string;
  dateField?: string;
  filters?: string[];
  immutable?: string[];
  adminRead?: boolean;
};

export const RESOURCES: Record<string, ResourceConfig> = {
  // Les utilisateurs peuvent créer des missions et gérer celles qu'ils ont créées ;
  // l'administrateur principal garde le contrôle de tout.
  missions: { table: missions, label: "Mission", create: "auth", mutate: "ownerOrAdmin", ownerField: "createdBy", dateField: "date", filters: ["driverId", "chantierId", "vehicleId", "date"], immutable: ["createdBy", "createdAt"] },
  chantiers: { table: chantiers, label: "Chantier", create: "admin", mutate: "admin", immutable: ["createdAt"] },
  vehicles: { table: vehicles, label: "Véhicule", create: "admin", mutate: "admin", immutable: ["createdAt"] },
  alerts: { table: alerts, label: "Alerte panne", create: "auth", mutate: "ownerOrAdmin", ownerField: "createdBy", filters: ["status", "vehicleId"], immutable: ["createdBy", "createdByName", "createdAt"] },
  contacts: { table: contacts, label: "Contact", create: "admin", mutate: "admin" },
  maintenance: { table: maintenance, label: "Entretien", create: "admin", mutate: "admin", dateField: "date", filters: ["vehicleId"] },
  fuel: { table: fuelLogs, label: "Plein carburant", create: "auth", mutate: "ownerOrAdmin", ownerField: "userId", dateField: "date", filters: ["vehicleId", "userId"] },
  checklists: { table: checklists, label: "Checklist", create: "auth", mutate: "ownerOrAdmin", ownerField: "userId", dateField: "date", filters: ["userId", "vehicleId", "date"], immutable: ["createdAt"] },
  leaves: { table: leaves, label: "Absence", create: "auth", mutate: "admin", ownerField: "userId", filters: ["userId", "status"], immutable: ["createdAt"] },
  audit: { table: auditLog, label: "Journal", create: "admin", mutate: "admin", filters: ["action", "userId"], adminRead: true },
};

async function missionLabel(m: Row): Promise<string> {
  const [d] = await db.select().from(users).where(eq(users.id, Number(m.driverId))).limit(1);
  const [c] = await db.select().from(chantiers).where(eq(chantiers.id, Number(m.chantierId))).limit(1);
  return `${d?.name ?? "Chauffeur"} → ${c?.name ?? "Chantier"} le ${fmtFr(String(m.date))} de ${m.startTime} à ${m.endTime}`;
}

function diffMissions(before: Row, after: Row): string {
  const parts: string[] = [];
  const fields: Array<[string, string]> = [
    ["date", "date"], ["startTime", "début"], ["endTime", "fin"],
    ["driverId", "chauffeur"], ["chantierId", "chantier"], ["vehicleId", "véhicule"],
    ["task", "tâche"], ["notes", "consignes"],
  ];
  for (const [k, lbl] of fields) {
    if (after[k] !== undefined && String(after[k]) !== String(before[k])) {
      if (k === "date") parts.push(`date : ${fmtFr(String(before[k]))} → ${fmtFr(String(after[k]))}`);
      else parts.push(`${lbl} : ${before[k]} → ${after[k]}`);
    }
  }
  return parts.length ? parts.join(", ") : "détails mis à jour";
}

/** Hooks : notifications automatiques + effets métier après chaque écriture. */
export async function afterChange(
  resource: string,
  action: "create" | "update" | "delete",
  before: Row | null,
  after: Row | null,
  session: SessionUser
): Promise<void> {
  const row = (after ?? before ?? {}) as Row;

  if (resource === "missions") {
    if (action === "create" && after) {
      await broadcast("planning", "📅 Nouvelle mission au planning", await missionLabel(after), session);
      await audit("Planning : ajout", await missionLabel(after), session);
    } else if (action === "update" && after && before) {
      const changes = diffMissions(before, { ...before, ...after });
      await broadcast("planning", "✏️ Planning modifié", `${await missionLabel({ ...before, ...after })} — ${changes} (par ${session.name})`, session);
      await audit("Planning : modification", changes, session);
    } else if (action === "delete" && before) {
      await broadcast("planning", "🗑️ Mission annulée", `${await missionLabel(before)} — annulée par ${session.name}`, session);
      await audit("Planning : suppression", await missionLabel(before), session);
    }
    return;
  }

  if (resource === "alerts") {
    const [v] = await db.select().from(vehicles).where(eq(vehicles.id, Number(row.vehicleId))).limit(1);
    const vName = v ? `${v.name} (${v.plate})` : "Véhicule";
    if (action === "create") {
      await db.update(vehicles).set({ status: "panne" }).where(eq(vehicles.id, Number(row.vehicleId)));
      const kinds: Record<string, string> = { moteur: "Panne moteur", crevaison: "Crevaison", hydraulique: "Panne hydraulique", electrique: "Panne électrique", autre: "Panne" };
      const sev = row.severity === "immobilise" ? "VÉHICULE IMMOBILISÉ" : "véhicule dégradé, roule au ralenti";
      await broadcast("panne", `🚨 ALERTE PANNE — ${vName}`, `${kinds[String(row.kind)] ?? "Panne"} : ${row.message || "sans détail"}. ${sev}. Signalé par ${session.name}${row.location ? ` — Lieu : ${row.location}` : ""} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`, session);
      await audit("Alerte panne déclenchée", `${vName} — ${row.kind}`, session);
    } else if (action === "update" && String(row.status) === "resolue" && before?.status !== "resolue") {
      await db.update(alerts).set({ resolvedAt: new Date(), resolvedByName: session.name }).where(eq(alerts.id, Number(row.id)));
      const others = await db.select().from(alerts).where(and(eq(alerts.vehicleId, Number(row.vehicleId)), eq(alerts.status, "active"), ne(alerts.id, Number(row.id))));
      if (others.length === 0) await db.update(vehicles).set({ status: "disponible" }).where(eq(vehicles.id, Number(row.vehicleId)));
      await broadcast("panne", `✅ Panne résolue — ${vName}`, `Le véhicule est de nouveau opérationnel. Résolu par ${session.name}.`, session);
      await audit("Alerte panne résolue", vName, session);
    }
    return;
  }

  if (resource === "leaves") {
    const [u] = await db.select().from(users).where(eq(users.id, Number(row.userId))).limit(1);
    const who = u?.name ?? "Un utilisateur";
    if (action === "create") {
      await broadcast("conges", "🏖️ Demande d'absence", `${who} demande une absence (${row.kind}) du ${fmtFr(String(row.startDate))} au ${fmtFr(String(row.endDate))}. À valider par l'administrateur.`, session);
      await audit("Absence : demande", `${who} ${row.startDate} → ${row.endDate}`, session);
    } else if (action === "update" && row.status && before?.status !== row.status) {
      const ok = row.status === "valide";
      await db.update(leaves).set({ decidedByName: session.name }).where(eq(leaves.id, Number(row.id)));
      await broadcast("conges", ok ? "✅ Absence validée" : "❌ Absence refusée", `${who} : ${row.kind} du ${fmtFr(String(row.startDate))} au ${fmtFr(String(row.endDate))} — ${ok ? "validée" : "refusée"} par ${session.name}. Pensez à ajuster le planning.`, session);
      await audit("Absence : décision", `${who} — ${row.status}`, session);
    }
    return;
  }

  if (resource === "checklists" && action === "create") {
    const items = (row.items ?? {}) as Record<string, boolean>;
    const failed = Object.entries(items).filter(([, v]) => !v).map(([k]) => k);
    const [v] = await db.select().from(vehicles).where(eq(vehicles.id, Number(row.vehicleId))).limit(1);
    if (failed.length > 0) {
      await broadcast("systeme", `⚠️ Anomalie checklist départ — ${v?.name ?? "véhicule"}`, `${session.name} signale : ${failed.join(", ")}. Vérifier avant départ.`, session);
    }
    await audit("Checklist départ", `${v?.name ?? ""} — ${failed.length ? failed.length + " anomalie(s)" : "conforme"}`, session);
    return;
  }

  const cfg = RESOURCES[resource];
  const name = String(row.name ?? row.kind ?? row.date ?? `#${row.id ?? ""}`);
  await audit(`${cfg?.label ?? resource} : ${action === "create" ? "ajout" : action === "update" ? "modification" : "suppression"}`, name, session);

  if (resource === "vehicles" && action === "update" && row.status && before?.status !== row.status) {
    const label = String(row.status) === "disponible" ? "de nouveau disponible" : String(row.status) === "entretien" ? "immobilisé pour entretien" : "en panne";
    await broadcast("systeme", `🚚 Véhicule ${label} — ${name}`, `${VEHICLE_TYPES[String(row.type)] ?? "Véhicule"} ${row.plate ?? ""} — statut mis à jour par ${session.name}.`, session);
  }
}

export { fmtDateTime };