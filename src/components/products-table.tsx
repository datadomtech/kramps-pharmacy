import { Link, useNavigate } from "@tanstack/react-router";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Product } from "~/lib/types";
import { DateTooltip } from "./tooltip";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Image } from "@unpic/react";
import { EditIcon, PlusSquareIcon, TrashIcon } from "icons";
import { Button } from "~primitives/button";
import { toastManager as toast } from "~selia/toast";
import { useDeleteProduct, useRestoreProduct } from "~/hooks/use-products";

const productsTableFeatures = tableFeatures({
	// coreRowModel: coreRowModelsFeature,
});

const cth = createColumnHelper<typeof productsTableFeatures, Product>();

const ProductRowActions = ({ product }: { product: Product }) => {
	const deleteProduct = useDeleteProduct();
	const restoreProduct = useRestoreProduct();
	const navigate = useNavigate();

	if (product.deletedAt) {
		return (
			<Button
				type="button"
				aria-label={`Restore ${product.name}`}
				title="Restore product"
				onClick={async () =>
					await restoreProduct.mutateAsync(product.id, {
						onSuccess: () => toast.add({ title: `${product.name} restored successfully`, type: "success" }),
					})
				}
				className="cursor-pointer"
			>
				<PlusSquareIcon className="size-4 fill-transparent stroke-brand stroke-2" />
			</Button>
		);
	}

	return (
		<div className="flex items-center justify-end gap-x-1.5">
			<Button
				type="button"
				aria-label={`Edit ${product.name}`}
				title="Edit product"
				onClick={() => void navigate({ to: "/products/$productId/edit", params: { productId: product.id } })}
				className="cursor-pointer"
			>
				<EditIcon className="size-4 fill-transparent stroke-brand stroke-2" />
			</Button>
			<Button
				type="button"
				aria-label={`Delete ${product.name}`}
				title="Delete product"
				onClick={async () =>
					await deleteProduct.mutateAsync(product.id, {
						onSuccess: () => toast.add({ title: `${product.name} deleted successfully`, type: "success" }),
					})
				}
				className="cursor-pointer"
			>
				<TrashIcon className="size-4 fill-transparent stroke-red-500 stroke-2" />
			</Button>
		</div>
	);
};

const productsTableColumns = [
	cth.accessor((row) => row.name, {
		header: "Name",
		cell: ({ row, getValue }) => (
			<div className="flex items-center gap-2">
				<span className="size-10 overflow-hidden rounded-xl bg-emerald-200 ring-1 ring-green-300 ring-inset">
					<Image
						src={row.original.imageUrl ? row.original.imageUrl : "/logo.png"}
						alt={row.original.imageUrl ?? undefined}
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
		header: "Product Category",
		cell: (info) => (
			<Link
				to="/inventory"
				hash={encodeURIComponent(info.row.original.dosageFormId.toString())}
				viewTransition={true}
				className="inline-flex items-center justify-start"
			>
				<span className="text-sm text-btn font-btn">{info.row.original.dosageForm?.name.toLocaleLowerCase("en-GB")}</span>
			</Link>
		),
	}),

	cth.accessor((row) => row.createdAt, {
		header: "Added At",
		cell: (info) => <DateTooltip date={new Date(info.getValue())} />,
	}),

	cth.display({
		id: "actions",
		header: () => null,
		cell: ({ row }) => <ProductRowActions product={row.original} />,
	}),
];

const useProductsTable = ({ key, data }: { key: string; data: Array<Product> }) =>
	useTable({
		key,
		features: productsTableFeatures,
		data,
		columns: productsTableColumns as Array<ColumnDef<typeof productsTableFeatures, Product>>,
		getRowId: (row) => row.id,
	});

const ProductsTable = ({ tableKey, products }: { tableKey: string; products: Array<Product> }) => {
	const table = useProductsTable({ key: tableKey, data: products });

	useTanStackTableDevtools(table);

	return (
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
	);
};

export const ActiveProductsTable = ({ activeProducts }: { activeProducts: Array<Product> }) => (
	<ProductsTable tableKey="active-products-table" products={activeProducts} />
);

export const InactiveProductsTable = ({ inActiveProducts }: { inActiveProducts: Array<Product> }) => (
	<ProductsTable tableKey="inactive-products-table" products={inActiveProducts} />
);

export const DeletedProductsTable = ({ deletedProducts }: { deletedProducts: Array<Product> }) => (
	<ProductsTable tableKey="deleted-products-table" products={deletedProducts} />
);
