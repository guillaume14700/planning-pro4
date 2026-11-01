import { NextRequest } from "next/server";
import { getTableColumns } from "drizzle-orm";
import { and, asc, desc, eq, gte, lte, SQL } from "drizzle-orm";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { RESOURCES, afterChange } from "@/lib/resources";
import { toMin } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string }> };

function pickBody(table: any, body: Record<string, unknown>, immutable: string[] = []): Record<string, unknown> {
  const cols = getTableColumns(table);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(cols)) {
    if (key === "id" || immutable.includes(key)) continue;
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const { resource } = await ctx.params;
  const cfg = RESOURCES[resource];
  if (!cfg) return Response.json({ error: "Ressource inconnue" }, { status: 404 });
  if (cfg.adminRead && me.role !== "admin") return Response.json({ error: "Réservé à l'administrateur." }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const conds: SQL[] = [];
  const cols = getTableColumns(cfg.table);
  for (const f of cfg.filters ?? []) {
    const v = sp.get(f);
    if (v != null && v !== "" && cols[f]) conds.push(eq(cols[f], isNaN(Number(v)) ? v : Number(v)));
  }
  if (cfg.dateField && cols[cfg.dateField]) {
    const from = sp.get("from");
    const to = sp.get("to");
    if (from) conds.push(gte(cols[cfg.dateField], from));
    if (to) conds.push(lte(cols[cfg.dateField], to));
  }

  let q = db.select().from(cfg.table).$dynamic();
  if (conds.length) q = q.where(and(...conds));
  q = cfg.dateField && cols[cfg.dateField]
    ? q.orderBy(asc(cols[cfg.dateField]), asc(cols.id))
    : q.orderBy(desc(cols.id));
  const rows = await q.limit(600);
  return Response.json(rows);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const { resource } = await ctx.params;
  const cfg = RESOURCES[resource];
  if (!cfg) return Response.json({ error: "Ressource inconnue" }, { status: 404 });
  if (cfg.create === "admin" && me.role !== "admin")
    return Response.json({ error: "Seul l'administrateur principal peut faire cette action." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = pickBody(cfg.table, body, cfg.immutable);

  if (resource === "missions") {
    if (!payload.date || !payload.startTime || !payload.endTime || !payload.driverId || !payload.chantierId || !payload.vehicleId)
      return Response.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    if (toMin(String(payload.endTime)) <= toMin(String(payload.startTime)))
      return Response.json({ error: "L'heure de fin doit être après l'heure de début." }, { status: 400 });
    payload.createdBy = me.id;
    payload.updatedAt = new Date();
  }
  if (resource === "alerts") {
    payload.createdBy = me.id;
    payload.createdByName = me.name;
    payload.status = "active";
    if (!payload.vehicleId) return Response.json({ error: "Choisissez le véhicule concerné." }, { status: 400 });
  }
  if (["fuel", "checklists", "leaves"].includes(resource)) {
    if (!(me.role === "admin" && body.userId)) payload[cfg.ownerField ?? "userId"] = me.id;
  }

  const inserted = (await db.insert(cfg.table).values(payload as never).returning()) as Record<string, unknown>[];
  const row = inserted[0];
  await afterChange(resource, "create", null, row ?? {}, me);
  return Response.json(row);
}