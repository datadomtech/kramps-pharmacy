import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "./auth";

export type StaffMember = {
	id: string;
	createdAt: number;
	fullName: string | undefined;
	email: string | undefined;
	phone: string | undefined;
};

type AddStaffInput = {
	fullName: string;
	email: string;
	phoneNumber: string;
	password: string;
};

export const listStaff = createServerFn({ method: "GET" }).handler(async (): Promise<Array<StaffMember>> => {
	await requireUser();

	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const admin = createSupabaseAdminClient();

	const users: Array<StaffMember> = [];
	let page = 1;
	const perPage = 200;

	for (;;) {
		const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

		if (error) {
			throw new Error(`Failed to load staff: ${error.message}`);
		}

		for (const user of data.users) {
			users.push({
				id: user.id,
				createdAt: Date.parse(user.created_at),
				fullName: pickMetadataString(user.user_metadata, ["full_name", "name"]),
				email: user.email ?? undefined,
				phone: user.phone ?? pickMetadataString(user.user_metadata, ["phone_number"]) ?? undefined,
			});
		}

		if (data.users.length < perPage) {
			break;
		}

		page += 1;
	}

	return users;
});

function pickMetadataString(metadata: Record<string, unknown> | undefined, keys: Array<string>): string | undefined {
	for (const key of keys) {
		const value = metadata?.[key];

		if (typeof value === "string" && value.trim() !== "") {
			return value;
		}
	}

	return undefined;
}

export const addStaff = createServerFn({ method: "POST" })
	.validator((input: AddStaffInput) => input)
	.handler(async ({ data }): Promise<{ id: string; name: string }> => {
		await requireUser();

		const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
		const admin = createSupabaseAdminClient();

		const { data: created, error } = await admin.auth.admin.createUser({
			email: data.email,
			password: data.password,
			phone: data.phoneNumber,
			email_confirm: true,
			user_metadata: {
				full_name: data.fullName,
				phone_number: data.phoneNumber,
			},
		});

		if (error) {
			throw new Error(`Failed to add staff member: ${error.message}`);
		}

		return {
			id: created.user.id,
			name: data.fullName,
		};
	});
