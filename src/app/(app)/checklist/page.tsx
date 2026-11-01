"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, CheckCircle2, XCircle, Save, History } from "lucide-react";
import { useApp, api, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Empty, Field, PageHead, Select, Spinner, Textarea } from "@/components/ui";
import { CHECKLIST_ITEMS } from "@/lib/modules";
import { todayStr, fmtFr, initials } from "@/lib/utils";

type ChecklistRow = { id: number; date: string; userId: number; vehicleId: number; items: Record<string, boolean>; note: string };

export default function ChecklistPage() {
  return <ModuleGate k="checklist"><Checklist /></ModuleGate>;
}

function Checklist() {
  const { me, vehicles, users, toast } = useApp();
  const [vehicleId, setVehicleId] = useState(String(vehicles[0]?.id ?? ""));
  const [items, setItems] = useState<Record<string, boolean>>(Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i, true])));
  const [note, setNote] = useState("");
  const [existingId, setExistingId] = useState<number | null>(null);
  const [history, setHistory] = useState<ChecklistRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const today = todayStr();

  const load = useCallback(async () => {
    const all = await api<ChecklistRow[]>(`/api/checklists`);
    setHistory([...all].reverse().slice(0, 12));
    const mine = all.find((c) => c.date === today && c.userId === me.id && c.vehicleId === Number(vehicleId));
    if (mine) {
      setExistingId(mine.id);
      setItems({ ...Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i, true])), ...mine.items });
      setNote(mine.note);
    } else {
      setExistingId(null);
      setItems(Object.fromEntries(CHECKLIST_ITEMS.map((i) => [i, true])));
      setNote("");
    }
  }, [today, me.id, vehicleId]);

  useEffect(() => { load().catch(() => setHistory([])); }, [load]);

  const failed = CHECKLIST_ITEMS.filter((i) => !items[i]);
  const checked = CHECKLIST_ITEMS.length - failed.length;

  async function save() {
    if (!vehicleId) { toast("Choisissez un véhicule", "panne"); return; }
    setBusy(true);
    try {
      const payload = { date: today, vehicleId: Number(vehicleId), items, note };
      if (existingId) await api(`/api/checklists/${existingId}`, "PATCH", payload);
      else await api("/api/checklists", "POST", payload);
      toast(failed.length ? "⚠️ Checklist enregistrée — anomalies signalées à l'équipe" : "✅ Checklist conforme enregistrée", failed.length ? "panne" : "ok");
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHead
        title="Checklist départ" subtitle="Contrôle avant prise de poste — les anomalies sont signalées à toute l'équipe."
        icon={<ClipboardCheck size={22} />}
      />
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5 anim-fade-up">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <Field label="Véhicule du jour">
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-64">
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.plate}</option>)}
              </Select>
            </Field>
            <div className="text-right">
              <p className="font-display text-3xl font-extrabold">{checked}<span className="text-steel text-lg">/{CHECKLIST_ITEMS.length}</span></p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-steel">points conformes</p>
            </div>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-5">
            <div className={`h-full rounded-full transition-all duration-500 ${failed.length ? "bg-amber-500" : "bg-green-600"}`} style={{ width: `${(checked / CHECKLIST_ITEMS.length) * 100}%` }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {CHECKLIST_ITEMS.map((item) => {
              const ok = items[item];
              return (
                <button
                  key={item}
                  onClick={() => setItems({ ...items, [item]: !ok })}
                  className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm font-semibold transition-all cursor-pointer ${ok ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-700"}`}
                >
                  {ok ? <CheckCircle2 size={18} className="shrink-0" /> : <XCircle size={18} className="shrink-0" />}
                  {item}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Field label="Observations">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précisez les anomalies constatées…" />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <Button onClick={save} disabled={busy}><Save size={16} /> {existingId ? "Mettre à jour" : "Valider la checklist"}</Button>
            {failed.length > 0 && <Badge color="red">{failed.length} anomalie{failed.length > 1 ? "s" : ""} — message automatique à l'équipe</Badge>}
          </div>
        </Card>

        <Card className="p-5 anim-fade-up delay-2">
          <h2 className="font-display text-xl font-extrabold uppercase mb-3 flex items-center gap-2"><History size={17} /> Derniers contrôles</h2>
          {history == null ? <Spinner /> : history.length === 0 ? <Empty text="Aucun contrôle enregistré." /> : (
            <div className="space-y-2.5">
              {history.map((h) => {
                const fails = Object.entries(h.items ?? {}).filter(([, v]) => !v).length;
                const u = users.find((x) => x.id === h.userId);
                const v = vehicles.find((x) => x.id === h.vehicleId);
                return (
                  <div key={h.id} className="border border-gray-200 rounded-md p-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-bold text-xs">
                        {u && <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-extrabold" style={{ background: u.color }}>{initials(u.name)}</span>}
                        {u?.name ?? "—"}
                      </span>
                      <Badge color={fails ? "red" : "green"}>{fails ? `${fails} anomalie${fails > 1 ? "s" : ""}` : "Conforme"}</Badge>
                    </div>
                    <p className="text-xs text-steel mt-1">{fmtFr(h.date)} · {v?.name ?? "Véhicule"}</p>
                    {h.note && <p className="text-xs mt-1 text-gray-600">{h.note}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
