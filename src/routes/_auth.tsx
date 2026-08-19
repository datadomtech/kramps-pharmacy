import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "~convex/_generated/api";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async (options) => {
		const user = await options.context.queryClient.ensureQueryData(convexQuery(api.auth.getCurrentUser));

		console.dir({ user });
		if (user) {
			throw redirect({ to: "/staff" });
		}

		return user;
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
