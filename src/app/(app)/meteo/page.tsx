"use client";

import { useEffect, useState } from "react";
import { CloudSun, Wind, Droplets, RefreshCw, MapPin, Construction } from "lucide-react";
import { useApp, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, PageHead } from "@/components/ui";
import { weatherIcon } from "../page";

type Daily = {
  time?: string[]; weather_code?: number[]; temperature_2m_max?: number[]; temperature_2m_min?: number[];
  wind_speed_10m_max?: number[]; wind_gusts_10m_max?: number[]; precipitation_probability_max?: number[];
};

type Spot = { name: string; address: string; isCrane?: boolean; data: Daily | null; loading: boolean };

export default function MeteoPage() {
  return <ModuleGate k="meteo"><Meteo /></ModuleGate>;
}

function Meteo() {
  const { settings, chantiers } = useApp();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const list: { name: string; address: string; lat: number; lon: number }[] = [
      { name: settings.depotName, address: settings.depotAddress, lat: settings.depotLat, lon: settings.depotLng },
      ...chantiers.filter((c) => c.active).map((c) => ({ name: c.name, address: c.address, lat: c.lat ?? settings.depotLat, lon: c.lng ?? settings.depotLng })),
    ];
    setSpots(list.map((l) => ({ name: l.name, address: l.address, data: null, loading: true })));
    list.forEach((l, i) => {
      fetch(`/api/weather?lat=${l.lat}&lon=${l.lon}`)
        .then((r) => r.json())
        .then((d) => setSpots((s) => s.map((x, j) => (j === i ? { ...x, data: d?.time ? d : null, loading: false } : x))))
        .catch(() => setSpots((s) => s.map((x, j) => (j === i ? { ...x, loading: false } : x))));
    });
  }, [settings, chantiers, tick]);

  return (
    <div>
      <PageHead
        title="Météo chantiers" subtitle="Prévisions 4 jours — vigilance vent pour les opérations de levage."
        icon={<CloudSun size={22} />}
        actions={<Button variant="outline" onClick={() => setTick((t) => t + 1)}><RefreshCw size={15} /> Actualiser</Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Badge color="green">Rafales &lt; 38 km/h : levage OK</Badge>
        <Badge color="amber">38–50 km/h : vigilance grutier</Badge>
        <Badge color="red">&gt; 50 km/h : levage déconseillé / arrêt</Badge>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {spots.map((s, i) => {
          const gust = s.data?.wind_gusts_10m_max?.[0] ?? 0;
          return (
            <Card key={s.name + i} className={`p-4 anim-fade-up delay-${(i % 4) + 1}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-extrabold uppercase leading-tight truncate">{s.name}</h3>
                  <p className="text-xs text-steel truncate flex items-center gap-1"><MapPin size={11} /> {s.address || "—"}</p>
                </div>
                {!s.loading && s.data && (
                  <Badge color={gust >= 50 ? "red" : gust >= 38 ? "amber" : "green"}>
                    <Construction size={11} /> {gust >= 50 ? "Arrêt levage" : gust >= 38 ? "Vigilance" : "Levage OK"}
                  </Badge>
                )}
              </div>
              {s.loading ? (
                <div className="h-28 bg-gray-100 rounded-md animate-pulse" />
              ) : !s.data ? (
                <p className="text-sm text-steel py-6 text-center">Météo indisponible.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {(s.data.time ?? []).slice(0, 4).map((t, j) => {
                    const g = s.data!.wind_gusts_10m_max?.[j] ?? 0;
                    return (
                      <div key={t} className={`rounded-md border p-2 text-center ${j === 0 ? "border-brand/50 bg-brand/5" : "border-gray-200"}`}>
                        <p className="text-[10px] font-bold uppercase text-steel">{j === 0 ? "Auj." : new Date(t + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" })}</p>
                        <div className="flex justify-center my-1.5">{weatherIcon(s.data!.weather_code?.[j] ?? 0, 22)}</div>
                        <p className="text-xs font-bold">{Math.round(s.data!.temperature_2m_max?.[j] ?? 0)}° <span className="text-steel font-normal">{Math.round(s.data!.temperature_2m_min?.[j] ?? 0)}°</span></p>
                        <p className={`text-[10px] mt-1 font-semibold flex items-center justify-center gap-0.5 ${g >= 50 ? "text-red-600" : g >= 38 ? "text-amber-600" : "text-steel"}`}>
                          <Wind size={10} /> {Math.round(g)}
                        </p>
                        <p className="text-[10px] text-sky-700 flex items-center justify-center gap-0.5"><Droplets size={10} /> {s.data!.precipitation_probability_max?.[j] ?? 0}%</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-steel mt-4">Données Open-Meteo (rafales 10 m). Toujours appliquer les consignes constructeur de la grue (abattement de charge selon flèche et vent).</p>
    </div>
  );
}
