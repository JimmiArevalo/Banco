import { randomUUID } from "crypto";
import { ensureSchema, query } from "../db";

export interface ProductRecord {
  id: string;
  client_id: string;
  product_type: string;
  alias: string | null;
  account_number: string;
  currency: string;
  balance: string;
  created_at: string;
}

const ACCOUNT_PREFIX = "320";

function generateAccountNumber() {
  const randomPart = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  return `${ACCOUNT_PREFIX}${randomPart}`;
}

export async function createProduct(
  clientId: string,
  payload: { productType: string; alias?: string; currency?: string }
) {
  await ensureSchema();
  const id = randomUUID();
  const accountNumber = generateAccountNumber();
  const currency = payload.currency || "COP";
  const insert = await query<ProductRecord>(
    `INSERT INTO products
      (id, client_id, product_type, alias, account_number, currency)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, clientId, payload.productType, payload.alias ?? null, accountNumber, currency]
  );
  return normalize(insert.rows[0]);
}

export async function listProducts(clientId: string) {
  await ensureSchema();
  const res = await query<ProductRecord>(
    "SELECT * FROM products WHERE client_id = $1 ORDER BY created_at DESC",
    [clientId]
  );
  return res.rows.map(normalize);
}

export async function getProduct(clientId: string, productId: string) {
  await ensureSchema();
  const res = await query<ProductRecord>(
    "SELECT * FROM products WHERE id = $1 AND client_id = $2",
    [productId, clientId]
  );
  if (!res.rows.length) {
    throw new Error("Producto no encontrado.");
  }
  return normalize(res.rows[0]);
}

export async function depositToProduct(
  clientId: string,
  productId: string,
  amount: number,
  description?: string
) {
  if (amount <= 0) {
    throw new Error("El valor debe ser mayor que cero.");
  }

  await ensureSchema();
  const res = await query<ProductRecord>(
    `UPDATE products
     SET balance = balance + $1
     WHERE id = $2 AND client_id = $3
     RETURNING *`,
    [amount, productId, clientId]
  );

  if (!res.rows.length) {
    throw new Error("Producto no encontrado.");
  }

  await recordTransaction(productId, "DEPOSIT", amount, description);
  return normalize(res.rows[0]);
}

export async function withdrawFromProduct(
  clientId: string,
  productId: string,
  amount: number,
  description?: string
) {
  if (amount <= 0) {
    throw new Error("El valor debe ser mayor que cero.");
  }

  await ensureSchema();
  const res = await query<ProductRecord>(
    `UPDATE products
     SET balance = balance - $1
     WHERE id = $2 AND client_id = $3 AND balance >= $1
     RETURNING *`,
    [amount, productId, clientId]
  );

  if (!res.rows.length) {
    throw new Error("Fondos insuficientes o producto no encontrado.");
  }

  await recordTransaction(productId, "WITHDRAW", amount, description);
  return normalize(res.rows[0]);
}

export async function getTransactions(productId: string, limit = 20) {
  await ensureSchema();
  const res = await query<{
    id: string;
    kind: string;
    amount: string;
    created_at: string;
    description: string | null;
  }>(
    `SELECT id, kind, amount, created_at, description
     FROM transactions
     WHERE product_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [productId, limit]
  );

  return res.rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

async function recordTransaction(
  productId: string,
  kind: "DEPOSIT" | "WITHDRAW",
  amount: number,
  description?: string
) {
  await query(
    `INSERT INTO transactions (id, product_id, kind, amount, description)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), productId, kind, amount, description ?? null]
  );
}

function normalize(record: ProductRecord) {
  return {
    ...record,
    balance: Number(record.balance),
  };
}

