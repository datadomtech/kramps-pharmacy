import { createFileRoute } from "@tanstack/react-router";
import { AddProductForm } from "~/components/product-form";

export const Route = createFileRoute("/_app/products/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="card my-2 max-w-4xl p-0! md:mx-auto md:my-6 lg:my-8">
			<div className="p-4 text-xl text-emerald-700 md:text-2xl lg:p-8">Add a product </div>
			<AddProductForm />
		</div>
	);
}
