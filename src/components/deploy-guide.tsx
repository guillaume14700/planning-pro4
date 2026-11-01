"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2, Circle, Code2, GitBranch, Database, Rocket, KeyRound, Share2, Globe,
  ExternalLink, Clock, PartyPopper, ArrowDown, MousePointerClick,
} from "lucide-react";

/* Guide de déploiement interactif : progression sauvegardée dans le navigateur. */

type Step = {
  id: string;
  icon: ReactNode;
  title: string;
  time: string;
  where?: { label: string; href: string };
  content: ReactNode;
};

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 bg-coal hover:bg-coal-2 text-white text-xs font-display font-bold uppercase tracking-wide rounded-md px-3 py-2 transition-colors"
    >
      {children} <ExternalLink size={12} />
    </a>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[11px] bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 text-coal">{children}</span>;
}

const STEPS: Step[] = [
  {
    id: "code",
    icon: <ArrowDown size={18} />,
    title: "Récupérer le code de l'application",
    time: "2 min",
    content: (
      <ol className="space-y-2 list-decimal list-inside">
        <li>
          <strong>Méthode express</strong> : connectez-vous à l'application (code admin), ouvrez la page <Kbd>/guide-github</Kbd> et cliquez sur le gros bouton orange <strong>« 📦 Télécharger le code (.zip) »</strong> — le ZIP arrive directement dans vos Téléchargements.
          <div className="mt-1.5 ml-4">
            <Link href="/guide-github" className="inline-flex items-center gap-1.5 bg-brand hover:brightness-110 text-white text-xs font-display font-extrabold uppercase tracking-wide rounded-md px-3 py-2 transition-all">
              Ouvrir le mini-guide + bouton de téléchargement
            </Link>
          </div>
        </li>
        <li>Alternative : sur <strong>arena.ai</strong>, « Accéder au code de l'arène » → bouton « Download » / « Export ZIP ».</li>
        <li><strong>Décompressez</strong> le ZIP (clic droit → « Extraire tout » sur Windows, double-clic sur Mac).</li>
        <li>💡 Si le dossier contient <Kbd>node_modules</Kbd> ou <Kbd>.next</Kbd> : <strong>supprimez-les</strong> (le ZIP généré par le bouton les exclut déjà).</li>
      </ol>
    ),
  },
  {
    id: "github",
    icon: <Code2 size={18} />,
    title: "Créer un compte GitHub (gratuit)",
    time: "5 min",
    where: { label: "Ouvrir github.com", href: "https://github.com/signup" },
    // Mini-guide illustré en français : /guide-github
    content: (
      <>
        <p className="mb-2">GitHub est le « coffre » où vit votre code. Vercel lira le code depuis GitHub et mettra votre site à jour automatiquement à chaque modification.</p>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Cliquez sur <strong>« Sign up »</strong> et créez votre compte (e-mail, mot de passe, nom d'utilisateur).</li>
          <li>Validez l'e-mail de confirmation reçu.</li>
        </ol>
      </>
    ),
  },
  {
    id: "upload",
    icon: <GitBranch size={18} />,
    title: "Déposer le code sur GitHub",
    time: "5 min",
    where: { label: "Créer un nouveau dépôt", href: "https://github.com/new" },
    content: (
      <ol className="space-y-2 list-decimal list-inside">
        <li>Cliquez sur <strong>« Créer un nouveau dépôt »</strong> (ou le <strong>+</strong> en haut à droite → « New repository »).</li>
        <li>Nom du dépôt : <Kbd>planning-chauffeurs</Kbd>. Visibilité : <strong>Private</strong> (recommandé) ou Public.</li>
        <li>Cliquez sur le bouton vert <strong>« Create repository »</strong>.</li>
        <li>Sur la page suivante, cliquez sur le lien <strong>« uploading an existing file »</strong>.</li>
        <li>Ouvrez le dossier décompressé à l'étape 1, sélectionnez <strong>tout son contenu</strong> (<Kbd>Ctrl+A</Kbd> / <Kbd>Cmd+A</Kbd>) et <strong>glissez-le</strong> dans la fenêtre du navigateur.</li>
        <li>Attendez la fin du téléversement, puis cliquez sur le bouton vert <strong>« Commit changes »</strong>.</li>
      </ol>
    ),
  },
  {
    id: "neon",
    icon: <Database size={18} />,
    title: "La base de données — rien à faire ici, tout se passe dans Vercel",
    time: "0 min",
    content: (
      <>
        <p className="mb-2">
          ✅ Bonne nouvelle : <strong>pas besoin d'aller sur neon.tech</strong>. La base de données se crée
          <strong> directement depuis Vercel</strong> à l'étape suivante (menu « Storage »), et Vercel branche la
          connexion <strong>tout seul</strong>.
        </p>
        <p className="text-xs text-steel">
          L'application comprend les deux noms de variables utilisés par Vercel (<Kbd>DATABASE_URL</Kbd> et <Kbd>POSTGRES_URL</Kbd>) :
          quelle que soit celle créée automatiquement, ça fonctionne. Cochez cette étape et passez à la suivante.
        </p>
      </>
    ),
  },
  {
    id: "vercel",
    icon: <Rocket size={18} />,
    title: "Déployer sur Vercel — votre lien naît ici",
    time: "5 min",
    where: { label: "Ouvrir vercel.com/new", href: "https://vercel.com/new" },
    content: (
      <ol className="space-y-2 list-decimal list-inside">
        <li>Sur <strong>vercel.com</strong>, cliquez <strong>« Sign Up »</strong> → <strong>« Continue with GitHub »</strong> (réutilisez votre compte GitHub).</li>
        <li>Tableau de bord : <strong>« Add New… » → « Project »</strong>. Autorisez Vercel à accéder à vos dépôts si demandé.</li>
        <li>Dans la liste, trouvez votre dépôt (<Kbd>planning-chauffeurs</Kbd>) et cliquez <strong>« Import »</strong>.</li>
        <li>Vercel reconnaît Next.js tout seul : <strong>ne touchez à rien</strong> → cliquez <strong>« Deploy »</strong>. Attendez 1 à 3 minutes.
          <span className="block text-xs text-steel mt-1">(Un premier déploiement sans base de données peut afficher des erreurs à l'ouverture du site : normal, la base arrive juste après.)</span>
        </li>
        <li>🗄️ <strong>Créez maintenant la base de données DANS Vercel</strong> : menu de gauche → <strong>« Storage »</strong> → <strong>« Create Database »</strong> (ou « Connect Store ») → choisissez <strong>Neon</strong> → <strong>« Continue with GitHub »</strong> → formule <strong>gratuite</strong> → région <strong>Paris</strong> ou <strong>Frankfurt</strong> → créez.</li>
        <li>Quand Vercel demande à quel projet la connecter : choisissez <strong>votre projet</strong>. Vercel ajoute <strong>automatiquement</strong> la variable de connexion (<Kbd>POSTGRES_URL</Kbd> ou <Kbd>DATABASE_URL</Kbd>) — l'application comprend les deux.</li>
        <li>Si un <strong>« Redeploy »</strong> est proposé (ou dans Deployments → dernier → ⋯ → « Redeploy ») : cliquez, attendez la fin.</li>
        <li>Ouvrez votre lien (<Kbd>https://planning-chauffeurs.vercel.app</Kbd>) : l'écran à code apparaît → connectez-vous avec <Kbd>2468</Kbd> → <strong>changez-le aussitôt</strong>. 🎉</li>
      </ol>
    ),
  },
  {
    id: "first",
    icon: <KeyRound size={18} />,
    title: "Première connexion & sécurité",
    time: "3 min",
    content: (
      <ol className="space-y-2 list-decimal list-inside">
        <li>Ouvrez <strong>votre lien Vercel</strong> : l'écran de connexion à code s'affiche.</li>
        <li>La base s'est créée <strong>toute seule</strong> (aucune commande) : connectez-vous avec le code <Kbd>2468</Kbd>.</li>
        <li>🔒 <strong>Changez immédiatement votre code</strong> : menu en haut à droite (votre nom) → « Changer mon code ».</li>
        <li>Créez votre entreprise : Administration → Personnalisation (logo, couleurs, nom) et Entreprise & dépôt.</li>
        <li>Allez dans <strong>Chantiers</strong> et <strong>Parc véhicules</strong> pour saisir vos vraies données (une instance déployée démarre vide, sans les données de démonstration).</li>
      </ol>
    ),
  },
  {
    id: "share",
    icon: <Share2 size={18} />,
    title: "Partager avec vos chauffeurs",
    time: "2 min",
    content: (
      <ol className="space-y-2 list-decimal list-inside">
        <li>Administration → <strong>Utilisateurs & accès</strong> → « Nouvel utilisateur » pour chaque chauffeur : un <strong>code à 4 chiffres</strong> s'affiche, notez-le et transmettez-le.</li>
        <li>Administration → <strong>Partage & installation</strong> : le lien affiché est maintenant votre lien Vercel — <strong>il fonctionne partout</strong> (plus le message « Aperçu indisponible »). Copiez-le ou faites scanner le QR code.</li>
        <li>Chaque chauffeur ouvre le lien sur son téléphone, saisit son code, puis <strong>installe l'application</strong> (guide illustré : ajoutez <Kbd>/installer</Kbd> à la fin de votre lien).</li>
      </ol>
    ),
  },
  {
    id: "domain",
    icon: <Globe size={18} />,
    title: "Optionnel — Votre nom de domaine personnalisé",
    time: "15 min",
    content: (
      <ol className="space-y-2 list-decimal list-inside">
        <li>Achetez un domaine (ex. <Kbd>planning.votre-entreprise.fr</Kbd>) chez OVH, Gandi ou Ionos (~10 €/an).</li>
        <li>Sur Vercel : votre projet → <strong>Settings → Domains</strong> → saisissez le domaine → suivez les instructions DNS affichées (à reporter chez votre registraire).</li>
        <li>Le certificat HTTPS est généré automatiquement — l'installation PWA continue de fonctionner.</li>
      </ol>
    ),
  },
];

const TROUBLE = [
  {
    q: "Le site Vercel s'ouvre mais affiche une erreur / reste vide",
    r: "La base de données n'est pas encore branchée : faites l'étape « Storage → Create Database → Neon » du guide, connectez-la au projet, puis « Redeploy ». L'application reconnaît automatiquement la variable créée par Vercel (POSTGRES_URL ou DATABASE_URL).",
  },
  {
    q: "Le déploiement Vercel affiche une erreur rouge (« Build Error »)",
    r: "Cliquez « View Build Logs » et lisez la dernière ligne d'erreur. Si vous aviez ajouté une variable DATABASE_URL à la main, vérifiez dans Settings → Environment Variables qu'elle commence bien par postgresql:// (sans guillemets ni espace), puis Deployments → dernier → ⋯ → « Redeploy ».",
  },
  {
    q: "GitHub refuse mes fichiers ou le dépôt est vide",
    r: "Assurez-vous de glisser le CONTENU du dossier (src, public, package.json…) et non le dossier parent. Vérifiez que node_modules et .next ont été supprimés avant l'envoi, puis « Commit changes ».",
  },
  {
    q: "J'ai perdu / oublié mon code administrateur",
    r: "Connectez-vous à neon.tech → votre projet → « SQL Editor », et exécutez : DELETE FROM users WHERE role = 'admin'; Puis rechargez votre application : un administrateur neuf (code 2468) est recréé automatiquement. Changez-le aussitôt.",
  },
  {
    q: "Comment mettre à jour l'application plus tard ?",
    r: "Modifiez le code dans Arena, retéléchargez le ZIP et remplacez les fichiers sur GitHub (Add file → Upload files) : Vercel redéploie automatiquement en ~2 min. Vos données en base ne bougent pas.",
  },
  {
    q: "Et les sauvegardes ?",
    r: "Neon conserve automatiquement l'historique de la base (restore points). Pour une sauvegarde manuelle : Neon → branche → « Export » ou commande pg_dump. Une sauvegarde hebdomadaire est un bon rythme.",
  },
];

export default function DeployGuide() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deploy-progress");
      if (raw) setDone(JSON.parse(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem("deploy-progress", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const count = STEPS.filter((s) => done[s.id]).length;
  const pct = Math.round((count / STEPS.length) * 100);
  const finished = count === STEPS.length;

  return (
    <div>
      {/* Progression */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="font-display font-extrabold uppercase tracking-wide text-sm">
            Progression : {count}/{STEPS.length} étapes
            {finished && <span className="ml-2 text-green-600 inline-flex items-center gap-1 normal-case"><PartyPopper size={15} /> Bravo, votre application est en ligne !</span>}
          </p>
          {loaded && count > 0 && (
            <button onClick={() => { setDone({}); localStorage.removeItem("deploy-progress"); }} className="text-xs font-bold text-steel hover:text-red-600 cursor-pointer">
              Réinitialiser
            </button>
          )}
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mt-2">
          <div className={`h-full rounded-full transition-all duration-500 ${finished ? "bg-green-600" : "bg-brand"}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-steel mt-1.5">Votre progression est mémorisée dans ce navigateur : vous pouvez fermer la page et reprendre plus tard.</p>
      </div>

      <div className="mb-6 bg-sky-50 border border-sky-300 rounded-lg px-4 py-3 text-sm text-sky-900 flex items-center gap-2 flex-wrap">
        <MousePointerClick size={17} className="shrink-0" />
        <span>Perdu sur GitHub ?</span>
        <Link href="/guide-github" className="font-extrabold underline hover:text-sky-700">
          Ouvrir le mini-guide GitHub illustré, bouton par bouton, en français →
        </Link>
      </div>

      {/* Étapes */}
      <div className="space-y-4">
        {STEPS.map((s, i) => {
          const ok = done[s.id];
          return (
            <div key={s.id} className={`bg-white border rounded-lg overflow-hidden transition-all ${ok ? "border-green-300 bg-green-50/40" : "border-gray-200"}`}>
              <div className="p-4 md:p-5 flex gap-4">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className={`w-10 h-10 rounded-md flex items-center justify-center ${ok ? "bg-green-600 text-white" : "bg-coal text-accent"}`}>
                    {ok ? <CheckCircle2 size={20} /> : s.icon}
                  </span>
                  <span className="font-display text-2xl font-extrabold text-gray-300">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h3 className={`font-display text-xl md:text-2xl font-extrabold uppercase leading-tight ${ok ? "text-green-700" : ""}`}>{s.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-steel"><Clock size={12} /> {s.time}</span>
                      {s.where && <ExtLink href={s.where.href}>{s.where.label}</ExtLink>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mt-2.5 leading-relaxed">{s.content}</div>
                  <button
                    onClick={() => toggle(s.id)}
                    className={`mt-4 inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-display font-extrabold uppercase tracking-wide transition-all cursor-pointer ${ok ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-100 text-gray-600 hover:bg-brand hover:text-white"}`}
                  >
                    {ok ? <CheckCircle2 size={14} /> : <Circle size={14} />} {ok ? "Étape terminée" : "Marquer cette étape comme terminée"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dépannage */}
      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="font-display text-2xl font-extrabold uppercase mb-4">En cas de problème</h2>
        <div className="space-y-2.5">
          {TROUBLE.map((t) => (
            <details key={t.q} className="group border border-gray-200 rounded-md overflow-hidden">
              <summary className="px-3.5 py-2.5 text-sm font-bold cursor-pointer hover:bg-gray-50 flex items-center justify-between gap-2 select-none">
                {t.q}
                <span className="text-brand font-extrabold group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="px-3.5 pb-3 text-sm text-gray-600 leading-relaxed">{t.r}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
