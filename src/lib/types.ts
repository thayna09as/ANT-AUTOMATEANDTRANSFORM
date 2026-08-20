export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  owner_id: string;
  name: string;
  legal_name: string | null;
  cnpj: string | null;
  segment: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Settings = {
  id: string;
  company_id: string;
  currency: string;
  default_markup: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  company_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  cost_price: number;
  sale_price: number;
  stock_qty: number;
  min_stock: number;
  unit: string;
  created_at: string;
  updated_at: string;
};

export type Sale = {
  id: string;
  company_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  channel: string | null;
  status: string;
  sale_date: string;
  created_at: string;
  product?: Pick<Product, 'name' | 'sku'> | null;
};

export type FinancialTransaction = {
  id: string;
  company_id: string;
  type: 'revenue' | 'expense';
  category: string;
  description: string | null;
  amount: number;
  transaction_date: string;
  created_at: string;
};

export type BusinessHealth = {
  id: string;
  company_id: string;
  metric_key: string;
  metric_value: number;
  metric_label: string | null;
  recorded_at: string;
};
