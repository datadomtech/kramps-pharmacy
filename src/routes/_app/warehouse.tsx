import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusSquareIcon } from "icons";
import { WarehouseMovements } from "~/components/warehouse-movements";
import { WarehouseStock } from "~/components/warehouse-stock";

export const Route = createFileRoute("/_app/warehouse")({
	component: RouteComponent,
});

type Tab = "stock" | "movements";

const tabChipActive =
	"inline-flex cursor-pointer items-center rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800";

const tabChipIdle =
	"inline-flex cursor-pointer items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100";

const tabs: Array<{ id: Tab; name: string }> = [
	{ id: "stock", name: "Inventory" },
	{ id: "movements", name: "Movements" },
];

function RouteComponent() {
	const [tab, setTab] = useState<Tab>("stock");

	return (
		<div className="flex w-full min-w-0 flex-1 flex-col gap-4">
			<div className="card p-0!">
				<div className="flex flex-row flex-wrap items-center justify-between gap-4 px-5 py-4">
					<div>
						<h2 className="text-dialog-header font-medium text-emerald-900">Warehouse</h2>
						<p className="text-sm font-light text-gray-500">Stock on the shelves and who moved it</p>
					</div>

					<div className="flex items-center gap-2">
						{tabs.map((item) => (
							<button
								key={item.id}
								type="button"
								onClick={() => setTab(item.id)}
								className={tab === item.id ? tabChipActive : tabChipIdle}
							>
								{item.name}
							</button>
						))}
					</div>

					<div className="flex items-center gap-2">
						<Link to="/warehouse/move" className="btn inline-flex items-center gap-2">
							Move stock
						</Link>
						<Link to="/receive-stock" className="btn btn-primary inline-flex items-center gap-2">
							<PlusSquareIcon className="size-4 fill-transparent stroke-logo stroke-2" />
							Receive stock
						</Link>
					</div>
				</div>
			</div>

			{tab === "stock" ? <WarehouseStock /> : <WarehouseMovements />}
		</div>
	);
}
