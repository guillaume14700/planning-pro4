import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hashCode, createSession, destroySession, getSession } from "@/lib/auth";
import { audit } from "@/lib/server";
import { ensureBootstrap } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureBootstrap().catch(() => {});
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "login") {
    const code = String(body.code ?? "").trim();
    if (!/^\d{4,8}$/.test(code)) return Response.json({ error: "Code invalide (4 à 8 chiffres)." }, { status: 400 });
    const [user] = await db.select().from(users).where(and(eq(users.codeHash, hashCode(code)), eq(users.active, true))).limit(1);
    if (!user) return Response.json({ error: "Code incorrect ou accès désactivé par l'administrateur." }, { status: 401 });
    await createSession(user.id);
    await audit("Connexion", `${user.name} s'est connecté`, { ...user, active: user.active });
    return Response.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  }

  if (action === "logout") {
    await destroySession();
    return Response.json({ ok: true });
  }

  if (action === "change-code") {
    const me = await getSession();
    if (!me) return Response.json({ error: "Non connecté" }, { status: 401 });
    const current = String(body.current ?? "");
    const next = String(body.next ?? "");
    if (!/^\d{4,8}$/.test(next)) return Response.json({ error: "Le nouveau code doit contenir 4 à 8 chiffres." }, { status: 400 });
    const [row] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
    if (!row || row.codeHash !== hashCode(current)) return Response.json({ error: "Code actuel incorrect." }, { status: 400 });
    const clash = await db.select().from(users).where(eq(users.codeHash, hashCode(next)));
    if (clash.some((u) => u.id !== me.id)) return Response.json({ error: "Ce code est déjà utilisé par un autre utilisateur." }, { status: 400 });
    await db.update(users).set({ codeHash: hashCode(next) }).where(eq(users.id, me.id));
    await audit("Code d'accès modifié", `${me.name} a changé son code`, me);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 });
}