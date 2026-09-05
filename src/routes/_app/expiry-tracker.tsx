import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyCustomers } from "~/components/customers-table";
import { ExpiryGroupCard, groupBatchesByExpiry } from "~/components/expiry-groups";
import { useInventoryBatches } from "~/hooks/use-stock-in";

export const Route = createFileRoute("/_app/expiry-tracker")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: batches, isPending } = useInventoryBatches();

	if (isPending || batches === undefined) {
		return <div>Loading...</div>;
	}

	const tracked = batches.filter((batch) => batch.expiryDate !== null);
	const groups = groupBatchesByExpiry(tracked);

	return (
		<div className="p-0!">
			{tracked.length === 0 ? (
				<div className="card p-0!">
					<EmptyCustomers
						description="No batches are being tracked for expiry. Add an expiry date when receiving stock to start tracking it"
						title="Nothing To Track Yet"
						linkText="Receive stock"
						to="/receive-stock"
					/>
				</div>
			) : (
				<div className="flex flex-col gap-y-6">
					{groups.map((group) => (
						<ExpiryGroupCard key={group.id} group={group} />
					))}
					<p className="text-center text-sm font-light text-gray-500">
						Tracking {tracked.length} batch{tracked.length === 1 ? "" : "es"} — record expiry dates when{" "}
						<Link to="/receive-stock" className="text-btn hover:text-emerald-600">
							receiving stock
						</Link>
						.
					</p>
				</div>
			)}
		</div>
	);
}
