import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";

import type { WarehouseMovement, WarehouseMovementType } from "~/lib/types";
import { useRemoveWarehouseBatch, useWarehouseMovements } from "~/hooks/use-warehouse";
import { TrashIcon, SearchIcon } from "icons";
import { toastManager as toast } from "~selia/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { DateTooltip } from "./tooltip";

const movementsTableFeatures = tableFeatures({});

const cth = createColumnHelper<typeof movementsTableFeatures, WarehouseMovement>();

type Filter = "all" | WarehouseMovementType;

const filterChipIdle =
	"inline-flex cursor-pointer items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100";

const filterChipActive: Record<Exclude<Filter, "all">, string> = {
	in: "inline-flex cursor-pointer items-center rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800",
	out: "inline-flex cursor-pointer items-center rounded-full border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-700",
	move: "inline-flex cursor-pointer items-center rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700",
};

const typeLabel: Record<WarehouseMovementType, string> = {
	in: "In",
	out: "Out",
	move: "Moved",
};

const typeChip: Record<WarehouseMovementType, string> = {
	in: "border-emerald-300 bg-emerald-100 text-emerald-800",
	out: "border-red-300 bg-red-50 text-red-700",
	move: "border-gray-200 bg-gray-100 text-gray-600",
};

const quantitySign: Record<WarehouseMovementType, { sign: string; className: string }> = {
	in: { sign: "+", className: "text-emerald-600" },
	out: { sign: "−", className: "text-red-600" },
	move: { sign: "→", className: "text-gray-600" },
};

const saleStatusLabel: Record<string, string> = {
	pending: "Pending",
	completed: "Completed",
	cancelled: "Cancelled",
	refunded: "Refunded",
};

const movementsTableColumns = [
	cth.accessor((row) => row.occurredAt, {
		header: "When",
		cell: (info) => <DateTooltip date={new Date(info.getValue())} />,
	}),
	cth.accessor((row) => row.type, {
		header: "Type",
		cell: (info) => (
			<span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${typeChip[info.getValue()]}`}>
				{typeLabel[info.getValue()]}
			</span>
		),
	}),
	cth.accessor((row) => row.productName, {
		header: "Product",
		cell: ({ row }) => (
			<Link to="/products/$productId" params={{ productId: row.original.productId }} className="text-btn">
				<strong className="font-medium whitespace-nowrap text-emerald-700 capitalize">{row.original.productName}</strong>
				{row.original.batchNumber !== null && <p className="truncate text-gray-500">Batch {row.original.batchNumber}</p>}
			</Link>
		),
	}),
	cth.accessor((row) => row.quantity, {
		header: "Quantity",
		cell: (info) => {
			const { sign, className } = quantitySign[info.row.original.type];

			return (
				<span className={`text-sm text-btn font-btn font-semibold ${className}`}>
					{sign}
					{info.getValue()}
				</span>
			);
		},
	}),
	cth.accessor((row) => `${row.type}-${row.supplierName ?? ""}-${row.saleStatus ?? ""}-${row.fromLocationName ?? ""}`, {
		header: "Details",
		cell: ({ row }) => {
			const movement = row.original;

			if (movement.type === "in") {
				return (
					<p className="text-sm text-gray-600">
						Received from <span className="font-medium text-emerald-700">{movement.supplierName ?? "unknown supplier"}</span>
					</p>
				);
			}

			if (movement.type === "out") {
				return <p className="text-sm text-gray-600">{saleStatusLabel[movement.saleStatus ?? ""] ?? "Sale"}</p>;
			}

			return (
				<div className="text-sm text-gray-600">
					<p>
						<span className="font-medium text-emerald-700">{movement.fromLocationName ?? "?"}</span>
						<span className="mx-1">→</span>
						<span className="font-medium text-emerald-700">{movement.toLocationName ?? "?"}</span>
					</p>
					{movement.note !== null && <p className="text-xs text-gray-400">{movement.note}</p>}
				</div>
			);
		},
	}),
	cth.accessor((row) => row.staffName ?? "-", {
		header: "Staff",
		cell: (info) => <span className="whitespace-nowrap">{info.getValue()}</span>,
	}),
	cth.display({
		id: "actions",
		header: () => null,
		cell: ({ row }) =>
			row.original.type === "in" && row.original.batchId !== null ? (
				<RemoveBatch batchId={row.original.batchId} productName={row.original.productName} />
			) : null,
	}),
];

const RemoveBatch = ({ batchId, productName }: { batchId: string; productName: string }) => {
	const removeBatch = useRemoveWarehouseBatch();

	return (
		<button
			type="button"
			aria-label={`Remove ${productName} batch`}
			title="Remove this batch (takes remaining units out of stock)"
			onClick={async () =>
				await removeBatch.mutateAsync(batchId, {
					onSuccess: () => toast.add({ title: `${productName} batch removed from stock`, type: "success", timeout: 5000 }),
				})
			}
			className="cursor-pointer rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
		>
			<TrashIcon className="size-4" />
		</button>
	);
};

const useMovementsTable = ({ key, data }: { key: string; data: Array<WarehouseMovement> }) =>
	useTable({
		key,
		features: movementsTableFeatures,
		data,
		columns: movementsTableColumns as Array<ColumnDef<typeof movementsTableFeatures, WarehouseMovement>>,
		getRowId: (row) => row.id,
	});

export const WarehouseMovements = () => {
	const { data: movements, isPending } = useWarehouseMovements();
	const [filter, setFilter] = useState<Filter>("all");
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const term = query.trim().toLocaleLowerCase();

		return (movements ?? []).filter((movement) => {
			if (filter !== "all" && movement.type !== filter) return false;

			if (term === "") return true;

			return movement.productName.toLocaleLowerCase().includes(term);
		});
	}, [movements, filter, query]);

	const table = useMovementsTable({ key: "warehouse-movements-table", data: filtered });

	useTanStackTableDevtools(table);

	if (isPending || movements === undefined) {
		return <div>Loading...</div>;
	}

	const counts: Record<Filter, number> = {
		all: movements.length,
		in: movements.filter((movement) => movement.type === "in").length,
		out: movements.filter((movement) => movement.type === "out").length,
		move: movements.filter((movement) => movement.type === "move").length,
	};

	const filters: Array<{ id: Filter; name: string }> = [
		{ id: "all", name: `All (${counts.all})` },
		{ id: "in", name: `In (${counts.in})` },
		{ id: "out", name: `Out (${counts.out})` },
		{ id: "move", name: `Moved (${counts.move})` },
	];

	return (
		<div className="card overflow-x-auto p-0!">
			<div className="flex flex-row flex-wrap items-center justify-between gap-4 px-5 py-4">
				<h2 className="text-dialog-header font-medium text-emerald-900">Movements</h2>
				<div className="relative w-full sm:max-w-52">
					<SearchIcon className="pointer-events-none absolute top-1/2 left-1/2 size-5 -translate-x-[calc(100%+7px)] -translate-y-1/2 fill-white stroke-gray-400 stroke-[1.5px]" />
					<input
						type="search"
						placeholder="Search products…"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						className="input-text pl-10!"
					/>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2 border-t border-solid border-gray-200 px-5 py-3">
				{filters.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => setFilter(item.id)}
						className={
							filter === item.id && item.id !== "all" ? filterChipActive[item.id] : filter === item.id ? filterChipIdle : filterChipIdle
						}
					>
						{item.name}
					</button>
				))}
			</div>

			{filtered.length === 0 ? (
				<div className="px-5 py-10 text-center">
					<p className="text-sm text-gray-500">
						{movements.length === 0
							? "No movements yet. Receive stock or record a move to populate this log."
							: "No movements match your filters."}
					</p>
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
