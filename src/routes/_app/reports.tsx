import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { endOfDay, endOfMonth, format, isAfter, isBefore, isSameDay, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";

import { useProducts } from "~/hooks/use-products";
import { useSuppliers } from "~/hooks/use-suppliers";

export const Route = createFileRoute("/_app/reports")({
	component: RouteComponent,
});

type ReportRange = "daily" | "two-weeks" | "last-month";

const ranges: Array<{ id: ReportRange; name: string }> = [
	{ id: "daily", name: "Daily" },
	{ id: "two-weeks", name: "Last 2 Weeks" },
	{ id: "last-month", name: "Last Month" },
];

function rangeWindow(range: ReportRange, now: Date): { start: Date; end: Date } {
	switch (range) {
		case "daily":
			return { start: startOfDay(now), end: endOfDay(now) };
		case "two-weeks":
			return { start: startOfDay(subDays(now, 13)), end: endOfDay(now) };
		case "last-month": {
			const previousMonth = subMonths(now, 1);
			return { start: startOfMonth(previousMonth), end: endOfMonth(previousMonth) };
		}
	}
}

function inWindow(date: string | null | undefined, window: { start: Date; end: Date }): boolean {
	if (!date) return false;

	const value = new Date(date);

	return !isBefore(value, window.start) && !isAfter(value, window.end);
}

const rangeChipActive =
	"inline-flex cursor-pointer items-center rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800";
const rangeChipIdle =
	"inline-flex cursor-pointer items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100";

const statCardStyles = "card p-5";

function RouteComponent() {
	const [range, setRange] = useState<ReportRange>("daily");
	const { data: products, isPending: productsPending } = useProducts();
	const { data: suppliers, isPending: suppliersPending } = useSuppliers();

	const stats = useMemo(() => {
		const now = new Date();
		const today = startOfDay(now);
		const window = rangeWindow(range, now);

		const liveProducts = (products ?? []).filter((product) => !product.deletedAt);
		const liveSuppliers = (suppliers ?? []).filter((supplier) => !supplier.deletedAt);

		return {
			label: range === "daily" ? format(today, "eeee, d MMMM yyyy") : `${format(window.start, "d MMM")} – ${format(window.end, "d MMM yyyy")}`,
			productsAdded: liveProducts.filter((product) => inWindow(product.addedAt, window)).length,
			suppliersAdded: liveSuppliers.filter((supplier) => inWindow(supplier.createdAt, window)).length,
			productsUpdated: liveProducts.filter(
				(product) =>
					product.updatedAt !== null &&
					inWindow(product.updatedAt, window) &&
					!isSameDay(new Date(product.updatedAt), new Date(product.addedAt)),
			).length,
			totalProducts: liveProducts.length,
			activeProducts: liveProducts.filter((product) => product.isActive).length,
			expired: liveProducts.filter((product) => product.soonestExpiryDate && isBefore(new Date(`${product.soonestExpiryDate}T00:00:00`), today))
				.length,
			outOfStock: liveProducts.filter((product) => product.stockAvailable <= 0).length,
			totalSuppliers: liveSuppliers.length,
		};
	}, [range, products, suppliers]);

	if (productsPending || suppliersPending || products === undefined || suppliers === undefined) {
		return <div>Loading...</div>;
	}

	return (
		<div className="card p-0!">
			<div className="flex flex-row flex-wrap items-center justify-between gap-4 px-5 py-4">
				<div>
					<h2 className="text-dialog-header font-medium text-emerald-900">Reports</h2>
					<p className="text-sm font-light text-gray-500">{stats.label}</p>
				</div>
				<div className="flex items-center gap-2">
					{ranges.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => setRange(item.id)}
							className={range === item.id ? rangeChipActive : rangeChipIdle}
						>
							{item.name}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 border-t border-solid border-gray-200 p-5 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label={`Products added — ${stats.label}`} value={stats.productsAdded} />
				<StatCard label={`Products updated — ${stats.label}`} value={stats.productsUpdated} />
				<StatCard label={`Suppliers added — ${stats.label}`} value={stats.suppliersAdded} />

				<StatCard label="Total products" value={stats.totalProducts} hint={`${stats.activeProducts} active`} />
				<StatCard label="Expired products" value={stats.expired} hint="soonest open batch is past expiry" />
				<StatCard label="Out of stock" value={stats.outOfStock} hint="no stock on hand" />
				<StatCard label="Total suppliers" value={stats.totalSuppliers} />
			</div>

			<p className="border-t border-solid border-gray-200 px-5 py-3 text-center text-xs font-light text-gray-500">
				Sales and prescriptions reporting will become available once those modules are implemented.
			</p>
		</div>
	);
}

const StatCard = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
	<div className={statCardStyles}>
		<strong className="text-2xl font-semibold text-emerald-900">{value}</strong>
		<p className="mt-1 text-sm text-gray-700">{label}</p>
		{hint && <p className="text-xs font-light text-gray-500">{hint}</p>}
	</div>
);
