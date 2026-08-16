import { toastManager as toast } from "~selia/toast";
import { Button } from "~primitives/button";
import { Radio } from "~primitives/radio";
import { RadioGroup } from "~primitives/radio-group";

import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { InfoCircleIcon } from "~/components/icons";
import { Input, Label } from "~/components/input";
import { api } from "~convex/_generated/api";
import type { Doc } from "~convex/_generated/dataModel";
import { Field } from "~primitives/field";

export const Route = createFileRoute("/_app/customers/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="card overflow-hidden p-0!">
			<div className="flex items-center justify-between border-b border-solid border-gray-200 p-5">
				<h3 className="text-base font-btn text-emerald-900">Add a Customer</h3>
				<div className="flex items-center justify-start gap-2 text-sm font-light text-gray-500 [&>a]:hover:text-emerald-700">
					<Link to="/customers">Active</Link>
					<Link to="/customers/blacklist">Blacklisted</Link>
				</div>
			</div>
			<AddCustomerForm />
		</div>
	);
}

// export type CustomerTypeMap = Record<CustomerType, string>;

type CustomerType = FunctionArgs<typeof api.customers.addCustomer>["type"];

const customerTypes: Array<{ id: number; name: string; value: CustomerType }> = [
	{ id: 1, name: "Individual", value: "individual" },
	{ id: 2, name: "Hospital", value: "hospital" },
	{ id: 3, name: "Pharmacy", value: "pharmacy" },
];

const addCustomerDefaultValues: Pick<
	Doc<"customers">,
	"name" | "email" | "phone" | "type" | "address" | "contactEmail" | "contactName" | "contactPhone"
> = {
	address: "",
	contactEmail: "",
	contactName: "",
	contactPhone: "",
	email: "",
	name: "",
	phone: "",
	type: "individual",
};

const AddCustomerForm = () => {
	const addCustomer = useMutation(api.customers.addCustomer);

	const form = useForm({
		defaultValues: addCustomerDefaultValues,
		onSubmit: async ({ value }) => {
			try {
				await addCustomer({ ...value });
				form.reset();
				toast.add({ title: "Customer added successfully", type: "success" });
			} catch (err) {
				toast.add({ title: err instanceof Error ? err.name : "Something went wrong", type: "error" });
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
			className="grid grid-cols-1 gap-x-4 gap-y-6 border-t border-gray-200/70 p-5 sm:grid-cols-2"
		>
			<form.Field name="name">
				{(field) => (
					<Field.Root className="space-y-1 sm:col-span-1">
						<Label htmlFor={field.name} className="text-navy-900 text-sm font-btn">
							Name
						</Label>
						<Input
							type="text"
							id={field.name}
							name={field.name}
							placeholder="Full name"
							value={field.state.value}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field.Root>
				)}
			</form.Field>

			<form.Field name="address">
				{(field) => (
					<Field.Root className="space-y-1 sm:col-span-1">
						<Label htmlFor={field.name} className="text-navy-900 text-sm font-btn">
							Address
						</Label>
						<Input
							type="text"
							autoComplete="address-level1"
							id={field.name}
							name={field.name}
							placeholder="Something meaningful for you to recognize"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field.Root>
				)}
			</form.Field>

			<form.Field name="phone">
				{(field) => (
					<Field.Root className="space-y-1 sm:col-span-1">
						<Label htmlFor={field.name} className="text-navy-900 text-sm font-btn">
							Phone Number
						</Label>
						<Input
							type="text"
							autoComplete="tel-local"
							id={field.name}
							name={field.name}
							placeholder="Something meaningful for you to recognize"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field.Root>
				)}
			</form.Field>

			<form.Field name="email">
				{(field) => (
					<Field.Root className="space-y-1 sm:col-span-1">
						<Label htmlFor={field.name} className="text-navy-900 text-sm font-btn">
							Email Address
						</Label>
						<Input
							type="text"
							autoComplete="work email"
							id={field.name}
							name={field.name}
							placeholder="Something meaningful for you to recognize"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field.Root>
				)}
			</form.Field>

			<div className="space-y-1.5 sm:col-span-2">
				<h5 className="text-btn font-btn text-emerald-900">Contact Person</h5>

				<div className="card card-note mb-5 flex items-start gap-1.5">
					<InfoCircleIcon className="size-6 shrink-0 fill-green-700 stroke-transparent" />
					<div className="flex-1">
						If the customer is an <strong>individual</strong>, you don't need to fill out the contact person details below. For
						<strong> hospitals</strong> or other types of customers, please provide the relevant contact information in the form fields.
					</div>
				</div>
			</div>

			<form.Field name="contactName">
				{(field) => (
					<Field.Root className="space-y-1 sm:col-span-1">
						<Label htmlFor={field.name} className="text-navy-900 text-sm font-btn">
							Contact Person&apos;s Name
						</Label>
						<Input
							type="text"
							autoComplete="given-name webauthn"
							className="autofill:bg-red-500"
							id={field.name}
							name={field.name}
							placeholder="Something meaningful for you to recognize"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field.Root>
				)}
			</form.Field>

			<form.Field name="contactPhone">
				{(field) => (
					<Field.Root className="space-y-1 sm:col-span-1">
						<Label htmlFor={field.name} className="text-navy-900 text-sm font-btn">
							Contact Phone
						</Label>
						<Input
							type="text"
							autoComplete="home tel"
							id={field.name}
							name={field.name}
							placeholder="Something meaningful for you to recognize"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field.Root>
				)}
			</form.Field>

			<form.Field name="contactEmail">
				{(field) => (
					<Field.Root className="space-y-1 sm:col-span-1">
						<Label htmlFor={field.name} className="text-navy-900 text-sm font-btn">
							Contact Email
						</Label>
						<Input
							type="text"
							autoComplete="email"
							id={field.name}
							name={field.name}
							placeholder="Something meaningful for you to recognize"
							value={field.state.value ?? ""}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
						/>
					</Field.Root>
				)}
			</form.Field>

			<div className="sm:col-span-2">
				<h5 className="text-sm text-btn font-btn">Type of customer</h5>

				<form.Field name="type">
					{(field) => (
						<Field.Root className="card mt-1">
							<RadioGroup aria-labelledby={field.name} onValueChange={field.handleChange} value={field.state.value}>
								<div id={field.name} className="sr-only">
									Types of customers
								</div>
								{customerTypes.map((ct) => (
									<Label className="mt-1.5 flex items-center gap-2 text-sm text-btn font-btn text-emerald-900">
										<Radio.Root
											key={ct.id}
											value={ct.value}
											className="flex size-4 shrink-0 items-center justify-center rounded-full border border-emerald-500 bg-white p-0 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 data-checked:bg-emerald-500 data-checked:text-white"
										>
											<Radio.Indicator className="flex items-center justify-center before:size-1.75 before:rounded-full before:bg-current data-unchecked:hidden" />
										</Radio.Root>
										{ct.name}
									</Label>
								))}
							</RadioGroup>
						</Field.Root>
					)}
				</form.Field>
			</div>

			<div className="contents">
				<Button type="submit" className="btn-lg btn-primary gap-2 lg:max-w-60">
					Add customer
				</Button>
			</div>
		</form>
	);
};
