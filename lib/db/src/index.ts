import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase (and similar) expect TLS. `sslmode=require` in the URL is usually
// enough; this covers pooler URLs and stricter SSL without breaking local dev.
const hostNeedsSsl =
  /\.supabase\.co\b/i.test(connectionString) ||
  process.env.DATABASE_SSL === "1" ||
  process.env.DATABASE_SSL === "true";

const sslFromUrl = /[?&]sslmode=(require|verify-full|verify-ca)\b/i.test(connectionString);
const sslDisabled = /[?&]sslmode=disable\b/i.test(connectionString);
const sslExplicitOff =
  process.env.DATABASE_SSL === "0" || process.env.DATABASE_SSL === "false";
const useSsl =
  !sslExplicitOff && !sslDisabled && (hostNeedsSsl || sslFromUrl);

const poolMaxRaw = Number(process.env.DATABASE_POOL_MAX ?? 10);
const poolMax = Number.isFinite(poolMaxRaw) && poolMaxRaw > 0 ? poolMaxRaw : 10;

const poolConfig: ConstructorParameters<typeof Pool>[0] = {
  connectionString,
  max: poolMax,
  ...(useSsl
    ? {
        ssl:
          process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true"
            ? { rejectUnauthorized: true }
            : { rejectUnauthorized: false },
      }
    : {}),
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
