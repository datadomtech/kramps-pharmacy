import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "./auth";

export type StockInLine = {
	productId: string;
	quantity: number;
	unitCost: number;
	price?: number | null;
	batchNumber?: string | null;
	expiryDate?: string | null;
};

export type StockInInput = {
	supplierId: string;
	lines: Array<StockInLine>;
};

const RPC_STOCK_IN_ERROR_MESSAGES: Record<string, string> = {
	STAFF_REQUIRED: "No staff member on the register. Sign in and try again.",
	SUPPLIER_REQUIRED: "Choose a supplier for this receipt.",
	SUPPLIER_NOT_FOUND: "That supplier no longer exists.",
	EMPTY_LINES: "Add at least one product to receive.",
	PRODUCT_REQUIRED: "A line is missing its product.",
	PRODUCT_NOT_FOUND: "A product in this receipt is missing or inactive. Refresh and retry.",
	INVALID_QUANTITY: "Quantities must be at least 1.",
	INVALID_COST: "Unit cost cannot be negative.",
	INVALID_PRICE: "Selling price cannot be negative.",
};

export type SupplierProductSummary = {
	id: string;
	name: string;
	brandName: string;
	genericName: string | null;
	strength: string | null;
	strengthUnit: string | null;
	dosageFormName: string | null;
};

export type InventoryBatchLine = {
	id: string;
	productId: string;
	productName: string;
	brandName: string;
	dosageFormName: string | null;
	batchNumber: string | null;
	quantityOnHand: number;
	expiryDate: string | null;
	receivedAt: string;
	costPrice: number | null;
};

type SupplierProductRow = {
	product_id: string;
	products: {
		id: string;
		name: string;
		brand_name: string;
		generic_name: string | null;
		strength: string | null;
		strength_unit: string | null;
		is_active: boolean;
		deleted_at: string | null;
		dosage_forms: { name: string } | Array<{ name: string }> | null;
	} | null;
};

export const addStockIn = createServerFn({ method: "POST" })
	.validator((input: StockInInput) => input)
	.handler(async ({ data }): Promise<{ amount: number }> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: amount, error } = await supabase.rpc("record_stock_in", {
			p_payload: {
				staffId: user.id,
				supplierId: data.supplierId,
				lines: data.lines.map((line) => ({
					productId: line.productId,
					quantity: line.quantity,
					unitCost: line.unitCost,
					price: line.price ?? null,
					batchNumber: line.batchNumber ?? null,
					expiryDate: line.expiryDate ?? null,
				})),
			},
		});

		if (error) {
			const friendly = Object.keys(RPC_STOCK_IN_ERROR_MESSAGES).find((key) => error.message.includes(key));

			throw new Error(friendly ? RPC_STOCK_IN_ERROR_MESSAGES[friendly] : `Failed to record receipt: ${error.message}`);
		}

		return { amount: Number(amount ?? 0) };
	});

export const listSupplierProducts = createServerFn({ method: "GET" })
	.validator((input: { supplierId: string }) => input)
	.handler(async ({ data }): Promise<Array<SupplierProductSummary>> => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		if (data.supplierId === "") {
			return [];
		}

		const { data: rows, error } = await supabase
			.from("inventory_batches")
			.select(
				"product_id, products ( id, name, brand_name, generic_name, strength, strength_unit, is_active, deleted_at, dosage_forms ( name ) )",
			)
			.eq("supplier_id", data.supplierId)
			.filter("deleted_at", "is", null)
			.order("received_at", { ascending: false })
			.limit(20);

		if (error) {
			throw new Error(`Failed to load supplier products: ${error.message}`);
		}

		const seen = new Set<string>();
		const results: Array<SupplierProductSummary> = [];

		for (const row of Array.isArray(rows) ? (rows as unknown as Array<SupplierProductRow>) : []) {
			const product = row.products;
			if (!product || product.deleted_at !== null || !product.is_active || seen.has(product.id)) {
				continue;
			}

			seen.add(product.id);
			const dosageForm = Array.isArray(product.dosage_forms) ? product.dosage_forms[0] : product.dosage_forms;

			results.push({
				id: product.id,
				name: product.name,
				brandName: product.brand_name,
				genericName: product.generic_name,
				strength: product.strength,
				strengthUnit: product.strength_unit,
				dosageFormName: dosageForm?.name ?? null,
			});
		}

		return results;
	});

type BatchLineRow = {
	id: string;
	product_id: string;
	batch_number: string | null;
	quantity_on_hand: number;
	expiry_date: string | null;
	received_at: string;
	cost_price: string | number | null;
	products: { name: string; brand_name: string; dosage_forms: { name: string } | Array<{ name: string }> | null } | null;
};

export const listInventoryBatches = createServerFn({ method: "GET" }).handler(async (): Promise<Array<InventoryBatchLine>> => {
	await requireUser();
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	const { data: rows, error } = await supabase
		.from("inventory_batches")
		.select(
			"id, product_id, batch_number, quantity_on_hand, expiry_date, received_at, cost_price, products ( name, brand_name, dosage_forms ( name ) )",
		)
		.filter("deleted_at", "is", null)
		.order("received_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to load inventory batches: ${error.message}`);
	}

	return (Array.isArray(rows) ? (rows as unknown as Array<BatchLineRow>) : []).map((row) => {
		const product = row.products;
		const raw = product?.dosage_forms ?? null;
		const dosageForm = Array.isArray(raw) ? raw[0] : raw;

		return {
			id: row.id,
			productId: row.product_id,
			productName: product?.name ?? "Unknown product",
			brandName: product?.brand_name ?? "",
			dosageFormName: dosageForm?.name ?? null,
			batchNumber: row.batch_number,
			quantityOnHand: row.quantity_on_hand,
			expiryDate: row.expiry_date,
			receivedAt: row.received_at,
			costPrice: row.cost_price === null ? null : Number(row.cost_price),
		};
	});
});
