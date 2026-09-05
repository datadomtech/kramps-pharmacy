import { useEffect, useRef, useState } from "react";
import { toastManager as toast } from "~selia/toast";
import { Button } from "~primitives/button";
import { SearchIcon, XIcon } from "icons";

import type { ProductSearchResult } from "~/server/pos";
import { useActiveBranch } from "~/hooks/use-active-branch";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useProductSearch } from "~/hooks/use-pos";
import { useLocations, useRecordStockMove } from "~/hooks/use-warehouse";

type MoveLine = {
	key: string;
	productId: string;
	name: string;
	brandName: string;
	dosageFormName: string | null;
	strength: string | null;
	strengthUnit: string | null;
	quantity: number;
};

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

export const MoveStock = () => {
	const currentUser = useCurrentUser();
	const { branch } = useActiveBranch();
	const { data: locations } = useLocations();

	const [fromLocationId, setFromLocationId] = useState("");
	const [toLocationId, setToLocationId] = useState("");
	const [note, setNote] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [lines, setLines] = useState<Array<MoveLine>>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const searchInputRef = useRef<HTMLInputElement>(null);

	const debouncedSearch = useDebounced(searchInput);
	const { data: productResults } = useProductSearch(debouncedSearch);

	const recordMove = useRecordStockMove();

	const activeLocations = (locations ?? []).filter((location) => !location.deletedAt);

	useEffect(() => {
		if (fromLocationId !== "" || branch.id === "") return;

		const active = activeLocations.some((location) => location.id === branch.id);

		if (active) {
			setFromLocationId(branch.id);
		}
	}, [branch.id, fromLocationId, activeLocations]);

	const addProduct = (candidate: ProductSearchResult) => {
		if (lines.some((line) => line.productId === candidate.id)) {
			toast.add({ title: `${candidate.name} is already in this movement`, type: "info", timeout: 5000 });

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
				quantity: 1,
			},
		]);

		setSearchInput("");
		searchInputRef.current?.focus();
	};

	const updateLine = (key: string, patch: Partial<MoveLine>) =>
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

	const totalUnits = lines.reduce((sum, line) => sum + line.quantity, 0);

	const canSubmit =
		fromLocationId !== "" &&
		toLocationId !== "" &&
		fromLocationId !== toLocationId &&
		lines.length > 0 &&
		lines.every((line) => line.quantity >= 1) &&
		!isSubmitting;

	const submit = async () => {
		if (!canSubmit) {
			return;
		}

		try {
			setIsSubmitting(true);
			const { amount } = await recordMove.mutateAsync({
				fromLocationId,
				toLocationId,
				note: note.trim() === "" ? null : note.trim(),
				lines: lines.map((line) => ({
					productId: line.productId,
					quantity: line.quantity,
				})),
			});

			toast.add({
				title: `${amount} item${amount === 1 ? "" : "s"} moved`,
				description: "Movement recorded.",
				type: "success",
				timeout: 10_000,
			});

			setLines([]);
			setNote("");
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
						<h1 className="text-[1.5rem] font-semibold text-emerald-900">Move Stock</h1>
						<div className="mt-auto flex items-center gap-2">
							<span className="text-btn text-gray-600">Recording as {currentUser.user.name ?? currentUser.user.email ?? "You"}</span>
						</div>
					</div>

					<div className="flex w-full flex-col gap-3 sm:max-w-xs sm:flex-row">
						<label className="block w-full space-y-1">
							<span className="text-btn text-gray-600">From</span>
							<select
								value={fromLocationId}
								onChange={(event) => setFromLocationId(event.target.value)}
								className="input-select w-full rounded-lg"
							>
								<option value="">Choose a source…</option>
								{activeLocations.map((location) => (
									<option key={location.id} value={location.id}>
										{location.name}
									</option>
								))}
							</select>
						</label>

						<label className="block w-full space-y-1">
							<span className="text-btn text-gray-600">To</span>
							<select
								value={toLocationId}
								onChange={(event) => setToLocationId(event.target.value)}
								className="input-select w-full rounded-lg"
							>
								<option value="">Choose a destination…</option>
								{activeLocations.map((location) => (
									<option key={location.id} value={location.id}>
										{location.name}
									</option>
								))}
							</select>
						</label>
					</div>
				</div>
			</header>

			<div className="w-full space-y-5 p-4 lg:p-6">
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
						<h2 className="text-dialog-header font-medium text-emerald-900">Moving</h2>
						<span className="text-xs text-gray-500">
							{totalUnits} {totalUnits === 1 ? "unit" : "units"} · {lines.length} {lines.length === 1 ? "line" : "lines"}
						</span>
					</header>

					{lines.length === 0 ? (
						<p className="px-5 py-6 text-sm text-gray-500">
							Search above to add a product. Moves are recorded, so stock totals are not changed.
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
								</li>
							))}
						</ul>
					)}
				</section>

				<label className="block space-y-1">
					<span className="text-btn text-gray-600">Note (optional)</span>
					<textarea
						value={note}
						onChange={(event) => setNote(event.target.value)}
						rows={2}
						placeholder="e.g. restock for the weekend"
						className="input-text w-full resize-y"
					/>
				</label>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<span className="text-sm text-gray-500">
						{fromLocationId === "" || toLocationId === ""
							? "Choose a source and destination to record this move."
							: fromLocationId === toLocationId
								? "Source and destination must differ."
								: `${lines.length} ${lines.length === 1 ? "line" : "lines"} ready`}
					</span>
					<Button
						type="button"
						onClick={() => void submit()}
						disabled={!canSubmit}
						className="btn btn-lg btn-primary grow gap-2 lg:max-w-60"
					>
						{isSubmitting ? "Recording…" : "Move Stock"}
					</Button>
				</div>
			</div>
		</main>
	);
};
