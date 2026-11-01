import { NextRequest } from "next/server";
import { getTableColumns, eq } from "drizzle-orm";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { RESOURCES, afterChange } from "@/lib/resources";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const { resource, id } = await ctx.params;
  const cfg = RESOURCES[resource];
  if (!cfg) return Response.json({ error: "Ressource inconnue" }, { status: 404 });

  const cols = getTableColumns(cfg.table);
  const [before] = await db.select().from(cfg.table).where(eq(cols.id, Number(id))).limit(1);
  if (!before) return Response.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = cfg.ownerField ? (before as Record<string, unknown>)[cfg.ownerField] === me.id : false;
  if (me.role !== "admin" && !(cfg.mutate === "ownerOrAdmin" && isOwner))
    return Response.json({ error: "Action réservée à l'administrateur principal." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  for (const key of Object.keys(cols)) {
    if (key === "id" || (cfg.immutable ?? []).includes(key)) continue;
    if (body[key] !== undefined) payload[key] = body[key];
  }
  if (resource === "missions") payload.updatedAt = new Date();
  if (resource === "alerts" && me.role !== "admin" && payload.status && payload.status !== "resolue")
    return Response.json({ error: "Action non autorisée." }, { status: 403 });

  const updated = (await db.update(cfg.table).set(payload as never).where(eq(cols.id, Number(id))).returning()) as Record<string, unknown>[];
  const row = updated[0];
  await afterChange(resource, "update", before as Record<string, unknown>, row ?? {}, me);
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const { resource, id } = await ctx.params;
  const cfg = RESOURCES[resource];
  if (!cfg) return Response.json({ error: "Ressource inconnue" }, { status: 404 });

  const cols = getTableColumns(cfg.table);
  const [before] = await db.select().from(cfg.table).where(eq(cols.id, Number(id))).limit(1);
  if (!before) return Response.json({ error: "Introuvable" }, { status: 404 });

  const isOwner = cfg.ownerField ? (before as Record<string, unknown>)[cfg.ownerField] === me.id : false;
  if (me.role !== "admin" && !(cfg.mutate === "ownerOrAdmin" && isOwner))
    return Response.json({ error: "Action réservée à l'administrateur principal." }, { status: 403 });

  await db.delete(cfg.table).where(eq(cols.id, Number(id)));
  await afterChange(resource, "delete", before as Record<string, unknown>, null, me);
  return Response.json({ ok: true });
}