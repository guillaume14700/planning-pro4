"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, CheckCircle2, Loader2, TriangleAlert, FolderOpen, ExternalLink, KeyRound } from "lucide-react";

export default function TelechargerPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "unauth" | "error">("idle");

  async function start() {
    setStatus("loading");
    try {
      const res = await fetch("/api/download-code");
      if (res.status === 401) { setStatus("unauth"); return; }
      if (!res.ok) throw new Error("download");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "planning-pro-code.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="hazard h-2 rounded-full w-32 mb-5" />
      <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase leading-none mb-2">
        Télécharger le code
      </h1>
      <p className="text-sm text-steel mb-6">
        Étape 1 de la mise en ligne : récupérez le fichier <strong className="font-mono text-coal">planning-pro-code.zip</strong>,
        puis déposez-le sur GitHub (le mini-guide vous attend après).
      </p>

      {/* Le gros bouton */}
      <div className="bg-white border-2 border-brand rounded-lg p-6 md:p-8 text-center shadow-sm">
        {status === "loading" ? (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 size={40} className="animate-spin text-brand" />
            <p className="font-display text-xl font-extrabold uppercase">Préparation du fichier…</p>
            <p className="text-sm text-steel">Cela prend quelques secondes, ne fermez pas la page.</p>
          </div>
        ) : (
          <button
            onClick={start}
            className="inline-flex items-center gap-3 bg-brand hover:brightness-110 active:scale-[0.98] text-white font-display font-extrabold uppercase tracking-wide text-xl md:text-2xl px-8 py-5 rounded-lg transition-all shadow-lg cursor-pointer"
          >
            <Download size={30} /> Télécharger le code (.zip)
          </button>
        )}

        {status === "ok" && (
          <div className="mt-5 bg-green-50 border border-green-300 text-green-800 rounded-md px-4 py-3 text-sm font-semibold flex items-start gap-2 text-left anim-fade-up">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>
              ✅ Le téléchargement a démarré ! Le fichier <strong className="font-mono">planning-pro-code.zip</strong> se trouve dans
              votre dossier <strong>« Téléchargements »</strong> (Explorateur/Finder → colonne de gauche).
              Vous ne le voyez pas ? Appuyez sur <strong>Ctrl + J</strong> dans le navigateur : la liste des téléchargements s'affiche.
            </span>
          </div>
        )}

        {status === "unauth" && (
          <div className="mt-5 bg-amber-50 border border-amber-300 text-amber-900 rounded-md px-4 py-3 text-sm font-semibold flex items-start gap-2 text-left anim-fade-up">
            <KeyRound size={18} className="shrink-0 mt-0.5" />
            <span>
              Vous n'êtes pas connecté en <strong>administrateur</strong>. Retournez à l'écran de connexion,
              entrez votre code admin (celui créé au départ : <span className="font-mono">2468</span> ou votre nouveau code),
              puis revenez sur cette page et recliquez.
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="mt-5 bg-red-50 border border-red-300 text-red-800 rounded-md px-4 py-3 text-sm font-semibold flex items-start gap-2 text-left anim-fade-up">
            <TriangleAlert size={18} className="shrink-0 mt-0.5" />
            <span>
              Le téléchargement a échoué (connexion interrompue ou navigateur qui bloque).
              Réessayez, ou utilisez la <strong>méthode de secours</strong> ci-dessous.
            </span>
          </div>
        )}

        {/* Méthode de secours */}
        <div className="mt-5 pt-4 border-t border-gray-200 text-sm">
          <p className="text-steel mb-2">Rien ne se télécharge avec le gros bouton ? Méthode de secours :</p>
          <a
            href="/api/download-code"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-coal hover:bg-coal-2 text-accent font-display font-bold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all"
          >
            <ExternalLink size={15} /> Ouvrir le téléchargement dans un nouvel onglet
          </a>
        </div>
      </div>

      {/* Et après */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-display text-xl font-extrabold uppercase mb-3">Une fois le .zip téléchargé :</h2>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            Ouvrez votre dossier <strong>« Téléchargements »</strong> et faites un <strong>clic droit</strong> sur
            <span className="font-mono font-semibold"> planning-pro-code.zip</span> → <strong>« Extraire tout »</strong> → « Extraire ».
            <span className="inline-flex align-middle ml-1.5 text-steel"><FolderOpen size={15} /></span>
          </li>
          <li>Le dossier extrait contient <strong>directement</strong> <span className="font-mono">package.json</span> et <span className="font-mono">src</span> : c'est le bon, rien à trier.</li>
          <li>
            Suivez ensuite le mini-guide pour le déposer sur GitHub :{" "}
            <Link href="/guide-github" className="text-brand font-bold underline hover:text-coal">
              ouvrir le mini-guide GitHub illustré →
            </Link>
          </li>
        </ol>
      </div>

      <p className="text-xs text-steel mt-4 pb-4">
        💡 Ce ZIP contient tout le projet (sans données personnelles ni mots de passe). Il est généré en direct depuis le serveur
        à chaque clic — c'est toujours la dernière version de votre application.
      </p>
    </div>
  );
}
