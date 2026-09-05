import { createFileRoute } from "@tanstack/react-router";
import { MoveStock } from "~/components/move-stock";

export const Route = createFileRoute("/_app/warehouse/move")({
	component: RouteComponent,
});

function RouteComponent() {
	return <MoveStock />;
}
