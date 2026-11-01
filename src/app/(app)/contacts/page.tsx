"use client";

import { Contact, Phone, Mail } from "lucide-react";
import { useApp, ModuleGate } from "@/components/app-provider";
import CrudModule from "@/components/crud";
import { Badge } from "@/components/ui";

export default function ContactsPage() {
  return <ModuleGate k="contacts"><Contacts /></ModuleGate>;
}

function Contacts() {
  const { me, users } = useApp();
  return (
    <div>
      <CrudModule
        resource="contacts"
        title="Annuaire"
        subtitle="Clients, chefs de chantier, dépanneurs et services utiles."
        icon={<Contact size={22} />}
        canWrite={me.role === "admin"}
        addLabel="Nouveau contact"
        emptyText="Aucun contact enregistré."
        fields={[
          { key: "name", label: "Nom", type: "text", required: true },
          { key: "company", label: "Société", type: "text" },
          { key: "role", label: "Fonction", type: "text" },
          { key: "phone", label: "Téléphone", type: "tel" },
          { key: "email", label: "Email", type: "text" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        columns={[
          { key: "name", label: "Nom", render: (r) => <span className="font-bold">{r.name}</span> },
          { key: "company", label: "Société / fonction", render: (r) => <span>{r.company}<span className="block text-xs text-steel">{r.role}</span></span> },
          { key: "phone", label: "Téléphone", render: (r) => r.phone ? <a href={`tel:${String(r.phone).replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-bold text-brand hover:underline"><Phone size={13} />{r.phone}</a> : "—" },
          { key: "email", label: "Email", render: (r) => r.email ? <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 text-brand hover:underline text-xs"><Mail size={13} />{r.email}</a> : "—" },
          { key: "notes", label: "Notes", render: (r) => <span className="text-xs text-steel">{r.notes}</span> },
        ]}
      />
      {/* Équipe interne */}
      <h2 className="font-display text-xl font-extrabold uppercase mt-8 mb-3">Équipe interne</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {users.filter((u) => u.active).map((u) => (
          <div key={u.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <span className="w-10 h-10 rounded-md flex items-center justify-center text-white font-extrabold text-sm" style={{ background: u.color }}>
              {u.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{u.name} {u.role === "admin" && <Badge color="brand">Admin</Badge>}</p>
              <p className="text-xs text-steel truncate">{u.job}</p>
              {u.phone && <a href={`tel:${u.phone.replace(/\s/g, "")}`} className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1"><Phone size={11} />{u.phone}</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}