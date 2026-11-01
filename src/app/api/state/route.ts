import { db } from "@/db";
import { users, chantiers, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getSettings, getModulesState, versionStamp } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });

  const [st, mods, allUsers, cs, vs, version] = await Promise.all([
    getSettings(),
    getModulesState(),
    db.select({ id: users.id, name: users.name, role: users.role, job: users.job, phone: users.phone, color: users.color, active: users.active }).from(users),
    db.select().from(chantiers),
    db.select().from(vehicles),
    versionStamp(),
  ]);

  return Response.json({
    me,
    settings: st,
    modules: mods,
    users: me.role === "admin" ? allUsers : allUsers.filter((u) => u.active),
    chantiers: cs,
    vehicles: vs,
    version,
  });
}