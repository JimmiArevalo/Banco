import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_TTL = process.env.JWT_TTL || "1h";

export function generateTotpSecret(email: string) {
  return speakeasy.generateSecret({
    name: `Banco 2FA (${email})`,
    length: 20,
  });
}

export function verifyTotp(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    token,
    encoding: "base32",
    window: 1,
  });
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(clientId: string) {
  return jwt.sign({ sub: clientId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { sub: string; iat: number; exp: number };
}

