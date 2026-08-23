import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/react-start/server";

export function createSupabaseServerClient() {
	return createServerClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll() {
				return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					setCookie(name, value, options as never);
				}
			},
		},
	});
}

export function createSupabaseAdminClient() {
	return createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}
