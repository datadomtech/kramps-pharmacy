-- Phase 6: Point of sale.
-- Sales, sale items (one row per fulfilling batch), payments (split-payment capable),
-- and batch-level inventory so expiry can be enforced via FEFO deduction.

create extension if not exists pg_trgm;

-- Products need a sale price to snapshot from.
alter table public.products
	add column if not exists price numeric(12, 2);

-- ------------------------------------------------------------------
-- Inventory batches
-- ------------------------------------------------------------------
create table public.inventory_batches (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	product_id uuid not null references public.products (id),
	batch_number text,
	quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
	expiry_date date,
	received_at timestamptz not null default now(),
	supplier_id uuid references public.suppliers (id),
	cost_price numeric(12, 2),
	added_by uuid not null,
	updated_by uuid,
	updated_at timestamptz,
	deleted_by uuid,
	deleted_at timestamptz
);

create index inventory_batches_fefo on public.inventory_batches (product_id, expiry_date asc nulls last)
	where deleted_at is null and quantity_on_hand > 0;
create index inventory_batches_by_soft_delete on public.inventory_batches (deleted_at);

-- ------------------------------------------------------------------
-- Sales
-- ------------------------------------------------------------------
create table public.sales (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	customer_id uuid references public.customers (id),
	staff_id uuid not null,
	fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')),
	courier_id uuid,
	delivery_address text,
	status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled', 'refunded')),
	subtotal numeric(12, 2) not null default 0,
	discount numeric(12, 2) not null default 0 check (discount >= 0),
	total numeric(12, 2) not null default 0,
	idempotency_key uuid not null unique
);

create index sales_by_created_at on public.sales (created_at desc);
create index sales_by_customer on public.sales (customer_id);
create index sales_by_staff on public.sales (staff_id);
create index sales_by_status on public.sales (status);

create table public.sale_items (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	sale_id uuid not null references public.sales (id),
	product_id uuid not null references public.products (id),
	inventory_batch_id uuid references public.inventory_batches (id),
	dosage_form_id uuid,
	quantity integer not null check (quantity > 0),
	unit_price numeric(12, 2) not null check (unit_price >= 0),
	line_total numeric(12, 2) not null check (line_total >= 0)
);

create index sale_items_by_sale on public.sale_items (sale_id);
create index sale_items_by_product on public.sale_items (product_id);
create index sale_items_by_batch on public.sale_items (inventory_batch_id);

create table public.payments (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	sale_id uuid not null references public.sales (id),
	method text not null check (method in ('cash', 'momo', 'credit')),
	amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
	amount_due numeric(12, 2) not null default 0 check (amount_due >= 0),
	received_by uuid not null,
	reference text,
	paid_at timestamptz not null default now()
);

create index payments_by_sale on public.payments (sale_id);

-- Fast typeahead for POS search (name contains, phone/barcode prefix).
create index products_name_trgm on public.products using gin (name gin_trgm_ops);
create index products_generic_name_trgm on public.products using gin (generic_name gin_trgm_ops);
create index products_barcode_prefix on public.products (bar_code_number text_pattern_ops);
create index customers_name_trgm on public.customers using gin (name gin_trgm_ops);
create index customers_phone_prefix on public.customers (phone text_pattern_ops);

-- ------------------------------------------------------------------
-- Outstanding credit balance
--   pending + completed sales count as owed; cancelled/refunded do not.
-- ------------------------------------------------------------------
create or replace function public.customer_outstanding_balance(p_customer_id uuid)
	returns numeric(12, 2)
	language sql
	stable
	as $$
	select
		coalesce((
			select sum(s.total)
			from public.sales s
			where s.customer_id = p_customer_id and s.status in ('pending', 'completed')
		), 0)
		-
		coalesce((
			select sum(p.amount_paid)
			from public.payments p
			join public.sales s on s.id = p.sale_id
			where s.customer_id = p_customer_id and s.status in ('pending', 'completed')
		), 0);
$$;

-- ------------------------------------------------------------------
-- create_sale: atomic POS submission.
-- Validates + inserts sale/items/payments and deducts stock FEFO inside one
-- transaction. Prices are snapshotted from live product rows server-side —
-- the client never dictates pricing.
--
-- payload keys:
--   idempotencyKey uuid, customerId uuid|null, fulfillmentType pickup|delivery,
--   courierId uuid|null, deliveryAddress text|null,
--   discount numeric >= 0, allowExpiredBatch bool (default false),
--   blacklistOverride bool (default false),
--   items [{ productId, quantity, inventoryBatchId? (staff override) }],
--   payments [{ method cash|momo|credit, amountPaid numeric, reference? }]
-- Raises exception with coded message on validation failure.
-- ------------------------------------------------------------------
create or replace function public.create_sale(p_payload jsonb)
	returns uuid
	language plpgsql
	as $$
declare
	v_sale_id uuid;
	v_staff_id uuid := (p_payload ->> 'staffId')::uuid;
	v_customer_id uuid := nullif(p_payload ->> 'customerId', '')::uuid;
	v_fulfillment text := p_payload ->> 'fulfillmentType';
	v_discount numeric(12, 2) := coalesce((p_payload ->> 'discount')::numeric, 0);
	v_allow_expired boolean := coalesce((p_payload ->> 'allowExpiredBatch')::boolean, false);
	v_override_blacklist boolean := coalesce((p_payload ->> 'blacklistOverride')::boolean, false);
	v_credit_acknowledged boolean := coalesce((p_payload ->> 'creditAcknowledged')::boolean, false);
	v_items jsonb := p_payload -> 'items';
	v_payments jsonb := p_payload -> 'payments';
	v_item jsonb;
	v_line jsonb;
	v_subtotal numeric(12, 2) := 0;
	v_total numeric(12, 2) := 0;
	v_paid numeric(12, 2) := 0;
	v_amount numeric(12, 2);
	v_unit_price numeric(12, 2);
	v_dosage_form_id uuid;
	v_needed integer;
	v_drawn integer;
	v_batch record;
	v_lines jsonb := '[]'::jsonb;
begin
	if v_staff_id is null then
		raise exception 'STAFF_REQUIRED';
	end if;

	if v_fulfillment not in ('pickup', 'delivery') then
		raise exception 'INVALID_FULFILLMENT_TYPE';
	end if;

	if v_fulfillment = 'delivery' and coalesce(nullif(p_payload ->> 'deliveryAddress', ''), '') = '' then
		raise exception 'DELIVERY_ADDRESS_REQUIRED';
	end if;

	if v_discount < 0 then
		raise exception 'INVALID_DISCOUNT';
	end if;

	if jsonb_array_length(v_items) = 0 then
		raise exception 'EMPTY_CART';
	end if;

	-- Blacklist guard (explicit staff override allowed; roles pending).
	if v_customer_id is not null and not v_override_blacklist then
		if exists (
			select 1 from public.customers c
			where c.id = v_customer_id and c.blacklisted_at is not null
		) then
			raise exception 'CUSTOMER_BLACKLISTED';
		end if;
	end if;

	-- Idempotency: return the existing sale if this key was already submitted.
	select id into v_sale_id from public.sales where idempotency_key = (p_payload ->> 'idempotencyKey')::uuid;
	if v_sale_id is not null then
		return v_sale_id;
	end if;

	-- Snapshot prices server-side and validate quantities.
	for v_item in select * from jsonb_array_elements(v_items) loop
		if coalesce((v_item ->> 'quantity')::int, 0) <= 0 then
			raise exception 'INVALID_QUANTITY';
		end if;

		select price, dosage_form_id into v_unit_price, v_dosage_form_id
		from public.products
		where id = (v_item ->> 'productId')::uuid and deleted_at is null;

		if v_unit_price is null then
			raise exception 'PRODUCT_NOT_FOUND';
		end if;

		v_subtotal := v_subtotal + v_unit_price * (v_item ->> 'quantity')::int;
	end loop;

	v_total := greatest(v_subtotal - v_discount, 0);

	-- Validate payment amounts before touching stock.
	for v_line in select * from jsonb_array_elements(v_payments) loop
		if (v_line ->> 'method') not in ('cash', 'momo', 'credit') then
			raise exception 'INVALID_PAYMENT_METHOD';
		end if;

		v_amount := coalesce((v_line ->> 'amountPaid')::numeric, 0);
		if v_amount < 0 then
			raise exception 'INVALID_PAYMENT_AMOUNT';
		end if;

		v_paid := v_paid + v_amount;
	end loop;

	if v_paid > v_total + 0.005 then
		raise exception 'OVERPAYMENT';
	end if;

	if v_paid < v_total and not v_credit_acknowledged then
		raise exception 'UNDERPAID_CREDIT_NOT_ACKNOWLEDGED';
	end if;

	-- Insert the sale first so items/payments can reference it.
	insert into public.sales (customer_id, staff_id, fulfillment_type, courier_id, delivery_address, status, subtotal, discount, total, idempotency_key)
	values (
		v_customer_id,
		v_staff_id,
		v_fulfillment,
		nullif(p_payload ->> 'courierId', '')::uuid,
		nullif(p_payload ->> 'deliveryAddress', ''),
		case when v_paid >= v_total then 'completed' else 'pending' end,
		v_subtotal,
		v_discount,
		v_total,
		(p_payload ->> 'idempotencyKey')::uuid
	)
	returning id into v_sale_id;

	-- Deduct stock FEFO per line. A staff-specified batch pins the draw to that
	-- batch only; otherwise earliest-expiring batches drain first. Splitting a
	-- line across batches produces one sale_item row per batch drawn.
	for v_item in select * from jsonb_array_elements(v_items) loop
		v_needed := (v_item ->> 'quantity')::int;

		select price, dosage_form_id into v_unit_price, v_dosage_form_id
		from public.products
		where id = (v_item ->> 'productId')::uuid and deleted_at is null;

		if v_unit_price is null then
			raise exception 'PRODUCT_NOT_FOUND';
		end if;

		if v_item ->> 'inventoryBatchId' is not null then
			select * into v_batch from public.inventory_batches
			where id = (v_item ->> 'inventoryBatchId')::uuid
				and product_id = (v_item ->> 'productId')::uuid
				and deleted_at is null
			for update;

			if v_batch.id is null then
				raise exception 'BATCH_NOT_FOUND';
			end if;
			if v_batch.expiry_date < current_date and not v_allow_expired then
				raise exception 'BATCH_EXPIRED';
			end if;
			if v_batch.quantity_on_hand < v_needed then
				raise exception 'INSUFFICIENT_STOCK';
			end if;

			update public.inventory_batches set quantity_on_hand = quantity_on_hand - v_needed where id = v_batch.id;

			v_lines := v_lines || jsonb_build_object(
				'productId', v_item ->> 'productId',
				'batchId', v_batch.id,
				'dosageFormId', v_dosage_form_id,
				'quantity', v_needed,
				'unitPrice', v_unit_price,
				'lineTotal', v_unit_price * v_needed
			);
		else
			for v_batch in
				select * from public.inventory_batches
				where product_id = (v_item ->> 'productId')::uuid
					and deleted_at is null
					and quantity_on_hand > 0
				order by expiry_date asc nulls last, received_at asc
				for update
			loop
				exit when v_needed = 0;

				-- Skip expired stock unless explicitly overridden; fail later only
				-- if nothing sellable covers the line.
				if v_batch.expiry_date < current_date and not v_allow_expired then
					continue;
				end if;

				v_drawn := least(v_batch.quantity_on_hand, v_needed);

				update public.inventory_batches set quantity_on_hand = quantity_on_hand - v_drawn where id = v_batch.id;

				v_lines := v_lines || jsonb_build_object(
					'productId', v_item ->> 'productId',
					'batchId', v_batch.id,
					'dosageFormId', v_dosage_form_id,
					'quantity', v_drawn,
					'unitPrice', v_unit_price,
					'lineTotal', v_unit_price * v_drawn
				);

				v_needed := v_needed - v_drawn;
			end loop;

			if v_needed > 0 then
				raise exception 'INSUFFICIENT_STOCK';
			end if;
		end if;
	end loop;

	-- Materialise sale item rows (one per batch draw).
	insert into public.sale_items (sale_id, product_id, inventory_batch_id, dosage_form_id, quantity, unit_price, line_total)
	select
		v_sale_id,
		(line ->> 'productId')::uuid,
		(line ->> 'batchId')::uuid,
		(line ->> 'dosageFormId')::uuid,
		(line ->> 'quantity')::int,
		(line ->> 'unitPrice')::numeric,
		(line ->> 'lineTotal')::numeric
	from jsonb_array_elements(v_lines) as line;

	-- Payments actually provided.
	insert into public.payments (sale_id, method, amount_paid, amount_due, received_by, reference)
	select
		v_sale_id,
		v_line ->> 'method',
		least((v_line ->> 'amountPaid')::numeric, v_total),
		0,
		v_staff_id,
		nullif(v_line ->> 'reference', '')
	from jsonb_array_elements(v_payments) as v_line
	where coalesce((v_line ->> 'amountPaid')::numeric, 0) > 0;

	-- Remainder left intentionally as credit becomes its own payment row.
	if v_paid < v_total then
		insert into public.payments (sale_id, method, amount_paid, amount_due, received_by)
		values (v_sale_id, 'credit', 0, v_total - v_paid, v_staff_id);
	end if;

	return v_sale_id;
exception
	when unique_violation then
		-- Concurrent duplicate submit: hand back the winner's sale id.
		select id into v_sale_id from public.sales where idempotency_key = (p_payload ->> 'idempotencyKey')::uuid;
		return v_sale_id;
end;
$$;
