import { useNavigate } from "@tanstack/react-router";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Supplier } from "~/lib/types";
import { DateTooltip } from "./tooltip";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { EditIcon, PlusSquareIcon, TrashIcon } from "icons";
import { Button } from "~primitives/button";
import { toastManager as toast } from "~selia/toast";
import { useDeleteSupplier, useRestoreSupplier } from "~/hooks/use-suppliers";

const suppliersTableFeatures = tableFeatures({});

const cth = createColumnHelper<typeof suppliersTableFeatures, Supplier>();

const SupplierRowActions = ({ supplier }: { supplier: Supplier }) => {
	const deleteSupplier = useDeleteSupplier();
	const restoreSupplier = useRestoreSupplier();
	const navigate = useNavigate();

	if (supplier.deletedAt) {
		return (
			<Button
				type="button"
				aria-label={`Restore ${supplier.name}`}
				title="Restore supplier"
				onClick={async () =>
					await restoreSupplier.mutateAsync(supplier.id, {
						onSuccess: () => toast.add({ title: `${supplier.name} restored successfully`, type: "success" }),
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
				aria-label={`Edit ${supplier.name}`}
				title="Edit supplier"
				onClick={() => void navigate({ to: "/suppliers/$supplierId/edit", params: { supplierId: supplier.id } })}
				className="cursor-pointer"
			>
				<EditIcon className="size-4 fill-transparent stroke-brand stroke-2" />
			</Button>
			<Button
				type="button"
				aria-label={`Delete ${supplier.name}`}
				title="Delete supplier"
				onClick={async () =>
					await deleteSupplier.mutateAsync(supplier.id, {
						onSuccess: () => toast.add({ title: `${supplier.name} deleted successfully`, type: "success" }),
					})
				}
				className="cursor-pointer"
			>
				<TrashIcon className="size-4 fill-transparent stroke-red-500 stroke-2" />
			</Button>
		</div>
	);
};

const suppliersTableColumns = [
	cth.accessor((row) => row.name, {
		header: "Name",
		cell: (info) => (
			<strong title={info.getValue()} className="truncate text-base font-medium text-emerald-700 capitalize">
				{info.getValue()}
			</strong>
		),
	}),
	cth.accessor((row) => row.phone, {
		header: "Phone Number",
		cell: (info) => <a href={`tel:${info.getValue()}`}>{info.getValue()}</a>,
	}),
	cth.accessor((row) => row.email, {
		header: "Email Address",
		cell: (info) =>
			info.getValue() ? (
				<a href={`mailto:${info.getValue()}`} className="lowercase underline">
					{info.getValue()}
				</a>
			) : null,
	}),
	cth.accessor((row) => row.contactName ?? "", {
		header: "Contact Person",
		cell: ({ row }) => (
			<div className="inline-flex flex-col items-start justify-start">
				<span className="text-sm text-btn font-btn">{row.original.contactName?.toLocaleLowerCase("en-GB")}</span>
				<a href={`tel:${row.original.contactPhone}`}>{row.original.contactPhone}</a>
			</div>
		),
	}),
	cth.accessor((row) => row.createdAt, {
		header: "Added At",
		cell: (info) => <DateTooltip date={new Date(info.getValue())} />,
	}),
	cth.display({
		id: "actions",
		header: () => null,
		cell: ({ row }) => <SupplierRowActions supplier={row.original} />,
	}),
];

export const SuppliersTable = ({ tableKey, suppliers }: { tableKey: string; suppliers: Array<Supplier> }) => {
	const table = useTable({
		key: tableKey,
		features: suppliersTableFeatures,
		data: suppliers,
		columns: suppliersTableColumns as Array<ColumnDef<typeof suppliersTableFeatures, Supplier>>,
		getRowId: (row) => row.id,
	});

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

export const ActiveSuppliersTable = ({ activeSuppliers }: { activeSuppliers: Array<Supplier> }) => (
	<SuppliersTable tableKey="active-suppliers-table" suppliers={activeSuppliers} />
);

export const DeletedSuppliersTable = ({ deletedSuppliers }: { deletedSuppliers: Array<Supplier> }) => (
	<SuppliersTable tableKey="deleted-suppliers-table" suppliers={deletedSuppliers} />
);
