import { NextRequest } from "next/server";
import { db } from "@/db";
import { chantiers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { broadcast, audit } from "@/lib/server";

export const dynamic = "force-dynamic";

const PALETTE = ["#F26A1B", "#0E7490", "#4D7C0F", "#B91C1C", "#7C3AED", "#0F766E", "#B45309", "#1D4ED8", "#BE185D", "#525252"];

type Row = {
  name?: string; client?: string; address?: string; contactName?: string; contactPhone?: string;
  distanceKm?: number | string; travelMin?: number | string; notes?: string;
};

/** Import en masse de chantiers (CSV préparé sur PC) — réservé à l'administrateur. */
export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Réservé à l'administrateur principal." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { rows?: Row[] };
  const rows = (Array.isArray(body.rows) ? body.rows : []).slice(0, 500);
  if (rows.length === 0) return Response.json({ error: "Aucune ligne à importer dans le fichier." }, { status: 400 });

  const existing = await db.select({ name: chantiers.name }).from(chantiers);
  const have = new Set(existing.map((e) => e.name.trim().toLowerCase()));

  let imported = 0;
  let colorIdx = existing.length;
  const duplicates: string[] = [];
  const errors: { line: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] ?? {};
    const name = String(r.name ?? "").trim();
    if (!name) { errors.push({ line: i + 1, reason: "nom manquant" }); continue; }
    if (name.length > 120) { errors.push({ line: i + 1, reason: "nom trop long" }); continue; }
    if (have.has(name.toLowerCase())) { duplicates.push(name); continue; }
    have.add(name.toLowerCase());
    const km = Number(String(r.distanceKm ?? "0").replace(",", ".")) || 0;
    const min = Math.round(Number(String(r.travelMin ?? "0").replace(",", ".")) || 0);
    await db.insert(chantiers).values({
      name,
      client: String(r.client ?? "").slice(0, 200),
      address: String(r.address ?? "").slice(0, 300),
      contactName: String(r.contactName ?? "").slice(0, 120),
      contactPhone: String(r.contactPhone ?? "").slice(0, 40),
      distanceKm: Math.max(0, Math.min(2000, km)),
      travelMin: Math.max(0, Math.min(600, min)),
      notes: String(r.notes ?? "").slice(0, 1000),
      color: PALETTE[colorIdx++ % PALETTE.length]!,
    });
    imported++;
  }

  if (imported > 0) {
    await broadcast(
      "systeme",
      "📥 Nouveaux chantiers importés",
      `${imported} chantier(s) ajouté(s) par ${me.name}.${duplicates.length ? ` ${duplicates.length} doublon(s) ignoré(s).` : ""} Consultez le module Chantiers (cartes et distances calculables en un clic).`,
      me
    );
    await audit("Import chantiers", `${imported} ajoutés · ${duplicates.length} doublons · ${errors.length} erreurs`, me);
  }

  return Response.json({ imported, duplicates, errors });
}
