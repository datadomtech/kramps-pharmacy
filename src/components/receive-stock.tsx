import { useEffect, useRef, useState } from "react";
import { toastManager as toast } from "~selia/toast";
import { Button } from "~primitives/button";
import { SearchIcon, XIcon } from "~/components/icons";

import type { ProductSearchResult } from "~/server/pos";
import type { SupplierProductSummary } from "~/server/stock-in";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useProductSearch } from "~/hooks/use-pos";
import { useAddStockIn, useSupplierProducts } from "~/hooks/use-stock-in";
import { useSuppliers } from "~/hooks/use-suppliers";

type ReceiptLine = {
	key: string;
	productId: string;
	name: string;
	brandName: string;
	dosageFormName: string | null;
	strength: string | null;
	strengthUnit: string | null;
	batchNumber: string;
	expiryDate: string;
	unitCost: string;
	quantity: number;
	price: string;
};

const money = (value: number) => value.toFixed(2);

const strengthLabel = (strength: string | null, strengthUnit: string | null): string => {
	if (!strength && !strengthUnit) return "";
	return [strength ?? "", strengthUnit ?? ""].filter(Boolean).join(" ");
};

function useDebounced(value: string, delay = 200): string {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);

		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}

export const ReceiveStock = () => {
	const [supplierId, setSupplierId] = useState("");

	const { data: suppliers } = useSuppliers();
	const currentUser = useCurrentUser();
	const { data: supplierProducts } = useSupplierProducts(supplierId || "");

	const [searchInput, setSearchInput] = useState("");
	const [lines, setLines] = useState<Array<ReceiptLine>>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const searchInputRef = useRef<HTMLInputElement>(null);

	const debouncedSearch = useDebounced(searchInput);
	const { data: productResults } = useProductSearch(debouncedSearch);

	const addStockIn = useAddStockIn();

	const activeSuppliers = (suppliers ?? []).filter((supplier) => !supplier.deletedAt);

	const addProduct = (candidate: ProductSearchResult | SupplierProductSummary) => {
		if (lines.some((line) => line.productId === candidate.id)) {
			toast.add({ title: `${candidate.name} is already in this receipt`, type: "info", timeout: 5000 });

			return;
		}

		setLines((current) => [
			...current,
			{
				key: crypto.randomUUID(),
				productId: candidate.id,
				name: candidate.name,
				brandName: candidate.brandName,
				dosageFormName: candidate.dosageFormName,
				strength: candidate.strength,
				strengthUnit: candidate.strengthUnit,
				batchNumber: "",
				expiryDate: "",
				unitCost: "",
				quantity: 1,
				price: "",
			},
		]);

		setSearchInput("");
		searchInputRef.current?.focus();
	};

	const updateLine = (key: string, patch: Partial<ReceiptLine>) =>
		setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

	const removeLine = (key: string) => setLines((current) => current.filter((line) => line.key !== key));

	const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== "Enter" || productResults === undefined) {
			return;
		}

		const matches = productResults.filter(
			(result) => result.barCodeNumber !== null && result.barCodeNumber.toLocaleLowerCase() === searchInput.trim().toLocaleLowerCase(),
		);

		if (matches.length === 1) {
			event.preventDefault();
			addProduct(matches[0]);

			return;
		}

		if (productResults.length === 1) {
			event.preventDefault();
			addProduct(productResults[0]);
		}
	};

	const lineCost = (line: ReceiptLine): number => (line.unitCost.trim() === "" ? NaN : Number.parseFloat(line.unitCost));

	const isLineValid = (line: ReceiptLine): boolean => {
		const cost = lineCost(line);

		return line.productId !== "" && line.quantity >= 1 && Number.isFinite(cost) && cost >= 0;
	};

	const isPriceValid = (line: ReceiptLine): boolean => {
		if (line.price.trim() === "") {
			return true;
		}

		const price = Number.parseFloat(line.price);

		return Number.isFinite(price) && price >= 0;
	};

	const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);
	const validLines = lines.filter((line) => isLineValid(line) && isPriceValid(line));

	const canSubmit = supplierId !== "" && lines.length > 0 && validLines.length === lines.length && !isSubmitting;

	const submit = async () => {
		if (!canSubmit) {
			return;
		}

		try {
			setIsSubmitting(true);
			const { amount } = await addStockIn.mutateAsync({
				supplierId,
				lines: validLines.map((line) => ({
					productId: line.productId,
					quantity: line.quantity,
					unitCost: lineCost(line),
					price: line.price.trim() === "" ? null : Number.parseFloat(line.price),
					batchNumber: line.batchNumber.trim() === "" ? null : line.batchNumber.trim(),
					expiryDate: line.expiryDate === "" ? null : line.expiryDate,
				})),
			});

			toast.add({
				title: `${amount} item${amount === 1 ? "" : "s"} recorded`,
				description: "Stock is on the shelves and ready to sell.",
				type: "success",
				timeout: 10_000,
			});

			setLines([]);
			setSearchInput("");
			searchInputRef.current?.focus();
		} catch (error) {
			toast.add({ title: error instanceof Error ? error.message : String(error), type: "error", timeout: 10_000 });
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="card w-full! min-w-0! flex-1! p-0!">
			<header className="border-b border-solid border-gray-200 px-4 py-4">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex flex-col">
						<h1 className="text-[1.5rem] font-semibold text-emerald-900">Receive Stock</h1>
						<div className="mt-auto flex items-center gap-2">
							<span className="text-btn text-gray-600">Recording as {currentUser.user.name ?? currentUser.user.email ?? "You"}</span>
						</div>
					</div>

					<label className="block w-full space-y-1 sm:max-w-xs">
						<span className="text-btn text-gray-600">Supplier</span>
						<select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="input-select w-full rounded-lg">
							<option value="">Choose a supplier…</option>
							{activeSuppliers.map((supplier) => (
								<option key={supplier.id} value={supplier.id}>
									{supplier.name}
								</option>
							))}
						</select>
					</label>
				</div>
			</header>

			<div className="w-full space-y-5 p-4 lg:p-6">
				{supplierId !== "" && supplierProducts !== undefined && supplierProducts.length > 0 && (
					<section className="card p-0!">
						<header className="border-b border-solid border-gray-200 px-5 py-3">
							<h2 className="text-dialog-header font-medium text-emerald-900">Already received from this supplier</h2>
						</header>
						<ul className="flex flex-wrap gap-2 p-4">
							{supplierProducts.map((product) => (
								<li key={product.id}>
									<button
										type="button"
										onClick={() => addProduct(product)}
										className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-left text-xs font-medium text-emerald-800 transition-all hover:bg-emerald-100"
									>
										<span className="truncate font-semibold">{product.name}</span>
										<span className="text-emerald-600">
											{product.dosageFormName?.toLocaleLowerCase("en-GB")}
											{strengthLabel(product.strength, product.strengthUnit)
												? ` · ${strengthLabel(product.strength, product.strengthUnit)}`
												: ""}
										</span>
									</button>
								</li>
							))}
						</ul>
					</section>
				)}

				<section className="card p-0!">
					<header className="border-b border-solid border-gray-200 px-5 py-3">
						<h2 className="text-dialog-header font-medium text-emerald-900">Products</h2>
					</header>
					<div className="relative px-5 py-3">
						<SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 fill-white stroke-gray-400 stroke-[1.5px]" />
						<input
							ref={searchInputRef}
							type="search"
							placeholder="Scan barcode or search name…"
							autoFocus={true}
							value={searchInput}
							onChange={(event) => setSearchInput(event.target.value)}
							onKeyDown={handleSearchKeyDown}
							className="input-text pl-10!"
						/>
					</div>
					{productResults !== undefined && productResults.length > 0 && (
						<ul className="divide-y divide-solid divide-gray-100 border-t border-solid border-gray-200">
							{productResults.map((result) => (
								<li key={result.id}>
									<button
										type="button"
										onClick={() => addProduct(result)}
										className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-2.5 text-left hover:bg-gray-50"
									>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-emerald-700 capitalize">{result.name}</p>
											<p className="text-xs text-gray-500">
												{result.dosageFormName?.toLocaleLowerCase("en-GB") ?? "—"}
												{strengthLabel(result.strength, result.strengthUnit)
													? ` · ${strengthLabel(result.strength, result.strengthUnit)}`
													: ""}
												{result.brandName ? ` · ${result.brandName}` : ""}
											</p>
										</div>
										<span className="shrink-0 text-xs text-gray-500">GHS {money(result.price ?? 0)}</span>
									</button>
								</li>
							))}
						</ul>
					)}
					<p className="border-t border-solid border-gray-100 px-5 py-2 text-xs text-gray-400">
						Type to search · Enter adds an exact match
					</p>
				</section>

				<section className="card p-0!">
					<header className="flex items-center justify-between border-b border-solid border-gray-200 px-5 py-3">
						<h2 className="text-dialog-header font-medium text-emerald-900">Receiving</h2>
						<span className="text-xs text-gray-500">
							{totalUnits} {totalUnits === 1 ? "unit" : "units"} · {lines.length} {lines.length === 1 ? "line" : "lines"}
						</span>
					</header>

					{lines.length === 0 ? (
						<p className="px-5 py-6 text-sm text-gray-500">
							Search above to add a product. Optionally tag each line with its batch number, expiry, unit cost and selling price.
						</p>
					) : (
						<ul className="divide-y divide-solid divide-gray-100">
							{lines.map((line) => (
								<li key={line.key} className="space-y-3 px-5 py-3">
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<p className="truncate text-sm font-medium text-emerald-700 capitalize">{line.name}</p>
											<p className="text-xs text-gray-500">
												{line.dosageFormName?.toLocaleLowerCase("en-GB") ?? "—"}
												{strengthLabel(line.strength, line.strengthUnit)
													? ` · ${strengthLabel(line.strength, line.strengthUnit)}`
													: ""}
												{line.brandName ? ` · ${line.brandName}` : ""}
											</p>
										</div>
										<button
											type="button"
											onClick={() => removeLine(line.key)}
											className="shrink-0 cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
											aria-label={`Remove ${line.name}`}
										>
											<XIcon className="size-4" />
										</button>
									</div>

									<div className="flex flex-wrap items-end gap-2">
										<label className="block w-32 space-y-1">
											<span className="text-xs text-gray-500">Batch no.</span>
											<input
												type="text"
												value={line.batchNumber}
												onChange={(event) => updateLine(line.key, { batchNumber: event.target.value })}
												className="input-text"
											/>
										</label>

										<label className="block w-40 space-y-1">
											<span className="text-xs text-gray-500">Expiry</span>
											<input
												type="date"
												value={line.expiryDate}
												onChange={(event) => updateLine(line.key, { expiryDate: event.target.value })}
												className="input-text"
											/>
										</label>

										<label className="block w-32 space-y-1">
											<span className="text-xs text-gray-500">Unit cost (GHS)</span>
											<input
												type="number"
												min={0}
												step="0.01"
												value={line.unitCost}
												onChange={(event) => updateLine(line.key, { unitCost: event.target.value })}
												className="input-text"
											/>
										</label>

										<label className="block w-24 space-y-1">
											<span className="text-xs text-gray-500">Quantity</span>
											<input
												type="number"
												min={1}
												step={1}
												value={line.quantity}
												onChange={(event) =>
													updateLine(line.key, {
														quantity: Number.isNaN(event.target.valueAsNumber)
															? 1
															: Math.max(1, Math.round(event.target.valueAsNumber)),
													})
												}
												className="input-text"
											/>
										</label>

										<label className="block w-32 space-y-1">
											<span className="text-xs text-gray-500">Sell price (GHS)</span>
											<input
												type="number"
												min={0}
												step="0.01"
												value={line.price}
												onChange={(event) => updateLine(line.key, { price: event.target.value })}
												className="input-text"
											/>
										</label>

										{line.batchNumber.trim() !== "" && (
											<span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
												Batch {line.batchNumber.trim()}
											</span>
										)}
									</div>
								</li>
							))}
						</ul>
					)}
				</section>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<span className="text-sm text-gray-500">
						{supplierId === "" ? "Choose a supplier to record this receipt." : `${validLines.length}/${lines.length} lines ready`}
					</span>
					<Button
						type="button"
						onClick={() => void submit()}
						disabled={!canSubmit}
						className="btn btn-lg btn-primary grow gap-2 lg:max-w-60"
					>
						{isSubmitting ? "Recording…" : "Receive Stock"}
					</Button>
				</div>
			</div>
		</main>
	);
};
