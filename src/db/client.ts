import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Reuse one connection pool across hot reloads in development
// and across requests in the same serverless instance on Vercel.
const globalForDb = globalThis as unknown as { pgClient?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  // prepare:false keeps it compatible with connection poolers such as Neon's pooled endpoint.
  return postgres(url, { prepare: false, max: process.env.VERCEL ? 1 : 10 });
}

export const pg = globalForDb.pgClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = pg;

export const db = drizzle(pg, { schema });
export type DB = typeof db;
