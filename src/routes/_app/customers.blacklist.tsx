import { createFileRoute } from "@tanstack/react-router";
import { EmptyCustomers } from "~/components/customers-table";
import { useBlacklistedCustomers } from "~/hooks/use-customers";

export const Route = createFileRoute("/_app/customers/blacklist")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: blacklisted, isPending } = useBlacklistedCustomers();

	if (isPending || blacklisted === undefined) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<div className="card overflow-x-scroll p-0">
				{blacklisted.length === 0 ? (
					<EmptyCustomers
						description="Blacklist a customer to get started"
						title="No Blaclisted Customers"
						linkText="Blacklist a customer"
						to="/customers"
					/>
				) : (
					<pre>{JSON.stringify(blacklisted, null, 3)}</pre>
				)}
			</div>
		</div>
	);
}
