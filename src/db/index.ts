import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/* L'application accepte plusieurs noms de variables d'environnement :
   - DATABASE_URL  (Vercel, Neon en direct, README, .env local)
   - POSTGRES_URL / POSTGRES_PRISMA_URL (créées automatiquement par
     l'intégration Neon depuis le menu « Storage » de Vercel)
   Aucune exception à l'import : si la variable manque, le build passe quand
   même et les requêtes échouent proprement jusqu'à ce qu'elle soit ajoutée. */

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  "";

if (!databaseUrl) {
  console.warn(
    "[db] Aucune variable DATABASE_URL / POSTGRES_URL trouvée — l'application démarrera mais ne pourra pas lire la base tant qu'elle n'aura pas été ajoutée (Settings → Environment Variables sur Vercel)."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl || "postgresql://postgres@127.0.0.1:5432/postgres",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
