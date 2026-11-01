"use client";

import { useEffect, useState } from "react";
import { Link2, Copy, CheckCircle2, Share2, ExternalLink, TriangleAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "./app-provider";
import { Button, Modal } from "./ui";

/** Origine courante de l'application (le lien à partager), disponible dès le premier rendu. */
export function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

/** Vrai si l'app tourne dans l'aperçu sandbox arena.ai (lien non partageable à l'extérieur). */
export function useIsPreview() {
  const [preview, setPreview] = useState(false);
  useEffect(() => setPreview(/\.e2b\.app$/.test(window.location.hostname)), []);
  return preview;
}

export function PreviewWarning({ compact }: { compact?: boolean }) {
  if (!useIsPreview()) return null;
  return (
    <p className={`text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md flex gap-2 ${compact ? "px-2.5 py-1.5" : "px-3 py-2.5"}`}>
      <TriangleAlert size={15} className="shrink-0 mt-0.5" />
      <span>
        Vous êtes dans l'<strong>aperçu arena.ai</strong> : ce lien ne s'ouvre que dans le panneau d'aperçu Arena, pas sur un autre navigateur.
        Pour le partager à vos chauffeurs, déployez l'application — guide en 4 étapes dans <strong>Administration → Partage & installation</strong>.
      </span>
    </p>
  );
}

function useCopy() {
  const { toast } = useApp();
  const [copied, setCopied] = useState(false);
  async function copy(text: string, message = "Lien copié — envoyez-le à vos chauffeurs") {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast(message, "ok");
  }
  return { copied, copy };
}

async function shareUrl(url: string, appName: string, companyName: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${appName} — ${companyName}`,
        text: `Accède au planning de l'équipe ${companyName}. Ouvre ce lien et saisis ton code personnel. Guide d'installation : ${url}/installer`,
        url,
      });
      return;
    } catch { /* annulé par l'utilisateur */ }
  }
  await navigator.clipboard.writeText(url);
}

/** Bouton « lien de partage » dans la barre du haut (admin) → modale avec URL + QR code. */
export function ShareLinkButton() {
  const { settings } = useApp();
  const origin = useOrigin();
  const { copied, copy } = useCopy();
  const [open, setOpen] = useState(false);
  const url = origin || "…";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Lien de l'application à partager"
        aria-label="Lien de l'application à partager"
        className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-coal"
      >
        <Link2 size={20} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="🔗 Lien de votre application" footer={<Button variant="ghost" onClick={() => setOpen(false)}>Fermer</Button>}>
        <div className="space-y-4">
          <PreviewWarning />
          <p className="text-sm text-steel">
            Envoyez ce lien à vos chauffeurs : il ouvre l'écran de connexion, où chacun saisit <strong className="text-coal">son code personnel</strong>.
          </p>
          <div className="bg-coal rounded-md p-3.5 flex items-center gap-2.5">
            <Link2 size={17} className="text-accent shrink-0" />
            <span className="font-mono text-sm text-white break-all flex-1">{url}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="dark" onClick={() => copy(origin)}>
              {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />} {copied ? "Copié !" : "Copier le lien"}
            </Button>
            <Button onClick={() => shareUrl(origin, settings.appName, settings.companyName)}>
              <Share2 size={15} /> Partager (SMS/WhatsApp)
            </Button>
            <a href="/installer" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline px-2 py-2">
              <ExternalLink size={14} /> Guide d'installation
            </a>
          </div>
          {origin && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-white border-2 border-coal rounded-lg p-2.5 shadow-sm">
                <QRCodeSVG value={origin} size={112} fgColor="#16191e" level="M" />
              </div>
              <p className="text-xs text-steel max-w-56">
                QR code à faire scanner au dépôt ou à imprimer et afficher dans les véhicules.
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

/** Bandeau clair affichant le lien directement sur le tableau de bord (admin). */
export function ShareLinkStrip() {
  const { settings } = useApp();
  const origin = useOrigin();
  const preview = useIsPreview();
  const { copied, copy } = useCopy();
  const url = origin || "…";

  return (
    <div className="bg-white/8 border border-white/15 rounded-lg p-3 flex flex-wrap items-center gap-3">
      {preview && (
        <p className="w-full text-[11px] font-semibold text-amber-300 flex items-start gap-1.5 mb-0.5">
          <TriangleAlert size={13} className="shrink-0 mt-0.5" />
          Aperçu arena.ai : ce lien ne s'ouvre que dans le panneau d'aperçu Arena. Pour un lien partageable, déployez l'app (Administration → Partage & installation).
        </p>
      )}
      <Link2 size={18} className="text-accent shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">Le lien de l'application à partager</p>
        <p className="font-mono text-sm text-white break-all">{url}</p>
      </div>
      <button
        onClick={() => copy(origin)}
        className="inline-flex items-center gap-1.5 bg-accent hover:brightness-105 text-coal text-xs font-display font-extrabold uppercase tracking-wide rounded-md px-3 py-2 transition-all cursor-pointer"
      >
        {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copied ? "Copié !" : "Copier"}
      </button>
      <button
        onClick={() => shareUrl(origin, settings.appName, settings.companyName)}
        className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-display font-extrabold uppercase tracking-wide rounded-md px-3 py-2 transition-all cursor-pointer"
      >
        <Share2 size={14} /> Partager
      </button>
      <a href="/installer" className="text-xs font-bold text-gray-300 hover:text-white underline underline-offset-2">
        Guide d'installation
      </a>
    </div>
  );
}
