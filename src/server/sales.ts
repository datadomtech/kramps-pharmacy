import { createServerFn } from "@tanstack/react-start";
import type { FulfillmentType, Payment, PaymentMethod, Sale, SaleItem, SaleStatus, UserInfo } from "~/lib/types";
import { fetchUserInfoLookup, requireUser } from "./auth";

export type CreateSaleInput = {
	idempotencyKey: string;
	customerId: string | null;
	fulfillmentType: FulfillmentType;
	courierId?: string | null;
	deliveryAddress?: string | null;
	discount: number;
	allowExpiredBatch: boolean;
	blacklistOverride: boolean;
	creditAcknowledged: boolean;
	items: Array<{ productId: string; quantity: number; inventoryBatchId?: string | null }>;
	payments: Array<{ method: PaymentMethod; amountPaid: number; reference?: string | null }>;
};

const RPC_ERROR_MESSAGES: Record<string, string> = {
	STAFF_REQUIRED: "No staff member on the register. Sign in and try again.",
	INVALID_FULFILLMENT_TYPE: "Fulfilment type must be pickup or delivery.",
	DELIVERY_ADDRESS_REQUIRED: "Delivery address is required for delivery sales.",
	INVALID_DISCOUNT: "Discount cannot be negative.",
	EMPTY_CART: "Add at least one product to the cart.",
	CUSTOMER_BLACKLISTED: "This customer is blacklisted. An override is required to continue.",
	INVALID_QUANTITY: "Quantities must be at least 1.",
	PRODUCT_NOT_FOUND: "A product in the cart no longer exists. Refresh and retry.",
	BATCH_NOT_FOUND: "The selected batch is no longer available.",
	BATCH_EXPIRED: "A batch in this sale has expired. Expired stock cannot be sold unless overridden.",
	INSUFFICIENT_STOCK: "Not enough stock across batches to fulfil an item.",
	OVERPAYMENT: "Payments exceed the total due.",
	UNDERPAID_CREDIT_NOT_ACKNOWLEDGED: "Remaining balance must be acknowledged as credit.",
	INVALID_PAYMENT_AMOUNT: "Payment amounts cannot be negative.",
	INVALID_PAYMENT_METHOD: "Payment method must be cash, momo or credit.",
};

type SaleRow = {
	id: string;
	created_at: string;
	customer_id: string | null;
	staff_id: string;
	fulfillment_type: FulfillmentType;
	courier_id: string | null;
	delivery_address: string | null;
	status: SaleStatus;
	subtotal: string | number;
	discount: string | number;
	total: string | number;
};

type SaleItemRow = {
	id: string;
	sale_id: string;
	product_id: string;
	inventory_batch_id: string | null;
	dosage_form_id: string | null;
	quantity: number;
	unit_price: string | number;
	line_total: string | number;
	products: { name: string } | Array<{ name: string }> | null;
	inventory_batches:
		| { batch_number: string | null; expiry_date: string | null }
		| Array<{ batch_number: string | null; expiry_date: string | null }>
		| null;
};

type PaymentRow = {
	id: string;
	sale_id: string;
	method: PaymentMethod;
	amount_paid: string | number;
	amount_due: string | number;
	received_by: string;
	reference: string | null;
	paid_at: string;
};

function num(value: string | number): number {
	return typeof value === "number" ? value : Number(value);
}

function firstOrNull<T>(value: T | Array<T> | null | undefined): T | null {
	if (Array.isArray(value)) return value[0] ?? null;

	return value ?? null;
}

function toSale(row: SaleRow, users: Map<string, UserInfo>): Sale {
	return {
		id: row.id,
		createdAt: row.created_at,
		customerId: row.customer_id,
		staffId: row.staff_id,
		staffName: users.get(row.staff_id)?.name ?? null,
		courierName: row.courier_id !== null ? (users.get(row.courier_id)?.name ?? null) : null,
		fulfillmentType: row.fulfillment_type,
		courierId: row.courier_id,
		deliveryAddress: row.delivery_address,
		status: row.status,
		subtotal: num(row.subtotal),
		discount: num(row.discount),
		total: num(row.total),
	};
}

function toSaleItem(row: SaleItemRow): SaleItem & { productName: string | null; batchNumber: string | null; expiryDate: string | null } {
	const product = firstOrNull(row.products);
	const batch = firstOrNull(row.inventory_batches);

	return {
		id: row.id,
		saleId: row.sale_id,
		productId: row.product_id,
		inventoryBatchId: row.inventory_batch_id,
		dosageFormId: row.dosage_form_id,
		quantity: row.quantity,
		unitPrice: num(row.unit_price),
		lineTotal: num(row.line_total),
		productName: product?.name ?? null,
		batchNumber: batch?.batch_number ?? null,
		expiryDate: batch?.expiry_date ?? null,
	};
}

function toPayment(row: PaymentRow): Payment {
	return {
		id: row.id,
		saleId: row.sale_id,
		method: row.method,
		amountPaid: num(row.amount_paid),
		amountDue: num(row.amount_due),
		receivedBy: row.received_by,
		reference: row.reference,
		paidAt: row.paid_at,
	};
}

async function userLookup(ids: Array<string | null>): Promise<Map<string, UserInfo>> {
	return fetchUserInfoLookup(ids.filter((id): id is string => Boolean(id)));
}

export type SaleReceipt = {
	sale: Sale;
	items: Array<SaleItem & { productName: string | null; batchNumber: string | null; expiryDate: string | null }>;
	payments: Array<Payment>;
};

export const createSale = createServerFn({ method: "POST" })
	.validator((input: Omit<CreateSaleInput, never> & { idempotencyKey: string }) => input)
	.handler(async ({ data }): Promise<SaleReceipt> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: saleId, error } = await supabase.rpc("create_sale", {
			p_payload: {
				idempotencyKey: data.idempotencyKey,
				staffId: user.id,
				customerId: data.customerId,
				fulfillmentType: data.fulfillmentType,
				courierId: data.courierId ?? null,
				deliveryAddress: data.deliveryAddress ?? null,
				discount: data.discount,
				allowExpiredBatch: data.allowExpiredBatch,
				blacklistOverride: data.blacklistOverride,
				creditAcknowledged: data.creditAcknowledged,
				items: data.items,
				payments: data.payments,
			},
		});

		if (error !== null) {
			const raw = error.message;
			const code = Object.keys(RPC_ERROR_MESSAGES).find((key) => raw.includes(key));

			throw new Error(code !== undefined ? RPC_ERROR_MESSAGES[code] : `Failed to create sale: ${raw}`);
		}

		if (typeof saleId !== "string") {
			throw new Error("Sale creation returned no id.");
		}

		return loadSale(supabase, saleId);
	});

async function loadSale(
	supabase: any,
	saleId: string,
): Promise<{ sale: Sale; items: Array<ReturnType<typeof toSaleItem>>; payments: Array<Payment> }> {
	const { data: saleRow, error: saleError } = await supabase.from("sales").select("*").eq("id", saleId).single();

	if (saleError) {
		throw new Error(`Failed to load sale: ${saleError.message}`);
	}

	const { data: itemRows, error: itemsError } = await supabase
		.from("sale_items")
		.select("*, products ( name ), inventory_batches ( batch_number, expiry_date )")
		.eq("sale_id", saleId);

	if (itemsError) {
		throw new Error(`Failed to load sale items: ${itemsError.message}`);
	}

	const { data: paymentRows, error: paymentsError } = await supabase.from("payments").select("*").eq("sale_id", saleId);

	if (paymentsError) {
		throw new Error(`Failed to load payments: ${paymentsError.message}`);
	}

	const typedSale = saleRow as SaleRow;
	const users = await userLookup([typedSale.staff_id, typedSale.courier_id]);

	return {
		sale: toSale(typedSale, users),
		items: (itemRows as Array<SaleItemRow>).map(toSaleItem),
		payments: (paymentRows as Array<PaymentRow>).map(toPayment),
	};
}

export const getSale = createServerFn({ method: "GET" })
	.validator((input: { saleId: string }) => input)
	.handler(async ({ data }) => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		return loadSale(supabase, data.saleId);
	});

export const listSales = createServerFn({ method: "GET" })
	.validator(
		(input: { staffId?: string | null; customerId?: string | null; status?: SaleStatus | null; from?: string | null; to?: string | null }) =>
			input,
	)
	.handler(async ({ data }): Promise<Array<Sale>> => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		let query = supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(200);

		if (data.staffId) query = query.eq("staff_id", data.staffId);
		if (data.customerId) query = query.eq("customer_id", data.customerId);
		if (data.status) query = query.eq("status", data.status);
		if (data.from) query = query.gte("created_at", data.from);
		if (data.to) query = query.lte("created_at", data.to);

		const { data: rows, error } = await query;

		if (error) {
			throw new Error(`Failed to list sales: ${error.message}`);
		}

		const typedRows = rows as Array<SaleRow>;
		const users = await userLookup(typedRows.flatMap((row) => [row.staff_id, row.courier_id]));

		return typedRows.map((row) => toSale(row, users));
	});

const ALLOWED_STATUS_TRANSITIONS: Record<string, Array<SaleStatus>> = {
	pending: ["cancelled"],
	completed: ["refunded"],
};

export const updateSaleStatus = createServerFn({ method: "POST" })
	.validator((input: { saleId: string; status: SaleStatus }) => input)
	.handler(async ({ data }): Promise<void> => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: existing, error: loadError } = await supabase
			.from("sales")
			.select("status")
			.eq("id", data.saleId)
			.single<{ status: SaleStatus }>();

		if (loadError) {
			throw new Error(`Failed to load sale: ${loadError.message}`);
		}

		const currentStatus = existing.status;
		const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

		if (!allowed.includes(data.status)) {
			throw new Error(`Cannot move a ${currentStatus} sale to ${data.status}.`);
		}

		const { error } = await supabase.from("sales").update({ status: data.status }).eq("id", data.saleId);

		if (error) {
			throw new Error(`Failed to update sale status: ${error.message}`);
		}
	});

export const addPayment = createServerFn({ method: "POST" })
	.validator((input: { saleId: string; method: PaymentMethod; amountPaid: number; reference?: string | null }) => input)
	.handler(async ({ data }): Promise<void> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		if (data.amountPaid <= 0) {
			throw new Error("Payment amount must be greater than zero.");
		}

		const { error } = await supabase.from("payments").insert({
			sale_id: data.saleId,
			method: data.method,
			amount_paid: data.amountPaid,
			amount_due: 0,
			received_by: user.id,
			reference: data.reference || null,
		});

		if (error) {
			throw new Error(`Failed to record payment: ${error.message}`);
		}

		// Settle a pending credit sale once fully paid.
		const { data: totals, error: totalsError } = await supabase.from("sales").select("total, status").eq("id", data.saleId).single();

		if (totalsError === null && (totals as { status: SaleStatus }).status === "pending") {
			const { data: paidSum, error: sumError } = await supabase.from("payments").select("amount_paid").eq("sale_id", data.saleId);

			if (sumError === null) {
				const paid = (paidSum as Array<{ amount_paid: string | number }>).reduce((sum, row) => sum + num(row.amount_paid), 0);

				if (paid + 0.005 >= num((totals as { total: string | number }).total)) {
					await supabase.from("sales").update({ status: "completed" }).eq("id", data.saleId);
				}
			}
		}
	});

export const listPayments = createServerFn({ method: "GET" })
	.validator((input: { saleId: string }) => input)
	.handler(async ({ data }): Promise<Array<Payment>> => {
		await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: rows, error } = await supabase.from("payments").select("*").eq("sale_id", data.saleId).order("paid_at");

		if (error) {
			throw new Error(`Failed to list payments: ${error.message}`);
		}

		return (rows as Array<PaymentRow>).map(toPayment);
	});
