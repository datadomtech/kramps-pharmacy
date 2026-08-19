
import { useQuery } from "convex/react";
import { api } from "~convex/_generated/api";

export const useCurrentUser = () => {

	const user = useQuery(api.auth.getCurrentUser);

	return {
		isLoading: user === null,
		isAuthenticated: user !== null,
		user: { ...user },
	};
};
