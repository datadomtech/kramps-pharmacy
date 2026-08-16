import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { FunctionReturnType } from "convex/server";
// oxlint-disable-next-line typescript/consistent-type-imports
import { api } from "~convex/_generated/api";
import { DateTooltip } from "./tooltip";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";

const productsTableFeatures = tableFeatures({
	// coreRowModel: coreRowModelsFeature,
});

export type Product = FunctionReturnType<typeof api.products.listProducts>[0];

const cth = createColumnHelper<typeof productsTableFeatures, Product>();

const productsTableColumns = [
	cth.accessor((row) => row.name, {
		header: "Name",
		cell: ({ row, getValue }) => (
			<div className="flex items-center gap-2">
				<span className="size-10 overflow-hidden rounded-xl bg-emerald-200 ring-1 ring-green-300 ring-inset">
					<Image
						src={row.original.imageUrl ? row.original.imageUrl : "/logo.png"}
						alt={row.original.imageUrl}
						layout="fixed"
						height={40}
						aspectRatio={1}
						className="size-10 rounded-xl border border-solid border-emerald-200 object-contain text-emerald-700"
					/>
				</span>
				<div className="max-w-40 text-btn">
					<strong title={getValue()} className="block truncate font-medium whitespace-nowrap text-emerald-700 capitalize">
						{getValue()}
					</strong>
					<p title={row.original.description ?? undefined} className="truncate">
						{row.original.description}
					</p>
				</div>
			</div>
		),
	}),
	cth.accessor((row) => row.brandName, {
		header: "Brand Name",
		cell: (info) => <span className="capitalize underline">{info.getValue()}</span>,
	}),
	cth.accessor((row) => row.genericName, {
		header: "Generic Name",
		cell: (info) => <span>{info.getValue()}</span>,
	}),

	cth.accessor((row) => row.dosageFormId, {
		header: "Dosage Form",
		cell: (info) => (
			<Link
				to="/inventory"
				hash={encodeURIComponent(info.row.original.dosageFormId.toString())}
				viewTransition={true}
				className="inline-flex items-center justify-start"
			>
				<span className="text-sm text-btn font-btn">{info.row.original.dosageForm?.name?.toLocaleLowerCase("en-GB")}</span>
			</Link>
		),
	}),

	cth.accessor((row) => row._creationTime, {
		header: "Added At",
		cell: (info) => <DateTooltip date={new Date(info.getValue())} />,
	}),
];

export const ActiveProductsTable = ({ activeProducts }: { activeProducts: Array<Product> }) => {
	const activeProductsTable = useTable({
		key: "active-producs-table",
		features: productsTableFeatures,
		data: activeProducts,
		columns: productsTableColumns as Array<ColumnDef<typeof productsTableFeatures, Product>>,
		getRowId: (row) => row._id,
	});

	useTanStackTableDevtools(activeProductsTable);

	return (
		<Table>
			<TableHeader>
				{activeProductsTable.getHeaderGroups().map((hg) => (
					<TableRow key={hg.id}>
						{hg.headers.map((header) => (
							<TableHead key={header.id} className="text-btn">
								{header.isPlaceholder ? null : <activeProductsTable.FlexRender header={header} />}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>

			<TableBody>
				{activeProductsTable.getRowModel().rows.map((row) => (
					<TableRow key={row.id}>
						{row.getAllCells().map((cell) => (
							<TableCell key={cell.id}>
								<activeProductsTable.FlexRender cell={cell} />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};

export const InactiveProductsTable = ({ inActiveProducts }: { inActiveProducts: Array<Product> }) => {
	const inActiveProductsTable = useTable({
		key: "inactive-products-table",
		features: productsTableFeatures,
		data: inActiveProducts,
		columns: productsTableColumns as Array<ColumnDef<typeof productsTableFeatures, Product>>,
		getRowId: (row) => row._id,
	});

	useTanStackTableDevtools(inActiveProductsTable);

	return (
		<Table>
			<TableHeader>
				{inActiveProductsTable.getHeaderGroups().map((hg) => (
					<TableRow key={hg.id}>
						{hg.headers.map((header) => (
							<TableHead key={header.id}>
								{header.isPlaceholder ? null : <inActiveProductsTable.FlexRender header={header} />}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>

			<TableBody>
				{inActiveProductsTable.getRowModel().rows.map((row) => (
					<TableRow key={row.id}>
						{row.getAllCells().map((cell) => (
							<TableCell key={cell.id}>
								<inActiveProductsTable.FlexRender cell={cell} />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
