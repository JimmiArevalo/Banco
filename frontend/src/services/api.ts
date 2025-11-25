import axios from "axios";
import { Client, Product, Transaction } from "../types";

const TOKEN_KEY = "banco.accessToken";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export async function registerClient(payload: {
  fullName: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<{
    client: Client;
    totp: { base32: string; otpauthUrl?: string };
  }>("/auth/register", payload);
  return data;
}

export async function loginStepOne(payload: {
  email: string;
  password: string;
}) {
  const { data } = await api.post<{ loginToken: string; expiresAt: string }>(
    "/auth/login",
    payload
  );
  return data;
}

export async function verifyOtp(payload: {
  loginToken: string;
  code: string;
}) {
  const { data } = await api.post<{ accessToken: string; client: Client }>(
    "/auth/verify-otp",
    payload
  );
  return data;
}

export async function getProfile() {
  const { data } = await api.get<Client>("/clients/me");
  return data;
}

export async function createProduct(payload: {
  productType: string;
  alias?: string;
  currency?: string;
}) {
  const { data } = await api.post<Product>("/products", payload);
  return data;
}

export async function listProducts() {
  const { data } = await api.get<Product[]>("/products");
  return data;
}

export async function getProduct(productId: string) {
  const { data } = await api.get<Product>(`/products/${productId}`);
  return data;
}

export async function getTransactions(productId: string) {
  const { data } = await api.get<Transaction[]>(
    `/products/${productId}/transactions`
  );
  return data;
}

export async function deposit(productId: string, payload: { amount: number; description?: string }) {
  const { data } = await api.post<Product>(
    `/products/${productId}/deposit`,
    payload
  );
  return data;
}

export async function withdraw(productId: string, payload: { amount: number; description?: string }) {
  const { data } = await api.post<Product>(
    `/products/${productId}/withdraw`,
    payload
  );
  return data;
}

