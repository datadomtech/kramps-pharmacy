import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toastManager as toast } from "~selia/toast";
import { Button } from "~primitives/button";
import { EmptyCustomers } from "~/components/customers-table";
import { Image } from "@unpic/react";
import { format } from "date-fns";
import { EditIcon, TrashIcon } from "icons";
import { useDeleteProduct, useProduct } from "~/hooks/use-products";

export const Route = createFileRoute("/_app/products/$productId/")({
	component: RouteComponent,
});

function RouteComponent() {
	const { productId } = Route.useParams();
	const { data: product, isPending } = useProduct(productId);
	const deleteProduct = useDeleteProduct();
	const navigate = useNavigate();

	if (isPending || product === undefined) {
		return <div>Loading...</div>;
	}

	if (product === null) {
		return (
			<div className="card p-0!">
				<EmptyCustomers
					description="This product does not exist or was removed"
					title="Product Not Found"
					linkText="Back to products"
					to="/products"
				/>
			</div>
		);
	}

	const handleDelete = async () => {
		await deleteProduct.mutateAsync(product.id, {
			onSuccess: () => {
				toast.add({
					title: `${product.name} deleted successfully`,
					type: "success",
				});
				void navigate({ to: "/products" });
			},
		});
	};

	return (
		<div className="card h-fit! w-full p-0! md:mx-auto md:my-6 lg:mt-8 lg:mb-0">
			<div className="flex flex-row items-center justify-between px-4 py-4 lg:px-8">
				<h2 className="text-dialog-header font-medium text-emerald-900">{product.name}</h2>
				<div className="flex items-center gap-x-2">
					<Link
						to="/products/$productId/edit"
						params={{ productId: product.id }}
						className="btn btn-secondary inline-flex items-center gap-1.5 text-sm font-semibold"
					>
						<EditIcon className="size-4 fill-transparent stroke-emerald-400 stroke-2" />
						Edit
					</Link>
					<Button
						type="button"
						onClick={handleDelete}
						className="btn btn-danger cursor-pointer gap-2 bg-red-400 text-sm font-semibold text-white"
					>
						<TrashIcon className="size-4 fill-transparent stroke-red-50 stroke-2" />
						Delete
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-x-4 gap-y-6 border-t border-solid border-gray-200 p-4 sm:grid-cols-2 lg:p-8">
				<div className="flex items-start gap-4 sm:col-span-2">
					<span className="size-16 shrink-0 overflow-hidden rounded-xl bg-emerald-200 ring-1 ring-green-300 ring-inset">
						<Image
							src={product.imageUrl ? product.imageUrl : "/logo.png"}
							alt={product.imageUrl ?? undefined}
							layout="fixed"
							height={64}
							aspectRatio={1}
							className="size-16 rounded-xl border border-solid border-emerald-200 object-contain text-emerald-700"
						/>
					</span>
					<div className="min-w-0">
						<strong className="block truncate text-lg font-medium text-emerald-700 capitalize">{product.name}</strong>
						<p title={product.description ?? undefined} className="text-base font-normal text-gray-500">
							{product.description}
						</p>
					</div>
				</div>

				<DetailField label="Brand Name" value={product.brandName} />
				<DetailField label="Generic Name" value={product.genericName} />
				<DetailField label="Dosage Form" value={product.dosageForm?.name} />
				<DetailField label="Manufacturer" value={product.manufacturer} />
				<DetailField label="Bar Code Number" value={product.barCodeNumber} />
				<DetailField label="Supplier" value={product.supplier?.name} />
				<DetailField label="Quantity" value={`${product.quantity} ${product.quantity === 1 ? "unit" : "units"}`} />

				<div className="sm:col-span-2">
					<h3 className="text-btn font-btn text-gray-500">Added</h3>
					<p className="mt-1">
						{format(new Date(product.addedAt), "PPPppp")}
						{product.addedBy ? ` by ${product.addedBy.name}` : ""}
					</p>
				</div>

				{product.updatedAt && (
					<div className="sm:col-span-2">
						<h3 className="text-btn font-btn text-gray-500">Last Updated</h3>
						<p className="mt-1">
							{format(new Date(product.updatedAt), "PPPppp")}
							{product.updatedBy ? ` by ${product.updatedBy.name}` : ""}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

const DetailField = ({ label, value }: { label: string; value: string | null | undefined }) => (
	<div>
		<h3 className="text-btn font-btn text-gray-500">{label}</h3>
		<p className="mt-1 capitalize">{value ?? "—"}</p>
	</div>
);
