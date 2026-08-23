import { createServerFn } from "@tanstack/react-start";
import type { Supplier, UserInfo } from "~/lib/types";
import { fetchUserInfoLookup, requireUser } from "./auth";

type SupplierRow = {
	id: string;
	created_at: string;
	name: string;
	phone: string | null;
	address: string | null;
	email: string | null;
	contact_name: string | null;
	contact_phone: string | null;
	contact_email: string | null;
	added_by: string;
	updated_by: string | null;
	updated_at: string | null;
	deleted_by: string | null;
	deleted_at: string | null;
};

export type SupplierInput = {
	name: string;
	phone: string | null;
	address: string | null;
	email: string | null;
	contactName: string | null;
	contactPhone: string | null;
	contactEmail: string | null;
};

const supplierSelection =
	"id, created_at, name, phone, address, email, contact_name, contact_phone, contact_email, added_by, updated_by, updated_at, deleted_by, deleted_at";

function toSupplier(row: SupplierRow, users: Map<string, UserInfo>): Supplier {
	return {
		id: row.id,
		createdAt: row.created_at,
		name: row.name,
		phone: row.phone,
		address: row.address,
		email: row.email,
		contactName: row.contact_name,
		contactPhone: row.contact_phone,
		contactEmail: row.contact_email,
		addedBy: users.get(row.added_by) ?? null,
		updatedBy: row.updated_by ? (users.get(row.updated_by) ?? null) : null,
		updatedAt: row.updated_at,
		deletedBy: row.deleted_by ? (users.get(row.deleted_by) ?? null) : null,
		deletedAt: row.deleted_at,
	};
}

async function listSuppliers(): Promise<Array<Supplier>> {
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	const { data, error } = await supabase.from("suppliers").select(supplierSelection).order("created_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to load suppliers: ${error.message}`);
	}

	const rows = data as Array<SupplierRow>;

	const users = await fetchUserInfoLookup(
		rows.flatMap((row) => [row.added_by, row.updated_by, row.deleted_by].filter((id): id is string => Boolean(id))),
	);

	return rows.map((row) => toSupplier(row, users));
}

export const listAllSuppliers = createServerFn({ method: "GET" }).handler(() => listSuppliers());

export const getSupplier = createServerFn({ method: "GET" })
	.validator((input: { supplierId: string }) => input)
	.handler(async ({ data }): Promise<Supplier | null> => {
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: row, error } = await supabase.from("suppliers").select(supplierSelection).eq("id", data.supplierId).maybeSingle();

		if (error) {
			throw new Error(`Failed to load supplier: ${error.message}`);
		}

		if (!row) {
			return null;
		}

		const users = await fetchUserInfoLookup([row.added_by, row.updated_by, row.deleted_by].filter((id): id is string => Boolean(id)));

		return toSupplier(row, users);
	});

export const addSupplier = createServerFn({ method: "POST" })
	.validator((input: SupplierInput) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: inserted, error } = await supabase
			.from("suppliers")
			.insert({
				name: data.name,
				phone: data.phone,
				address: data.address,
				email: data.email,
				contact_name: data.contactName,
				contact_phone: data.contactPhone,
				contact_email: data.contactEmail,
				added_by: user.id,
			})
			.select("id")
			.single();

		if (error) {
			throw new Error(`Failed to add supplier: ${error.message}`);
		}

		return inserted.id;
	});

export const updateSupplier = createServerFn({ method: "POST" })
	.validator((input: SupplierInput & { supplierId: string }) => input)
	.handler(async ({ data }): Promise<void> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("suppliers")
			.update({
				name: data.name,
				phone: data.phone,
				address: data.address,
				email: data.email,
				contact_name: data.contactName,
				contact_phone: data.contactPhone,
				contact_email: data.contactEmail,
				updated_at: new Date().toISOString(),
				updated_by: user.id,
				deleted_at: null,
				deleted_by: null,
			})
			.eq("id", data.supplierId);

		if (error) {
			throw new Error(`Failed to update supplier: ${error.message}`);
		}
	});

export const deleteSupplier = createServerFn({ method: "POST" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("suppliers")
			.update({
				deleted_at: new Date().toISOString(),
				deleted_by: user.id,
			})
			.eq("id", data.id);

		if (error) {
			throw new Error(`Failed to delete supplier: ${error.message}`);
		}

		return data.id;
	});

export const restoreSupplier = createServerFn({ method: "POST" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("suppliers")
			.update({
				deleted_at: null,
				deleted_by: null,
				updated_at: new Date().toISOString(),
				updated_by: user.id,
			})
			.eq("id", data.id);

		if (error) {
			throw new Error(`Failed to restore supplier: ${error.message}`);
		}

		return data.id;
	});
