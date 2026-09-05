import { Link } from "@tanstack/react-router";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { addMonths, format, isBefore, isSameMonth, startOfDay } from "date-fns";

import type { InventoryBatchLine } from "~/server/stock-in";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { DateTooltip } from "./tooltip";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";

export type ExpiryGroup = {
	id: "expired" | "this-month" | "next-month" | "upcoming";
	title: string;
	batches: Array<InventoryBatchLine>;
};

export function groupBatchesByExpiry(batches: Array<InventoryBatchLine>): Array<ExpiryGroup> {
	const today = startOfDay(new Date());
	const nextMonth = addMonths(today, 1);

	const groups: Array<ExpiryGroup> = [
		{ id: "expired", title: "Expired", batches: [] },
		{ id: "this-month", title: format(today, "MMMM yyyy"), batches: [] },
		{ id: "next-month", title: format(nextMonth, "MMMM yyyy"), batches: [] },
		{ id: "upcoming", title: "Upcoming", batches: [] },
	];

	for (const batch of batches) {
		if (!batch.expiryDate) continue;

		const expiryDate = new Date(`${batch.expiryDate}T00:00:00`);

		if (isBefore(expiryDate, today)) {
			groups[0].batches.push(batch);
		} else if (isSameMonth(expiryDate, today)) {
			groups[1].batches.push(batch);
		} else if (isSameMonth(expiryDate, nextMonth)) {
			groups[2].batches.push(batch);
		} else {
			groups[3].batches.push(batch);
		}
	}

	return groups
		.filter((group) => group.batches.length > 0)
		.map((group) => ({
			...group,
			batches: [...group.batches].sort((a, b) => (a.expiryDate ?? "").localeCompare(b.expiryDate ?? "")),
		}));
}

const expiryTableFeatures = tableFeatures({});

const cth = createColumnHelper<typeof expiryTableFeatures, InventoryBatchLine>();

const expiryTableColumns = [
	cth.accessor((row) => row.productName, {
		header: "Product",
		cell: ({ row }) => (
			<Link to="/products/$productId" params={{ productId: row.original.productId }} className="text-btn">
				<strong className="font-medium whitespace-nowrap text-emerald-700 capitalize">{row.original.productName}</strong>
				<p className="truncate text-gray-500">{row.original.brandName}</p>
			</Link>
		),
	}),
	cth.accessor((row) => row.batchNumber ?? "", {
		header: "Batch Number",
		cell: (info) => <span>{info.getValue() || "—"}</span>,
	}),
	cth.accessor((row) => row.quantityOnHand, {
		header: "Units",
		cell: (info) => (
			<span className="text-sm text-btn font-btn">
				{info.getValue()} {info.getValue() === 1 ? "unit" : "units"}
			</span>
		),
	}),
	cth.accessor((row) => row.expiryDate ?? "", {
		header: "Expiry Date",
		cell: ({ row }) => (row.original.expiryDate ? <DateTooltip date={new Date(`${row.original.expiryDate}T00:00:00`)} /> : <span>—</span>),
	}),
	cth.accessor((row) => row.receivedAt, {
		header: "Received",
		cell: (info) => <DateTooltip date={new Date(info.getValue())} />,
	}),
];

const useExpiryTable = ({ key, data }: { key: string; data: Array<InventoryBatchLine> }) =>
	useTable({
		key,
		features: expiryTableFeatures,
		data,
		columns: expiryTableColumns as Array<ColumnDef<typeof expiryTableFeatures, InventoryBatchLine>>,
		getRowId: (row) => row.id,
	});

export const ExpiryGroupCard = ({ group }: { group: ExpiryGroup }) => {
	const table = useExpiryTable({ key: `expiry-${group.id}-table`, data: group.batches });

	useTanStackTableDevtools(table);

	return (
		<div className="card overflow-x-auto p-0!">
			<div className="flex flex-row items-center justify-between px-5 py-4">
				<h2 className="text-dialog-header font-medium text-emerald-900">{group.title}</h2>
				<span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-medium text-emerald-800">
					{group.batches.length}
				</span>
			</div>
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
		</div>
	);
};
