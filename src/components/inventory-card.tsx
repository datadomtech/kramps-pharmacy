import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { isBefore, startOfDay, format } from "date-fns";

import type { Product } from "~/lib/types";
import { useProducts } from "~/hooks/use-products";
import { CheckIcon, SearchIcon } from "icons";
import { Input } from "./input";
import { cn } from "~/utils";

type InventoryFilter = "expired" | "out-of-stock" | "inactive";

const filters: Array<{ id: InventoryFilter; name: string }> = [
	{ id: "expired", name: "Expired" },
	{ id: "out-of-stock", name: "Out of stock" },
	{ id: "inactive", name: "Inactive" },
];

const filterStyles: Record<InventoryFilter, { chip: string; dot: string }> = {
	expired: {
		chip: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
		dot: "bg-red-500 border-red-300",
	},
	inactive: {
		chip: "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
		dot: "bg-gray-400 border-gray-200",
	},
	"out-of-stock": {
		chip: "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
		dot: "bg-yellow-400 border-yellow-200",
	},
};

function productStatus(product: Product, today: Date): Array<InventoryFilter> {
	const statuses: Array<InventoryFilter> = [];

	if (product.expiryDate && isBefore(new Date(`${product.expiryDate}T00:00:00`), today)) {
		statuses.push("expired");
	}
	if (product.quantity <= 0) {
		statuses.push("out-of-stock");
	}
	if (!product.isActive) {
		statuses.push("inactive");
	}

	return statuses.length > 0 ? statuses : [];
}

const statusDotStyles: Record<string, string> = {
	expired: "bg-red-500",
	"out-of-stock": "bg-yellow-400",
	inactive: "bg-gray-400",
	ok: "bg-emerald-500",
};

export const Inventory = () => {
	const { data: products, isPending } = useProducts();
	const [search, setSearch] = useState("");
	const [activeFilters, setActiveFilters] = useState<Array<InventoryFilter>>([]);

	const today = startOfDay(new Date());

	const inStockProducts = useMemo(() => (products ?? []).filter((product) => !product.deletedAt), [products]);

	const counts = useMemo(() => {
		const result: Record<InventoryFilter, number> = {
			expired: 0,
			"out-of-stock": 0,
			inactive: 0,
		};

		for (const product of inStockProducts) {
			for (const status of productStatus(product, today)) {
				result[status] += 1;
			}
		}

		return result;
	}, [inStockProducts, today]);

	const visibleProducts = useMemo(() => {
		const query = search.trim().toLowerCase();

		return inStockProducts.filter((product) => {
			if (activeFilters.length > 0) {
				const statuses = productStatus(product, today);
				if (!statuses.some((status) => activeFilters.includes(status))) {
					return false;
				}
			}

			if (query === "") {
				return true;
			}

			return (
				product.name.toLowerCase().includes(query) ||
				product.brandName.toLowerCase().includes(query) ||
				(product.genericName?.toLowerCase().includes(query) ?? false)
			);
		});
	}, [inStockProducts, search, activeFilters, today]);

	const toggleFilter = (filter: InventoryFilter) =>
		setActiveFilters((current) => (current.includes(filter) ? current.filter((f) => f !== filter) : [...current, filter]));

	return (
		<main className="card w-full! min-w-0! flex-1! p-0!">
			<header className="border-b border-solid border-gray-200 px-4 py-4">
				<div className="flex flex-wrap items-stretch justify-between gap-4">
					<div className="flex flex-col">
						<h1 className="text-[1.5rem] font-semibold text-emerald-900">Inventory</h1>
						<div className="mt-auto flex items-center gap-2">
							<span className="flex items-center gap-1.5 text-btn text-gray-600">
								<span className="inline-flex items-center rounded-md bg-gray-100 px-2 text-sm font-medium text-gray-800">
									{visibleProducts.length}
								</span>
								products
							</span>
						</div>
					</div>

					<div className="flex flex-col items-end gap-4">
						<div className="relative w-full sm:w-[320px]">
							<label htmlFor="inventory-search" className="sr-only">
								Search
							</label>
							<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<SearchIcon className="size-5 fill-transparent stroke-emerald-400" />
							</div>

							<Input
								id="inventory-search"
								type="search"
								inputMode="search"
								value={search}
								onValueChange={(val) => setSearch(val)}
								placeholder="Search products..."
								className="input-text pl-9!"
							/>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{filters.map((filter) => {
								const isActive = activeFilters.includes(filter.id);
								const styles = filterStyles[filter.id];

								return (
									<button
										key={filter.id}
										type="button"
										onClick={() => toggleFilter(filter.id)}
										className={cn(
											"inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium transition-all",
											styles.chip,
											isActive ? "" : "opacity-60",
										)}
									>
										<span>{filter.name}</span>
										<span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-white/60 px-1 text-[10px] font-semibold">
											{counts[filter.id]}
										</span>
										{isActive && <CheckIcon className="size-3.5" />}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</header>

			<ul role="list" className="relative z-0 divide-y divide-solid divide-gray-100">
				{isPending || products === undefined ? (
					<li className="px-4 py-6 text-sm text-gray-500">Loading...</li>
				) : visibleProducts.length === 0 ? (
					<NoResultsInventory />
				) : (
					visibleProducts.map((product) => {
						const statuses = productStatus(product, today);
						const dotColor = statuses.length > 0 ? statusDotStyles[statuses[0]] : statusDotStyles.ok;

						return (
							<li key={product.id} className="relative py-2 pr-6 pl-4 hover:bg-gray-50 sm:pl-6 lg:pl-8">
								<div className="flex items-center justify-between gap-6">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-3">
											<span className={cn("mr-1 inline-block size-2 shrink-0 rounded-full", dotColor)} />

											<div className="flex min-h-10 flex-col justify-center gap-0.5">
												<h2 className="flex items-center gap-2 text-btn font-medium capitalize">
													<Link
														to="/products/$productId"
														params={{
															productId: product.id,
														}}
														className="text-emerald-700 hover:text-emerald-600"
													>
														{product.name}
													</Link>
												</h2>
												<div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm text-gray-500">
													<span>{product.dosageForm?.name.toLocaleLowerCase("en-GB")}</span>
													{product.batchNumber && <span>Batch {product.batchNumber}</span>}
													{product.expiryDate && (
														<span>Expires {format(new Date(`${product.expiryDate}T00:00:00`), "d MMM yyyy")}</span>
													)}
													{!product.isActive && <span>Inactive</span>}
												</div>
											</div>
										</div>
									</div>

									<div className="hidden shrink-0 flex-col items-end justify-center sm:flex">
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												product.quantity <= 0 ? "bg-yellow-50 text-yellow-700" : "bg-emerald-100 text-emerald-800"
											}`}
										>
											{product.quantity} {product.quantity === 1 ? "unit" : "units"}
										</span>
									</div>
								</div>
							</li>
						);
					})
				)}
			</ul>
		</main>
	);
};

const NoResultsInventory = () => (
	<li className="relative py-5 pr-6 pl-4 hover:bg-gray-50 sm:py-6 sm:pl-6 lg:pl-8 xl:pl-6">
		<div className="text-center">
			<SearchIcon className="mx-auto size-12 fill-transparent stroke-gray-400" />

			<h3 className="mt-2 text-btn font-medium text-gray-900">No results for your search</h3>
			<p className="mt-1 text-sm text-gray-500">Your search is yielding no results, try lessening the filters.</p>
		</div>
	</li>
);
