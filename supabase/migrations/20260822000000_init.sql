-- Kramps Pharmacy — initial schema
-- 1:1 mapping of the previous Convex schema (snake_cased).
--
-- Convex system fields:
--   _id           -> id (uuid)
--   _creationTime -> created_at (timestamptz)
--
-- User reference columns (added_by, updated_by, ...) hold auth.users(id) values.
-- Like in Convex, they carry no FK constraints so user management stays decoupled.
-- RLS is disabled on all tables for now.

create table public.dosage_forms (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	name text not null,
	description text,
	added_by uuid,
	updated_by uuid,
	updated_at timestamptz,
	deleted_by uuid,
	deleted_at timestamptz
);

create index dosage_forms_by_soft_delete on public.dosage_forms (deleted_at);

create table public.customers (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	name text not null,
	phone text,
	address text,
	email text,
	contact_name text,
	contact_phone text,
	contact_email text,
	type text not null check (type in ('individual', 'hospital', 'pharmacy')),
	blacklisted_at timestamptz,
	blacklisted_by uuid,
	blacklisted_reason text,
	added_by uuid not null,
	updated_at timestamptz,
	updated_by uuid,
	deleted_at timestamptz,
	deleted_by uuid
);

create index customers_by_blacklisted on public.customers (blacklisted_at);

create table public.products (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	name text not null,
	brand_name text not null,
	generic_name text,
	bar_code_number text,
	dosage_form_id uuid not null references public.dosage_forms (id),
	description text,
	image_url text,
	manufacturer text,
	is_active boolean not null default true,
	added_at timestamptz not null default now(),
	added_by uuid not null,
	deactivated_by uuid,
	updated_by uuid,
	updated_at timestamptz,
	deleted_by uuid,
	deleted_at timestamptz
);

create index products_by_soft_delete on public.products (deleted_at);
