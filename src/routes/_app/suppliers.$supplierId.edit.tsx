import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toastManager as toast } from "~selia/toast";
import { EmptyCustomers } from "~/components/customers-table";
import { SupplierForm } from "~/components/supplier-form";
import { useSupplier, useUpdateSupplier } from "~/hooks/use-suppliers";

export const Route = createFileRoute("/_app/suppliers/$supplierId/edit")({
	component: RouteComponent,
});

function RouteComponent() {
	const { supplierId } = Route.useParams();
	const { data: supplier, isPending } = useSupplier(supplierId);
	const updateSupplier = useUpdateSupplier();
	const navigate = useNavigate();

	if (isPending || supplier === undefined) {
		return <div>Loading...</div>;
	}

	if (supplier === null) {
		return (
			<div className="card p-0!">
				<EmptyCustomers
					description="This supplier does not exist or was removed"
					title="Supplier Not Found"
					linkText="Back to suppliers"
					to="/suppliers"
				/>
			</div>
		);
	}

	return (
		<div className="card my-2 w-full p-0! md:mx-auto md:my-6 lg:mb-8">
			<div className="flex flex-row items-center justify-between px-5 py-4">
				<h2 className="text-dialog-header font-medium text-emerald-900">Edit {supplier.name}</h2>
				<Link to="/suppliers" className="text-btn hover:text-emerald-600">
					Back to suppliers
				</Link>
			</div>
			<SupplierForm
				defaultValues={{
					name: supplier.name,
					phone: supplier.phone ?? "",
					address: supplier.address ?? "",
					email: supplier.email ?? "",
					contactName: supplier.contactName ?? "",
					contactPhone: supplier.contactPhone ?? "",
					contactEmail: supplier.contactEmail ?? "",
				}}
				submitLabel="Save changes"
				showReset={false}
				onSubmit={async (value) => {
					await updateSupplier.mutateAsync({
						...value,
						supplierId: supplier.id,
					});

					toast.add({ title: `${value.name} updated successfully`, type: "success" });
					void navigate({ to: "/suppliers" });
				}}
			/>
		</div>
	);
}
