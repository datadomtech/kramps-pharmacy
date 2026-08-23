import { createServerFn } from "@tanstack/react-start";
import type { InventoryBatch } from "~/lib/types";
import { requireUser } from "./auth";

export type ProductSearchResult = {
	id: string;
	name: string;
	brandName: string;
	genericName: string | null;
	barCodeNumber: string | null;
	price: number | null;
	dosageFormName: string | null;
	stockAvailable: number;
	soonestExpiryDate: string | null;
};

export type CustomerSearchResult = {
	id: string;
	name: string;
	phone: string | null;
	email: string | null;
	blacklisted: boolean;
};

type BatchRow = {
	id: string;
	created_at: string;
	product_id: string;
	batch_number: string | null;
	quantity_on_hand: number;
	expiry_date: string | null;
	received_at: string;
	supplier_id: string | null;
	cost_price: string | number | null;
};

function sanitizeTerm(term: string): string {
	return term.replace(/[%_,()]/g, " ").trim();
}

export const searchProducts = createServerFn({ method: "GET" })
	.validator((input: { query: string }) => input)
	.handler(async ({ data }): Promise<Array<ProductSearchResult>> => {
		const term = sanitizeTerm(data.query);

		if (term === "") {
			return [];
		}

		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const pattern = `${term}%`;

		const { data: rows, error } = await supabase
			.from("products")
			.select(
				"id, name, brand_name, generic_name, bar_code_number, price, dosage_forms ( name ), inventory_batches ( quantity_on_hand, expiry_date )",
			)
			.eq("is_active", true)
			.filter("deleted_at", "is", null)
			.or(`name.ilike."${pattern}",generic_name.ilike."${pattern}",brand_name.ilike."${pattern}",bar_code_number.ilike."${pattern}"`)
			.limit(10);

		if (error) {
			throw new Error(`Product search failed: ${error.message}`);
		}

		return rows.map((row: any) => {
			const batches = (row.inventory_batches ?? []) as Array<{ quantity_on_hand: number; expiry_date: string | null }>;
			const openBatches = batches.filter((batch) => batch.quantity_on_hand > 0);
			const expiries = openBatches.map((batch) => batch.expiry_date).filter((expiry): expiry is string => expiry !== null);

			return {
				id: row.id as string,
				name: row.name as string,
				brandName: row.brand_name as string,
				genericName: (row.generic_name as string | null) ?? null,
				barCodeNumber: (row.bar_code_number as string | null) ?? null,
				price: row.price === null || row.price === undefined ? null : Number(row.price),
				dosageFormName: Array.isArray(row.dosage_forms) ? (row.dosage_forms[0]?.name ?? null) : (row.dosage_forms?.name ?? null),
				stockAvailable: openBatches.reduce((sum, batch) => sum + batch.quantity_on_hand, 0),
				soonestExpiryDate: expiries.length > 0 ? expiries.sort()[0] : null,
			};
		});
	});

export const getProductBatches = createServerFn({ method: "GET" })
	.validator((input: { productId: string }) => input)
	.handler(async ({ data }): Promise<Array<InventoryBatch>> => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: rows, error } = await supabase
			.from("inventory_batches")
			.select("*")
			.eq("product_id", data.productId)
			.gt("quantity_on_hand", 0)
			.filter("deleted_at", "is", null)
			.order("expiry_date", { ascending: true, nullsFirst: false })
			.order("received_at", { ascending: true });

		if (error) {
			throw new Error(`Failed to load batches: ${error.message}`);
		}

		return (rows as Array<BatchRow>).map((row) => ({
			id: row.id,
			createdAt: row.created_at,
			productId: row.product_id,
			batchNumber: row.batch_number,
			quantityOnHand: row.quantity_on_hand,
			expiryDate: row.expiry_date,
			receivedAt: row.received_at,
			supplierId: row.supplier_id,
			costPrice: row.cost_price === null ? null : Number(row.cost_price),
		}));
	});

export const searchCustomers = createServerFn({ method: "GET" })
	.validator((input: { query: string }) => input)
	.handler(async ({ data }): Promise<Array<CustomerSearchResult>> => {
		const term = sanitizeTerm(data.query);

		if (term.length < 2) {
			return [];
		}

		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: rows, error } = await supabase
			.from("customers")
			.select("id, name, phone, email, blacklisted_at")
			.filter("deleted_at", "is", null)
			.or(`name.ilike."${term}%",phone.ilike."${term}%"`)
			.limit(8);

		if (error) {
			throw new Error(`Customer search failed: ${error.message}`);
		}

		return rows.map((row: any) => ({
			id: row.id as string,
			name: row.name as string,
			phone: (row.phone as string | null) ?? null,
			email: (row.email as string | null) ?? null,
			blacklisted: row.blacklisted_at !== null,
		}));
	});

export const getBlacklistStatus = createServerFn({ method: "GET" })
	.validator((input: { customerId: string }) => input)
	.handler(async ({ data }): Promise<{ blacklisted: boolean; reason: string | null }> => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: row, error } = await supabase.from("customers").select("blacklisted_at, blacklisted_reason").eq("id", data.customerId).single();

		if (error) {
			throw new Error(`Failed to check blacklist status: ${error.message}`);
		}

		return {
			blacklisted: row.blacklisted_at !== null,
			reason: (row.blacklisted_reason as string | null) ?? null,
		};
	});

export const getCustomerBalance = createServerFn({ method: "GET" })
	.validator((input: { customerId: string }) => input)
	.handler(async ({ data }): Promise<{ outstandingBalance: number }> => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: balance, error } = await supabase.rpc("customer_outstanding_balance", {
			p_customer_id: data.customerId,
		});

		if (error) {
			throw new Error(`Failed to compute balance: ${error.message}`);
		}

		return { outstandingBalance: Number(balance ?? 0) };
	});
