"use client";

import { useState } from "react";
import { HardHat, Plus, MapPin, Phone, Route, Clock, Pencil, Trash2, User, StickyNote } from "lucide-react";
import { useApp, api, ChantierT, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Confirm, Empty, ErrorNote, Field, Input, Modal, PageHead, Textarea, Toggle } from "@/components/ui";
import { PALETTE } from "@/lib/utils";

type Form = { id?: number; name: string; client: string; address: string; contactName: string; contactPhone: string; distanceKm: string; travelMin: string; lat: string; lng: string; color: string; notes: string; active: boolean };

const empty: Form = { name: "", client: "", address: "", contactName: "", contactPhone: "", distanceKm: "", travelMin: "", lat: "", lng: "", color: PALETTE[0]!, notes: "", active: true };

export default function ChantiersPage() {
  return <ModuleGate k="chantiers"><Chantiers /></ModuleGate>;
}

function Chantiers() {
  const { me, chantiers, refresh, toast } = useApp();
  const isAdmin = me.role === "admin";
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<number | null>(null);

  const shown = isAdmin ? chantiers : chantiers.filter((c) => c.active);

  async function save() {
    if (!form) return;
    if (!form.name.trim()) { setError("Le nom du chantier est obligatoire."); return; }
    setBusy(true); setError("");
    try {
      const payload = {
        name: form.name, client: form.client, address: form.address, contactName: form.contactName,
        contactPhone: form.contactPhone, distanceKm: Number(form.distanceKm || 0), travelMin: Number(form.travelMin || 0),
        lat: form.lat === "" ? null : Number(form.lat), lng: form.lng === "" ? null : Number(form.lng),
        color: form.color, notes: form.notes, active: form.active,
      };
      if (form.id) await api(`/api/chantiers/${form.id}`, "PATCH", payload);
      else await api("/api/chantiers", "POST", payload);
      toast(form.id ? "Chantier modifié" : "Chantier ajouté", "ok");
      setForm(null);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function doDelete() {
    if (del == null) return;
    try { await api(`/api/chantiers/${del}`, "DELETE"); toast("Chantier supprimé", "ok"); await refresh(); }
    catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  return (
    <div>
      <PageHead
        title="Chantiers" subtitle="Distance dépôt ↔ chantier et temps de trajet utilisés dans tout le planning."
        icon={<HardHat size={22} />}
        actions={isAdmin ? <Button onClick={() => { setError(""); setForm({ ...empty }); }}><Plus size={16} /> Nouveau chantier</Button> : undefined}
      />
      {shown.length === 0 ? <Card><Empty text="Aucun chantier enregistré." icon={<HardHat size={28} />} /></Card> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((c: ChantierT, i) => (
            <Card key={c.id} className={`overflow-hidden anim-fade-up delay-${(i % 4) + 1} ${!c.active ? "opacity-60" : ""}`}>
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-extrabold uppercase leading-tight">{c.name}</h3>
                    <p className="text-xs text-steel font-semibold">{c.client || "Client non renseigné"}</p>
                  </div>
                  {!c.active && <Badge>Inactif</Badge>}
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge color="coal"><Route size={11} /> {c.distanceKm} km</Badge>
                  <Badge color="coal"><Clock size={11} /> {c.travelMin} min</Badge>
                  <Badge color="brand">{c.distanceKm * 2} km A/R</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-3 flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0 text-steel" />{c.address || "Adresse non renseignée"}</p>
                {c.contactName && (
                  <p className="text-sm text-gray-600 mt-1.5 flex items-center gap-1.5">
                    <User size={14} className="shrink-0 text-steel" />{c.contactName}
                    {c.contactPhone && <a href={`tel:${c.contactPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-brand font-bold hover:underline ml-1"><Phone size={12} />{c.contactPhone}</a>}
                  </p>
                )}
                {c.notes && <p className="text-xs text-steel bg-gray-50 border border-gray-200 rounded-md px-2.5 py-2 mt-3 flex gap-1.5"><StickyNote size={13} className="shrink-0 mt-0.5" />{c.notes}</p>}
                {isAdmin && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button variant="outline" className="flex-1 !py-1.5 text-xs" onClick={() => { setError(""); setForm({ id: c.id, name: c.name, client: c.client, address: c.address, contactName: c.contactName, contactPhone: c.contactPhone, distanceKm: String(c.distanceKm), travelMin: String(c.travelMin), lat: c.lat?.toString() ?? "", lng: c.lng?.toString() ?? "", color: c.color, notes: c.notes, active: c.active }); }}>
                      <Pencil size={13} /> Modifier
                    </Button>
                    <Button variant="ghost" className="!py-1.5 text-xs text-red-600" onClick={() => setDel(c.id)}><Trash2 size={13} /></Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={form != null} onClose={() => setForm(null)} wide title={form?.id ? "Modifier le chantier" : "Nouveau chantier"} footer={
        <><Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button><Button onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button></>
      }>
        {form && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nom du chantier" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Client / entreprise"><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Field>
            </div>
            <Field label="Adresse complète"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Contact sur site"><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></Field>
              <Field label="Téléphone contact"><Input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Distance dépôt (km)" required hint="aller simple"><Input type="number" min={0} step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} /></Field>
              <Field label="Trajet (min)" required hint="PL, aller simple"><Input type="number" min={0} value={form.travelMin} onChange={(e) => setForm({ ...form, travelMin: e.target.value })} /></Field>
              <Field label="Latitude" hint="météo (option)"><Input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="45.75" /></Field>
              <Field label="Longitude" hint="météo (option)"><Input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="4.85" /></Field>
            </div>
            <Field label="Couleur planning">
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map((p) => (
                  <button key={p} type="button" onClick={() => setForm({ ...form, color: p })} className={`w-8 h-8 rounded-md cursor-pointer transition-transform ${form.color === p ? "ring-2 ring-offset-2 ring-coal scale-110" : "hover:scale-105"}`} style={{ background: p }} aria-label={`Couleur ${p}`} />
                ))}
              </div>
            </Field>
            <Field label="Consignes d'accès / sécurité"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <div className="flex items-center gap-3"><Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Chantier actif" /><span className="text-sm font-semibold">Chantier actif {form.active ? "" : "(masqué pour les utilisateurs)"}</span></div>
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </Modal>

      <Confirm open={del != null} onClose={() => setDel(null)} onConfirm={doDelete} title="Supprimer le chantier" message="Les missions liées resteront au planning mais sans fiche chantier. Préférez désactiver le chantier si des missions existent." confirmLabel="Supprimer" danger />
    </div>
  );
}
