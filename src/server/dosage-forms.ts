import { createServerFn } from "@tanstack/react-start";
import type { DosageForm, UserInfo } from "~/lib/types";
import { fetchUserInfoLookup, requireUser } from "./auth";

type DosageFormRow = {
	id: string;
	created_at: string;
	name: string;
	description: string | null;
	added_by: string | null;
	updated_by: string | null;
	updated_at: string | null;
	deleted_at: string | null;
};

type DosageFormInput = {
	name: string;
	description: string | null;
};

function toDosageForm(row: DosageFormRow, users: Map<string, UserInfo>): DosageForm {
	return {
		id: row.id,
		createdAt: row.created_at,
		name: row.name,
		description: row.description,
		addedBy: row.added_by ? (users.get(row.added_by) ?? null) : null,
		updatedBy: row.updated_by ? (users.get(row.updated_by) ?? null) : null,
		updatedAt: row.updated_at,
		deletedAt: row.deleted_at,
	};
}

export const listDosageForms = createServerFn({ method: "GET" }).handler(async (): Promise<Array<DosageForm>> => {
	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseAdminClient();

	const { data, error } = await supabase
		.from("dosage_forms")
		.select("id, created_at, name, description, added_by, updated_by, updated_at, deleted_at")
		.is("deleted_at", null)
		.order("created_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to load dosage forms: ${error.message}`);
	}

	const rows = data as Array<DosageFormRow>;

	const users = await fetchUserInfoLookup(rows.flatMap((row) => [row.added_by, row.updated_by].filter((id): id is string => Boolean(id))));

	return rows.map((row) => toDosageForm(row, users));
});

export const addDosageForm = createServerFn({ method: "POST" })
	.validator((input: DosageFormInput) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { data: inserted, error } = await supabase
			.from("dosage_forms")
			.insert({
				name: data.name,
				description: data.description,
				added_by: user.id,
				deleted_at: null,
				updated_at: null,
			})
			.select("id")
			.single();

		if (error) {
			throw new Error(`Failed to add dosage form: ${error.message}`);
		}

		return inserted.id as string;
	});

export const updateDosageForm = createServerFn({ method: "POST" })
	.validator((input: DosageFormInput & { dosageFormId: string }) => input)
	.handler(async ({ data }): Promise<void> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("dosage_forms")
			.update({
				name: data.name,
				description: data.description,
				updated_at: new Date().toISOString(),
				updated_by: user.id,
				deleted_at: null,
			})
			.eq("id", data.dosageFormId);

		if (error) {
			throw new Error(`Failed to update dosage form: ${error.message}`);
		}
	});

export const deleteDosageForm = createServerFn({ method: "POST" })
	.validator((input: { id: string }) => input)
	.handler(async ({ data }): Promise<string> => {
		const user = await requireUser();
		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const supabase = createSupabaseAdminClient();

		const { error } = await supabase
			.from("dosage_forms")
			.update({
				deleted_at: new Date().toISOString(),
				deleted_by: user.id,
			})
			.eq("id", data.id);

		if (error) {
			throw new Error(`Failed to delete dosage form: ${error.message}`);
		}

		return data.id;
	});
