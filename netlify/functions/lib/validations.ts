import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Nombre muy corto"),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const otpSchema = z.object({
  loginToken: z.string().min(10),
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

export const productSchema = z.object({
  productType: z.string().min(3),
  alias: z.string().min(3).max(40).optional(),
  currency: z.string().length(3).optional(),
});

export const movementSchema = z.object({
  amount: z.number().positive(),
  description: z.string().max(120).optional(),
});

