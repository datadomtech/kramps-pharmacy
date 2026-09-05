-- Phase 8: Warehouse.
-- Locations (branches), record-only stock movements between them, and the
-- original quantity on each batch so movement logs stay truthful after FEFO
-- draws.

-- ------------------------------------------------------------------
-- Locations
-- ------------------------------------------------------------------
create table public.locations (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	name text not null unique,
	description text,
	added_by uuid,
	updated_by uuid,
	updated_at timestamptz,
	deleted_by uuid,
	deleted_at timestamptz
);

create index locations_by_soft_delete on public.locations (deleted_at);

insert into public.locations (name, description)
values ('Head Office', 'Main branch')
on conflict (name) do nothing;

-- ------------------------------------------------------------------
-- Inventory movements (record-only stock transfers between locations)
-- ------------------------------------------------------------------
create table public.inventory_movements (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	product_id uuid not null references public.products (id),
	quantity integer not null check (quantity > 0),
	from_location_id uuid not null references public.locations (id),
	to_location_id uuid not null references public.locations (id),
	note text,
	moved_by uuid not null,
	moved_at timestamptz not null default now()
);

create index inventory_movements_by_moved on public.inventory_movements (moved_at desc);
create index inventory_movements_by_product on public.inventory_movements (product_id);

-- Original received quantity so "in" movements reflect what actually arrived.
alter table public.inventory_batches
	add column if not exists initial_quantity integer;

update public.inventory_batches
set initial_quantity = quantity_on_hand
where initial_quantity is null;

-- ------------------------------------------------------------------
-- record_stock_move: atomic movement capture.
-- Record-only: batches and stock totals are untouched, the warehouse log
-- simply gets one row per moved line.
--
-- payload keys:
--   staffId uuid (authenticated user, server-set)
--   fromLocationId uuid, toLocationId uuid
--   note text|null
--   lines [{ productId, quantity }]
-- Raises exception with coded message on validation failure.
-- ------------------------------------------------------------------
create or replace function public.record_stock_move(p_payload jsonb)
	returns integer
	language plpgsql
	as $$
declare
	v_staff_id uuid := nullif(p_payload ->> 'staffId', '')::uuid;
	v_from uuid := nullif(p_payload ->> 'fromLocationId', '')::uuid;
	v_to uuid := nullif(p_payload ->> 'toLocationId', '')::uuid;
	v_note text := nullif(p_payload ->> 'note', '');
	v_lines jsonb := p_payload -> 'lines';
	v_line jsonb;
	v_product_id uuid;
	v_quantity integer;
	v_count integer := 0;
begin
	if v_staff_id is null then
		raise exception 'STAFF_REQUIRED';
	end if;

	if v_from is null or v_to is null then
		raise exception 'LOCATION_REQUIRED';
	end if;

	if v_from = v_to then
		raise exception 'SAME_LOCATION';
	end if;

	if not exists (select 1 from public.locations where id = v_from and deleted_at is null) then
		raise exception 'LOCATION_NOT_FOUND';
	end if;

	if not exists (select 1 from public.locations where id = v_to and deleted_at is null) then
		raise exception 'LOCATION_NOT_FOUND';
	end if;

	if v_lines is null or jsonb_array_length(v_lines) = 0 then
		raise exception 'EMPTY_LINES';
	end if;

	for v_line in select * from jsonb_array_elements(v_lines) loop
		v_product_id := nullif(v_line ->> 'productId', '')::uuid;
		v_quantity := (v_line ->> 'quantity')::int;

		if v_product_id is null then
			raise exception 'PRODUCT_REQUIRED';
		end if;

		if not exists (
			select 1 from public.products
			where id = v_product_id and deleted_at is null
		) then
			raise exception 'PRODUCT_NOT_FOUND';
		end if;

		if v_quantity is null or v_quantity < 1 then
			raise exception 'INVALID_QUANTITY';
		end if;

		insert into public.inventory_movements (
			product_id,
			quantity,
			from_location_id,
			to_location_id,
			note,
			moved_by
		)
		values (v_product_id, v_quantity, v_from, v_to, v_note, v_staff_id);

		v_count := v_count + 1;
	end loop;

	return v_count;
end;
$$;