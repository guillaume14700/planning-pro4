import { NextRequest } from "next/server";
import { db } from "@/db";
import { notifications, notificationReads } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const rows = await db
    .select({ n: notifications, readId: notificationReads.id })
    .from(notifications)
    .leftJoin(notificationReads, and(eq(notificationReads.notificationId, notifications.id), eq(notificationReads.userId, me.id)))
    .orderBy(desc(notifications.id))
    .limit(80);
  return Response.json(rows.map((r) => ({ ...r.n, read: r.readId != null })));
}

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { all?: boolean; ids?: number[] };

  let ids: number[] = body.ids ?? [];
  if (body.all) {
    const all = await db.select({ id: notifications.id }).from(notifications);
    ids = all.map((n) => n.id);
  }
  if (ids.length === 0) return Response.json({ ok: true });
  const existing = await db
    .select({ nid: notificationReads.notificationId })
    .from(notificationReads)
    .where(and(eq(notificationReads.userId, me.id), inArray(notificationReads.notificationId, ids)));
  const have = new Set(existing.map((e) => e.nid));
  const toInsert = ids.filter((id) => !have.has(id)).map((notificationId) => ({ notificationId, userId: me.id }));
  if (toInsert.length) await db.insert(notificationReads).values(toInsert);
  return Response.json({ ok: true });
}