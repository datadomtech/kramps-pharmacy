import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyCustomers } from "~/components/customers-table";
import { ExpiryGroupCard, groupProductsByExpiry } from "~/components/expiry-groups";
import { useProducts } from "~/hooks/use-products";

export const Route = createFileRoute("/_app/expiry-tracker")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: products, isPending } = useProducts();

	if (isPending || products === undefined) {
		return <div>Loading...</div>;
	}

	const tracked = products.filter((product) => product.deletedAt === null && product.expiryDate !== null);
	const groups = groupProductsByExpiry(tracked);

	return (
		<div className="p-0!">
			{tracked.length === 0 ? (
				<div className="card p-0!">
					<EmptyCustomers
						description="No products are being tracked for expiry. Add an expiry date to a product to start tracking it"
						title="Nothing To Track Yet"
						linkText="Add new product"
						to="/products/new"
					/>
				</div>
			) : (
				<div className="flex flex-col gap-y-6">
					{groups.map((group) => (
						<ExpiryGroupCard key={group.id} group={group} />
					))}
					<p className="text-center text-sm font-light text-gray-500">
						Tracking {tracked.length} product{tracked.length === 1 ? "" : "s"} — manage expiry dates from the{" "}
						<Link to="/products" className="text-btn hover:text-emerald-600">
							products page
						</Link>
						.
					</p>
				</div>
			)}
		</div>
	);
}
