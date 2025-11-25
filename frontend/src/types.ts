export interface Client {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface Product {
  id: string;
  product_type: string;
  alias: string | null;
  account_number: string;
  currency: string;
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  kind: "DEPOSIT" | "WITHDRAW";
  amount: number;
  created_at: string;
  description?: string | null;
}

