"use client";

import { Fuel } from "lucide-react";
import { useApp, ModuleGate } from "@/components/app-provider";
import CrudModule from "@/components/crud";
import { fmtFr } from "@/lib/utils";

export default function CarburantPage() {
  return <ModuleGate k="carburant"><Carburant /></ModuleGate>;
}

function Carburant() {
  const { vehicles, users } = useApp();
  const vName = (id: number) => vehicles.find((v) => v.id === id)?.name ?? `#${id}`;
  const uName = (id: number) => users.find((u) => u.id === id)?.name ?? "—";
  return (
    <CrudModule
      resource="fuel"
      title="Carburant"
      subtitle="Chaque chauffeur peut saisir ses pleins — suivi des litres, coûts et kilométrage."
      icon={<Fuel size={22} />}
      canWrite
      addLabel="Saisir un plein"
      emptyText="Aucun plein enregistré."
      sortDesc
      fields={[
        { key: "vehicleId", label: "Véhicule", type: "select", optionsFrom: "vehicles", required: true },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "liters", label: "Litres", type: "number", required: true },
        { key: "cost", label: "Montant total (€)", type: "number", required: true },
        { key: "km", label: "Km compteur", type: "number" },
        { key: "station", label: "Station", type: "text", placeholder: "Ex : Total Corbas, AS24…" },
      ]}
      columns={[
        { key: "date", label: "Date", render: (r) => <span className="font-mono text-xs font-semibold">{fmtFr(r.date)}</span> },
        { key: "vehicleId", label: "Véhicule", render: (r) => <span className="font-bold">{vName(r.vehicleId)}</span> },
        { key: "liters", label: "Litres", render: (r) => <span className="font-mono">{Number(r.liters).toFixed(1)} L</span> },
        { key: "cost", label: "Montant", render: (r) => <span className="font-mono">{Number(r.cost).toFixed(2)} €<span className="block text-[10px] text-steel">{r.liters > 0 ? `${(r.cost / r.liters).toFixed(3)} €/L` : ""}</span></span> },
        { key: "km", label: "Compteur", render: (r) => <span className="font-mono text-xs">{Number(r.km).toLocaleString("fr-FR")} km</span> },
        { key: "station", label: "Station / chauffeur", render: (r) => <span>{r.station || "—"}<span className="block text-xs text-steel">{uName(r.userId)}</span></span> },
      ]}
    />
  );
}
