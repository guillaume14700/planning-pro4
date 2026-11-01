"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarDays, Siren, Info, CalendarOff, CheckCheck } from "lucide-react";
import { useApp, api, NotifT, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Empty, PageHead, Spinner } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";

const TYPE_UI: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  planning: { icon: <CalendarDays size={18} />, label: "Planning", cls: "bg-brand/10 text-brand" },
  panne: { icon: <Siren size={18} />, label: "Panne", cls: "bg-red-100 text-red-600" },
  conges: { icon: <CalendarOff size={18} />, label: "Absence", cls: "bg-sky-100 text-sky-700" },
  systeme: { icon: <Info size={18} />, label: "Système", cls: "bg-gray-200 text-gray-700" },
};

export default function NotificationsPage() {
  return <ModuleGate k="notifications"><Notifications /></ModuleGate>;
}

function Notifications() {
  const { setUnread, toast } = useApp();
  const [rows, setRows] = useState<NotifT[] | null>(null);

  const load = useCallback(async () => {
    setRows(await api<NotifT[]>("/api/notifications"));
  }, []);
  useEffect(() => { load().catch(() => setRows([])); }, [load]);

  async function markAll() {
    await api("/api/notifications", "POST", { all: true });
    setRows((r) => (r ?? []).map((n) => ({ ...n, read: true })));
    setUnread(0);
    toast("Tous les messages sont marqués comme lus", "ok");
  }

  async function markOne(n: NotifT) {
    if (n.read) return;
    await api("/api/notifications", "POST", { ids: [n.id] });
    setRows((r) => (r ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread(Math.max(0, (rows ?? []).filter((x) => !x.read).length - 1));
  }

  const unread = (rows ?? []).filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl">
      <PageHead
        title="Messages" subtitle="Modifications du planning, alertes panne, absences et infos de l'administrateur."
        icon={<Bell size={22} />}
        actions={<Button variant="outline" onClick={markAll} disabled={unread === 0}><CheckCheck size={16} /> Tout marquer lu</Button>}
      />
      {rows == null ? <Spinner /> : rows.length === 0 ? <Card><Empty text="Aucun message pour le moment." icon={<Bell size={28} />} /></Card> : (
        <div className="space-y-2.5">
          {rows.map((n, i) => {
            const ui = TYPE_UI[n.type] ?? TYPE_UI.systeme!;
            return (
              <button
                key={n.id}
                onClick={() => markOne(n)}
                className={`w-full text-left bg-white border rounded-lg p-4 flex gap-3.5 transition-all hover:shadow-md cursor-pointer anim-fade-up ${n.read ? "border-gray-200 opacity-80" : "border-brand/40 shadow-sm"} ${i < 4 ? `delay-${i + 1}` : ""}`}
              >
                <span className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${ui.cls}`}>{ui.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm leading-snug">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                  <p className="text-[11px] text-steel mt-1.5 uppercase tracking-wide flex items-center gap-2">
                    <Badge>{ui.label}</Badge> {fmtDateTime(n.createdAt)} · {n.createdByName}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
