# PLanning Pro — Planning chauffeurs PL & grutiers BTP

Application fullstack (Next.js + PostgreSQL/Drizzle) de planning pour chauffeurs poids lourds et grutiers :
planning hebdo avec distances dépôt ↔ chantier et temps de trajet, conformité **RSE (règlement CE 561/2006)**,
**bouton Alerte panne** diffusé à toute l'équipe en temps réel, messagerie automatique en cas de modification
du planning, météo chantiers (vent/levage), feuilles de route imprimables, checklist départ, entretien/VGP,
carburant, annuaire, absences, statistiques et journal d'audit.

**Accès par code personnel** (pavé numérique). Un **administrateur principal** (le chauffeur-gérant) peut tout :
créer/réinitialiser les codes, interdire ou rétablir les accès, activer/désactiver chacun des 18 modules,
personnaliser le logo, les couleurs et le nom de l'application.

---

## 🚀 Démarrage rapide (local)

```bash
npm install
# créez le fichier .env avec :
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
npm run dev
```

Ouvrez http://localhost:3000 — **aucune migration à lancer** : au premier démarrage, l'application
crée automatiquement toutes les tables, les réglages, les modules et le compte
**Administrateur (code 2468)**.

Optionnel — charger le jeu de démonstration (chantiers, véhicules, chauffeurs, missions) sur base vide :

```bash
npx tsx src/db/seed.ts
```

> ⚠️ Changez le code 2468 dès la première connexion (menu profil → « Changer mon code »).

---

## ☁️ Déploiement Vercel (recommandé, gratuit — base de données incluse)

Tout se passe sur **un seul site** ([vercel.com](https://vercel.com)) :

1. **Récupérez le code** du projet (depuis arena.ai : bouton « Accéder au code de l'arène »,
   page `/telecharger` de l'app, ou votre dépôt GitHub existant).
2. **Vercel** : *Sign Up → Continue with GitHub* → *Add New… → Project* → importez le dépôt →
   **Deploy** (ne changez aucun réglage, Next.js est reconnu automatiquement).
3. **Base de données dans Vercel** : menu de gauche → *Storage* → *Create Database* → **Neon** →
   continuez avec GitHub, formule gratuite, région Paris/Frankfurt → créez, puis
   **connectez la base à votre projet**. Vercel ajoute automatiquement la variable de
   connexion (`POSTGRES_URL` ou `DATABASE_URL` — l'application reconnaît les deux, ainsi que
   `POSTGRES_PRISMA_URL`). Lancez un **Redeploy** si proposé.
4. Ouvrez votre lien `https://votre-projet.vercel.app` : les tables et le compte admin
   (code **2468**) sont créés automatiquement au premier lancement.
5. Connectez-vous, changez le code admin, créez vos chantiers/véhicules/chauffeurs,
   puis partagez le lien (Administration → *Partage & installation* : lien + QR code).

> Alternative classique : créer la base en direct sur [neon.tech](https://neon.tech), copier sa
> chaîne de connexion, et l'ajouter vous-même dans Vercel → *Settings → Environment Variables*
> sous le nom `DATABASE_URL`.

Le déploiement Vercel fournit automatiquement le **HTTPS**, requis pour installer
l'application sur les téléphones (PWA).

## 🖥️ Déploiement sur votre serveur (VPS / machine entreprise)

```bash
# Prérequis : Node.js 20+ et PostgreSQL
npm install
echo 'DATABASE_URL=postgresql://user:motdepasse@hote:5432/planning' > .env
npm run build
npm run start        # à garder actif avec pm2 : pm2 start npm --name planning -- start
```

Placez **Nginx + certificat HTTPS** (Let's Encrypt) devant l'application :

```nginx
server {
  listen 443 ssl;
  server_name planning.votre-entreprise.fr;
  # ssl_certificate / ssl_certificate_key …
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

La base s'initialise seule au premier lancement. Sauvegardez-la régulièrement
(`pg_dump` quotidien conseillé).

---

## 📱 Installation sur téléphone / PC (PWA)

L'application est installable sans passer par un store (icône sur l'écran d'accueil, plein écran) :

- **Android (Chrome)** : ouvrir le lien → menu ⋮ → « Installer l'application »
- **iPhone (Safari)** : bouton Partager ⬆ → « Sur l'écran d'accueil »
- **PC (Chrome/Edge)** : icône d'installation dans la barre d'adresse

Un guide illustré pas à pas est intégré : page `/installer` (accessible depuis l'écran de connexion).

## 👥 Partager l'application à l'équipe

1. Administration → **Utilisateurs & accès** → *Nouvel utilisateur* : un **code à 4 chiffres**
   est généré et affiché (bouton « Copier le code ») — transmettez-le au chauffeur.
2. Administration → **Partage & installation** : lien de l'application + **QR code** à envoyer
   par SMS/WhatsApp ou à afficher au dépôt.
3. Chaque chauffeur ouvre le lien, saisit son code, puis installe l'application.
4. Vous pouvez à tout moment **réinitialiser un code**, **interdire** ou **rétablir** un accès.

> Note : dans l'aperçu arena.ai (URL `*.e2b.app`), le lien ne s'ouvre que dans le panneau
> d'aperçu Arena. Déployez l'application (ci-dessus) pour obtenir un lien partageable.

---

## 🧩 Structure

```
src/
  app/            pages (Next.js App Router) + API routes
    (app)/        espace authentifié : planning, RSE, alertes, admin, …
    api/          /api/auth, /api/state, /api/pulse, /api/admin, /api/[resource], …
    installer/    guide d'installation pas à pas (public)
    login/        écran de connexion par code (pavé numérique)
  components/     UI (shell, modules, PWA, partage)
  db/             schema Drizzle, bootstrap automatique, seed de démo
  lib/            auth (codes hachés), RSE (CE 561/2006), ressources, utils
```

- Authentification : code personnel haché (SHA-256) + session en cookie httpOnly (30 jours).
- Temps réel : sondage `/api/pulse` toutes les 20 s (alertes panne, messages non lus,
  version des modules/personnalisation → rafraîchissement automatique pour tous).
- Notifications : toute création/modification/annulation de mission, alerte panne,
  décision d'absence ou changement de module génère un message **à tous les utilisateurs**.
