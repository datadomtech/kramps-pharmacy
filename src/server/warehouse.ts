import { createServerFn } from "@tanstack/react-start";
import type { Location, SaleStatus, UserInfo, WarehouseMovement } from "~/lib/types";
import { fetchUserInfoLookup, requireUser } from "./auth";

// ---------------------------------------------------------------------------
// Warehouse stock: products with live batches aggregated for the catalog.
// ---------------------------------------------------------------------------

export type WarehouseStockItem = {
	productId: string;
	productName: string;
	brandName: string;
	dosageFormName: string | null;
	strength: string | null;
	strengthUnit: string | null;
	onHand: number;
	soonestExpiryDate: string | null;
	batchCount: number;
	lastReceivedAt: string;
	lastReceivedBy: UserInfo | null;
	addedBy: UserInfo | null;
};

type WarehouseBatchRow = {
	product_id: string;
	quantity_on_hand: number;
	expiry_date: string | null;
	received_at: string;
	added_by: string;
	products: {
		id: string;
		name: string;
		brand_name: string;
		added_by: string | null;
		strength: string | null;
		strength_unit: string | null;
		dosage_forms: { name: string } | Array<{ name: string }> | null;
	} | null;
};

function firstOrNull<T>(value: T | Array<T> | null | undefined): T | null {
	if (Array.isArray(value)) return value[0] ?? null;

	return value ?? null;
}

export const listWarehouseStock = createServerFn({ method: "GET" }).handler(async (): Promise<Array<WarehouseStockItem>> => {
	await requireUser();
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	const { data: rows, error } = await supabase
		.from("inventory_batches")
		.select(
			"product_id, quantity_on_hand, expiry_date, received_at, added_by, products ( id, name, brand_name, added_by, strength, strength_unit, dosage_forms ( name ) )",
		)
		.gt("quantity_on_hand", 0)
		.filter("deleted_at", "is", null)
		.order("received_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to load warehouse stock: ${error.message}`);
	}

	const grouped = new Map<
		string,
		{
			product: NonNullable<WarehouseBatchRow["products"]>;
			onHand: number;
			soonest: string | null;
			batchCount: number;
			lastReceivedAt: string;
			lastAddedBy: string | null;
		}
	>();

	for (const raw of Array.isArray(rows) ? (rows as unknown as Array<WarehouseBatchRow>) : []) {
		const product = raw.products;

		if (!product) continue;

		const entry = grouped.get(raw.product_id) ?? {
			product,
			onHand: 0,
			soonest: null,
			batchCount: 0,
			lastReceivedAt: "",
			lastAddedBy: null,
		};

		entry.onHand += raw.quantity_on_hand;
		entry.batchCount += 1;

		if (raw.expiry_date !== null && (entry.soonest === null || raw.expiry_date.localeCompare(entry.soonest) < 0)) {
			entry.soonest = raw.expiry_date;
		}

		if (raw.received_at > entry.lastReceivedAt) {
			entry.lastReceivedAt = raw.received_at;
			entry.lastAddedBy = raw.added_by;
		}

		grouped.set(raw.product_id, entry);
	}

	const users = await fetchUserInfoLookup(
		(() => {
			const ids: Array<string> = [];

			for (const entry of grouped.values()) {
				if (entry.product.added_by !== null) ids.push(entry.product.added_by);
				if (entry.lastAddedBy !== null) ids.push(entry.lastAddedBy);
			}

			return ids;
		})(),
	);

	const items: Array<WarehouseStockItem> = [];

	for (const entry of grouped.values()) {
		const dosageForm = firstOrNull(entry.product.dosage_forms);

		items.push({
			productId: entry.product.id,
			productName: entry.product.name,
			brandName: entry.product.brand_name,
			dosageFormName: dosageForm?.name ?? null,
			strength: entry.product.strength,
			strengthUnit: entry.product.strength_unit,
			onHand: entry.onHand,
			soonestExpiryDate: entry.soonest,
			batchCount: entry.batchCount,
			lastReceivedAt: entry.lastReceivedAt,
			lastReceivedBy: entry.lastAddedBy !== null ? (users.get(entry.lastAddedBy) ?? null) : null,
			addedBy: entry.product.added_by !== null ? (users.get(entry.product.added_by) ?? null) : null,
		});
	}

	return items.sort((a, b) => b.lastReceivedAt.localeCompare(a.lastReceivedAt));
});

// ---------------------------------------------------------------------------
// Movement log: union of goods-in (batches), goods-out (sales) and moves.
// ---------------------------------------------------------------------------

type InRow = {
	id: string;
	product_id: string;
	batch_number: string | null;
	expiry_date: string | null;
	quantity_on_hand: number;
	initial_quantity: number | null;
	received_at: string;
	added_by: string;
	suppliers: { name: string } | Array<{ name: string }> | null;
	products: { id: string; name: string } | Array<{ id: string; name: string }> | null;
};

type OutRow = {
	id: string;
	product_id: string;
	quantity: number;
	created_at: string;
	products: { id: string; name: string } | Array<{ id: string; name: string }> | null;
	inventory_batches:
		| { batch_number: string | null; expiry_date: string | null }
		| Array<{ batch_number: string | null; expiry_date: string | null }>
		| null;
	sales: { staff_id: string; status: SaleStatus } | Array<{ staff_id: string; status: SaleStatus }> | null;
};

type MoveRow = {
	id: string;
	product_id: string;
	quantity: number;
	moved_at: string;
	moved_by: string;
	note: string | null;
	products: { id: string; name: string } | Array<{ id: string; name: string }> | null;
	from_locations: { name: string } | Array<{ name: string }> | null;
	to_locations: { name: string } | Array<{ name: string }> | null;
};

export const listWarehouseMovements = createServerFn({ method: "GET" }).handler(async (): Promise<Array<WarehouseMovement>> => {
	await requireUser();
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	const [inResult, outResult, moveResult] = await Promise.all([
		supabase
			.from("inventory_batches")
			.select(
				"id, product_id, batch_number, expiry_date, quantity_on_hand, initial_quantity, received_at, added_by, suppliers ( name ), products ( id, name )",
			)
			.filter("deleted_at", "is", null)
			.order("received_at", { ascending: false })
			.limit(200),
		supabase
			.from("sale_items")
			.select(
				"id, product_id, quantity, created_at, products ( id, name ), inventory_batches ( batch_number, expiry_date ), sales ( staff_id, status )",
			)
			.order("created_at", { ascending: false })
			.limit(200),
		supabase
			.from("inventory_movements")
			.select("id, product_id, quantity, moved_at, moved_by, note, products ( id, name ), from_locations ( name ), to_locations ( name )")
			.order("moved_at", { ascending: false })
			.limit(200),
	]);

	if (inResult.error) {
		throw new Error(`Failed to load stock-in movements: ${inResult.error.message}`);
	}

	if (outResult.error) {
		throw new Error(`Failed to load sales movements: ${outResult.error.message}`);
	}

	if (moveResult.error) {
		throw new Error(`Failed to load stock moves: ${moveResult.error.message}`);
	}

	const inRows = Array.isArray(inResult.data) ? (inResult.data as unknown as Array<InRow>) : [];
	const outRows = Array.isArray(outResult.data) ? (outResult.data as unknown as Array<OutRow>) : [];
	const moveRows = Array.isArray(moveResult.data) ? (moveResult.data as unknown as Array<MoveRow>) : [];

	const users = await fetchUserInfoLookup([
		...inRows.map((row) => row.added_by),
		...outRows.flatMap((row) => {
			const sale = firstOrNull(row.sales);

			return sale !== null ? [sale.staff_id] : [];
		}),
		...moveRows.map((row) => row.moved_by),
	]);

	const movements: Array<WarehouseMovement> = [
		...inRows.map((row) => {
			const product = firstOrNull(row.products);

			return {
				id: `in-${row.id}`,
				type: "in" as const,
				productId: row.product_id,
				productName: product?.name ?? "Unknown product",
				quantity: row.initial_quantity ?? row.quantity_on_hand,
				occurredAt: row.received_at,
				staffName: users.get(row.added_by)?.name ?? null,
				batchNumber: row.batch_number,
				expiryDate: row.expiry_date,
				supplierName: firstOrNull(row.suppliers)?.name ?? null,
				saleStatus: null,
				fromLocationName: null,
				toLocationName: null,
				note: null,
				batchId: row.id,
			};
		}),
		...outRows.map((row) => {
			const product = firstOrNull(row.products);
			const batch = firstOrNull(row.inventory_batches);
			const sale = firstOrNull(row.sales);

			return {
				id: `out-${row.id}`,
				type: "out" as const,
				productId: row.product_id,
				productName: product?.name ?? "Unknown product",
				quantity: row.quantity,
				occurredAt: row.created_at,
				staffName: sale !== null ? (users.get(sale.staff_id)?.name ?? null) : null,
				batchNumber: batch?.batch_number ?? null,
				expiryDate: batch?.expiry_date ?? null,
				supplierName: null,
				saleStatus: sale?.status ?? null,
				fromLocationName: null,
				toLocationName: null,
				note: null,
				batchId: null,
			};
		}),
		...moveRows.map((row) => {
			const product = firstOrNull(row.products);

			return {
				id: `move-${row.id}`,
				type: "move" as const,
				productId: row.product_id,
				productName: product?.name ?? "Unknown product",
				quantity: row.quantity,
				occurredAt: row.moved_at,
				staffName: users.get(row.moved_by)?.name ?? null,
				batchNumber: null,
				expiryDate: null,
				supplierName: null,
				saleStatus: null,
				fromLocationName: firstOrNull(row.from_locations)?.name ?? null,
				toLocationName: firstOrNull(row.to_locations)?.name ?? null,
				note: row.note,
				batchId: null,
			};
		}),
	];

	return movements.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 500);
});

// ---------------------------------------------------------------------------
// Record a stock move (record-only; stock totals unchanged).
// ---------------------------------------------------------------------------

export type StockMoveLine = {
	productId: string;
	quantity: number;
};

export type StockMoveInput = {
	fromLocationId: string;
	toLocationId: string;
	note: string | null;
	lines: Array<StockMoveLine>;
};

const RPC_STOCK_MOVE_ERROR_MESSAGES: Record<string, string> = {
	STAFF_REQUIRED: "No staff member on the register. Sign in and try again.",
	LOCATION_REQUIRED: "Choose both a source and a destination location.",
	SAME_LOCATION: "Source and destination must be different locations.",
	LOCATION_NOT_FOUND: "One of the locations no longer exists.",
	EMPTY_LINES: "Add at least one product to move.",
	PRODUCT_REQUIRED: "A line is missing its product.",
	PRODUCT_NOT_FOUND: "A product in this movement no longer exists. Refresh and retry.",
	INVALID_QUANTITY: "Quantities must be at least 1.",
};

export const recordStockMove = createServerFn({ method: "POST" })
	.validator((input: StockMoveInput) => input)
	.handler(async ({ data }): Promise<{ amount: number }> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: amount, error } = await supabase.rpc("record_stock_move", {
			p_payload: {
				staffId: user.id,
				fromLocationId: data.fromLocationId,
				toLocationId: data.toLocationId,
				note: data.note,
				lines: data.lines.map((line) => ({
					productId: line.productId,
					quantity: line.quantity,
				})),
			},
		});

		if (error) {
			const friendly = Object.keys(RPC_STOCK_MOVE_ERROR_MESSAGES).find((key) => error.message.includes(key));

			throw new Error(friendly ? RPC_STOCK_MOVE_ERROR_MESSAGES[friendly] : `Failed to record move: ${error.message}`);
		}

		return { amount: Number(amount ?? 0) };
	});

// ---------------------------------------------------------------------------
// Locations + batch removal.
// ---------------------------------------------------------------------------

type LocationRow = {
	id: string;
	created_at: string;
	name: string;
	description: string | null;
	added_by: string | null;
	deleted_at: string | null;
};

export const listLocations = createServerFn({ method: "GET" }).handler(async (): Promise<Array<Location>> => {
	await requireUser();
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	const { data: rows, error } = await supabase
		.from("locations")
		.select("*")
		.filter("deleted_at", "is", null)
		.order("created_at", { ascending: true });

	if (error) {
		throw new Error(`Failed to load locations: ${error.message}`);
	}

	const typedRows = Array.isArray(rows) ? (rows as unknown as Array<LocationRow>) : [];
	const users = await fetchUserInfoLookup(typedRows.map((row) => row.added_by).filter((id): id is string => id !== null));

	return typedRows.map((row) => ({
		id: row.id,
		createdAt: row.created_at,
		name: row.name,
		description: row.description,
		addedBy: row.added_by !== null ? (users.get(row.added_by) ?? null) : null,
		deletedAt: row.deleted_at,
	}));
});

export const removeWarehouseBatch = createServerFn({ method: "POST" })
	.validator((input: { batchId: string }) => input)
	.handler(async ({ data }): Promise<void> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("inventory_batches")
			.update({
				deleted_at: new Date().toISOString(),
				deleted_by: user.id,
			})
			.eq("id", data.batchId);

		if (error) {
			throw new Error(`Failed to remove batch: ${error.message}`);
		}
	});
