import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/prescriptions")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/_app/prescriptions"!</div>;
}
