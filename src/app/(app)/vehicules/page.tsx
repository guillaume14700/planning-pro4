"use client";

import { useState } from "react";
import Link from "next/link";
import { Truck, Construction, Plus, Pencil, Trash2, Wrench, Gauge, Siren } from "lucide-react";
import { useApp, api, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Confirm, Empty, ErrorNote, Field, Input, Modal, PageHead, Select, Textarea } from "@/components/ui";
import { VEHICLE_TYPES } from "@/lib/utils";

type Form = { id?: number; name: string; plate: string; type: string; km: string; notes: string };
const empty: Form = { name: "", plate: "", type: "porteur", km: "0", notes: "" };

export default function VehiculesPage() {
  return <ModuleGate k="vehicules"><Vehicules /></ModuleGate>;
}

function Vehicules() {
  const { me, vehicles, refresh, toast, activeAlerts, setPanneOpen } = useApp();
  const isAdmin = me.role === "admin";
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<number | null>(null);

  async function save() {
    if (!form) return;
    if (!form.name.trim()) { setError("Nom du véhicule obligatoire."); return; }
    setBusy(true); setError("");
    try {
      const payload = { name: form.name, plate: form.plate.toUpperCase(), type: form.type, km: Number(form.km || 0), notes: form.notes };
      if (form.id) await api(`/api/vehicles/${form.id}`, "PATCH", payload);
      else await api("/api/vehicles", "POST", payload);
      toast(form.id ? "Véhicule modifié" : "Véhicule ajouté", "ok");
      setForm(null); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function setStatus(id: number, status: string) {
    try { await api(`/api/vehicles/${id}`, "PATCH", { status }); toast("Statut véhicule mis à jour — équipe notifiée", "ok"); await refresh(); }
    catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  async function doDelete() {
    if (del == null) return;
    try { await api(`/api/vehicles/${del}`, "DELETE"); toast("Véhicule supprimé", "ok"); await refresh(); }
    catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  const statusBadge = (s: string) =>
    s === "disponible" ? <Badge color="green">● Disponible</Badge> :
    s === "panne" ? <Badge color="red"><Siren size={11} /> En panne</Badge> :
    <Badge color="amber"><Wrench size={11} /> Entretien</Badge>;

  return (
    <div>
      <PageHead
        title="Parc véhicules" subtitle="PL, bennes, grues mobiles et camions-grues — disponibilité en temps réel."
        icon={<Truck size={22} />}
        actions={<>
          <Button variant="danger" onClick={() => setPanneOpen(true)}><Siren size={16} /> Signaler une panne</Button>
          {isAdmin && <Button onClick={() => { setError(""); setForm({ ...empty }); }}><Plus size={16} /> Ajouter</Button>}
        </>}
      />
      {vehicles.length === 0 ? <Card><Empty text="Aucun véhicule dans le parc." icon={<Truck size={28} />} /></Card> : (
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map((v, i) => {
            const alert = activeAlerts.find((a) => a.vehicleId === v.id);
            const isCrane = v.type === "grue_mobile" || v.type === "camion_grue";
            return (
              <Card key={v.id} className={`p-4 anim-fade-up delay-${(i % 4) + 1} ${v.status === "panne" ? "border-red-300" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${v.status === "panne" ? "bg-red-100 text-red-600" : "bg-coal text-accent"}`}>
                    {isCrane ? <Construction size={24} /> : <Truck size={24} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-display text-xl font-extrabold uppercase leading-tight">{v.name}</h3>
                      {statusBadge(v.status)}
                    </div>
                    <p className="text-xs text-steel mt-0.5">
                      <span className="font-mono font-semibold bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 text-coal">{v.plate || "—"}</span>
                      <span className="ml-2">{VEHICLE_TYPES[v.type] ?? v.type}</span>
                      <span className="ml-2 inline-flex items-center gap-1"><Gauge size={11} /> {v.km.toLocaleString("fr-FR")} km</span>
                    </p>
                    {v.notes && <p className="text-xs text-steel mt-2">{v.notes}</p>}
                    {alert && (
                      <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5 mt-2 flex items-center gap-1.5">
                        <Siren size={13} className="anim-blink" /> Panne signalée par {alert.createdByName} — {alert.message || alert.kind}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                      {isAdmin && v.status !== "disponible" && !alert && (
                        <Button variant="outline" className="!py-1.5 text-xs" onClick={() => setStatus(v.id, "disponible")}>Remettre en service</Button>
                      )}
                      {isAdmin && v.status === "disponible" && (
                        <Button variant="outline" className="!py-1.5 text-xs" onClick={() => setStatus(v.id, "entretien")}><Wrench size={13} /> Immobiliser (entretien)</Button>
                      )}
                      <Link href="/entretien" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline py-1.5"><Wrench size={13} /> Carnet d'entretien</Link>
                      {isAdmin && (
                        <span className="ml-auto flex gap-1">
                          <button onClick={() => { setError(""); setForm({ id: v.id, name: v.name, plate: v.plate, type: v.type, km: String(v.km), notes: v.notes }); }} className="p-1.5 rounded hover:bg-gray-100 text-steel cursor-pointer" aria-label="Modifier"><Pencil size={15} /></button>
                          <button onClick={() => setDel(v.id)} className="p-1.5 rounded hover:bg-red-50 text-steel hover:text-red-600 cursor-pointer" aria-label="Supprimer"><Trash2 size={15} /></button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={form != null} onClose={() => setForm(null)} title={form?.id ? "Modifier le véhicule" : "Nouveau véhicule"} footer={
        <><Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button><Button onClick={save} disabled={busy}>{busy ? "…" : "Enregistrer"}</Button></>
      }>
        {form && (
          <div className="space-y-3">
            <Field label="Nom / modèle" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex : Volvo FH16 plateau" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Immatriculation"><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="AB-123-CD" className="font-mono uppercase" /></Field>
              <Field label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(VEHICLE_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Kilométrage"><Input type="number" min={0} value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} /></Field>
            <Field label="Notes (équipement, CACES, particularités)"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </Modal>

      <Confirm open={del != null} onClose={() => setDel(null)} onConfirm={doDelete} title="Supprimer le véhicule" message="Le véhicule sera retiré du parc. Les missions planifiées qui l'utilisent perdront leur véhicule." confirmLabel="Supprimer" danger />
    </div>
  );
}
