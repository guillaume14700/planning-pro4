"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, useApp } from "./app-provider";
import { Button, Card, Confirm, Empty, ErrorNote, Field, Input, Modal, PageHead, Select, Spinner, Textarea } from "./ui";
import { todayStr } from "@/lib/utils";

export type CrudField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "tel" | "color";
  options?: { value: string; label: string }[];
  optionsFrom?: "vehicles" | "users" | "chantiers";
  required?: boolean;
  default?: string | number;
  hint?: string;
  placeholder?: string;
};

export type CrudColumn = {
  key: string;
  label: string;
  render?: (row: Record<string, any>) => ReactNode;
  className?: string;
};

export default function CrudModule({
  resource, title, subtitle, icon, fields, columns, canWrite, canDelete, addLabel = "Ajouter", emptyText = "Aucun élément pour le moment.", sortDesc,
}: {
  resource: string; title: string; subtitle?: string; icon?: ReactNode;
  fields: CrudField[]; columns: CrudColumn[];
  canWrite: boolean; canDelete?: boolean; addLabel?: string; emptyText?: string; sortDesc?: boolean;
}) {
  const { vehicles, users, chantiers, toast, refresh } = useApp();
  const [rows, setRows] = useState<Record<string, any>[] | null>(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    const data = await api<Record<string, any>[]>(`/api/${resource}`);
    setRows(sortDesc ? [...data].reverse() : data);
  }, [resource, sortDesc]);

  useEffect(() => { load().catch(() => setRows([])); }, [load]);

  function resolveOptions(f: CrudField) {
    if (f.optionsFrom === "vehicles") return vehicles.map((v) => ({ value: String(v.id), label: `${v.name} · ${v.plate}` }));
    if (f.optionsFrom === "users") return users.map((u) => ({ value: String(u.id), label: u.name }));
    if (f.optionsFrom === "chantiers") return chantiers.map((c) => ({ value: String(c.id), label: c.name }));
    return f.options ?? [];
  }

  function openCreate() {
    const init: Record<string, any> = {};
    for (const f of fields) {
      init[f.key] = f.default ?? (f.type === "date" ? todayStr() : f.type === "select" ? (resolveOptions(f)[0]?.value ?? "") : f.type === "color" ? "#F26A1B" : "");
    }
    setForm(init); setEditing(null); setError(""); setModal(true);
  }
  function openEdit(row: Record<string, any>) {
    const init: Record<string, any> = {};
    for (const f of fields) init[f.key] = row[f.key] ?? "";
    setForm(init); setEditing(row); setError(""); setModal(true);
  }

  async function save() {
    setBusy(true); setError("");
    try {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        let v = form[f.key];
        if (f.required && (v === "" || v == null)) throw new Error(`« ${f.label} » est obligatoire.`);
        if (f.type === "number" || f.optionsFrom) v = v === "" ? 0 : Number(v);
        payload[f.key] = v;
      }
      if (editing) await api(`/api/${resource}/${editing.id}`, "PATCH", payload);
      else await api(`/api/${resource}`, "POST", payload);
      toast(editing ? `${title} : modifié` : `${title} : ajouté`, "ok");
      setModal(false);
      await load();
      if (["vehicles", "chantiers"].includes(resource)) await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function doDelete() {
    if (toDelete == null) return;
    try {
      await api(`/api/${resource}/${toDelete}`, "DELETE");
      toast(`${title} : supprimé`, "ok");
      await load();
      if (["vehicles", "chantiers"].includes(resource)) await refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  return (
    <div>
      <PageHead title={title} subtitle={subtitle} icon={icon} actions={
        canWrite ? <Button onClick={openCreate}><Plus size={16} /> {addLabel}</Button> : undefined
      } />
      {rows == null ? <Spinner /> : rows.length === 0 ? (
        <Card><Empty text={emptyText} /></Card>
      ) : (
        <Card className="overflow-x-auto anim-fade-up">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left border-b border-gray-200 bg-gray-50">
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-steel">{c.label}</th>
                ))}
                {canWrite && <th className="px-4 py-2.5 w-24" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-brand/4 transition-colors">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                  {canWrite && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-gray-100 text-steel hover:text-coal cursor-pointer" title="Modifier" aria-label="Modifier">
                          <Pencil size={15} />
                        </button>
                        {(canDelete ?? true) && (
                          <button onClick={() => setToDelete(row.id)} className="p-1.5 rounded hover:bg-red-50 text-steel hover:text-red-600 cursor-pointer" title="Supprimer" aria-label="Supprimer">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Modifier — ${title}` : `Ajouter — ${title}`} footer={
        <>
          <Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
        </>
      }>
        <div className="space-y-3">
          {fields.map((f) => (
            <Field key={f.key} label={f.label} required={f.required} hint={f.hint}>
              {f.type === "select" ? (
                <Select value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  {resolveOptions(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea value={String(form[f.key] ?? "")} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              ) : f.type === "color" ? (
                <div className="flex items-center gap-2">
                  <input type="color" value={String(form[f.key] ?? "#F26A1B")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-10 h-9 rounded cursor-pointer border border-gray-300" />
                  <Input value={String(form[f.key] ?? "")} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ) : (
                <Input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "tel" ? "tel" : "text"}
                  value={String(form[f.key] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </Field>
          ))}
          <ErrorNote>{error}</ErrorNote>
        </div>
      </Modal>

      <Confirm
        open={toDelete != null}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        title="Confirmer la suppression"
        message="Cette action est définitive. Les utilisateurs concernés seront informés si cela impacte le planning."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  );
}
