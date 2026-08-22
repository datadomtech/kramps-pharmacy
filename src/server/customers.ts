import { createServerFn } from "@tanstack/react-start";
import type { Customer, UserInfo } from "~/lib/types";
import { fetchUserInfoLookup, requireUser } from "./auth";

type CustomerRow = {
	id: string;
	created_at: string;
	name: string;
	phone: string | null;
	address: string | null;
	email: string | null;
	contact_name: string | null;
	contact_phone: string | null;
	contact_email: string | null;
	type: Customer["type"];
	blacklisted_at: string | null;
	blacklisted_by: string | null;
	blacklisted_reason: string | null;
	added_by: string;
	updated_by: string | null;
	updated_at: string | null;
	deleted_at: string | null;
	deleted_by: string | null;
};

type CustomerInput = {
	name: string;
	phone: string | null;
	address: string | null;
	email: string | null;
	contactName: string | null;
	contactPhone: string | null;
	contactEmail: string | null;
	type: Customer["type"];
};

function toCustomer(row: CustomerRow, users: Map<string, UserInfo>): Customer {
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
		type: row.type,
		blacklistedAt: row.blacklisted_at,
		blacklistedBy: row.blacklisted_by,
		blacklistedReason: row.blacklisted_reason,
		addedBy: users.get(row.added_by) ?? null,
		updatedBy: row.updated_by ? (users.get(row.updated_by) ?? null) : null,
		updatedAt: row.updated_at,
		deletedAt: row.deleted_at,
		deletedBy: row.deleted_by,
	};
}

async function listCustomers(whereBlacklisted: boolean): Promise<Array<Customer>> {
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	let query = supabase
		.from("customers")
		.select(
			"id, created_at, name, phone, address, email, contact_name, contact_phone, contact_email, type, blacklisted_at, blacklisted_by, blacklisted_reason, added_by, updated_by, updated_at, deleted_at, deleted_by",
		)
		.order("created_at", { ascending: false });

	if (whereBlacklisted) {
		query = query.not("blacklisted_at", "is", null);
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(`Failed to load customers: ${error.message}`);
	}

	const rows = data as Array<CustomerRow>;

	const users = await fetchUserInfoLookup(rows.flatMap((row) => [row.added_by, row.updated_by].filter((id): id is string => Boolean(id))));

	return rows.map((row) => toCustomer(row, users));
}

export const listActiveCustomers = createServerFn({ method: "GET" }).handler(() => listCustomers(false));

export const listBlacklistedCustomers = createServerFn({ method: "GET" }).handler(() => listCustomers(true));

export const addCustomer = createServerFn({ method: "POST" })
	.validator((input: CustomerInput) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: inserted, error } = await supabase
			.from("customers")
			.insert({
				name: data.name,
				phone: data.phone,
				address: data.address,
				email: data.email,
				contact_name: data.contactName,
				contact_phone: data.contactPhone,
				contact_email: data.contactEmail,
				type: data.type,
				added_by: user.id,
			})
			.select("id")
			.single();

		if (error) {
			throw new Error(`Failed to add customer: ${error.message}`);
		}

		return inserted.id as string;
	});

export const updateCustomer = createServerFn({ method: "POST" })
	.validator((input: CustomerInput & { customerId: string }) => input)
	.handler(async ({ data }): Promise<void> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("customers")
			.update({
				name: data.name,
				phone: data.phone,
				address: data.address,
				email: data.email,
				contact_name: data.contactName,
				contact_phone: data.contactPhone,
				contact_email: data.contactEmail,
				type: data.type,
				updated_at: new Date().toISOString(),
				updated_by: user.id,
				deleted_at: null,
				deleted_by: null,
			})
			.eq("id", data.customerId);

		if (error) {
			throw new Error(`Failed to update customer: ${error.message}`);
		}
	});

export const deleteCustomer = createServerFn({ method: "POST" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("customers")
			.update({
				deleted_at: new Date().toISOString(),
				deleted_by: user.id,
			})
			.eq("id", data.id);

		if (error) {
			throw new Error(`Failed to delete customer: ${error.message}`);
		}

		return data.id;
	});
