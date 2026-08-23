import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { EmptyCustomers } from "~/components/customers-table";
import { ProductForm } from "~/components/product-form";
import { useProduct, useUpdateProduct } from "~/hooks/use-products";

export const Route = createFileRoute("/_app/products/$productId/edit")({
	component: RouteComponent,
});

function RouteComponent() {
	const { productId } = Route.useParams();
	const { data: product, isPending } = useProduct(productId);
	const updateProduct = useUpdateProduct();
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

	return (
		<div className="card my-2 w-full p-0! md:mx-auto md:my-6 lg:my-8">
			<div className="flex flex-row items-center justify-between px-4 py-4 lg:px-8">
				<h2 className="text-xl text-emerald-700 md:text-2xl">
					Edit {product.name}
				</h2>
				<Link
					to="/products/$productId"
					params={{ productId: product.id }}
					className="text-btn hover:text-emerald-600"
				>
					View details
				</Link>
			</div>
			<ProductForm
				defaultValues={{
					name: product.name,
					brandName: product.brandName,
					genericName: product.genericName ?? "",
					barCodeNumber: product.barCodeNumber ?? "",
					description: product.description ?? "",
					dosageFormId: product.dosageFormId,
					imageUrl: product.imageUrl ?? "",
					manufacturer: product.manufacturer ?? "",
					expiryDate: product.expiryDate ?? "",
					batchNumber: product.batchNumber ?? "",
					supplierId: product.supplierId ?? "",
					quantity: product.quantity,
				}}
				submitLabel="Save changes"
				onSubmit={async (value) => {
					await updateProduct.mutateAsync({
						...value,
						productId: product.id,
					});

					toast.success(`${value.name} updated successfully`, {
						duration: 5000
					});

					void navigate({
						to: "/products/$productId",
						params: { productId },
					});
				}}
			/>
		</div>
	);
}
