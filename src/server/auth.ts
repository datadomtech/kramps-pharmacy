import { createServerFn } from "@tanstack/react-start";
import type { SessionUser, UserInfo } from "~/lib/types";

export const getSessionUser = createServerFn({ method: "GET" }).handler(async (): Promise<SessionUser | null> => {
	const { createSupabaseServerClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseServerClient();
	const { data } = await supabase.auth.getUser();

	const user = data.user;

	if (!user) {
		return null;
	}

	return {
		id: user.id,
		email: user.email ?? null,
		name: resolveUserName(user),
		phone: user.phone ?? null,
	};
});

export async function requireUser(): Promise<SessionUser> {
	const { createSupabaseServerClient } = await import("~/lib/supabase/server");
	const supabase = createSupabaseServerClient();
	const { data } = await supabase.auth.getUser();
	const user = data.user;

	if (!user) {
		throw new Error("Unauthorized");
	}

	return {
		id: user.id,
		email: user.email ?? null,
		name: resolveUserName(user),
		phone: user.phone ?? null,
	};
}

function resolveUserName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string | null {
	const metadata = user.user_metadata ?? {};

	for (const key of ["full_name", "name"]) {
		const value = metadata[key];

		if (typeof value === "string" && value.trim() !== "") {
			return value;
		}
	}

	return user.email ?? null;
}

function toUserInfo(user: { id: string; email?: string | null; phone?: string | null; user_metadata?: Record<string, unknown> }): UserInfo {
	const name = resolveUserName(user);

	return {
		id: user.id,
		name: name ?? "Unknown",
		email: user.email ?? null,
		phone: user.phone ?? null,
	};
}

export async function fetchUserInfoLookup(ids: Array<string>): Promise<Map<string, UserInfo>> {
	const lookup = new Map<string, UserInfo>();

	const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];

	if (uniqueIds.length === 0) {
		return lookup;
	}

	const { createSupabaseAdminClient } = await import("~/lib/supabase/server");
	const admin = createSupabaseAdminClient();

	const perPage = 200;
	let page = 1;

	for (;;) {
		const { data, error } = await admin.auth.admin.listUsers({ page, perPage });

		if (error) {
			throw new Error(`Failed to load users: ${error.message}`);
		}

		for (const user of data.users) {
			if (uniqueIds.includes(user.id)) {
				lookup.set(user.id, toUserInfo(user));
			}
		}

		if (data.users.length < perPage || lookup.size >= uniqueIds.length) {
			break;
		}

		page += 1;
	}

	return lookup;
}
