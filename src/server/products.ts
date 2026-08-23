import { createServerFn } from "@tanstack/react-start";
import type { Product, UserInfo } from "~/lib/types";
import { fetchUserInfoLookup, requireUser } from "./auth";

type ProductRow = {
	id: string;
	created_at: string;
	name: string;
	brand_name: string;
	generic_name: string | null;
	bar_code_number: string | null;
	dosage_form_id: string;
	description: string | null;
	image_url: string | null;
	manufacturer: string | null;
	is_active: boolean;
	expiry_date: string | null;
	batch_number: string | null;
	supplier_id: string | null;
	quantity: number;
	price: number | null;
	added_at: string;
	added_by: string;
	deactivated_by: string | null;
	updated_by: string | null;
	updated_at: string | null;
	deleted_by: string | null;
	deleted_at: string | null;
};

type DosageFormRef = { id: string; name: string; description: string | null };

export type ProductInput = {
	name: string;
	brandName: string;
	genericName: string | null;
	barCodeNumber: string | null;
	dosageFormId: string;
	description: string | null;
	imageUrl: string | null;
	manufacturer: string | null;
	expiryDate?: string | null;
	batchNumber?: string | null;
	supplierId?: string | null;
	quantity?: number;
	price?: number | null;
};

type SupplierRef = { id: string; name: string };

const productSelection =
	"id, created_at, name, brand_name, generic_name, bar_code_number, dosage_form_id, description, image_url, manufacturer, is_active, expiry_date, batch_number, supplier_id, quantity, price, added_at, added_by, deactivated_by, updated_by, updated_at, deleted_by, deleted_at, dosage_forms ( id, name, description ), suppliers ( id, name )";

function toProduct(
	row: ProductRow & {
		dosage_forms: DosageFormRef | Array<DosageFormRef> | null;
		suppliers: SupplierRef | Array<SupplierRef> | null;
	},
	users: Map<string, UserInfo>,
): Product {
	const dosageForm = Array.isArray(row.dosage_forms) ? row.dosage_forms[0] : row.dosage_forms;
	const supplier = Array.isArray(row.suppliers) ? row.suppliers[0] : row.suppliers;

	return {
		id: row.id,
		createdAt: row.created_at,
		name: row.name,
		brandName: row.brand_name,
		genericName: row.generic_name,
		barCodeNumber: row.bar_code_number,
		dosageFormId: row.dosage_form_id,
		dosageForm,
		description: row.description,
		imageUrl: row.image_url,
		manufacturer: row.manufacturer,
		isActive: row.is_active,
		expiryDate: row.expiry_date,
		batchNumber: row.batch_number,
		supplierId: row.supplier_id,
		supplier,
		quantity: row.quantity,
		price: row.price === null ? null : Number(row.price),
		addedAt: row.added_at,
		addedBy: users.get(row.added_by) ?? null,
		deactivatedBy: row.deactivated_by ? (users.get(row.deactivated_by) ?? null) : null,
		updatedBy: row.updated_by ? (users.get(row.updated_by) ?? null) : null,
		updatedAt: row.updated_at,
		deletedBy: row.deleted_by ? (users.get(row.deleted_by) ?? null) : null,
		deletedAt: row.deleted_at,
	};
}

export const listProducts = createServerFn({ method: "GET" }).handler(async (): Promise<Array<Product>> => {
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	const { data, error } = await supabase.from("products").select(productSelection).order("created_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to load products: ${error.message}`);
	}

	const rows = data as Array<
		ProductRow & { dosage_forms: DosageFormRef | Array<DosageFormRef> | null; suppliers: SupplierRef | Array<SupplierRef> | null }
	>;

	const users = await fetchUserInfoLookup(
		rows.flatMap((row) => [row.added_by, row.updated_by, row.deactivated_by, row.deleted_by].filter((id): id is string => Boolean(id))),
	);

	return rows.map((row) => toProduct(row, users));
});

export const getProduct = createServerFn({ method: "GET" })
	.validator((input: { productId: string }) => input)
	.handler(async ({ data }): Promise<Product | null> => {
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: row, error } = await supabase.from("products").select(productSelection).eq("id", data.productId).maybeSingle();

		if (error) {
			throw new Error(`Failed to load product: ${error.message}`);
		}

		if (!row) {
			return null;
		}

		const typedRow = row as ProductRow & {
			dosage_forms: DosageFormRef | Array<DosageFormRef> | null;
			suppliers: SupplierRef | Array<SupplierRef> | null;
		};
		const users = await fetchUserInfoLookup(
			[typedRow.added_by, typedRow.updated_by, typedRow.deactivated_by, typedRow.deleted_by].filter((id): id is string => Boolean(id)),
		);

		return toProduct(typedRow, users);
	});

export const addProduct = createServerFn({ method: "POST" })
	.validator((input: ProductInput) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: inserted, error } = await supabase
			.from("products")
			.insert({
				name: data.name,
				brand_name: data.brandName,
				generic_name: data.genericName,
				bar_code_number: data.barCodeNumber,
				dosage_form_id: data.dosageFormId,
				description: data.description,
				image_url: data.imageUrl || null,
				manufacturer: data.manufacturer,
				expiry_date: data.expiryDate || null,
				batch_number: data.batchNumber || null,
				supplier_id: data.supplierId || null,
				quantity: data.quantity ?? 0,
				price: data.price ?? null,
				is_active: true,
				added_at: new Date().toISOString(),
				added_by: user.id,
			})
			.select("id")
			.single();

		if (error) {
			throw new Error(`Failed to add product: ${error.message}`);
		}

		return inserted.id as string;
	});

export const updateProduct = createServerFn({ method: "POST" })
	.validator((input: ProductInput & { productId: string }) => input)
	.handler(async ({ data }): Promise<void> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("products")
			.update({
				name: data.name,
				brand_name: data.brandName,
				generic_name: data.genericName,
				bar_code_number: data.barCodeNumber,
				dosage_form_id: data.dosageFormId,
				description: data.description,
				image_url: data.imageUrl,
				manufacturer: data.manufacturer,
				expiry_date: data.expiryDate || null,
				batch_number: data.batchNumber || null,
				supplier_id: data.supplierId || null,
				quantity: data.quantity ?? 0,
				price: data.price ?? null,
				updated_at: new Date().toISOString(),
				updated_by: user.id,
				deleted_at: null,
				deleted_by: null,
			})
			.eq("id", data.productId);

		if (error) {
			console.error("failed to update product", error);
			throw new Error(`Failed to update product: ${error.message}`);
		}
	});

export const deleteProduct = createServerFn({ method: "POST" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("products")
			.update({
				deleted_at: new Date().toISOString(),
				deleted_by: user.id,
			})
			.eq("id", data.id);

		if (error) {
			throw new Error(`Failed to delete product: ${error.message}`);
		}

		return data.id;
	});

export const restoreProduct = createServerFn({ method: "POST" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("products")
			.update({
				deleted_at: null,
				deleted_by: null,
				updated_at: new Date().toISOString(),
				updated_by: user.id,
			})
			.eq("id", data.id);

		if (error) {
			throw new Error(`Failed to restore product: ${error.message}`);
		}

		return data.id;
	});
