import type { Id } from "~convex/_generated/dataModel";
import { createColumnHelper, useTable, tableFeatures } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/tooltip";
import { TableCell, TableRow, Table, TableBody, TableHead, TableHeader } from "~/components/table";

export type User = {
	id: Id<"users">;
	createdAt: number;
	fullName: string | undefined;
	email: string | undefined;
	phone: string | undefined;
};

const staffTableFeatures = tableFeatures({
	// coreRowModel: coreRowModelsFeature,
});

const sth = createColumnHelper<typeof staffTableFeatures, User>(); // staffTableHelper

const staffColumns = [
	sth.accessor((row) => row.fullName, {
		header: "Full Name",
		cell: (info) => (
			<strong title={info.getValue()} className="truncate text-base font-medium text-emerald-700">
				{info.getValue()}
			</strong>
		),
	}),
	sth.accessor((row) => row.email, {
		header: "Email Address",
		cell: (info) => (
			<a href={`mailto:${info.getValue()}`} className="lowercase underline">
				{info.getValue()}
			</a>
		),
	}),
	sth.accessor((row) => row.phone, {
		header: "Phone Number",
		cell: (info) => <a href={`tel:${info.getValue()}`}>{info.getValue()}</a>,
	}),
	sth.accessor((row) => row.createdAt, {
		header: "Added At",
		cell: (info) => (
			<Tooltip>
				<TooltipTrigger
					render={
						<time dateTime={new Date(info.getValue()).toISOString()}>
							{formatDistanceToNow(new Date(info.getValue()), {
								addSuffix: true,
								includeSeconds: true,
							})}
						</time>
					}
				/>
				<TooltipContent className={"bubble-t! tail max-w-sm"}>{format(new Date(info.getValue()), "Pp")}</TooltipContent>
			</Tooltip>
		),
	}),
];

export type StaffTableProps = {
	data: Array<User>;
};

export const StaffTable = ({ data }: StaffTableProps) => {
	const staffTable = useTable({
		key: "staff-table",
		features: staffTableFeatures,
		data,
		columns: staffColumns as Array<ColumnDef<typeof staffTableFeatures, User>>,
		getRowId: (row) => row.id,
	});

	return (
		<Table>
			<TableHeader>
				{staffTable.getHeaderGroups().map((hg) => (
					<TableRow key={hg.id}>
						{hg.headers.map((header) => (
							<TableHead key={header.id}>{header.isPlaceholder ? null : <staffTable.FlexRender header={header} />}</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>

			<TableBody>
				{staffTable.getRowModel().rows.map((row) => (
					<TableRow key={row.id}>
						{row.getAllCells().map((cell) => (
							<TableCell key={cell.id}>
								<staffTable.FlexRender cell={cell} />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
};
