"use client";

import { useEffect, useRef, useState } from "react";
import {
  Settings, Users, Puzzle, Palette, Warehouse, Plus, KeyRound, Ban, Trash2,
  Pencil, ShieldCheck, Unlock, Copy, CheckCircle2, Upload, Lock, Image as ImageIcon, Share2,
} from "lucide-react";
import { useApp, api, UserT, ModuleGate } from "@/components/app-provider";
import ShareTab from "@/components/share-tab";
import { Badge, Button, Card, Confirm, ErrorNote, Field, Input, Modal, PageHead, Select, Tabs, Toggle } from "@/components/ui";
import { MODULES } from "@/lib/modules";
import { PALETTE, initials } from "@/lib/utils";

const PRESETS = [
  { name: "Chantier (orange / jaune)", p: "#F26A1B", a: "#FFC400" },
  { name: "Levage (bleu / jaune)", p: "#1D4ED8", a: "#FACC15" },
  { name: "TP (vert / lime)", p: "#15803D", a: "#A3E635" },
  { name: "Secours (rouge / gris)", p: "#B91C1C", a: "#D1D5DB" },
  { name: "Nuit (cyan / ambre)", p: "#0E7490", a: "#F59E0B" },
];

export default function AdminPage() {
  return <ModuleGate k="admin"><Admin /></ModuleGate>;
}

function Admin() {
  const [tab, setTab] = useState("users");
  return (
    <div>
      <PageHead
        title="Administration" subtitle="Vous êtes l'administrateur principal : accès, modules, identité visuelle et dépôt."
        icon={<Settings size={22} />}
      />
      <Tabs
        tabs={[
          { key: "users", label: "Utilisateurs & accès", icon: <Users size={15} /> },
          { key: "modules", label: "Modules", icon: <Puzzle size={15} /> },
          { key: "branding", label: "Personnalisation", icon: <Palette size={15} /> },
          { key: "depot", label: "Entreprise & dépôt", icon: <Warehouse size={15} /> },
          { key: "share", label: "Partage & installation", icon: <Share2 size={15} /> },
        ]}
        active={tab} onChange={setTab}
      />
      {tab === "users" && <UsersTab />}
      {tab === "modules" && <ModulesTab />}
      {tab === "branding" && <BrandingTab />}
      {tab === "depot" && <DepotTab />}
      {tab === "share" && <ShareTab onGoUsers={() => setTab("users")} />}
    </div>
  );
}

/* ================= UTILISATEURS ================= */
function UsersTab() {
  const { me, users, refresh, toast } = useApp();
  const [modal, setModal] = useState<{ id?: number; name: string; job: string; phone: string; color: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeShown, setCodeShown] = useState<{ name: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "reset" | "block" | "unblock" | "delete"; user: UserT } | null>(null);

  async function save() {
    if (!modal) return;
    if (!modal.name.trim()) { setError("Nom obligatoire."); return; }
    setBusy(true); setError("");
    try {
      if (modal.id) {
        await api("/api/admin", "POST", { action: "update-user", ...modal });
        toast("Utilisateur modifié", "ok");
      } else {
        const res = await api<{ code: string }>("/api/admin", "POST", { action: "create-user", ...modal });
        setCodeShown({ name: modal.name, code: res.code });
      }
      setModal(null); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function doConfirm() {
    if (!confirm) return;
    const { kind, user } = confirm;
    try {
      if (kind === "reset") {
        const res = await api<{ code: string }>("/api/admin", "POST", { action: "reset-code", id: user.id });
        setCodeShown({ name: user.name, code: res.code });
        toast(`Code de ${user.name} réinitialisé`, "ok");
      } else if (kind === "block") {
        await api("/api/admin", "POST", { action: "set-active", id: user.id, active: false });
        toast(`Accès de ${user.name} interdit`, "ok");
      } else if (kind === "unblock") {
        await api("/api/admin", "POST", { action: "set-active", id: user.id, active: true });
        toast(`Accès de ${user.name} rétabli`, "ok");
      } else if (kind === "delete") {
        await api("/api/admin", "POST", { action: "delete-user", id: user.id });
        toast(`${user.name} supprimé`, "ok");
      }
      await refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-sm text-steel">Chaque utilisateur se connecte avec un <strong>code personnel</strong>. Vous seul pouvez réinitialiser les codes, interdire ou rétablir un accès.</p>
        <Button onClick={() => { setError(""); setModal({ name: "", job: "Chauffeur PL", phone: "", color: PALETTE[1]! }); }}><Plus size={16} /> Nouvel utilisateur</Button>
      </div>
      <Card className="overflow-x-auto anim-fade-up">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-left border-b border-gray-200 bg-gray-50">
              {["Utilisateur", "Fonction", "Téléphone", "Code d'accès", "Statut", "Actions"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-steel">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${!u.active ? "opacity-55" : ""}`}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-extrabold" style={{ background: u.color }}>{initials(u.name)}</span>
                    <span className="font-bold">{u.name} {u.id === me.id && <Badge color="coal">Vous</Badge>}</span>
                  </span>
                </td>
                <td className="px-4 py-3">{u.job} {u.role === "admin" && <Badge color="brand"><ShieldCheck size={10} /> Admin principal</Badge>}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.phone || "—"}</td>
                <td className="px-4 py-3">
                  <span className="font-mono tracking-widest text-steel">••••</span>
                  <button onClick={() => setConfirm({ kind: "reset", user: u })} className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline cursor-pointer">
                    <KeyRound size={12} /> Réinitialiser
                  </button>
                </td>
                <td className="px-4 py-3">{u.active ? <Badge color="green">Actif</Badge> : <Badge color="red"><Ban size={10} /> Interdit</Badge>}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setError(""); setModal({ id: u.id, name: u.name, job: u.job, phone: u.phone, color: u.color }); }} className="p-1.5 rounded hover:bg-gray-100 text-steel cursor-pointer" title="Modifier" aria-label="Modifier"><Pencil size={15} /></button>
                    {u.id !== me.id && (u.active ? (
                      <button onClick={() => setConfirm({ kind: "block", user: u })} className="p-1.5 rounded hover:bg-amber-50 text-steel hover:text-amber-600 cursor-pointer" title="Interdire l'accès" aria-label="Interdire l'accès"><Ban size={15} /></button>
                    ) : (
                      <button onClick={() => setConfirm({ kind: "unblock", user: u })} className="p-1.5 rounded hover:bg-green-50 text-steel hover:text-green-600 cursor-pointer" title="Rétablir l'accès" aria-label="Rétablir l'accès"><Unlock size={15} /></button>
                    ))}
                    {u.id !== me.id && (
                      <button onClick={() => setConfirm({ kind: "delete", user: u })} className="p-1.5 rounded hover:bg-red-50 text-steel hover:text-red-600 cursor-pointer" title="Supprimer" aria-label="Supprimer"><Trash2 size={15} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Création / édition */}
      <Modal open={modal != null} onClose={() => setModal(null)} title={modal?.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"} footer={
        <><Button variant="ghost" onClick={() => setModal(null)}>Annuler</Button><Button onClick={save} disabled={busy}>{busy ? "…" : modal?.id ? "Enregistrer" : "Créer & générer le code"}</Button></>
      }>
        {modal && (
          <div className="space-y-3">
            <Field label="Nom complet" required><Input value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} /></Field>
            <Field label="Fonction">
              <Select value={modal.job} onChange={(e) => setModal({ ...modal, job: e.target.value })}>
                {["Chauffeur PL", "Chauffeur PL benne", "Chauffeur SPL", "Grutier", "Conductrice PL / Camion-grue", "Chef d'équipe", "Exploitant", modal.job].filter((v, i, a) => a.indexOf(v) === i).map((j) => <option key={j}>{j}</option>)}
              </Select>
            </Field>
            <Field label="Téléphone"><Input type="tel" value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} /></Field>
            <Field label="Couleur (planning)">
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map((p) => (
                  <button key={p} type="button" onClick={() => setModal({ ...modal, color: p })} className={`w-8 h-8 rounded-md cursor-pointer transition-transform ${modal.color === p ? "ring-2 ring-offset-2 ring-coal scale-110" : "hover:scale-105"}`} style={{ background: p }} aria-label={`Couleur ${p}`} />
                ))}
              </div>
            </Field>
            {!modal.id && <p className="text-xs text-steel bg-gray-50 border border-gray-200 rounded px-3 py-2">🔑 Un code d'accès à 4 chiffres sera généré automatiquement — communiquez-le à l'utilisateur.</p>}
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </Modal>

      {/* Code généré */}
      <Modal open={codeShown != null} onClose={() => setCodeShown(null)} title="Code d'accès" footer={<Button onClick={() => setCodeShown(null)}>Fermer</Button>}>
        {codeShown && (
          <div className="text-center py-4">
            <p className="text-sm text-steel mb-3">Nouveau code pour <strong className="text-coal">{codeShown.name}</strong> — notez-le et transmettez-le :</p>
            <div className="inline-flex items-center gap-3 bg-coal text-accent font-mono text-5xl font-semibold tracking-[0.35em] px-8 py-5 rounded-lg pl-10">
              {codeShown.code}
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(codeShown.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />} {copied ? "Copié !" : "Copier le code"}
              </Button>
            </div>
            <p className="text-xs text-steel mt-4">L'utilisateur pourra changer ce code depuis son menu profil. Ses sessions ouvertes ont été déconnectées.</p>
          </div>
        )}
      </Modal>

      <Confirm
        open={confirm != null} onClose={() => setConfirm(null)} onConfirm={doConfirm}
        title={confirm?.kind === "reset" ? "Réinitialiser le code" : confirm?.kind === "block" ? "Interdire l'accès" : confirm?.kind === "unblock" ? "Rétablir l'accès" : "Supprimer l'utilisateur"}
        message={
          confirm?.kind === "reset" ? `Un nouveau code sera généré pour ${confirm?.user.name} et ses sessions seront fermées.` :
          confirm?.kind === "block" ? `${confirm?.user.name} ne pourra plus se connecter et sera déconnecté immédiatement. Vous pourrez rétablir l'accès à tout moment.` :
          confirm?.kind === "unblock" ? `${confirm?.user.name} pourra de nouveau se connecter avec son code.` :
          `Suppression définitive de ${confirm?.user.name}, de ses missions au planning et de ses données. L'équipe sera notifiée.`
        }
        confirmLabel={confirm?.kind === "reset" ? "Générer un nouveau code" : confirm?.kind === "block" ? "Interdire l'accès" : confirm?.kind === "unblock" ? "Rétablir" : "Supprimer définitivement"}
        danger={confirm?.kind === "block" || confirm?.kind === "delete"}
      />
    </div>
  );
}

/* ================= MODULES ================= */
function ModulesTab() {
  const { modules, refresh, toast } = useApp();
  const [busyKey, setBusyKey] = useState("");

  async function toggle(key: string, enabled: boolean) {
    setBusyKey(key);
    try {
      await api("/api/admin", "POST", { action: "toggle-module", key, enabled });
      toast(`Module ${enabled ? "activé" : "désactivé"} — utilisateurs notifiés`, "ok");
      await refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
    finally { setBusyKey(""); }
  }

  const groups = ["Exploitation", "Suivi & conformité", "Outils terrain", "Administration"] as const;
  const enabledCount = MODULES.filter((m) => modules[m.key] !== false).length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-steel">
        <strong className="text-coal">{enabledCount}/{MODULES.length} modules actifs.</strong> Vous seul pouvez activer / désactiver un module : les utilisateurs ne voient que ceux que vous activez. Chaque changement est notifié à l'équipe.
      </p>
      {groups.map((g) => (
        <div key={g}>
          <h3 className="font-display text-lg font-extrabold uppercase tracking-wide text-coal mb-2.5">{g}</h3>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {MODULES.filter((m) => m.group === g).map((m) => {
              const on = modules[m.key] !== false;
              return (
                <Card key={m.key} className={`p-4 flex gap-3 items-start transition-all ${on ? "" : "opacity-70 bg-gray-50"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{m.label}</p>
                      {m.locked && <Badge color="coal"><Lock size={9} /> Cœur</Badge>}
                      {m.adminOnly && <Badge color="amber"><ShieldCheck size={9} /> Admin seul</Badge>}
                    </div>
                    <p className="text-xs text-steel mt-1">{m.desc}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Toggle checked={on} disabled={m.locked || busyKey === m.key} onChange={(v) => toggle(m.key, v)} label={`Module ${m.label}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${on ? "text-green-600" : "text-steel"}`}>{on ? "Actif" : "Off"}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= PERSONNALISATION ================= */
function BrandingTab() {
  const { settings, refresh, toast } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm({ ...settings }); }, [settings]);

  function onFile(f: File | null) {
    if (!f) return;
    if (f.size > 500_000) { setError("Logo trop lourd (max 500 Ko). Choisissez une image plus petite."); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((s) => ({ ...s, logoData: String(reader.result ?? "") }));
    reader.readAsDataURL(f);
  }

  async function save() {
    setBusy(true); setError("");
    try {
      await api("/api/admin", "POST", { action: "save-settings", ...form });
      toast("🎨 Personnalisation enregistrée — appliquée pour tous", "ok");
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-5 space-y-4 anim-fade-up">
          <h3 className="font-display text-xl font-extrabold uppercase">Identité</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nom de l'application"><Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} /></Field>
            <Field label="Nom de l'entreprise"><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></Field>
          </div>
          <Field label="Logo entreprise" hint="PNG / JPG / SVG, max 500 Ko — affiché sur l'accueil, la sidebar et les feuilles de route.">
            <div className="flex items-center gap-3 flex-wrap">
              {form.logoData ? (
                <img src={form.logoData} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-gray-100 border border-gray-200 p-1" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-steel"><ImageIcon size={22} /></div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload size={15} /> Charger un logo</Button>
              {form.logoData && <Button variant="ghost" onClick={() => setForm({ ...form, logoData: "" })}><Trash2 size={15} /> Retirer</Button>}
            </div>
          </Field>
        </Card>

        <Card className="p-5 space-y-4 anim-fade-up delay-1">
          <h3 className="font-display text-xl font-extrabold uppercase">Couleurs de l'application</h3>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => setForm({ ...form, primaryColor: p.p, accentColor: p.a })} className={`flex items-center gap-2 border rounded-md px-3 py-2 text-xs font-bold cursor-pointer transition-all hover:shadow ${form.primaryColor === p.p && form.accentColor === p.a ? "border-coal ring-1 ring-coal" : "border-gray-300"}`}>
                <span className="w-4 h-4 rounded-full" style={{ background: p.p }} />
                <span className="w-4 h-4 rounded-full" style={{ background: p.a }} />
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Couleur principale" hint="boutons, onglet actif, accents">
              <div className="flex items-center gap-2">
                <input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer border border-gray-300" />
                <Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="font-mono" />
              </div>
            </Field>
            <Field label="Couleur secondaire" hint="rayures de sécurité, badges, surbrillance">
              <div className="flex items-center gap-2">
                <input type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="w-12 h-10 rounded cursor-pointer border border-gray-300" />
                <Input value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} className="font-mono" />
              </div>
            </Field>
          </div>
          <ErrorNote>{error}</ErrorNote>
          <Button onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Appliquer pour tous les utilisateurs"}</Button>
        </Card>
      </div>

      {/* Aperçu en direct */}
      <Card className="p-5 h-fit anim-fade-up delay-2">
        <h3 className="font-display text-xl font-extrabold uppercase mb-3">Aperçu en direct</h3>
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <div className="coal-texture p-3 flex items-center gap-2">
            {form.logoData ? <img src={form.logoData} alt="" className="w-8 h-8 rounded object-contain bg-white p-0.5" /> : <span className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-extrabold" style={{ background: form.primaryColor }}>PL</span>}
            <div>
              <p className="text-white font-display font-extrabold uppercase text-sm leading-none">{form.appName || "Mon appli"}</p>
              <p className="text-gray-400 text-[10px]">{form.companyName || "Entreprise"}</p>
            </div>
          </div>
          <div className="h-2" style={{ backgroundImage: `repeating-linear-gradient(-45deg, ${form.accentColor} 0 10px, #16191e 10px 20px)` }} />
          <div className="p-3 space-y-2 bg-gray-50">
            <span className="inline-block text-white text-xs font-display font-bold uppercase tracking-wide px-3 py-1.5 rounded-md" style={{ background: form.primaryColor }}>Bouton principal</span>
            <span className="inline-block ml-2 text-coal text-xs font-display font-bold uppercase tracking-wide px-3 py-1.5 rounded-md" style={{ background: form.accentColor }}>Secondaire</span>
            <div className="bg-white border border-gray-200 rounded-md p-2" style={{ borderLeftWidth: 4, borderLeftColor: form.primaryColor }}>
              <p className="font-mono text-[10px]">07:00–16:00</p>
              <p className="text-xs font-bold">Mission exemple</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-steel mt-3">Les changements sont appliqués à tous les utilisateurs dès l'enregistrement (rafraîchissement automatique ≤ 20 s).</p>
      </Card>
    </div>
  );
}

/* ================= DEPOT ================= */
function DepotTab() {
  const { settings, refresh, toast } = useApp();
  const [form, setForm] = useState({ depotName: settings.depotName, depotAddress: settings.depotAddress, depotLat: String(settings.depotLat), depotLng: String(settings.depotLng) });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api("/api/admin", "POST", { action: "save-settings", ...form, depotLat: Number(form.depotLat), depotLng: Number(form.depotLng) });
      toast("Informations dépôt enregistrées", "ok");
      await refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
    finally { setBusy(false); }
  }

  return (
    <Card className="p-5 max-w-2xl space-y-4 anim-fade-up">
      <h3 className="font-display text-xl font-extrabold uppercase">Dépôt de l'entreprise</h3>
      <p className="text-sm text-steel">Le dépôt est le point de départ des feuilles de route et la référence météo. Les distances et temps de trajet de chaque chantier se configurent dans le module <strong>Chantiers</strong>.</p>
      <Field label="Nom du dépôt"><Input value={form.depotName} onChange={(e) => setForm({ ...form, depotName: e.target.value })} /></Field>
      <Field label="Adresse complète"><Input value={form.depotAddress} onChange={(e) => setForm({ ...form, depotAddress: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude" hint="météo du dépôt"><Input type="number" step="0.0001" value={form.depotLat} onChange={(e) => setForm({ ...form, depotLat: e.target.value })} /></Field>
        <Field label="Longitude" hint="météo du dépôt"><Input type="number" step="0.0001" value={form.depotLng} onChange={(e) => setForm({ ...form, depotLng: e.target.value })} /></Field>
      </div>
      <Button onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
    </Card>
  );
}
