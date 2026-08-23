import { createFileRoute } from "@tanstack/react-router";
import { DosageForms } from "~/components/dosage-forms";
import { Inventory } from "~/components/inventory-card";

export const Route = createFileRoute("/_app/inventory")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex flex-col gap-6 w-full lg:flex-row lg:items-start">
			<Inventory />
			<aside className="space-y-6 xl:w-96">
				<DosageForms />
			</aside>
		</div>
	);
}
