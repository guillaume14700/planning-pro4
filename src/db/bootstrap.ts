import { createHash } from "crypto";
import { pool } from "./index";
import { MODULES, DEFAULT_DISABLED } from "../lib/modules";

/* Initialisation automatique de la base :
   - crée toutes les tables si elles n'existent pas (CREATE TABLE IF NOT EXISTS)
   - crée les réglages, les modules et le compte administrateur (code 2468) si la base est vide
   Ainsi, un déploiement (Vercel, VPS…) fonctionne dès l'ouverture du lien,
   sans aucune commande à taper. Idempotent + verrou transactionnel anti-concurrence. */

const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
     id serial PRIMARY KEY,
     name text NOT NULL,
     role text NOT NULL DEFAULT 'user',
     job text NOT NULL DEFAULT 'Chauffeur PL',
     phone text NOT NULL DEFAULT '',
     code_hash text NOT NULL,
     active boolean NOT NULL DEFAULT true,
     color text NOT NULL DEFAULT '#F26A1B',
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token text PRIMARY KEY,
     user_id integer NOT NULL,
     expires_at timestamp NOT NULL,
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS settings (
     id integer PRIMARY KEY DEFAULT 1,
     app_name text NOT NULL DEFAULT 'PLanning Pro',
     company_name text NOT NULL DEFAULT 'Transports & Levage',
     logo_data text NOT NULL DEFAULT '',
     primary_color text NOT NULL DEFAULT '#F26A1B',
     accent_color text NOT NULL DEFAULT '#FFC400',
     depot_name text NOT NULL DEFAULT 'Dépôt principal',
     depot_address text NOT NULL DEFAULT '',
     depot_lat real NOT NULL DEFAULT 45.7,
     depot_lng real NOT NULL DEFAULT 4.9,
     updated_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS modules (
     key text PRIMARY KEY,
     enabled boolean NOT NULL DEFAULT true
   )`,
  `CREATE TABLE IF NOT EXISTS chantiers (
     id serial PRIMARY KEY,
     name text NOT NULL,
     client text NOT NULL DEFAULT '',
     address text NOT NULL DEFAULT '',
     contact_name text NOT NULL DEFAULT '',
     contact_phone text NOT NULL DEFAULT '',
     distance_km real NOT NULL DEFAULT 0,
     travel_min integer NOT NULL DEFAULT 0,
     lat real,
     lng real,
     color text NOT NULL DEFAULT '#F26A1B',
     notes text NOT NULL DEFAULT '',
     active boolean NOT NULL DEFAULT true,
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS vehicles (
     id serial PRIMARY KEY,
     name text NOT NULL,
     plate text NOT NULL DEFAULT '',
     type text NOT NULL DEFAULT 'porteur',
     status text NOT NULL DEFAULT 'disponible',
     km integer NOT NULL DEFAULT 0,
     notes text NOT NULL DEFAULT '',
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS missions (
     id serial PRIMARY KEY,
     date text NOT NULL,
     driver_id integer NOT NULL,
     chantier_id integer NOT NULL,
     vehicle_id integer NOT NULL,
     start_time text NOT NULL,
     end_time text NOT NULL,
     extra_driving_min integer NOT NULL DEFAULT 0,
     task text NOT NULL DEFAULT 'Livraison matériaux',
     notes text NOT NULL DEFAULT '',
     created_by integer NOT NULL DEFAULT 0,
     created_at timestamp NOT NULL DEFAULT now(),
     updated_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS alerts (
     id serial PRIMARY KEY,
     vehicle_id integer NOT NULL,
     kind text NOT NULL DEFAULT 'autre',
     severity text NOT NULL DEFAULT 'immobilise',
     message text NOT NULL DEFAULT '',
     location text NOT NULL DEFAULT '',
     status text NOT NULL DEFAULT 'active',
     created_by integer NOT NULL,
     created_by_name text NOT NULL DEFAULT '',
     created_at timestamp NOT NULL DEFAULT now(),
     resolved_at timestamp,
     resolved_by_name text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS notifications (
     id serial PRIMARY KEY,
     type text NOT NULL DEFAULT 'systeme',
     title text NOT NULL,
     body text NOT NULL DEFAULT '',
     created_by integer NOT NULL DEFAULT 0,
     created_by_name text NOT NULL DEFAULT 'Système',
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS notification_reads (
     id serial PRIMARY KEY,
     notification_id integer NOT NULL,
     user_id integer NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS contacts (
     id serial PRIMARY KEY,
     name text NOT NULL,
     company text NOT NULL DEFAULT '',
     role text NOT NULL DEFAULT '',
     phone text NOT NULL DEFAULT '',
     email text NOT NULL DEFAULT '',
     notes text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS maintenance (
     id serial PRIMARY KEY,
     vehicle_id integer NOT NULL,
     date text NOT NULL,
     kind text NOT NULL DEFAULT 'Entretien courant',
     description text NOT NULL DEFAULT '',
     km integer NOT NULL DEFAULT 0,
     cost real NOT NULL DEFAULT 0,
     next_date text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS fuel_logs (
     id serial PRIMARY KEY,
     vehicle_id integer NOT NULL,
     user_id integer NOT NULL DEFAULT 0,
     date text NOT NULL,
     liters real NOT NULL DEFAULT 0,
     cost real NOT NULL DEFAULT 0,
     km integer NOT NULL DEFAULT 0,
     station text NOT NULL DEFAULT ''
   )`,
  `CREATE TABLE IF NOT EXISTS checklists (
     id serial PRIMARY KEY,
     date text NOT NULL,
     user_id integer NOT NULL,
     vehicle_id integer NOT NULL,
     items jsonb NOT NULL DEFAULT '{}',
     note text NOT NULL DEFAULT '',
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS leaves (
     id serial PRIMARY KEY,
     user_id integer NOT NULL,
     start_date text NOT NULL,
     end_date text NOT NULL,
     kind text NOT NULL DEFAULT 'Congé payé',
     reason text NOT NULL DEFAULT '',
     status text NOT NULL DEFAULT 'attente',
     decided_by_name text NOT NULL DEFAULT '',
     created_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
     id serial PRIMARY KEY,
     user_id integer NOT NULL DEFAULT 0,
     user_name text NOT NULL DEFAULT 'Système',
     action text NOT NULL,
     details text NOT NULL DEFAULT '',
     created_at timestamp NOT NULL DEFAULT now()
   )`,
];

function hashCode(code: string): string {
  return createHash("sha256").update(`planning-pl::${code.trim()}`).digest("hex");
}

let done: Promise<void> | null = null;

async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(727272)");
    for (const stmt of DDL) await client.query(stmt);

    await client.query(`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);

    const mods = await client.query(`SELECT count(*)::int AS n FROM modules`);
    if (mods.rows[0].n === 0) {
      for (const m of MODULES) {
        await client.query(
          `INSERT INTO modules (key, enabled) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
          [m.key, !DEFAULT_DISABLED.includes(m.key)]
        );
      }
    }

    // Filet de sécurité : garantit toujours un compte administrateur
    // (base neuve, ou admin supprimé → recréé avec le code 2468 au prochain lancement).
    const us = await client.query(`SELECT count(*)::int AS n FROM users WHERE role = 'admin'`);
    if (us.rows[0].n === 0) {
      const [admin] = (await client.query(
        `INSERT INTO users (name, role, job, phone, code_hash, color)
         VALUES ('Administrateur', 'admin', 'Chauffeur PL / Grutier — Admin principal', '', $1, '#F26A1B')
         RETURNING id`,
        [hashCode("2468")]
      )).rows;
      await client.query(
        `INSERT INTO notifications (type, title, body, created_by, created_by_name)
         VALUES ('systeme', $1, $2, $3, 'Système')`,
        [
          "👋 Bienvenue sur votre espace planning",
          "Base initialisée automatiquement. Connectez-vous avec le code administrateur 2468, puis : 1) créez vos chantiers et véhicules, 2) créez les accès de vos chauffeurs (Administration → Utilisateurs), 3) changez votre code 2468 (menu profil). Toute modification du planning est notifiée à l'équipe, et le bouton rouge « Alerte panne » prévient tout le monde en cas d'immobilisation d'un PL.",
          admin.id,
        ]
      );
      console.log("[bootstrap] Base initialisée — admin créé (code 2468)");
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export function ensureBootstrap(): Promise<void> {
  if (!done) {
    done = run().catch((e) => {
      done = null; // permet de réessayer au prochain appel
      throw e;
    });
  }
  return done;
}
