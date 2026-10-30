import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// The connection is opened on first use, not when this file is loaded, so `next build`
// works even before a database is connected (e.g. the first Vercel deploy).
// One pool is reused across hot reloads in development and across requests on Vercel.
type Client = ReturnType<typeof postgres>;
const g = globalThis as unknown as { pgClient?: Client; drizzleDb?: PostgresJsDatabase<typeof schema> };

function getClient(): Client {
  if (!g.pgClient) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    // prepare:false keeps it compatible with connection poolers such as Neon's pooled endpoint.
    g.pgClient = postgres(url, { prepare: false, max: process.env.VERCEL ? 1 : 10 });
  }
  return g.pgClient;
}

function getDb() {
  if (!g.drizzleDb) g.drizzleDb = drizzle(getClient(), { schema });
  return g.drizzleDb;
}

const lazy = <T extends object>(get: () => T) =>
  new Proxy({} as T, {
    get(_t, prop) {
      const target = get();
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });

export const db = lazy(getDb);
export const pg = { end: () => g.pgClient?.end() ?? Promise.resolve() };
export type DB = PostgresJsDatabase<typeof schema>;
