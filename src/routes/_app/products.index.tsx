import { createFileRoute, Link } from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";
import { EmptyCustomers } from "~/components/customers-table.tsx";

import type { Product } from "~/lib/types";
import { useProducts } from "~/hooks/use-products";
import { ActiveProductsTable, InactiveProductsTable } from "~/components/products-table.tsx";

export const Route = createFileRoute("/_app/products/")({
	component: RouteComponent,
});

const routeLinks: Array<{ id: number; name: string; link: Pick<LinkOptions, "to" | "hash"> }> = [
	{
		id: 1,
		name: "New",
		link: { to: "/products/new" },
	},
	{
		id: 2,
		name: "Inactive products",
		link: { to: "/products", hash: "inactive-products" },
	},
];

function RouteComponent() {
	const { data: products, isPending } = useProducts();

	if (isPending || products === undefined) {
		return <div>Loading...</div>;
	}
	return (
		<div className="p-0!">
			{products.length === 0 ? (
				<EmptyCustomers
					description="No products found. Add a product to get started"
					title="No Products"
					linkText="Add new product"
					to="/products/new"
				/>
			) : (
				<div className="flex flex-col gap-y-6">
					<div className="card overflow-x-auto p-0!">
						<ProductsPageHeader />
						<ActiveProductsTable activeProducts={products.filter((pd) => pd.isActive)} />
					</div>

					<InactiveProductsCard inActiveProducts={products.filter((pd) => !pd.isActive)} />
				</div>
			)}
		</div>
	);
}

const InactiveProductsCard = ({ inActiveProducts }: { inActiveProducts: Array<Product> }) => {
	if (inActiveProducts.length === 0) {
		return null;
	}

	return (
		<div className="card p-0!">
			<ProductsPageHeader showLinks={false} />
			<InactiveProductsTable inActiveProducts={inActiveProducts} />
		</div>
	);
};

const ProductsPageHeader = ({ showLinks = true }: { showLinks?: boolean }) => (
	<div className="flex flex-row items-center justify-between px-5 py-4">
		<h2 className="text-dialog-header font-medium text-emerald-900">Products</h2>
		{showLinks && (
			<div className="flex flex-row items-center gap-x-2 text-sm font-normal text-gray-500">
				{routeLinks.map(({ id, name, link }) => (
					<Link key={id} {...link} className="text-btn hover:text-emerald-600">
						{name}
					</Link>
				))}
			</div>
		)}
	</div>
);
