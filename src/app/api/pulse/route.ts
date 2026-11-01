import { db } from "@/db";
import { alerts, notifications, notificationReads, vehicles } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { versionStamp } from "@/lib/server";

export const dynamic = "force-dynamic";

/** Sondage léger (toutes les ~20 s côté client) : alertes actives, non-lus, dernier message. */
export async function GET() {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });

  const [unreadRow] = await db
    .select({ n: sql<number>`(select count(*) from ${notifications}) - (select count(*) from ${notificationReads} where ${notificationReads.userId} = ${me.id})` })
    .from(sql`(select 1) as t`);

  const active = await db
    .select({ a: alerts, vehicleName: vehicles.name, vehiclePlate: vehicles.plate })
    .from(alerts)
    .leftJoin(vehicles, eq(vehicles.id, alerts.vehicleId))
    .where(eq(alerts.status, "active"))
    .orderBy(desc(alerts.createdAt));

  const [last] = await db.select().from(notifications).orderBy(desc(notifications.id)).limit(1);
  const version = await versionStamp();

  return Response.json({
    unread: Math.max(0, Number(unreadRow?.n ?? 0)),
    activeAlerts: active.map((r) => ({ ...r.a, vehicleName: r.vehicleName ?? "Véhicule", vehiclePlate: r.vehiclePlate ?? "" })),
    lastNotif: last ?? null,
    version,
  });
}