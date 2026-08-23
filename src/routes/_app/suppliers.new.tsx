import { createFileRoute, Link } from "@tanstack/react-router";
import { AddSupplierForm } from "~/components/supplier-form";

export const Route = createFileRoute("/_app/suppliers/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="card overflow-hidden p-0!">
			<div className="flex items-center justify-between border-b border-solid border-gray-200 px-5 py-4">
				<h2 className="text-dialog-header font-medium text-emerald-900">Add a Supplier</h2>
				<Link to="/suppliers" className="btn btn-secondary">
					Back to suppliers
				</Link>
			</div>
			<AddSupplierForm />
		</div>
	);
}
