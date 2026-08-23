-- Phase 2: Expiry Tracker support.
-- Expiry tracking fields on products (nullable: existing rows have no batch/expiry data).
alter table public.products
	add column if not exists expiry_date date,
	add column if not exists batch_number text;
