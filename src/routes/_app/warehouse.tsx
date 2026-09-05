import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/warehouse")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_app/permissions"!</div>;
}
