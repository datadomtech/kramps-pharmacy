-- Phase 7: Receive stock.
-- Products become a pure catalog (identity + info only). Stock lives on
-- inventory_batches (one row per received lot), which POS already consumes
-- FEFO. Adding stock = recording a receipt against a supplier.

-- Products: strength fields, keep nullable selling price (filled during
-- receiving). Drop the stock-ish columns that now live on inventory_batches.
alter table public.products
	add column if not exists strength text,
	add column if not exists strength_unit text;

alter table public.products
	drop column if exists quantity,
	drop column if exists expiry_date,
	drop column if exists batch_number,
	drop column if exists supplier_id;

-- Future "when did it come, who recorded it" queries.
create index inventory_batches_by_received on public.inventory_batches (received_at desc);
create index inventory_batches_by_supplier on public.inventory_batches (supplier_id) where deleted_at is null;

-- ------------------------------------------------------------------
-- record_stock_in: atomic goods-in capture.
-- Inserts one inventory_batches row per received line and updates a
-- product's selling price when the line carries one (newest wins).
--
-- payload keys:
--   staffId uuid (authenticated user, server-set)
--   supplierId uuid
--   receivedAt timestamptz|null (defaults to now())
--   lines [{ productId, quantity, unitCost numeric >= 0,
--            price numeric|null (updates products.price), batchNumber?, expiryDate? }]
-- Raises exception with coded message on validation failure.
-- ------------------------------------------------------------------
create or replace function public.record_stock_in(p_payload jsonb)
	returns integer
	language plpgsql
	as $$
declare
	v_staff_id uuid := nullif(p_payload ->> 'staffId', '')::uuid;
	v_supplier_id uuid := nullif(p_payload ->> 'supplierId', '')::uuid;
	v_received_at timestamptz := coalesce(nullif(p_payload ->> 'receivedAt', '')::timestamptz, now());
	v_lines jsonb := p_payload -> 'lines';
	v_line jsonb;
	v_product_id uuid;
	v_quantity integer;
	v_unit_cost numeric(12, 2);
	v_price numeric(12, 2);
	v_count integer := 0;
begin
	if v_staff_id is null then
		raise exception 'STAFF_REQUIRED';
	end if;

	if v_supplier_id is null then
		raise exception 'SUPPLIER_REQUIRED';
	end if;

	if not exists (select 1 from public.suppliers where id = v_supplier_id and deleted_at is null) then
		raise exception 'SUPPLIER_NOT_FOUND';
	end if;

	if v_lines is null or jsonb_array_length(v_lines) = 0 then
		raise exception 'EMPTY_LINES';
	end if;

	for v_line in select * from jsonb_array_elements(v_lines) loop
		v_product_id := nullif(v_line ->> 'productId', '')::uuid;
		v_quantity := (v_line ->> 'quantity')::int;
		v_unit_cost := coalesce((v_line ->> 'unitCost')::numeric, -1);
		v_price := nullif(v_line ->> 'price', '')::numeric;

		if v_product_id is null then
			raise exception 'PRODUCT_REQUIRED';
		end if;

		if not exists (
			select 1 from public.products
			where id = v_product_id and deleted_at is null and is_active = true
		) then
			raise exception 'PRODUCT_NOT_FOUND';
		end if;

		if v_quantity is null or v_quantity < 1 then
			raise exception 'INVALID_QUANTITY';
		end if;

		if v_unit_cost < 0 then
			raise exception 'INVALID_COST';
		end if;

		if v_price is not null and v_price < 0 then
			raise exception 'INVALID_PRICE';
		end if;

		insert into public.inventory_batches (
			product_id,
			batch_number,
			quantity_on_hand,
			expiry_date,
			received_at,
			supplier_id,
			cost_price,
			added_by,
			updated_by
		)
		values (
			v_product_id,
			nullif(v_line ->> 'batchNumber', ''),
			v_quantity,
			nullif(v_line ->> 'expiryDate', '')::date,
			v_received_at,
			v_supplier_id,
			v_unit_cost,
			v_staff_id,
			v_staff_id
		);

		v_count := v_count + 1;

		-- Catalogue the selling price when supplied; newest receipt wins.
		if v_price is not null then
			update public.products
			set price = v_price, updated_at = now(), updated_by = v_staff_id
			where id = v_product_id;
		end if;
	end loop;

	return v_count;
end;
$$;