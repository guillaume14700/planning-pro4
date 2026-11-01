import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, modules, settings, missions, leaves, checklists, fuelLogs, sessions, notificationReads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, hashCode, randomCode, killUserSessions } from "@/lib/auth";
import { audit, broadcast, getSettings } from "@/lib/server";
import { MODULE_MAP } from "@/lib/modules";

export const dynamic = "force-dynamic";

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const code = randomCode();
    const clash = await db.select().from(users).where(eq(users.codeHash, hashCode(code))).limit(1);
    if (clash.length === 0) return code;
  }
  throw new Error("Impossible de générer un code unique");
}

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
  if (me.role !== "admin") return Response.json({ error: "Réservé à l'administrateur principal." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, any>;
  const action = String(body.action ?? "");

  if (action === "create-user") {
    const name = String(body.name ?? "").trim();
    if (!name) return Response.json({ error: "Nom obligatoire." }, { status: 400 });
    const code = await uniqueCode();
    const [u] = await db.insert(users).values({
      name,
      role: "user",
      job: String(body.job ?? "Chauffeur PL"),
      phone: String(body.phone ?? ""),
      color: String(body.color ?? "#0E7490"),
      codeHash: hashCode(code),
    }).returning();
    await audit("Utilisateur créé", `${name} (${u!.job})`, me);
    await broadcast("systeme", "👤 Nouvel utilisateur", `${name} (${u!.job}) a rejoint l'application.`, me);
    return Response.json({ user: u, code });
  }

  if (action === "update-user") {
    const id = Number(body.id);
    const patch: Record<string, unknown> = {};
    for (const k of ["name", "job", "phone", "color"]) if (body[k] !== undefined) patch[k] = String(body[k]);
    await db.update(users).set(patch).where(eq(users.id, id));
    await audit("Utilisateur modifié", `#${id} ${body.name ?? ""}`, me);
    return Response.json({ ok: true });
  }

  if (action === "reset-code") {
    const id = Number(body.id);
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!u) return Response.json({ error: "Introuvable" }, { status: 404 });
    const code = await uniqueCode();
    await db.update(users).set({ codeHash: hashCode(code) }).where(eq(users.id, id));
    await killUserSessions(id);
    await audit("Code réinitialisé", `Nouveau code pour ${u.name}`, me);
    return Response.json({ code });
  }

  if (action === "set-active") {
    const id = Number(body.id);
    if (id === me.id) return Response.json({ error: "Vous ne pouvez pas bloquer votre propre accès." }, { status: 400 });
    const active = Boolean(body.active);
    await db.update(users).set({ active }).where(eq(users.id, id));
    if (!active) await killUserSessions(id);
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    await audit(active ? "Accès rétabli" : "Accès interdit", u?.name ?? `#${id}`, me);
    if (!active) await broadcast("systeme", "🔒 Accès suspendu", `L'accès de ${u?.name ?? "un utilisateur"} a été suspendu par l'administrateur.`, me);
    return Response.json({ ok: true });
  }

  if (action === "delete-user") {
    const id = Number(body.id);
    if (id === me.id) return Response.json({ error: "Impossible de supprimer le compte administrateur principal." }, { status: 400 });
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    await db.delete(missions).where(eq(missions.driverId, id));
    await db.delete(leaves).where(eq(leaves.userId, id));
    await db.delete(checklists).where(eq(checklists.userId, id));
    await db.delete(fuelLogs).where(eq(fuelLogs.userId, id));
    await db.delete(sessions).where(eq(sessions.userId, id));
    await db.delete(notificationReads).where(eq(notificationReads.userId, id));
    await db.delete(users).where(eq(users.id, id));
    await audit("Utilisateur supprimé", u?.name ?? `#${id}`, me);
    await broadcast("systeme", "👤 Utilisateur retiré", `${u?.name ?? "Un utilisateur"} a été retiré de l'application (ses missions ont été supprimées du planning).`, me);
    return Response.json({ ok: true });
  }

  if (action === "toggle-module") {
    const key = String(body.key ?? "");
    const def = MODULE_MAP[key];
    if (!def) return Response.json({ error: "Module inconnu" }, { status: 404 });
    if (def.locked) return Response.json({ error: "Module cœur non désactivable." }, { status: 400 });
    const enabled = Boolean(body.enabled);
    await db.insert(modules).values({ key, enabled }).onConflictDoUpdate({ target: modules.key, set: { enabled } });
    await audit(`Module ${enabled ? "activé" : "désactivé"}`, def.label, me);
    await broadcast("systeme", `🧩 Module ${enabled ? "activé" : "désactivé"} : ${def.label}`, enabled ? `« ${def.label} » est désormais visible par tous les utilisateurs.` : `« ${def.label} » n'est plus visible par les utilisateurs.`, me);
    return Response.json({ ok: true });
  }

  if (action === "save-settings") {
    const cur = await getSettings();
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["appName", "companyName", "logoData", "primaryColor", "accentColor", "depotName", "depotAddress"]) {
      if (body[k] !== undefined) patch[k] = String(body[k]);
    }
    for (const k of ["depotLat", "depotLng"]) {
      if (body[k] !== undefined && body[k] !== "") patch[k] = Number(body[k]);
    }
    if (String(patch.logoData ?? "").length > 700_000)
      return Response.json({ error: "Logo trop lourd (max ~500 Ko). Réduisez l'image." }, { status: 400 });
    await db.update(settings).set(patch).where(eq(settings.id, 1));
    await audit("Personnalisation", "Paramètres de l'application mis à jour", me);
    const visualChanged = ["appName", "companyName", "logoData", "primaryColor", "accentColor"].some(
      (k) => patch[k] !== undefined && String(patch[k]) !== String((cur as Record<string, unknown>)[k])
    );
    if (visualChanged) await broadcast("systeme", "🎨 Application personnalisée", "L'administrateur a mis à jour l'identité visuelle de l'application.", me);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 });
}