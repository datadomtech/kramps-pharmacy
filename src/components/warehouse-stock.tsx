import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";

import type { WarehouseStockItem } from "~/server/warehouse";
import { useWarehouseStock } from "~/hooks/use-warehouse";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { DateTooltip } from "./tooltip";
import { ExpiryBadge } from "./expiry-badge";

const stockTableFeatures = tableFeatures({});

const cth = createColumnHelper<typeof stockTableFeatures, WarehouseStockItem>();
import { SearchIcon } from "icons";

const strengthLabel = (strength: string | null, strengthUnit: string | null): string => {
	if (!strength && !strengthUnit) return "";
	return [strength ?? "", strengthUnit ?? ""].filter(Boolean).join(" ");
};

const stockTableColumns = [
	cth.accessor((row) => row.productName, {
		header: "Product",
		cell: ({ row }) => (
			<Link to="/products/$productId" params={{ productId: row.original.productId }} className="text-btn">
				<strong className="font-medium whitespace-nowrap text-emerald-700 capitalize">{row.original.productName}</strong>
				<p className="truncate text-gray-500">
					{row.original.brandName}
					{row.original.dosageFormName ? ` · ${row.original.dosageFormName.toLocaleLowerCase("en-GB")}` : ""}
					{strengthLabel(row.original.strength, row.original.strengthUnit)
						? ` · ${strengthLabel(row.original.strength, row.original.strengthUnit)}`
						: ""}
				</p>
			</Link>
		),
	}),
	cth.accessor((row) => row.onHand, {
		header: "In stock",
		cell: (info) => (
			<span className="text-sm text-btn font-btn">
				{info.getValue()} {info.getValue() === 1 ? "unit" : "units"}
			</span>
		),
	}),
	cth.accessor((row) => row.soonestExpiryDate ?? "", {
		header: "Soonest expiry",
		cell: ({ row }) => <ExpiryBadge expiryDate={row.original.soonestExpiryDate} />,
	}),
	cth.accessor((row) => row.batchCount, {
		header: "Batches",
		cell: (info) => (
			<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-medium text-emerald-800">
				{info.getValue()}
			</span>
		),
	}),
	cth.accessor((row) => row.lastReceivedAt, {
		header: "Last received",
		cell: (info) => <DateTooltip date={new Date(info.getValue())} />,
	}),
	cth.accessor((row) => row.addedBy?.name ?? "-", {
		header: "Added by",
		cell: (info) => <span className="whitespace-nowrap">{info.getValue()}</span>,
	}),
];

const useStockTable = ({ key, data }: { key: string; data: Array<WarehouseStockItem> }) =>
	useTable({
		key,
		features: stockTableFeatures,
		data,
		columns: stockTableColumns as Array<ColumnDef<typeof stockTableFeatures, WarehouseStockItem>>,
		getRowId: (row) => row.productId,
	});

export const WarehouseStock = () => {
	const { data: stock, isPending } = useWarehouseStock();
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const term = query.trim().toLocaleLowerCase();

		if (term === "") return stock ?? [];

		return (stock ?? []).filter(
			(item) => item.productName.toLocaleLowerCase().includes(term) || item.brandName.toLocaleLowerCase().includes(term),
		);
	}, [stock, query]);

	const table = useStockTable({ key: "warehouse-stock-table", data: filtered });

	useTanStackTableDevtools(table);

	if (isPending || stock === undefined) {
		return <div>Loading...</div>;
	}

	return (
		<div className="card overflow-x-auto p-0!">
			<div className="flex flex-row items-center justify-between gap-4 px-5 py-4">
				<h2 className="text-dialog-header font-medium text-emerald-900">Inventory</h2>
				<div className="relative w-full sm:max-w-52 grid grid-cols-1">
					<input
						type="search"
						placeholder="Search products…"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className="input-text pl-10! col-start-1 row-start-1"
					/>
					<SearchIcon className="pointer-events-none self-center col-start-1 row-start-1 size-5 fill-white  stroke-gray-400 ml-3" />
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="px-5 py-10 text-center">
					{stock.length === 0 ? (
						<>
							<p className="text-sm text-gray-600">Nothing is in the warehouse yet.</p>
							<Link to="/receive-stock" className="mt-2 inline-block text-btn text-emerald-700 hover:underline">
								Receive stock to get started
							</Link>
						</>
					) : (
						<p className="text-sm text-gray-500">No products match your search.</p>
					)}
				</div>
			) : (
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((hg) => (
							<TableRow key={hg.id}>
								{hg.headers.map((header) => (
									<TableHead key={header.id} className="text-btn">
										{header.isPlaceholder ? null : <table.FlexRender header={header} />}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} className="group">
								{row.getAllCells().map((cell) => (
									<TableCell key={cell.id}>
										<table.FlexRender cell={cell} />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
};
