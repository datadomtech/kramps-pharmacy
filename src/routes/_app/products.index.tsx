import { createFileRoute, Link } from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";

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
	return (
		<div className="card overflow-x-scroll p-0!">
			<div className="flex flex-row items-center justify-between border-b border-solid border-gray-200 px-5 py-4">
				<h2 className="text-base font-medium text-emerald-900">Products</h2>
				<div className="flex flex-row items-center gap-x-2 text-sm font-normal text-gray-500">
					{routeLinks.map(({ id, name, link }) => (
						<Link key={id} {...link} className="hover:text-emerald-600">
							{name}
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
