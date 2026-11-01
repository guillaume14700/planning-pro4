"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff, Plus, Check, X, Hourglass } from "lucide-react";
import { useApp, api, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Empty, ErrorNote, Field, Input, Modal, PageHead, Select, Spinner, Textarea } from "@/components/ui";
import { todayStr, fmtFr, addDays, initials } from "@/lib/utils";

type Leave = { id: number; userId: number; startDate: string; endDate: string; kind: string; reason: string; status: string; decidedByName: string };

const KINDS = ["Congé payé", "RTT", "Maladie", "Absence exceptionnelle", "Sans solde", "Formation"];

export default function CongesPage() {
  return <ModuleGate k="conges"><Conges /></ModuleGate>;
}

function Conges() {
  const { me, users, toast } = useApp();
  const isAdmin = me.role === "admin";
  const [rows, setRows] = useState<Leave[] | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ startDate: todayStr(), endDate: todayStr(), kind: KINDS[0]!, reason: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await api<Leave[]>("/api/leaves");
    setRows([...data].reverse());
  }, []);
  useEffect(() => { load().catch(() => setRows([])); }, [load]);

  async function submit() {
    if (form.endDate < form.startDate) { setError("La date de fin doit être après la date de début."); return; }
    setBusy(true); setError("");
    try {
      await api("/api/leaves", "POST", form);
      toast("Demande envoyée — l'administrateur est prévenu", "ok");
      setModal(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function decide(id: number, status: "valide" | "refuse") {
    try {
      await api(`/api/leaves/${id}`, "PATCH", { status });
      toast(status === "valide" ? "Absence validée — équipe notifiée" : "Absence refusée — équipe notifiée", "ok");
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  const shown = isAdmin ? rows ?? [] : (rows ?? []).filter((l) => l.userId === me.id);
  const pending = (rows ?? []).filter((l) => l.status === "attente").length;

  return (
    <div className="max-w-4xl">
      <PageHead
        title="Absences & congés" subtitle={isAdmin ? "Validez les demandes — l'équipe est notifiée et le planning peut être ajusté." : "Vos demandes d'absence, validées par l'administrateur principal."}
        icon={<CalendarOff size={22} />}
        actions={<Button onClick={() => { setError(""); setForm({ startDate: addDays(todayStr(), 7), endDate: addDays(todayStr(), 7), kind: KINDS[0]!, reason: "" }); setModal(true); }}><Plus size={16} /> Demander une absence</Button>}
      />
      {isAdmin && pending > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-md px-4 py-2.5 text-sm font-semibold flex items-center gap-2 anim-fade-up">
          <Hourglass size={15} /> {pending} demande{pending > 1 ? "s" : ""} en attente de validation.
        </div>
      )}
      {rows == null ? <Spinner /> : shown.length === 0 ? <Card><Empty text="Aucune demande d'absence." icon={<CalendarOff size={28} />} /></Card> : (
        <div className="space-y-2.5">
          {shown.map((l) => {
            const u = users.find((x) => x.id === l.userId);
            return (
              <Card key={l.id} className="p-4 flex flex-wrap items-center gap-3 anim-fade-up">
                {u && <span className="w-9 h-9 rounded-md flex items-center justify-center text-white text-xs font-extrabold shrink-0" style={{ background: u.color }}>{initials(u.name)}</span>}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm">{isAdmin ? u?.name ?? "—" : l.kind} <span className="text-steel font-normal">· {l.kind}</span></p>
                  <p className="text-sm text-gray-600">Du <strong>{fmtFr(l.startDate)}</strong> au <strong>{fmtFr(l.endDate)}</strong>{l.reason ? ` — ${l.reason}` : ""}</p>
                  {l.decidedByName && <p className="text-[11px] text-steel">Décision : {l.decidedByName}</p>}
                </div>
                <Badge color={l.status === "valide" ? "green" : l.status === "refuse" ? "red" : "amber"}>
                  {l.status === "valide" ? <Check size={11} /> : l.status === "refuse" ? <X size={11} /> : <Hourglass size={11} />}
                  {l.status === "valide" ? "Validée" : l.status === "refuse" ? "Refusée" : "En attente"}
                </Badge>
                {isAdmin && l.status === "attente" && (
                  <div className="flex gap-2">
                    <Button className="!py-1.5 text-xs" onClick={() => decide(l.id, "valide")}><Check size={14} /> Valider</Button>
                    <Button variant="outline" className="!py-1.5 text-xs" onClick={() => decide(l.id, "refuse")}><X size={14} /> Refuser</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Demande d'absence" footer={
        <><Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button><Button onClick={submit} disabled={busy}>{busy ? "Envoi…" : "Envoyer la demande"}</Button></>
      }>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Du" required><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Au" required><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          </div>
          <Field label="Type d'absence">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k}>{k}</option>)}
            </Select>
          </Field>
          <Field label="Motif / commentaire"><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
          <ErrorNote>{error}</ErrorNote>
        </div>
      </Modal>
    </div>
  );
}
