-- =============================================
-- PAGFLOW - Schema do Banco de Dados Supabase
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- =============================================
-- TABELA: companies (Empresas Pagantes)
-- =============================================
create table if not exists public.companies (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  cnpj        text,
  created_at  timestamptz not null default now()
);

-- Índices
create index if not exists companies_user_id_idx on public.companies(user_id);

-- Row Level Security (RLS)
alter table public.companies enable row level security;

-- Políticas: cada usuário só vê/edita suas próprias empresas
create policy "companies: select own"
  on public.companies for select
  using (auth.uid() = user_id);

create policy "companies: insert own"
  on public.companies for insert
  with check (auth.uid() = user_id);

create policy "companies: update own"
  on public.companies for update
  using (auth.uid() = user_id);

create policy "companies: delete own"
  on public.companies for delete
  using (auth.uid() = user_id);

-- =============================================
-- TABELA: payments (Pagamentos)
-- =============================================
create table if not exists public.payments (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  company_id    uuid not null references public.companies(id) on delete restrict,
  description   text not null,
  reference     text not null,
  recipient     text,
  value         numeric(15,2) not null check (value > 0),
  due_date      date not null,
  payment_date  date,
  paid_at       timestamptz,
  category      text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_company_id_idx on public.payments(company_id);
create index if not exists payments_due_date_idx on public.payments(due_date);
create index if not exists payments_paid_at_idx on public.payments(paid_at);

-- Row Level Security
alter table public.payments enable row level security;

-- Políticas: cada usuário só vê/edita seus próprios pagamentos
create policy "payments: select own"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "payments: insert own"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "payments: update own"
  on public.payments for update
  using (auth.uid() = user_id);

create policy "payments: delete own"
  on public.payments for delete
  using (auth.uid() = user_id);

-- =============================================
-- TRIGGER: atualizar updated_at automaticamente
-- =============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger payments_updated_at
  before update on public.payments
  for each row execute procedure public.handle_updated_at();

-- =============================================
-- FIM DO SCHEMA
-- =============================================
