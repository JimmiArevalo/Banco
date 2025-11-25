import { randomUUID } from "node:crypto";
import { comparePassword, generateTotpSecret, hashPassword, signAccessToken, verifyTotp } from "../auth";
import { ensureSchema, query } from "../db";

export interface ClientRecord {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  totp_secret: string;
  created_at: string;
}

export async function registerClient(payload: {
  fullName: string;
  email: string;
  password: string;
}) {
  await ensureSchema();
  const existing = await query<ClientRecord>(
    "SELECT * FROM clients WHERE email = $1",
    [payload.email.toLowerCase()]
  );

  if (existing.rows.length) {
    throw new Error("Ya existe un cliente con ese correo.");
  }

  const secret = generateTotpSecret(payload.email);
  const hashed = await hashPassword(payload.password);
  const id = randomUUID();

  const insert = await query<ClientRecord>(
    `INSERT INTO clients (id, full_name, email, password_hash, totp_secret)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, payload.fullName, payload.email.toLowerCase(), hashed, secret.base32]
  );

  const client = sanitizeClient(insert.rows[0]);

  return {
    client,
    totp: {
      base32: secret.base32,
      otpauthUrl: secret.otpauth_url,
    },
  };
}

export async function initiateLogin(email: string, password: string) {
  await ensureSchema();

  const result = await query<ClientRecord>(
    "SELECT * FROM clients WHERE email = $1",
    [email.toLowerCase()]
  );

  if (!result.rows.length) {
    throw new Error("Credenciales inválidas.");
  }

  const client = result.rows[0];
  const ok = await comparePassword(password, client.password_hash);

  if (!ok) {
    throw new Error("Credenciales inválidas.");
  }

  const loginToken = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  await query(
    `INSERT INTO pending_sessions (id, client_id, login_token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), client.id, loginToken, expiresAt.toISOString()]
  );

  return {
    loginToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifyOtpForLogin(loginToken: string, otpCode: string) {
  await ensureSchema();

  const pending = await query<{
    client_id: string;
    expires_at: string;
  }>(
    "SELECT client_id, expires_at FROM pending_sessions WHERE login_token = $1",
    [loginToken]
  );

  if (!pending.rows.length) {
    throw new Error("Token de inicio de sesión inválido.");
  }

  const session = pending.rows[0];
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await query("DELETE FROM pending_sessions WHERE login_token = $1", [
      loginToken,
    ]);
    throw new Error("El token de inicio de sesión expiró.");
  }

  const clientResult = await query<ClientRecord>(
    "SELECT * FROM clients WHERE id = $1",
    [session.client_id]
  );

  if (!clientResult.rows.length) {
    throw new Error("Cliente no encontrado.");
  }

  const client = clientResult.rows[0];
  const isValidOtp = verifyTotp(client.totp_secret, otpCode);

  if (!isValidOtp) {
    throw new Error("Código 2FA inválido.");
  }

  await query("DELETE FROM pending_sessions WHERE login_token = $1", [
    loginToken,
  ]);

  const token = signAccessToken(client.id);

  return {
    accessToken: token,
    client: sanitizeClient(client),
  };
}

export async function getClientById(id: string) {
  await ensureSchema();
  const res = await query<ClientRecord>("SELECT * FROM clients WHERE id = $1", [
    id,
  ]);
  if (!res.rows.length) {
    throw new Error("Cliente no encontrado.");
  }
  return sanitizeClient(res.rows[0]);
}

function sanitizeClient({
  password_hash,
  totp_secret,
  ...rest
}: ClientRecord) {
  return rest;
}

