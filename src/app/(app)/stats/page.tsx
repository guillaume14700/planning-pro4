"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useApp, api, MissionT, ModuleGate } from "@/components/app-provider";
import { Button, Card, PageHead, Spinner, Stat } from "@/components/ui";
import { toMin, parseDate, dateStr } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

type FuelRow = { date: string; liters: number; cost: number };

function monthRange(ym: string): { from: string; to: string; label: string; days: number } {
  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y!, m! - 1, 1);
  const last = new Date(y!, m!, 0);
  return { from: dateStr(first), to: dateStr(last), label: first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }), days: last.getDate() };
}

export default function StatsPage() {
  return <ModuleGate k="stats"><Stats /></ModuleGate>;
}

function Stats() {
  const { users, chantiers, settings } = useApp();
  const now = new Date();
  const [ym, setYm] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [missions, setMissions] = useState<MissionT[] | null>(null);
  const [fuel, setFuel] = useState<FuelRow[]>([]);
  const range = monthRange(ym);

  useEffect(() => {
    setMissions(null);
    api<MissionT[]>(`/api/missions?from=${range.from}&to=${range.to}`).then(setMissions).catch(() => setMissions([]));
    api<FuelRow[]>(`/api/fuel?from=${range.from}&to=${range.to}`).then(setFuel).catch(() => setFuel([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  function shiftMonth(n: number) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y!, m! - 1 + n, 1);
    setYm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const activeUsers = users.filter((u) => u.active);
  const hoursByDriver = useMemo(() => activeUsers.map((u) =>
    Math.round((missions ?? []).filter((m) => m.driverId === u.id).reduce((a, m) => a + toMin(m.endTime) - toMin(m.startTime), 0) / 60)
  ), [missions, activeUsers]);

  const byChantier = useMemo(() => chantiers.map((c) => (missions ?? []).filter((m) => m.chantierId === c.id).length), [missions, chantiers]);

  const kmByDay = useMemo(() => {
    const arr = Array.from({ length: range.days }, () => 0);
    for (const m of missions ?? []) {
      const d = parseDate(m.date).getDate();
      arr[d - 1] = (arr[d - 1] ?? 0) + (chantiers.find((c) => c.id === m.chantierId)?.distanceKm ?? 0) * 2;
    }
    return arr.map((v) => Math.round(v));
  }, [missions, chantiers, range.days]);

  const totalKm = kmByDay.reduce((a, b) => a + b, 0);
  const liters = fuel.reduce((a, f) => a + Number(f.liters), 0);
  const fuelCost = fuel.reduce((a, f) => a + Number(f.cost), 0);

  const gridColor = "rgba(0,0,0,0.06)";
  const common = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } as const;

  return (
    <div>
      <PageHead
        title="Statistiques" subtitle="Activité mensuelle : heures, kilomètres, répartition chantiers et carburant."
        icon={<BarChart3 size={22} />}
        actions={<>
          <Button variant="outline" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></Button>
          <span className="font-display font-bold uppercase text-lg px-2 capitalize">{range.label}</span>
          <Button variant="outline" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></Button>
        </>}
      />
      {missions == null ? <Spinner /> : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <Stat label="Missions du mois" value={missions.length} tone="brand" />
            <Stat label="Km A/R estimés" value={totalKm.toLocaleString("fr-FR")} />
            <Stat label="Gasoil (litres)" value={Math.round(liters).toLocaleString("fr-FR")} />
            <Stat label="Coût carburant" value={`${fuelCost.toFixed(0)} €`} />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <Card className="p-5 anim-fade-up delay-1">
              <h2 className="font-display text-xl font-extrabold uppercase mb-4">Heures de service par chauffeur</h2>
              <div className="h-64">
                <Bar
                  data={{
                    labels: activeUsers.map((u) => u.name.split(" ")[0]!),
                    datasets: [{ data: hoursByDriver, backgroundColor: activeUsers.map((u) => u.color), borderRadius: 6, maxBarThickness: 52 }],
                  }}
                  options={{ ...common, scales: { y: { grid: { color: gridColor }, title: { display: true, text: "heures" } }, x: { grid: { display: false } } } }}
                />
              </div>
            </Card>
            <Card className="p-5 anim-fade-up delay-2">
              <h2 className="font-display text-xl font-extrabold uppercase mb-4">Missions par chantier</h2>
              <div className="h-64 flex items-center justify-center">
                {byChantier.some((v) => v > 0) ? (
                  <Doughnut
                    data={{
                      labels: chantiers.map((c) => c.name),
                      datasets: [{ data: byChantier, backgroundColor: chantiers.map((c) => c.color), borderWidth: 2, borderColor: "#fff" }],
                    }}
                    options={{ ...common, plugins: { legend: { display: true, position: "right" as const, labels: { boxWidth: 12, font: { size: 11 } } } }, cutout: "62%" }}
                  />
                ) : <p className="text-sm text-steel">Aucune mission ce mois-ci.</p>}
              </div>
            </Card>
          </div>

          <Card className="p-5 anim-fade-up delay-3">
            <h2 className="font-display text-xl font-extrabold uppercase mb-4">Kilomètres dépôt ↔ chantiers par jour</h2>
            <div className="h-56">
              <Line
                data={{
                  labels: Array.from({ length: range.days }, (_, i) => String(i + 1)),
                  datasets: [{
                    data: kmByDay, borderColor: settings.primaryColor, backgroundColor: `${settings.primaryColor}22`,
                    fill: true, tension: 0.35, pointRadius: 2.5, pointBackgroundColor: settings.primaryColor,
                  }],
                }}
                options={{ ...common, scales: { y: { grid: { color: gridColor }, title: { display: true, text: "km A/R" } }, x: { grid: { display: false } } } }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
