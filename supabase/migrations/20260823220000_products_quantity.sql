-- Phase 4: Stock levels.
-- Simple quantity counter per product; adjustments are plain updates (updated_by audit trail, no ledger).
alter table public.products
	add column if not exists quantity integer not null default 0;
