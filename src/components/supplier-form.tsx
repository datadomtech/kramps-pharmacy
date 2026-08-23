import { useForm } from "@tanstack/react-form";
import { toastManager as toast } from "~selia/toast";
import { Field, Input, Label } from "~input";
import { Button } from "~primitives/button";

import type { Supplier } from "~/lib/types";
import { useAddSupplier } from "~/hooks/use-suppliers";

export type SupplierFormSchema = Pick<Supplier, "name" | "phone" | "address" | "email" | "contactName" | "contactPhone" | "contactEmail">;

export const supplierFormDefaultValues: SupplierFormSchema = {
	name: "",
	phone: "",
	address: "",
	email: "",
	contactName: "",
	contactPhone: "",
	contactEmail: "",
};

type SupplierFormProps = {
	defaultValues: SupplierFormSchema;
	submitLabel: string;
	onSubmit: (value: SupplierFormSchema) => Promise<void>;
	showReset?: boolean;
};

export const SupplierForm = ({ defaultValues, submitLabel, onSubmit, showReset = true }: SupplierFormProps) => {
	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			try {
				await onSubmit(value);
				form.reset();
			} catch (error) {
				toast.add({ title: error instanceof Error ? error.message : String(error), type: "error", timeout: 10_000 });
			}
		},
	});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
			className="grid grid-cols-1 gap-x-4 gap-y-6 border-t border-solid border-gray-200 p-4 sm:grid-cols-2 lg:p-8"
		>
			<form.Field name="name">
				{(field) => (
					<Field>
						<Label htmlFor={field.name}>Name</Label>
						<Input
							type="text"
							id={field.name}
							name={field.name}
							placeholder="Supplier name"
							autoFocus={true}
							value={field.state.value}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="phone">
				{(field) => (
					<Field>
						<Label htmlFor={field.name}>Phone Number</Label>
						<Input
							type="text"
							autoComplete="tel-local"
							id={field.name}
							name={field.name}
							placeholder="Phone number"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="address">
				{(field) => (
					<Field className="sm:col-span-2">
						<Label htmlFor={field.name}>Address</Label>
						<Input
							type="text"
							autoComplete="address-level1"
							id={field.name}
							name={field.name}
							placeholder="Address"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="email">
				{(field) => (
					<Field>
						<Label htmlFor={field.name}>Email Address</Label>
						<Input
							type="email"
							inputMode="email"
							id={field.name}
							name={field.name}
							placeholder="Email address"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field>
				)}
			</form.Field>

			<div className="space-y-1.5 sm:col-span-2">
				<h5 className="text-btn font-btn text-emerald-900">Contact Person (optional)</h5>
				<p className="text-sm font-light text-gray-500">The person to reach when placing or following up on orders.</p>
			</div>

			<form.Field name="contactName">
				{(field) => (
					<Field>
						<Label htmlFor={field.name}>Contact Person&apos;s Name</Label>
						<Input
							type="text"
							id={field.name}
							name={field.name}
							placeholder="Contact person's name"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="contactPhone">
				{(field) => (
					<Field>
						<Label htmlFor={field.name}>Contact Phone</Label>
						<Input
							type="text"
							id={field.name}
							name={field.name}
							placeholder="Contact phone"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="contactEmail">
				{(field) => (
					<Field>
						<Label htmlFor={field.name}>Contact Email</Label>
						<Input
							type="email"
							inputMode="email"
							id={field.name}
							name={field.name}
							placeholder="Contact email"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field>
				)}
			</form.Field>

			<div className="col-span-full flex w-full items-center justify-center gap-x-4 border-solid border-gray-200 pt-4 md:justify-end">
				<Button type="submit" className="btn-lg btn-primary grow gap-2 lg:max-w-60">
					{submitLabel}
				</Button>

				{showReset && (
					<Button type="reset" className="btn-lg btn-secondary grow gap-2 lg:max-w-60">
						Reset
					</Button>
				)}
			</div>
		</form>
	);
};

export const AddSupplierForm = () => {
	const addSupplierMutation = useAddSupplier();

	return (
		<SupplierForm
			defaultValues={supplierFormDefaultValues}
			submitLabel="Add supplier"
			onSubmit={async (value) => {
				await addSupplierMutation.mutateAsync({ ...value });

				toast.add({
					title: `${value.name} added successfully`,
					type: "success",
					positionerProps: { side: "right", align: "start" },
					timeout: 10_000,
				});
			}}
		/>
	);
};
