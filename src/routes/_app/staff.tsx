import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
	DialogX,
} from "~dialog";
import { StaffTable } from "~/components/staff-table";
import { api } from "~convex/_generated/api";
import { Field, Input, Label } from "~input";
import { useForm } from "@tanstack/react-form";
import { Button } from "~primitives/button";
import { z } from "zod";

export const addStaffSchema = z.object({
	fullName: z.string().trim().min(2, "Full name is required"),
	email: z.email("Enter a valid email address").trim(),
	phoneNumber: z
		.string()
		.length(
			10,
			"Phone number should use the Ghanaian format and have no spaces.",
		)
		.startsWith("0", "Phone number should always start with 0"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

export type AddStaffValues = z.infer<typeof addStaffSchema>;

export const Route = createFileRoute("/_app/staff")({
	component: RouteComponent,
});

function RouteComponent() {
	const [open, setOpen] = useState(false);

	const staffMembers = useQuery(api.staff.listStaff);

	return (
		<div className="flex flex-col gap-6">
			<div className="card overflow-x-scroll p-0!">
				<div className="flex items-center justify-between px-5 py-4">
					<div className="space-y-2">
						<h2 className="text-lg font-medium text-emerald-900">
							Staff Members
						</h2>
					</div>

					<div>
						<AddStaffDialog
							isDialogOpen={open}
							onOpenDialog={setOpen}
						/>
					</div>
				</div>
				<StaffTable data={(staffMembers as any) ?? []} />
			</div>
		</div>
	);
}

type AddStaffDialogProps = {
	isDialogOpen: boolean;
	onOpenDialog: (isOpen: boolean) => void;
};

const addStaffDefaultValues: typeof api.staff.addStaff._args = {
	email: "",
	fullName: "",
	password: "",
	phoneNumber: "",
};

const AddStaffDialog = ({
	isDialogOpen,
	onOpenDialog,
}: AddStaffDialogProps) => {
	const addStaff = useAction(api.staff.addStaff);

	const form = useForm({
		defaultValues: addStaffDefaultValues,
		validators: {
			onSubmit: addStaffSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				console.log(
					"adding staff member from client",
					"value: ",
					value,
				);
				console.log("before use action");
				const staff = await addStaff({ ...value });

				console.log("after use action");
				onOpenDialog(false);
				toast.success(`${staff.name} added successfully`);
			} catch (error) {
				console.error("add staff use action failed: ", error);
				toast.error(
					error instanceof Error ? error.name : "Failed to add staff",
					{ description: String(error) },
				);
			}
		},
	});

	return (
		<Dialog open={isDialogOpen} onOpenChange={onOpenDialog}>
			<DialogTrigger className="btn btn-secondary cursor-pointer gap-2 bg-emerald-100!">
				Add member
			</DialogTrigger>
			<DialogPopup
				id="add-staff-dialog-popup"
				className="flex flex-col gap-6"
			>
				<div className="absolute top-5 right-5">
					<DialogX />
				</div>

				<div>
					<DialogTitle className="mb-2">
						Add a Staff Member
					</DialogTitle>
					<DialogDescription className="max-w-xl text-gray-500!">
						A staff member enters data such as patient name,
						prescribed medication and cost, to maintain pharmacy
						files, charge system, and inventory. They also assay
						medications to determine identity, purity, and strength.
						Instructs interns, other medical personnel and customers
						on matters pertaining to the pharmacy.
					</DialogDescription>

					<form
						className="mt-6 space-y-4"
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							void form.handleSubmit();
						}}
					>
						<form.Field name="fullName">
							{(field) => (
								<Field className="mb-4">
									<Label htmlFor={field.name}>
										Full Name
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onValueChange={field.handleChange}
										onBlur={field.handleBlur}
										aria-label="Full Name"
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="email">
							{(field) => (
								<Field className="mb-4">
									<Label htmlFor={field.name}>
										Email Address
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onValueChange={field.handleChange}
										onBlur={field.handleBlur}
										type="email"
										placeholder="pharmacist@krampsmail.com"
										aria-label="Email Address"
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name="phoneNumber">
							{(field) => (
								<Field className="mb-4">
									<Label htmlFor={field.name}>
										Phone Number
									</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onValueChange={field.handleChange}
										onBlur={field.handleBlur}
										aria-label="Phone Number"
									/>
									<p className="mt-1 text-xs text-emerald-500/80">
										Phone number should use the Ghanaian
										format and have no spaces.
									</p>
								</Field>
							)}
						</form.Field>

						<form.Field name="password">
							{(field) => (
								<Field className="mb-4">
									<Label htmlFor={field.name}>Password</Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										onValueChange={field.handleChange}
										onBlur={field.handleBlur}
										aria-label="Password"
									/>
								</Field>
							)}
						</form.Field>

						<div className="flex items-center justify-end gap-2">
							<DialogClose
								type="button"
								className="btn btn-secondary"
							>
								Cancel
							</DialogClose>

							<Button type="submit" className="btn btn-primary">
								Add member
							</Button>
						</div>
					</form>
				</div>
			</DialogPopup>
		</Dialog>
	);
};
