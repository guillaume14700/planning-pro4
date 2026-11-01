"use client";

import { useState } from "react";
import { HardHat, Plus, MapPin, Phone, Route, Clock, Pencil, Trash2, User, StickyNote, Globe, Navigation, Calculator, Upload, Download, FileSpreadsheet, CheckCircle2, TriangleAlert } from "lucide-react";
import { useApp, api, ChantierT, ModuleGate } from "@/components/app-provider";
import { Badge, Button, Card, Confirm, Empty, ErrorNote, Field, Input, Modal, PageHead, Textarea, Toggle } from "@/components/ui";
import { PALETTE } from "@/lib/utils";

type Form = { id?: number; name: string; client: string; address: string; contactName: string; contactPhone: string; distanceKm: string; travelMin: string; lat: string; lng: string; color: string; notes: string; active: boolean };

const empty: Form = { name: "", client: "", address: "", contactName: "", contactPhone: "", distanceKm: "", travelMin: "", lat: "", lng: "", color: PALETTE[0]!, notes: "", active: true };

export default function ChantiersPage() {
  return <ModuleGate k="chantiers"><Chantiers /></ModuleGate>;
}

function Chantiers() {
  const { me, chantiers, refresh, toast, settings } = useApp();
  const isAdmin = me.role === "admin";
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<number | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [geoBusy, setGeoBusy] = useState<string | null>(null);

  const shown = isAdmin ? chantiers : chantiers.filter((c) => c.active);

  /* Localise + calcule distance/trajet pour TOUS les chantiers sans coordonnées (file d'attente polie, ~2 s/site). */
  async function locateAll() {
    const targets = chantiers.filter((c) => c.active && c.address && (c.lat == null || c.lng == null));
    if (targets.length === 0) { toast("Tous les chantiers ayant une adresse sont déjà placés sur la carte", "ok"); return; }
    let ok = 0; let ko = 0;
    for (let i = 0; i < targets.length; i++) {
      const c = targets[i]!;
      setGeoBusy(`${i + 1}/${targets.length}`);
      try {
        const g = await api<{ lat: number; lon: number }>(`/api/geo?q=${encodeURIComponent(c.address)}`);
        const r = await api<{ distanceKm: number; travelMin: number }>(`/api/geo?from=${settings.depotLat},${settings.depotLng}&to=${g.lat},${g.lon}`);
        await api(`/api/chantiers/${c.id}`, "PATCH", { lat: g.lat, lng: g.lon, distanceKm: r.distanceKm, travelMin: r.travelMin });
        ok++;
      } catch { ko++; }
      await new Promise((res) => setTimeout(res, 1100));
    }
    setGeoBusy(null);
    await refresh();
    toast(`📍 Cartographie terminée : ${ok} chantier(s) placé(s) et mesuré(s)${ko ? `, ${ko} adresse(s) non trouvée(s)` : ""}`, ko ? "panne" : "ok");
  }

  /* Géolocalise l'adresse (OpenStreetMap) puis calcule distance/temps depuis le dépôt (OSRM). */
  async function locate(c: ChantierT) {
    if (!c.address) { toast("Renseignez d'abord l'adresse du chantier", "panne"); return; }
    try {
      const g = await api<{ lat: number; lon: number }>(`/api/geo?q=${encodeURIComponent(c.address)}`);
      await api(`/api/chantiers/${c.id}`, "PATCH", { lat: g.lat, lng: g.lon });
      toast("📍 Chantier placé sur la carte", "ok");
      await refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  async function calcRoute(c: ChantierT) {
    if (c.lat == null || c.lng == null) { toast("Localisez d'abord l'adresse du chantier", "panne"); return; }
    try {
      const r = await api<{ distanceKm: number; travelMin: number }>(`/api/geo?from=${settings.depotLat},${settings.depotLng}&to=${c.lat},${c.lng}`);
      await api(`/api/chantiers/${c.id}`, "PATCH", { distanceKm: r.distanceKm, travelMin: r.travelMin });
      toast(`🧮 Calculé : ${r.distanceKm} km · ${r.travelMin} min — enregistrés`, "ok");
      await refresh();
    } catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  const osmSrc = (lat: number, lng: number) =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012},${lat - 0.008},${lng + 0.012},${lat + 0.008}&layer=mapnik&marker=${lat},${lng}`;
  const depotQ = encodeURIComponent(settings.depotAddress || `${settings.depotLat},${settings.depotLng}`);

  async function save() {
    if (!form) return;
    if (!form.name.trim()) { setError("Le nom du chantier est obligatoire."); return; }
    setBusy(true); setError("");
    try {
      const payload = {
        name: form.name, client: form.client, address: form.address, contactName: form.contactName,
        contactPhone: form.contactPhone, distanceKm: Number(form.distanceKm || 0), travelMin: Number(form.travelMin || 0),
        lat: form.lat === "" ? null : Number(form.lat), lng: form.lng === "" ? null : Number(form.lng),
        color: form.color, notes: form.notes, active: form.active,
      };
      if (form.id) await api(`/api/chantiers/${form.id}`, "PATCH", payload);
      else await api("/api/chantiers", "POST", payload);
      toast(form.id ? "Chantier modifié" : "Chantier ajouté", "ok");
      setForm(null);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  async function doDelete() {
    if (del == null) return;
    try { await api(`/api/chantiers/${del}`, "DELETE"); toast("Chantier supprimé", "ok"); await refresh(); }
    catch (e) { toast(e instanceof Error ? e.message : "Erreur", "panne"); }
  }

  return (
    <div>
      <PageHead
        title="Chantiers" subtitle="Distance dépôt ↔ chantier et temps de trajet utilisés dans tout le planning."
        icon={<HardHat size={22} />}
        actions={isAdmin ? (
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload size={16} /> Importer une liste (CSV)</Button>
            <Button variant="outline" onClick={locateAll} disabled={geoBusy != null}>
              <Navigation size={16} /> {geoBusy ? `Cartographie ${geoBusy}…` : "Tout placer & calculer"}
            </Button>
            <Button onClick={() => { setError(""); setForm({ ...empty }); }}><Plus size={16} /> Nouveau chantier</Button>
          </>
        ) : undefined}
      />
      {shown.length === 0 ? <Card><Empty text="Aucun chantier enregistré." icon={<HardHat size={28} />} /></Card> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((c: ChantierT, i) => (
            <Card key={c.id} className={`overflow-hidden anim-fade-up delay-${(i % 4) + 1} ${!c.active ? "opacity-60" : ""}`}>
              <div className="h-1.5" style={{ background: c.color }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-extrabold uppercase leading-tight">{c.name}</h3>
                    <p className="text-xs text-steel font-semibold">{c.client || "Client non renseigné"}</p>
                  </div>
                  {!c.active && <Badge>Inactif</Badge>}
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge color="coal"><Route size={11} /> {c.distanceKm} km</Badge>
                  <Badge color="coal"><Clock size={11} /> {c.travelMin} min</Badge>
                  <Badge color="brand">{c.distanceKm * 2} km A/R</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-3 flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0 text-steel" />{c.address || "Adresse non renseignée"}</p>
                {c.contactName && (
                  <p className="text-sm text-gray-600 mt-1.5 flex items-center gap-1.5">
                    <User size={14} className="shrink-0 text-steel" />{c.contactName}
                    {c.contactPhone && <a href={`tel:${c.contactPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 text-brand font-bold hover:underline ml-1"><Phone size={12} />{c.contactPhone}</a>}
                  </p>
                )}
                {c.notes && <p className="text-xs text-steel bg-gray-50 border border-gray-200 rounded-md px-2.5 py-2 mt-3 flex gap-1.5"><StickyNote size={13} className="shrink-0 mt-0.5" />{c.notes}</p>}

                {/* Carte + calcul de distance */}
                {c.lat != null && c.lng != null ? (
                  <div className="mt-3">
                    <iframe
                      title={`Carte du chantier ${c.name}`}
                      className="w-full h-40 rounded-md border border-gray-200"
                      loading="lazy"
                      src={osmSrc(c.lat, c.lng)}
                    />
                    <div className="flex gap-3 mt-1.5 text-xs font-bold flex-wrap">
                      <a className="text-brand hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`}>
                        <Globe size={12} /> Agrandir / satellite
                      </a>
                      <a className="text-brand hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&origin=${depotQ}&destination=${c.lat},${c.lng}`}>
                        <Navigation size={12} /> Itinéraire dépôt → chantier
                      </a>
                    </div>
                    {isAdmin && (
                      <Button variant="outline" className="!py-1.5 text-xs mt-2" onClick={() => calcRoute(c)}>
                        <Calculator size={13} /> Calculer distance & trajet depuis le dépôt
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2 flex-wrap items-center">
                    <a className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || c.name)}`}>
                      <Globe size={12} /> Voir sur Google Maps
                    </a>
                    {isAdmin && (
                      <Button variant="outline" className="!py-1 text-xs" onClick={() => locate(c)}>
                        <MapPin size={12} /> Placer sur la carte
                      </Button>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button variant="outline" className="flex-1 !py-1.5 text-xs" onClick={() => { setError(""); setForm({ id: c.id, name: c.name, client: c.client, address: c.address, contactName: c.contactName, contactPhone: c.contactPhone, distanceKm: String(c.distanceKm), travelMin: String(c.travelMin), lat: c.lat?.toString() ?? "", lng: c.lng?.toString() ?? "", color: c.color, notes: c.notes, active: c.active }); }}>
                      <Pencil size={13} /> Modifier
                    </Button>
                    <Button variant="ghost" className="!py-1.5 text-xs text-red-600" onClick={() => setDel(c.id)}><Trash2 size={13} /></Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={form != null} onClose={() => setForm(null)} wide title={form?.id ? "Modifier le chantier" : "Nouveau chantier"} footer={
        <><Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button><Button onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button></>
      }>
        {form && (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nom du chantier" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Client / entreprise"><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Field>
            </div>
            <Field label="Adresse complète"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Contact sur site"><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></Field>
              <Field label="Téléphone contact"><Input type="tel" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Distance dépôt (km)" required hint="aller simple"><Input type="number" min={0} step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} /></Field>
              <Field label="Trajet (min)" required hint="PL, aller simple"><Input type="number" min={0} value={form.travelMin} onChange={(e) => setForm({ ...form, travelMin: e.target.value })} /></Field>
              <Field label="Latitude" hint="carte / météo"><Input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="45.75" /></Field>
              <Field label="Longitude" hint="carte / météo"><Input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="4.85" /></Field>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Button variant="outline" className="text-xs" onClick={async () => {
                if (!form.address.trim()) { setError("Renseignez d'abord l'adresse complète."); return; }
                setError("");
                try {
                  const g = await api<{ lat: number; lon: number }>(`/api/geo?q=${encodeURIComponent(form.address)}`);
                  setForm({ ...form, lat: String(g.lat), lng: String(g.lon) });
                  toast("📍 Adresse localisée — enregistrez", "ok");
                } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
              }}><MapPin size={14} /> Localiser l'adresse</Button>
              <Button variant="outline" className="text-xs" onClick={async () => {
                if (!form.lat || !form.lng) { setError("Cliquez d'abord sur « Localiser l'adresse »."); return; }
                setError("");
                try {
                  const r = await api<{ distanceKm: number; travelMin: number }>(`/api/geo?from=${settings.depotLat},${settings.depotLng}&to=${form.lat},${form.lng}`);
                  setForm({ ...form, distanceKm: String(r.distanceKm), travelMin: String(r.travelMin) });
                  toast(`🧮 ${r.distanceKm} km · ${r.travelMin} min — enregistrez`, "ok");
                } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
              }}><Calculator size={14} /> Calculer distance & trajet depuis le dépôt</Button>
              <a className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 ml-auto" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&origin=${depotQ}&destination=${encodeURIComponent(form.address || form.name)}`}>
                <Navigation size={13} /> Vérifier sur Google Maps
              </a>
            </div>
            {form.lat && form.lng && (
              <iframe title="Aperçu carte" className="w-full h-40 rounded-md border border-gray-200" loading="lazy" src={osmSrc(Number(form.lat), Number(form.lng))} />
            )}
            <Field label="Couleur planning">
              <div className="flex gap-2 flex-wrap">
                {PALETTE.map((p) => (
                  <button key={p} type="button" onClick={() => setForm({ ...form, color: p })} className={`w-8 h-8 rounded-md cursor-pointer transition-transform ${form.color === p ? "ring-2 ring-offset-2 ring-coal scale-110" : "hover:scale-105"}`} style={{ background: p }} aria-label={`Couleur ${p}`} />
                ))}
              </div>
            </Field>
            <Field label="Consignes d'accès / sécurité"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <div className="flex items-center gap-3"><Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Chantier actif" /><span className="text-sm font-semibold">Chantier actif {form.active ? "" : "(masqué pour les utilisateurs)"}</span></div>
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
      </Modal>

      <Confirm open={del != null} onClose={() => setDel(null)} onConfirm={doDelete} title="Supprimer le chantier" message="Les missions liées resteront au planning mais sans fiche chantier. Préférez désactiver le chantier si des missions existent." confirmLabel="Supprimer" danger />

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}

/* ================= IMPORT CSV ================= */

function parseCSV(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, "");
  const nl = t.indexOf("\n");
  const firstLine = nl === -1 ? t : t.slice(0, nl);
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  const delim = semi >= comma ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!;
    if (inQ) {
      if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell.trim() !== "" || row.length) { row.push(cell.trim()); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ""));
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const ALIASES: Record<string, string[]> = {
  name: ["nom", "name", "chantier", "nomchantier", "nomduchantier", "libelle", "affaire"],
  client: ["client", "entreprise", "societe", "maitreouvrage"],
  address: ["adresse", "address", "lieu", "localisation", "ville"],
  contactName: ["contact", "nomcontact", "contactchantier", "interlocuteur", "contactsurplace", "chefdechantier"],
  contactPhone: ["telephone", "tel", "phone", "numero", "telephonecontact", "telcontact"],
  distanceKm: ["distancekm", "distance", "km", "kms"],
  travelMin: ["trajetmin", "trajet", "tempsmin", "temps", "minutes", "duree", "dureemin", "tempsdemin"],
  notes: ["notes", "note", "commentaire", "commentaires", "consignes", "observation", "observations", "remarque", "remarques"],
};

type Parsed = { name: string; client: string; address: string; contactName: string; contactPhone: string; distanceKm: string; travelMin: string; notes: string };

function mapRows(grid: string[][]): { rows: Parsed[]; error?: string; hasHeader: boolean } {
  if (grid.length === 0) return { rows: [], error: "Fichier vide.", hasHeader: false };
  const first = grid[0]!.map(norm);
  const mapping: (keyof Parsed | null)[] = first.map((h) => {
    for (const [key, list] of Object.entries(ALIASES)) if (list.includes(h)) return key as keyof Parsed;
    return null;
  });
  const hasHeader = mapping.includes("name");
  const body = hasHeader ? grid.slice(1) : grid;
  const rows: Parsed[] = [];
  for (const r of body) {
    const o: Parsed = { name: "", client: "", address: "", contactName: "", contactPhone: "", distanceKm: "", travelMin: "", notes: "" };
    if (hasHeader) {
      mapping.forEach((k, i) => { if (k) o[k] = (r[i] ?? "").trim(); });
    } else if (r.length <= 2) {
      o.name = (r[0] ?? "").trim();
      o.address = (r[1] ?? "").trim();
    } else {
      return { rows: [], hasHeader, error: "Fichier non reconnu : utilisez le modèle (1re ligne d'en-tête : nom;client;adresse;contact;telephone;distance_km;trajet_min;notes)." };
    }
    if (o.name) rows.push(o);
  }
  return { rows, hasHeader, error: rows.length === 0 ? "Aucun chantier trouvé dans le fichier (colonne « nom » vide ?)." : undefined };
}

function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast, refresh } = useApp();
  const [rows, setRows] = useState<Parsed[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; duplicates: string[]; errors: { line: number; reason: string }[] } | null>(null);

  function downloadTemplate() {
    const csv = "nom;client;adresse;contact;telephone;distance_km;trajet_min;notes\n" +
      "Résidence Les Cèdres;Bouygues Bâtiment;8 cours Émile Zola, 69100 Villeurbanne;M. Lambert;06 12 34 56 78;;;Livraisons avant 9h\n" +
      "Échangeur A7 Givors;Eiffage Route;Zone des Vernes, 69700 Givors;;;;;\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "modele-chantiers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onFile(f: File | null) {
    if (!f) return;
    setResult(null); setParseError(""); setRows(null);
    setFileName(f.name);
    const text = await f.text();
    const { rows: parsed, error } = mapRows(parseCSV(text));
    if (error) { setParseError(error); return; }
    setRows(parsed.slice(0, 500));
  }

  async function doImport() {
    if (!rows?.length) return;
    setBusy(true);
    try {
      const res = await api<{ imported: number; duplicates: string[]; errors: { line: number; reason: string }[] }>("/api/import/chantiers", "POST", { rows });
      setResult(res);
      toast(`📥 ${res.imported} chantier(s) importé(s) — équipe notifiée`, "ok");
      await refresh();
    } catch (e) { setParseError(e instanceof Error ? e.message : "Erreur"); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} wide title={<span className="flex items-center gap-2"><FileSpreadsheet size={20} className="text-brand" /> Importer une liste de chantiers</span>} footer={
      result ? <Button onClick={onClose}>Fermer</Button> : (
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={doImport} disabled={!rows?.length || busy}>{busy ? "Import en cours…" : `Importer ${rows?.length ?? 0} chantier(s)`}</Button>
        </>
      )
    }>
      <div className="space-y-4">
        {result ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2.5 flex items-center gap-2">
              <CheckCircle2 size={17} /> {result.imported} chantier(s) importé(s) avec succès — l'équipe a été notifiée.
            </p>
            {result.duplicates.length > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded-md px-3 py-2">
                <TriangleAlert size={13} className="inline mr-1" /> Doublon(s) ignoré(s) (déjà existants) : {result.duplicates.join(", ")}
              </p>
            )}
            {result.errors.length > 0 && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                Ligne(s) en erreur : {result.errors.map((e) => `n°${e.line} (${e.reason})`).join(", ")}
              </p>
            )}
            <p className="text-xs text-steel">💡 Astuce : bouton « Tout placer & calculer » sur la page Chantiers → toutes les adresses sont placées sur la carte et les distances/temps de trajet depuis le dépôt sont calculés automatiquement.</p>
          </div>
        ) : (
          <>
            <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
              <li><button onClick={downloadTemplate} className="inline-flex items-center gap-1.5 text-brand font-bold underline hover:text-coal cursor-pointer"><Download size={14} /> Télécharger le modèle (modele-chantiers.csv)</button></li>
              <li>Ouvrez-le dans <strong>Excel</strong> (ou LibreOffice) et remplissez une ligne par chantier — seule la colonne <strong>nom</strong> est obligatoire, l'<strong>adresse complète</strong> est fortement conseillée (carte + calcul de distance)</li>
              <li>Enregistrez : <strong>Fichier → Enregistrer sous → format « CSV UTF-8 (délimité par des points-virgules) »</strong></li>
              <li>Ci-dessous, sélectionnez votre fichier, vérifiez l'aperçu, puis importez</li>
            </ol>
            <label className="block border-2 border-dashed border-gray-300 hover:border-brand rounded-lg p-5 text-center cursor-pointer transition-colors">
              <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
              <Upload size={22} className="mx-auto text-brand mb-1.5" />
              <span className="text-sm font-bold">Cliquez pour choisir votre fichier .csv</span>
              {fileName && <span className="block text-xs text-steel mt-1 font-mono">{fileName}</span>}
              <span className="block text-xs text-steel mt-1">Séparateur point-virgule « ; » ou virgule « , » — les deux fonctionnent</span>
            </label>
            {parseError && <ErrorNote>{parseError}</ErrorNote>}
            {rows && rows.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2">Aperçu — {rows.length} chantier(s) détecté(s) :</p>
                <div className="border border-gray-200 rounded-md overflow-x-auto max-h-52">
                  <table className="w-full text-xs min-w-[560px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>{["Nom", "Client", "Adresse", "Contact", "Tél", "km", "min", "Notes"].map((h) => <th key={h} className="text-left px-2.5 py-1.5 font-bold uppercase text-[10px] text-steel">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 8).map((r, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-2.5 py-1.5 font-bold max-w-40 truncate">{r.name}</td>
                          <td className="px-2.5 py-1.5 max-w-32 truncate">{r.client}</td>
                          <td className="px-2.5 py-1.5 max-w-48 truncate">{r.address}</td>
                          <td className="px-2.5 py-1.5 max-w-28 truncate">{r.contactName}</td>
                          <td className="px-2.5 py-1.5">{r.contactPhone}</td>
                          <td className="px-2.5 py-1.5">{r.distanceKm}</td>
                          <td className="px-2.5 py-1.5">{r.travelMin}</td>
                          <td className="px-2.5 py-1.5 max-w-40 truncate">{r.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 8 && <p className="text-xs text-steel mt-1.5">… et {rows.length - 8} autre(s). Les chantiers portant un nom déjà existant seront ignorés (pas de doublon).</p>}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
