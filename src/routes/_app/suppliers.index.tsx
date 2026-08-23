import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyCustomers } from "~/components/customers-table";
import { ActiveSuppliersTable, DeletedSuppliersTable } from "~/components/suppliers-table";
import { useSuppliers } from "~/hooks/use-suppliers";
import type { Supplier } from "~/lib/types";

export const Route = createFileRoute("/_app/suppliers/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: suppliers, isPending } = useSuppliers();

	if (isPending || suppliers === undefined) {
		return <div>Loading...</div>;
	}

	if (suppliers.length === 0) {
		return (
			<div className="card p-0!">
				<EmptyCustomers
					description="No suppliers found. Add a supplier to get started"
					title="No Suppliers"
					linkText="Add new supplier"
					to="/suppliers/new"
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-y-6 p-0!">
			<div className="card overflow-x-auto p-0!">
				<div className="flex flex-row items-center justify-between px-5 py-4">
					<h2 className="text-dialog-header font-medium text-emerald-900">Suppliers</h2>
					<Link to="/suppliers/new" className="btn btn-secondary">
						New Supplier
					</Link>
				</div>
				<ActiveSuppliersTable activeSuppliers={suppliers.filter((supplier) => !supplier.deletedAt)} />
			</div>

			<DeletedSuppliersCard deletedSuppliers={suppliers.filter((supplier) => supplier.deletedAt !== null)} />
		</div>
	);
}

const DeletedSuppliersCard = ({ deletedSuppliers }: { deletedSuppliers: Array<Supplier> }) => {
	if (deletedSuppliers.length === 0) {
		return null;
	}

	return (
		<div className="card p-0!">
			<CardHeader title="Deleted Suppliers" />
			<p className="border-b border-solid border-gray-200 px-5 py-2 text-sm font-light text-gray-500">
				Deleted suppliers are kept here. Use the restore action on a row to bring a supplier back.
			</p>
			<DeletedSuppliersTable deletedSuppliers={deletedSuppliers} />
		</div>
	);
};

const CardHeader = ({ title }: { title: string }) => (
	<div className="flex flex-row items-center justify-between px-5 py-4">
		<h2 className="text-dialog-header font-medium text-emerald-900">{title}</h2>
	</div>
);
