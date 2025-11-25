import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[WARN] DATABASE_URL no está definido. Las funciones no podrán acceder a Postgres."
  );
}

const pool = connectionString
  ? new Pool({ connectionString, max: 5, ssl: process.env.PGSSL === "1" })
  : null;

let schemaPromise: Promise<void> | null = null;

export async function ensureSchema() {
  if (!pool) {
    throw new Error(
      "No se puede inicializar la base de datos porque falta DATABASE_URL."
    );
  }

  if (!schemaPromise) {
    schemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          totp_secret TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY,
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          product_type TEXT NOT NULL,
          alias TEXT,
          account_number TEXT UNIQUE NOT NULL,
          currency TEXT NOT NULL DEFAULT 'COP',
          balance NUMERIC(14,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          amount NUMERIC(14,2) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS pending_sessions (
          id UUID PRIMARY KEY,
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          login_token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        );
      `);
    })();
  }

  return schemaPromise;
}

export async function query<T = unknown>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[] }> {
  if (!pool) {
    throw new Error("Base de datos no inicializada.");
  }

  const result = await pool.query(text, params);
  return { rows: result.rows as T[] };
}

