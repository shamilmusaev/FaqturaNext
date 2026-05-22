create extension if not exists "pgcrypto";

create table organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  org_number      text,
  vat_number      text,
  address         jsonb,
  iban            text,
  bankgiro        text,
  plusgiro        text,
  swish_number    text,
  default_vat_rate numeric(5,2) not null default 25,
  default_payment_terms_days int not null default 30,
  locale          text not null default 'sv-SE',
  currency        text not null default 'SEK',
  invoice_number_template text not null default 'INV-{YYYY}-{NNNN}',
  logo_url        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table memberships (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('owner','admin','member')),
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index memberships_user_idx on memberships (user_id);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger organizations_updated_at
  before update on organizations
  for each row execute function set_updated_at();
