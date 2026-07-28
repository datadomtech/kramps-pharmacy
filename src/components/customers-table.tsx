import type { LinkOptions } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { createColumnHelper, tableFeatures, useTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Image } from "@unpic/react";
import type { FunctionReturnType } from "convex/server";
// oxlint-disable-next-line typescript/consistent-type-imports
import { api } from "~convex/_generated/api";
import { DateTooltip } from "./tooltip";
import { useTanStackTableDevtools } from "@tanstack/react-table-devtools";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

type EmptyCustomersProps = {
	to: LinkOptions["to"];
	linkText: string;
	title: string;
	description: string;
};

export const EmptyCustomers = ({ ...props }: EmptyCustomersProps) => (
	<div className="mx-auto w-full max-w-sm space-y-4 py-20 text-center">
		<Image src="/assets/no-active-customers.png" alt="" className="mx-auto h-auto w-full" layout="constrained" width={192} height={192} />

		<div className="space-y-1">
			<h2 className="text-base font-medium text-emerald-900">{props.title}</h2>
			<p className="text-sm text-gray-500">{props.description}</p>
		</div>

		<Link to={props.to} className="btn btn-primary">
			{props.linkText}
		</Link>
	</div>
);

export type Customer = FunctionReturnType<typeof api.customers.listActiveCustomers>[0];

const customersTableFeatures = tableFeatures({
	// coreRowModel: coreRowModelsFeature,
});

const cth = createColumnHelper<typeof customersTableFeatures, Customer>();

const customerColumns = [
	cth.accessor((row) => row.name, {
		header: "Full Name",
		cell: (info) => (
			<strong title={info.getValue()} className="truncate text-base font-medium text-emerald-700 capitalize">
				{info.getValue()}
			</strong>
		),
	}),
	cth.accessor((row) => row.email, {
		header: "Email Address",
		cell: (info) => (
			<a href={`mailto:${info.getValue()}`} className="lowercase underline">
				{info.getValue()}
			</a>
		),
	}),
	cth.accessor((row) => row.phone, {
		header: "Phone Number",
		cell: (info) => <a href={`tel:${info.getValue()}`}>{info.getValue()}</a>,
	}),

	cth.accessor((row) => row.phone, {
		header: "Contact Person",
		cell: (info) => (
			<div className="justifystart inline-flex items-center">
				<span className="text-sm text-btn font-btn">{info.row.original.contactName?.toLocaleLowerCase("en-GB")}</span>
			</div>
		),
	}),

	cth.accessor((row) => row._creationTime, {
		header: "Added At",
		cell: (info) => <DateTooltip date={new Date(info.getValue())} />,
	}),
];

export const CustomersTable = ({ customers }: { customers: Array<Customer> }) => {
	const table = useTable({
		key: "active-customers-table",
		features: customersTableFeatures,
		data: customers,
		columns: customerColumns as Array<ColumnDef<typeof customersTableFeatures, Customer>>,
		getRowId: (row) => row._id,
	});

	useTanStackTableDevtools(table);

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map((hg) => (
					<TableRow key={hg.id}>
						{hg.headers.map((header) => (
							<TableHead key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>

			<TableBody>
				{table.getRowModel().rows.map((row) => (
					<TableRow key={row.id}>
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
