import Link from "next/link";
import { ArrowLeft, Rocket, ServerCog, Wallet, Timer, Mail, ShieldCheck } from "lucide-react";
import { getSettingsSafe } from "@/lib/server";
import DeployGuide from "@/components/deploy-guide";

export const dynamic = "force-dynamic";

export default async function DeploiementPage() {
  const s = await getSettingsSafe();

  return (
    <div className="min-h-screen" style={{ background: "#eef0f2" }}>
      <div className="hazard h-3" />

      <header className="coal-texture text-white">
        <div className="max-w-3xl mx-auto px-5 py-7">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft size={15} /> Retour à la connexion
          </Link>
          <div className="hazard h-1.5 w-24 rounded-full mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase leading-none">
            Déployer l&apos;application
          </h1>
          <p className="mt-3 text-gray-300 max-w-xl">
            Mettez <strong className="text-white">{s.appName}</strong> en ligne sur votre propre lien permanent,
            partageable avec tous vos chauffeurs. Suivez les étapes dans l&apos;ordre et cochez-les au fur et à mesure —
            votre progression est sauvegardée.
          </p>
          <div className="flex flex-wrap gap-2 mt-5 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-md px-3 py-2 font-bold"><Wallet size={14} className="text-accent" /> 100 % gratuit (hébergement + base)</span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-md px-3 py-2 font-bold"><Timer size={14} className="text-accent" /> ≈ 25 minutes au total</span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-md px-3 py-2 font-bold"><ServerCog size={14} className="text-accent" /> Aucune commande technique</span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-md px-3 py-2 font-bold"><Mail size={14} className="text-accent" /> Il faut : une adresse e-mail</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {/* Résumé du parcours */}
        <div className="bg-brand/10 border border-brand/30 rounded-lg p-4 mb-6 text-sm text-gray-800">
          <p className="font-bold mb-1 flex items-center gap-2"><Rocket size={16} className="text-brand" /> Le parcours en une phrase</p>
          <p>
            Votre code part sur <strong>GitHub</strong> (le coffre), <strong>Vercel</strong> fabrique le site (votre lien),
            et <strong>Neon</strong> contient les données (planning, utilisateurs). Au premier lancement, l&apos;application
            configure sa base <strong>toute seule</strong> et crée votre compte administrateur — code <span className="font-mono font-bold">2468</span>.
          </p>
        </div>

        <DeployGuide />

        <section className="coal-texture text-white rounded-lg p-5 mt-8">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-2 flex items-center gap-2">
            <ShieldCheck size={20} className="text-accent" /> Une fois en ligne, gardez ces réflexes
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>🔑 Changez le code admin <span className="font-mono text-white">2468</span> dès la première connexion, puis créez un code personnel par chauffeur.</li>
            <li>🚫 Un chauffeur quitte l&apos;entreprise ? Administration → Utilisateurs → « Interdire l&apos;accès » (effet immédiat, sessions fermées).</li>
            <li>💾 Sauvegardez la base chaque semaine (Neon conserve déjà un historique automatique).</li>
            <li>📱 Faites installer l&apos;application sur les téléphones (guide <span className="font-mono text-white">/installer</span>) pour recevoir les alertes panne comme une vraie appli.</li>
          </ul>
        </section>

        <p className="text-xs text-steel mt-6 pb-6">
          Guide également disponible hors ligne dans le fichier <span className="font-mono">README.md</span> du projet.
          Besoin d&apos;un serveur d&apos;entreprise plutôt que du cloud ? Voir « Option B — Votre serveur » dans Administration → Partage & installation.
        </p>
      </main>

      <div className="hazard h-3" />
    </div>
  );
}
