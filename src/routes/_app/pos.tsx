import { createFileRoute } from "@tanstack/react-router";
import { PosRegister } from "~/components/pos-register";

export const Route = createFileRoute("/_app/pos")({
	component: RouteComponent,
});

function RouteComponent() {
	return <PosRegister />;
}
