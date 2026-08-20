-- ============================================================
-- ANT (Automate and Transform) — Database Schema
-- Gestão de microempresas: perfis, empresas, produtos, estoque,
-- vendas, precificação, financeiro (DRE), saúde do negócio.
-- ============================================================

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- COMPANIES ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  legal_name text,
  cnpj text,
  segment text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- SETTINGS ----------
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  currency text not null default 'BRL',
  default_markup numeric(10,2) not null default 100,
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  cost_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  stock_qty integer not null default 0,
  min_stock integer not null default 0,
  unit text not null default 'un',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- SALES ----------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  channel text,
  status text not null default 'completed',
  sale_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------- FINANCIAL TRANSACTIONS ----------
create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null check (type in ('revenue','expense')),
  category text not null,
  description text,
  amount numeric(12,2) not null default 0,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- BUSINESS HEALTH ----------
create table public.business_health (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_key text not null,
  metric_value numeric(12,2) not null default 0,
  metric_label text,
  recorded_at timestamptz not null default now()
);

-- ============================================================
-- RLS — enable on every table
-- ============================================================
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.settings enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.business_health enable row level security;

-- ---------- PROFILES policies ----------
create policy "select_own_profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "insert_own_profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update_own_profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- COMPANIES policies ----------
create policy "select_own_companies" on public.companies for select to authenticated using (auth.uid() = owner_id);
create policy "insert_own_companies" on public.companies for insert to authenticated with check (auth.uid() = owner_id);
create policy "update_own_companies" on public.companies for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "delete_own_companies" on public.companies for delete to authenticated using (auth.uid() = owner_id);

-- ---------- SETTINGS policies ----------
create policy "select_own_settings" on public.settings for select to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "insert_own_settings" on public.settings for insert to authenticated with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "update_own_settings" on public.settings for update to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id)) with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "delete_own_settings" on public.settings for delete to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));

-- ---------- PRODUCTS policies ----------
create policy "select_own_products" on public.products for select to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "insert_own_products" on public.products for insert to authenticated with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "update_own_products" on public.products for update to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id)) with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "delete_own_products" on public.products for delete to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));

-- ---------- SALES policies ----------
create policy "select_own_sales" on public.sales for select to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "insert_own_sales" on public.sales for insert to authenticated with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "update_own_sales" on public.sales for update to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id)) with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "delete_own_sales" on public.sales for delete to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));

-- ---------- FINANCIAL TRANSACTIONS policies ----------
create policy "select_own_fin" on public.financial_transactions for select to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "insert_own_fin" on public.financial_transactions for insert to authenticated with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "update_own_fin" on public.financial_transactions for update to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id)) with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "delete_own_fin" on public.financial_transactions for delete to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));

-- ---------- BUSINESS HEALTH policies ----------
create policy "select_own_health" on public.business_health for select to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "insert_own_health" on public.business_health for insert to authenticated with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "update_own_health" on public.business_health for update to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id)) with check (auth.uid() = (select owner_id from public.companies where id = company_id));
create policy "delete_own_health" on public.business_health for delete to authenticated using (auth.uid() = (select owner_id from public.companies where id = company_id));

-- ============================================================
-- TRIGGER — auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_companies_owner on public.companies(owner_id);
create index idx_products_company on public.products(company_id);
create index idx_sales_company on public.sales(company_id);
create index idx_sales_date on public.sales(sale_date);
create index idx_fin_company on public.financial_transactions(company_id);
create index idx_fin_date on public.financial_transactions(transaction_date);
create index idx_health_company on public.business_health(company_id);
