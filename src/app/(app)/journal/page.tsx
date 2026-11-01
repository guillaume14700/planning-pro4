"use client";

import { useEffect, useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { api, ModuleGate } from "@/components/app-provider";
import { Badge, Card, Empty, Input, PageHead, Spinner } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

type Row = { id: number; userId: number; userName: string; action: string; details: string; createdAt: string };

export default function JournalPage() {
  return <ModuleGate k="journal"><Journal /></ModuleGate>;
}

function Journal() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => { api<Row[]>("/api/audit").then(setRows).catch(() => setRows([])); }, []);

  const actions = useMemo(() => Array.from(new Set((rows ?? []).map((r) => r.action))).sort(), [rows]);
  const filtered = (rows ?? []).filter((r) =>
    q === "" || r.action === q || r.userName.toLowerCase().includes(q.toLowerCase()) || r.details.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Journal d'activité" subtitle="Traçabilité complète : connexions, planning, pannes, accès et personnalisation."
        icon={<ScrollText size={22} />}
        actions={
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-steel" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer (action, nom…)" className="pl-9 w-64" list="actions-list" />
            <datalist id="actions-list">{actions.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
        }
      />
      {rows == null ? <Spinner /> : filtered.length === 0 ? <Card><Empty text="Aucune entrée dans le journal." /></Card> : (
        <Card className="overflow-x-auto anim-fade-up">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left border-b border-gray-200 bg-gray-50">
                {["Horodatage", "Utilisateur", "Action", "Détails"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-steel">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                  <td className="px-4 py-2.5 font-semibold whitespace-nowrap">{r.userName}</td>
                  <td className="px-4 py-2.5"><Badge color={r.action.includes("panne") ? "red" : r.action.startsWith("Planning") ? "brand" : r.action.includes("Accès") || r.action.includes("Code") ? "amber" : "gray"}>{r.action}</Badge></td>
                  <td className="px-4 py-2.5 text-gray-600">{r.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
