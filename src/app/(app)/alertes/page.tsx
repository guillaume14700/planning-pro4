"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Siren, CheckCircle2, MapPin, History, Truck } from "lucide-react";
import { useApp, api, AlertT, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Confirm, Empty, PageHead, Spinner } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = { moteur: "Panne moteur", crevaison: "Crevaison", hydraulique: "Panne hydraulique", electrique: "Panne électrique", autre: "Autre panne" };

export default function AlertesPage() {
  return <ModuleGate k="alertes"><Alertes /></ModuleGate>;
}

function Alertes() {
  const { me, vehicles, setPanneOpen, toast, refresh } = useApp();
  const [rows, setRows] = useState<AlertT[] | null>(null);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const vMap = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);

  const load = useCallback(async () => {
    const data = await api<AlertT[]>("/api/alerts");
    setRows([...data].reverse());
  }, []);
  useEffect(() => { load().catch(() => setRows([])); }, [load]);

  const active = (rows ?? []).filter((a) => a.status === "active");
  const history = (rows ?? []).filter((a) => a.status !== "active");

  async function resolve() {
    if (resolveId == null) return;
    try {
      await api(`/api/alerts/${resolveId}`, "PATCH", { status: "resolue" });
      toast("✅ Panne résolue — équipe notifiée", "ok");
      await load(); await refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  return (
    <div>
      <PageHead
        title="Alertes panne" subtitle="Signalez une panne PL : tout le monde est prévenu immédiatement."
        icon={<Siren size={22} />}
        actions={<Button variant="danger" onClick={() => setPanneOpen(true)} className="anim-siren"><Siren size={16} /> Déclencher une alerte</Button>}
      />

      {rows == null ? <Spinner /> : (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase mb-3 flex items-center gap-2">
              Alertes en cours {active.length > 0 && <Badge color="red">{active.length}</Badge>}
            </h2>
            {active.length === 0 ? (
              <Card><Empty text="Aucune panne en cours — tout le parc roule. 👌" icon={<CheckCircle2 size={28} className="text-green-600" />} /></Card>
            ) : (
              <div className="space-y-3">
                {active.map((a) => {
                  const v = vMap[a.vehicleId];
                  const canResolve = me.role === "admin" || me.id === a.createdBy;
                  return (
                    <Card key={a.id} className="overflow-hidden border-red-300 anim-fade-up">
                      <div className="hazard-red h-2" />
                      <div className="p-4 md:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <span className="w-11 h-11 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0 anim-siren"><Siren size={22} /></span>
                            <div>
                              <h3 className="font-display text-2xl font-extrabold uppercase text-red-700 leading-none">
                                {KIND_LABEL[a.kind] ?? a.kind} — {v?.name ?? a.vehicleName}
                              </h3>
                              <p className="text-xs text-steel font-mono mt-1">{v?.plate ?? a.vehiclePlate} · signalé par {a.createdByName} · {fmtDateTime(a.createdAt)}</p>
                            </div>
                          </div>
                          <Badge color={a.severity === "immobilise" ? "red" : "amber"}>
                            {a.severity === "immobilise" ? "🛑 Véhicule immobilisé" : "⚠️ Dégradé"}
                          </Badge>
                        </div>
                        {a.message && <p className="text-sm mt-3 bg-red-50 border border-red-200 rounded-md px-3 py-2.5">{a.message}</p>}
                        {a.location && <p className="text-sm mt-2 flex items-center gap-1.5 text-gray-700"><MapPin size={14} className="text-red-600" /> {a.location}</p>}
                        {canResolve && (
                          <div className="mt-4">
                            <Button onClick={() => setResolveId(a.id)}><CheckCircle2 size={16} /> Panne résolue — remettre en service</Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-xl font-extrabold uppercase mb-3 flex items-center gap-2"><History size={18} /> Historique</h2>
            {history.length === 0 ? <Card><Empty text="Aucune alerte passée." /></Card> : (
              <Card className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead>
                    <tr className="text-left border-b border-gray-200 bg-gray-50">
                      {["Date", "Véhicule", "Type", "Signalée par", "Résolue par", "Statut"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-steel">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((a) => (
                      <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{fmtDateTime(a.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold"><Truck size={13} className="inline mr-1 text-steel" />{vMap[a.vehicleId]?.name ?? a.vehicleName ?? "—"}</td>
                        <td className="px-4 py-3">{KIND_LABEL[a.kind] ?? a.kind}</td>
                        <td className="px-4 py-3">{a.createdByName}</td>
                        <td className="px-4 py-3">{a.resolvedByName || "—"}{a.resolvedAt ? ` · ${fmtDateTime(a.resolvedAt)}` : ""}</td>
                        <td className="px-4 py-3"><Badge color="green"><CheckCircle2 size={10} /> Résolue</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        </div>
      )}

      <Confirm
        open={resolveId != null} onClose={() => setResolveId(null)} onConfirm={resolve}
        title="Clôturer l'alerte panne"
        message="Le véhicule repassera « disponible » et un message de résolution sera envoyé à tous les utilisateurs."
        confirmLabel="Panne résolue"
      />
    </div>
  );
}
