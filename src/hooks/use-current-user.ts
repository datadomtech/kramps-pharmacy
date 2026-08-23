import { useQuery } from "@tanstack/react-query";
import { getSessionUser } from "~/server/auth";
import type { SessionUser } from "~/lib/types";

const EMPTY_USER: SessionUser = { id: "", email: null, name: null, phone: null };

export const useCurrentUser = () => {
	const { data, isPending } = useQuery({
		queryKey: ["session"],
		queryFn: () => getSessionUser(),
	});

	return {
		isLoading: isPending,
		isAuthenticated: Boolean(data),
		user: data ?? EMPTY_USER,
	};
};
