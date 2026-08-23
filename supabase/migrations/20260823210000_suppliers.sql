-- Phase 3: Suppliers.
-- Mirrors the customers table style: soft-delete trio + added/updated user tracking, no RLS.
create table public.suppliers (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	name text not null,
	phone text,
	address text,
	email text,
	contact_name text,
	contact_phone text,
	contact_email text,
	added_by uuid not null,
	updated_by uuid,
	updated_at timestamptz,
	deleted_by uuid,
	deleted_at timestamptz
);

create index suppliers_by_soft_delete on public.suppliers (deleted_at);

-- Products may reference their supplier.
alter table public.products
	add column if not exists supplier_id uuid references public.suppliers (id);
