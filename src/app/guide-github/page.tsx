import Link from "next/link";
import { ArrowLeft, CheckCircle2, TriangleAlert, MousePointerClick } from "lucide-react";

export const dynamic = "force-dynamic";

function GithubButton({ children, green, big }: { children: React.ReactNode; green?: boolean; big?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${big ? "px-4 py-2 text-sm" : "px-2.5 py-1.5 text-xs"} ${
        green ? "bg-[#1f883d] border-[#1a7f37] text-white" : "bg-[#f6f8fa] border-[#d0d7de] text-[#1f2328]"
      }`}
    >
      {children}
    </span>
  );
}

export default function GuideGithubPage() {
  return (
    <div className="min-h-screen" style={{ background: "#eef0f2" }}>
      <div className="hazard h-3" />

      <header className="coal-texture text-white">
        <div className="max-w-3xl mx-auto px-5 py-7">
          <Link href="/deploiement" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft size={15} /> Retour au guide de déploiement
          </Link>
          <div className="hazard h-1.5 w-24 rounded-full mb-4" />
          <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase leading-none">
            Mini-guide GitHub
          </h1>
          <p className="mt-3 text-gray-300 max-w-xl">
            <strong className="text-white">Un seul objectif :</strong> déposer le code de l&apos;application sur GitHub.
            Chaque bouton est écrit <strong className="text-white">en anglais (et sa traduction française)</strong> comme sur votre écran.
            Ne touchez à rien d&apos;autre que ce qui est indiqué.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {/* Étape 0 — Récupérer le dossier */}
        <section className="bg-white border-2 border-brand rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-1">
            <span className="inline-flex w-9 h-9 rounded-full bg-brand text-white items-center justify-center mr-2 text-xl">0</span>
            Où est le dossier avec « package.json » et « src » ?
          </h2>
          <p className="text-sm text-brand font-bold mb-4">
            ⚠️ Il n&apos;existe pas encore sur votre ordinateur — c&apos;est normal ! Vous allez le créer en 4 petits pas. (À faire sur un <strong>ordinateur</strong>, pas sur un téléphone.)
          </p>

          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-coal text-accent text-sm font-extrabold flex items-center justify-center shrink-0">A</span>
              <div className="text-sm text-gray-700">
                <p><strong>Téléchargez le code — méthode la plus simple : UN SEUL BOUTON.</strong></p>
                <p className="mt-1 mb-3">Vous êtes connecté à l&apos;application avec votre code admin (2468) ? Cliquez simplement ici :</p>
                <a
                  href="/telecharger"
                  className="inline-flex items-center gap-2 bg-brand hover:brightness-110 text-white font-display font-extrabold uppercase tracking-wide text-base px-5 py-3 rounded-md transition-all shadow-md"
                >
                  📦 Télécharger le code de l&apos;application (.zip)
                </a>
                <ul className="mt-3 space-y-1 text-xs text-gray-600 list-disc list-inside">
                  <li>Le fichier <strong>planning-pro-code.zip</strong> arrive directement dans vos « Téléchargements ».</li>
                  <li>Rien ne se passe ? <strong>Clic droit</strong> sur le bouton → « Ouvrir le lien dans un nouvel onglet ».</li>
                  <li>Un message d&apos;erreur s&apos;affiche ? Retournez d&apos;abord vous <strong>connecter à l&apos;application avec le code 2468</strong>, puis revenez ici et recliquez.</li>
                </ul>
                <p className="mt-2 text-xs text-steel">
                  Autre méthode (si le bouton ne marche pas) : sur arena.ai → « Accéder au code de l&apos;arène » → bouton « Download » / « Export ZIP ».
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-coal text-accent text-sm font-extrabold flex items-center justify-center shrink-0">B</span>
              <div className="text-sm text-gray-700">
                <p><strong>Retrouvez le fichier .zip sur votre ordinateur.</strong></p>
                <p className="mt-1">Il est dans le dossier <strong>« Téléchargements »</strong> :</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-gray-600">
                  <li><strong>Windows</strong> : ouvrez l&apos;Explorateur (icône dossier jaune en bas de l&apos;écran) → colonne de gauche → « <strong>Téléchargements</strong> ». Le .zip est en haut (le plus récent).</li>
                  <li><strong>Mac</strong> : ouvrez le Finder → colonne de gauche → « <strong>Téléchargements</strong> ».</li>
                  <li>Astuce : dans votre navigateur, <strong>Ctrl + J</strong> affiche la liste des téléchargements — cliquez sur « Afficher dans le dossier ».</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-coal text-accent text-sm font-extrabold flex items-center justify-center shrink-0">C</span>
              <div className="text-sm text-gray-700">
                <p><strong>« Décompressez » le fichier .zip</strong> (sinon GitHub ne peut pas le lire) :</p>
                <ul className="mt-1 space-y-1 list-disc list-inside text-gray-600">
                  <li><strong>Windows</strong> : clic droit sur le .zip → « <strong>Extraire tout…</strong> » → cliquez « <strong>Extraire</strong> ».</li>
                  <li><strong>Mac</strong> : simple <strong>double-clic</strong> sur le .zip.</li>
                </ul>
                <p className="mt-1">➜ Un <strong>dossier normal</strong> apparaît juste à côté du .zip. C&apos;est lui, le dossier de l&apos;application !</p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-coal text-accent text-sm font-extrabold flex items-center justify-center shrink-0">D</span>
              <div className="text-sm text-gray-700">
                <p><strong>Ouvrez le dossier et vérifiez.</strong> Vous devez voir directement :</p>
                <div className="mt-2 border border-gray-300 rounded-md overflow-hidden text-xs font-mono max-w-xs">
                  {[
                    { n: "public", t: "📁 dossier" },
                    { n: "src", t: "📁 dossier" },
                    { n: "package.json", t: "📄 fichier" },
                    { n: "README.md", t: "📄 fichier" },
                    { n: "next.config.ts", t: "📄 fichier" },
                  ].map((f, i, arr) => (
                    <div key={f.n} className={`px-3 py-1.5 bg-white flex justify-between ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                      <span>{f.n}</span><span className="text-steel font-sans">{f.t}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-md px-3 py-2 text-xs font-semibold max-w-md">
                  🪤 <strong>Le piège classique :</strong> en ouvrant, vous ne voyez qu&apos;UN seul autre dossier (ex. « projet-abc123 ») ?
                  <strong> Ouvrez-le aussi.</strong> Le bon dossier est celui qui contient <strong>directement</strong> package.json et src.
                </p>
                <p className="mt-2 text-xs text-gray-600">👉 Gardez ce dossier ouvert à l&apos;écran : c&apos;est son <strong>contenu</strong> (Ctrl+A) que vous glisserez sur GitHub à l&apos;étape 3.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Étape 1 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-1">
            <span className="inline-flex w-9 h-9 rounded-full bg-coal text-accent items-center justify-center mr-2 text-xl">1</span>
            Avoir un compte GitHub
          </h2>
          <p className="text-sm text-gray-600 mb-3">Si vous êtes déjà connecté(e) avec votre photo/ nom en haut à droite : passez à l&apos;étape 2.</p>
          <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
            <li>Allez sur <strong>github.com</strong></li>
            <li>Cliquez <GithubButton>Sign up <span className="text-steel font-normal">(S&apos;inscrire)</span></GithubButton></li>
            <li>Entrez votre <strong>e-mail</strong>, choisissez un <strong>mot de passe</strong> et un <strong>nom d&apos;utilisateur</strong>, puis validez</li>
            <li>GitHub vous envoie un <strong>code par e-mail</strong> : recopiez-le</li>
          </ol>
        </section>

        {/* Étape 2 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-3">
            <span className="inline-flex w-9 h-9 rounded-full bg-coal text-accent items-center justify-center mr-2 text-xl">2</span>
            Créer la « boîte » qui va contenir le code
          </h2>
          <ol className="text-sm text-gray-700 space-y-2.5 list-decimal list-inside">
            <li>
              En <strong>haut à droite</strong> de GitHub, cliquez sur le <strong>+</strong> puis sur :
              <div className="mt-2 ml-4 w-fit border border-gray-300 rounded-md shadow-md overflow-hidden text-xs">
                <div className="px-3 py-2 font-bold bg-[#f6f8fa] border-b border-gray-200">New repository <span className="font-normal text-steel">(Nouveau dépôt)</span> ← cliquez ici</div>
                <div className="px-3 py-2 text-gray-500">Import repository</div>
                <div className="px-3 py-2 text-gray-500">New codespace</div>
              </div>
            </li>
            <li>
              Remplissez <strong>seulement ces deux choses</strong> :
              <div className="mt-2 ml-4 border border-gray-300 rounded-md p-3 bg-white max-w-sm space-y-2.5 text-xs">
                <div>
                  <p className="font-bold mb-1">Repository name <span className="font-normal text-steel">(Nom du dépôt)</span></p>
                  <div className="border border-gray-300 rounded-md px-2.5 py-1.5 font-mono bg-[#f6f8fa] border-2 !border-brand">planning-chauffeurs</div>
                </div>
                <div>
                  <p className="font-bold mb-1">Visibilité</p>
                  <div className="flex gap-3">
                    <span className="text-gray-500">○ Public</span>
                    <span className="font-bold">🔘 Private <span className="font-normal text-steel">(Privé)</span> ← choisissez celui-ci</span>
                  </div>
                </div>
              </div>
            </li>
            <li>
              ⚠️ <strong>Ne cochez RIEN d&apos;autre</strong> (pas de « README », pas de « .gitignore », pas de « license »). Laissez tout vide.
            </li>
            <li>
              Cliquez sur le bouton <strong>vert</strong> tout en bas : <GithubButton green big>Create repository <span className="font-normal opacity-80">(Créer un dépôt)</span></GithubButton>
            </li>
          </ol>
        </section>

        {/* Étape 3 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-3">
            <span className="inline-flex w-9 h-9 rounded-full bg-coal text-accent items-center justify-center mr-2 text-xl">3</span>
            Envoyer vos fichiers dedans
          </h2>
          <ol className="text-sm text-gray-700 space-y-2.5 list-decimal list-inside">
            <li>
              Vous arrivez sur une page avec du texte. Cherchez le <strong>lien bleu</strong> « uploading an existing file ».
              Si vous ne le voyez pas, utilisez le bouton en haut à droite :
              <div className="mt-2 ml-4 w-fit border border-gray-300 rounded-md shadow-md overflow-hidden text-xs">
                <div className="px-3 py-2 bg-[#f6f8fa] border-b border-gray-200 font-bold">Add file ▾ <span className="font-normal text-steel">(Ajouter un fichier)</span> ← cliquez</div>
                <div className="px-3 py-2 font-bold text-brand bg-brand/10">Upload files <span className="font-normal text-steel">(Téléverser des fichiers)</span> ← puis ici</div>
                <div className="px-3 py-2 text-gray-500">Create new file</div>
              </div>
            </li>
            <li>
              Sur votre ordinateur, ouvrez le <strong>dossier du projet</strong> obtenu à l&apos;étape 0 (celui qui contient package.json et src).
              <div className="mt-2 ml-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-md px-3 py-2 text-xs font-semibold max-w-md">
                ⚠️ Vous voyez un dossier <strong>node_modules</strong> ou <strong>.next</strong> ? Clic droit → <strong>Supprimer</strong>. Ils sont énormes et inutiles. (S&apos;il n&apos;y en a pas, tant mieux !)
              </div>
            </li>
            <li>
              <strong>Entrez DANS le dossier</strong> et sélectionnez tout : <GithubButton>Ctrl + A</GithubButton> <span className="text-steel">(Cmd + A sur Mac)</span>
              <div className="mt-2 ml-4 text-xs text-red-700 font-semibold max-w-md">
                ❌ Ne glissez PAS le dossier lui-même — il faut glisser <strong>son contenu</strong> (src, public, package.json…).
              </div>
            </li>
            <li>
              <strong>Glissez tout</strong> dans la grande zone de la page GitHub :
              <div className="mt-2 ml-4 border-2 border-dashed border-gray-400 rounded-lg p-5 bg-[#f6f8fa] text-center text-xs text-gray-600 max-w-md">
                <MousePointerClick size={20} className="mx-auto mb-1.5 text-brand" />
                Drag files here to add them to your repository<br />
                <span className="text-steel">(Faites glisser les fichiers ici)</span>
              </div>
            </li>
            <li>
              Attendez la fin de l&apos;envoi (1 à 3 min, une barre progresse). <strong>Ne fermez pas la page.</strong>
            </li>
            <li>
              Descendez en bas de la page et cliquez sur le bouton <strong>vert</strong> :
              <div className="mt-1 ml-4"><GithubButton green big>Commit changes <span className="font-normal opacity-80">(Valider les modifications)</span></GithubButton></div>
            </li>
          </ol>
        </section>

        {/* Étape 4 */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-3">
            <span className="inline-flex w-9 h-9 rounded-full bg-coal text-accent items-center justify-center mr-2 text-xl">4</span>
            Vérifier que c&apos;est réussi
          </h2>
          <p className="text-sm text-gray-700 mb-2">Votre page GitHub doit maintenant afficher une liste de dossiers et fichiers, comme :</p>
          <div className="border border-gray-300 rounded-md overflow-hidden text-xs font-mono max-w-sm">
            {["public", "src", "package.json", "README.md", "next.config.ts", "drizzle.config.json"].map((f, i, arr) => (
              <div key={f} className={`px-3 py-1.5 bg-white flex items-center gap-2 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                <span className="text-brand">📁</span> {f}
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-green-700 mt-3 flex items-center gap-2">
            <CheckCircle2 size={17} /> Vous les voyez ? BRAVO, l&apos;étape GitHub est terminée !
          </p>
          <Link href="/deploiement" className="mt-3 inline-flex items-center gap-2 bg-brand hover:brightness-110 text-white font-display font-extrabold uppercase tracking-wide text-sm px-4 py-2.5 rounded-md transition-all">
            Étape suivante : la base de données (Neon) →
          </Link>
        </section>

        {/* Problèmes */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-3">Ça ne marche pas ?</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p><strong>L&apos;envoi n&apos;en finit pas ou échoue :</strong> vous avez sûrement laissé le dossier <strong>node_modules</strong> (des milliers de fichiers). Revenez à l&apos;étape 3, supprimez-le du dossier sur votre ordinateur, et recommencez l&apos;envoi.</p>
            <p><strong>Je me suis trompé de page / je suis perdu(e) :</strong> cliquez sur le logo GitHub (le chat noir) tout en haut à gauche, puis recommencez à l&apos;étape 2. Rien n&apos;est cassé.</p>
            <p><strong>Le bouton « Commit changes » est grisé :</strong> cela veut dire qu&apos;aucun fichier n&apos;est encore dans la zone. Refaites le glisser-déposer de l&apos;étape 3 et attendez que la liste des fichiers apparaisse.</p>
            <p><strong>J&apos;ai créé le dépôt avec un README par erreur :</strong> pas grave — faites « Add file → Upload files », glissez quand même tout le contenu du projet et validez.</p>
          </div>
        </section>

        {/* Plan B */}
        <section className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase mb-2">Plan B — Et si quelqu&apos;un le faisait pour vous ?</h2>
          <p className="text-sm text-gray-700 mb-3">
            Un neveu, un collègue à l&apos;aise avec les ordinateurs, ou un freelance (sur ComeUp ou Malt, comptez 1 à 2 h de mission) ?
            Envoyez-lui simplement ce message — tout est expliqué :
          </p>
          <pre className="bg-gray-50 border border-gray-300 rounded-md p-3.5 text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
{`Bonjour ! J'ai besoin d'aide pour mettre en ligne une application (Next.js + PostgreSQL, prête à déployer).

1. Récupérer le code : je te donne le lien de l'app (aperçu Arena) ou le ZIP du projet. Les tables SQL et le compte admin se créent automatiquement au premier lancement (fichier src/db/bootstrap.ts) — aucune migration à jouer.

2. Créer une base PostgreSQL gratuite sur neon.tech et copier sa chaîne de connexion.

3. Pousser le code sur un dépôt GitHub (privé).

4. Sur vercel.com : New Project → importer le dépôt → ajouter la variable d'environnement DATABASE_URL = la chaîne Neon → Deploy.

5. Ouvrir le lien Vercel obtenu : se connecter avec le code admin 2468 (à changer aussitôt dans le menu profil).

Tout est détaillé dans le README.md du projet et dans les pages /deploiement et /guide-github de l'app. Merci !`}
          </pre>
        </section>

        <p className="text-xs text-steel pb-6">
          Une fois GitHub terminé, la suite (Neon puis Vercel) est dans le <Link href="/deploiement" className="text-brand font-bold hover:underline">guide de déploiement</Link> — mêmes principes : on ne clique que sur ce qui est indiqué.
        </p>
      </main>

      <div className="hazard h-3" />
    </div>
  );
}
