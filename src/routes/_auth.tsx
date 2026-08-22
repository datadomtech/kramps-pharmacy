import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	beforeLoad: ({ context }) => {
		if (context.session) {
			throw redirect({ to: "/products" });
		}

		return { session: context.session };
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
