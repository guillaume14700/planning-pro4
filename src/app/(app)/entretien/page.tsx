"use client";

import { Wrench, TriangleAlert } from "lucide-react";
import { useApp, ModuleGate } from "@/components/app-provider";
import CrudModule from "@/components/crud";
import { Badge } from "@/components/ui";
import { fmtFr, todayStr } from "@/lib/utils";

export default function EntretienPage() {
  return <ModuleGate k="entretien"><Entretien /></ModuleGate>;
}

function Entretien() {
  const { me, vehicles } = useApp();
  const vName = (id: number) => vehicles.find((v) => v.id === id)?.name ?? `#${id}`;
  return (
    <CrudModule
      resource="maintenance"
      title="Entretien véhicules"
      subtitle="Vidanges, contrôles techniques, VGP grue — échéances sous surveillance."
      icon={<Wrench size={22} />}
      canWrite={me.role === "admin"}
      addLabel="Nouvelle intervention"
      emptyText="Aucune intervention enregistrée."
      sortDesc
      fields={[
        { key: "vehicleId", label: "Véhicule", type: "select", optionsFrom: "vehicles", required: true },
        { key: "date", label: "Date d'intervention", type: "date", required: true },
        { key: "kind", label: "Type", type: "select", options: ["Entretien courant", "Vidange + filtres", "Contrôle technique", "VGP grue (semestrielle)", "VGP auxiliaire de levage", "Pneumatiques", "Freins", "Réparation", "Autre"].map((k) => ({ value: k, label: k })) },
        { key: "km", label: "Kilométrage", type: "number" },
        { key: "cost", label: "Coût (€)", type: "number" },
        { key: "nextDate", label: "Prochaine échéance", type: "date", hint:"CT / VGP : laissez vide si sans échéance" },
        { key: "description", label: "Détails", type: "textarea" },
      ]}
      columns={[
        { key: "date", label: "Date", render: (r) => <span className="font-mono text-xs font-semibold">{fmtFr(r.date)}</span> },
        { key: "vehicleId", label: "Véhicule", render: (r) => <span className="font-bold">{vName(r.vehicleId)}</span> },
        { key: "kind", label: "Intervention", render: (r) => <span>{r.kind}<span className="block text-xs text-steel max-w-64 truncate">{r.description}</span></span> },
        { key: "km", label: "Km", render: (r) => <span className="font-mono text-xs">{Number(r.km).toLocaleString("fr-FR")}</span> },
        { key: "cost", label: "Coût", render: (r) => <span className="font-mono text-xs">{Number(r.cost).toFixed(2)} €</span> },
        {
          key: "nextDate", label: "Échéance", render: (r) => {
            if (!r.nextDate) return <span className="text-steel">—</span>;
            const late = r.nextDate < todayStr();
            const soon = !late && r.nextDate < new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
            return <Badge color={late ? "red" : soon ? "amber" : "green"}>{late && <TriangleAlert size={10} />}{late ? "Dépassée · " : ""}{fmtFr(r.nextDate)}</Badge>;
          },
        },
      ]}
    />
  );
}
