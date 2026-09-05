import { createFileRoute } from "@tanstack/react-router";
import { ReceiveStock } from "~/components/receive-stock";

export const Route = createFileRoute("/_app/receive-stock")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex w-full flex-col gap-6">
			<ReceiveStock />
		</div>
	);
}
