import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { api } from "~convex/_generated/api";
import { toastManager as toast } from "~selia/toast";
import { useForm } from "@tanstack/react-form";
import { Field, Fieldset, Input, Label, Legend, Radio, RadioGroup, RadioIndicator, TextArea } from "~input";
import { Button } from "~primitives/button";

import type { Doc, Id } from "~convex/_generated/dataModel";
import type { WithoutSystemFields } from "convex/server";
import { useMutation, useQuery } from "convex/react";
import { OpenLinkIcon } from "~icons/open-link.tsx";

export const Route = createFileRoute("/_app/products/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="card my-2 max-w-4xl p-0! md:mx-auto md:my-6 lg:my-8">
			<div className="p-4 text-xl text-emerald-700 md:text-2xl lg:p-8">Add a product </div>
			<NewProductForm />
		</div>
	);
}

type ProductFormSchema = Pick<
	WithoutSystemFields<Doc<"products">>,
	"name" | "dosageFormId" | "brandName" | "genericName" | "barCodeNumber" | "description" | "manufacturer" | "imageUrl"
>;

const addProductDefaultValues: ProductFormSchema = {
	name: "",
	brandName: "",
	barCodeNumber: "",
	description: "",
	genericName: "",
	dosageFormId: "" as Id<"dosage_forms">,
	imageUrl: "",
	manufacturer: "",
};

const NewProductForm = () => {
	const addProduct = useMutation(api.products.addProduct);

	const navigate = useNavigate();

	const form = useForm({
		defaultValues: addProductDefaultValues,
		onSubmit: async ({ value }) => {
			try {
				const product = await addProduct(value);
				form.reset();

				toast.add({
					title: `${value.name} added successfully`,
					type: "success",
					positionerProps: { side: "right", align: "start" },
					timeout: 10_000,
					actionProps: {
						children: "View product details",
						onClick: () => {
							toast.close();
							void navigate({ to: "/products/$productId", params: { productId: product } });
						},
					},
				});
			} catch (error) {
				toast.add({ title: error instanceof Error ? error.message : String(error), type: "error", timeout: 10_000 });
			}
		},
	});

	const dosageForms = useQuery(api.dosageForms.listDosageForms, {});

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="name">
				{(field) => (
					<Field className="grid grid-cols-none gap-x-4 border-t border-solid border-gray-200 p-4 md:grid-cols-6 md:grid-rows-none md:items-center lg:p-8">
						<Label className="mb-2 text-lg text-emerald-600 md:my-0">Name</Label>

						<div className="col-span-5 mt-0 space-y-4">
							<Input
								type="text"
								className="input-text"
								placeholder="Product name"
								autoFocus={true}
								name={field.name}
								value={field.state.value}
								onValueChange={field.handleChange}
								onBlur={field.handleBlur}
							/>
						</div>
					</Field>
				)}
			</form.Field>

			<Fieldset className="grid-cols-0 grid border-t border-solid border-gray-200 p-4 md:grid-cols-6 md:items-start lg:p-8">
				<Legend className="my-2 text-lg font-btn text-emerald-600 md:my-0">Optional Info</Legend>

				<div className="col-span-5 mt-0 space-y-4 md:grid md:grid-cols-2 md:gap-5 lg:-mt-4">
					<form.Field name="brandName">
						{(field) => (
							<Field className="md:col-span-1">
								<Label>Brand Name</Label>
								<Input
									type="text"
									value={field.state.value}
									onValueChange={field.handleChange}
									onBlur={field.handleBlur}
									name={field.name}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="genericName">
						{(field) => (
							<Field className="md:col-span-1">
								<Label>Generic Name</Label>
								<Input
									type="text"
									value={field.state.value as string}
									onValueChange={field.handleChange}
									onBlur={field.handleBlur}
									name={field.name}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="description">
						{(field) => (
							<Field className="md:col-span-2">
								<Label>Description</Label>
								<TextArea
									className="input-text-area"
									rows={4}
									value={field.state.value as string}
									onChange={(event) => field.handleChange(event.target.value)}
									onBlur={field.handleBlur}
									name={field.name}
								/>
							</Field>
						)}
					</form.Field>
				</div>
			</Fieldset>

			<form.Field name="manufacturer">
				{(field) => (
					<Field className="grid grid-cols-none gap-x-4 border-t border-solid border-gray-200 p-4 md:grid-cols-6 md:grid-rows-none md:items-center lg:p-8">
						<Label className="mb-2 text-lg text-emerald-600 md:my-0">Manufacturer</Label>

						<div className="col-span-5 mt-0 space-y-4 lg:-mt-4">
							<Input
								type="text"
								className="input-text"
								placeholder="Manufacturer"
								name={field.name}
								value={field.state.value as string}
								onValueChange={field.handleChange}
								onBlur={field.handleBlur}
							/>
						</div>
					</Field>
				)}
			</form.Field>

			<form.Field name="dosageFormId">
				{({ name, state, handleChange, handleBlur }) => (
					<Fieldset
						render={
							<RadioGroup
								name={name}
								value={state.value}
								onValueChange={handleChange}
								onBlur={handleBlur}
								className="grid-cols-0 grid border-t border-solid border-gray-200 p-4 md:grid-cols-6 lg:p-8"
							/>
						}
					>
						<header>
							<Legend className="mb-2 text-lg font-btn text-emerald-600 md:my-0">Dosage forms</Legend>
						</header>

						<Field className="grid gap-4 sm:grid-cols-2 md:col-span-5 md:grid-cols-3 lg:grid-cols-3">
							{dosageForms === undefined
								? null
								: dosageForms
										?.sort((a, b) => (a.name > b.name ? 1 : 0))
										.map((df) => (
											<Radio
												key={df._id.toString()}
												value={df._id as string}
												className="card group relative z-10 flex flex-col"
											>
												<div className="flex items-center">
													<Label className="mb-1 flex items-center gap-2 text-base group-hover:text-green-700 md:text-lg">
														{df.name}
													</Label>
													<Link
														to="/inventory"
														hash={encodeURIComponent(df._id)}
														className="-translate-x-4 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
													>
														<OpenLinkIcon className="pointer-events-none size-4" />
													</Link>
												</div>
												<p className="text-sm/6 font-light text-gray-500">{df.description}</p>
												<div className="absolute inset-0 -z-10 cursor-pointer overflow-hidden rounded-[0.625rem] border border-solid border-emerald-300 bg-emerald-100 opacity-0 group-hover:opacity-100" />
												<RadioIndicator className="absolute inset-0 rounded-[inherit] shadow-inner ring-2 ring-emerald-700 ring-inset" />
											</Radio>
										))}
						</Field>
					</Fieldset>
				)}
			</form.Field>

			<div className="col-span-1 flex w-full items-center justify-center gap-x-4 border-t border-solid border-gray-200 p-8 md:col-span-6 lg:justify-end">
				<Button type="submit" className="btn-lg btn-primary grow gap-2 lg:max-w-60">
					Add product
				</Button>

				<Button type="reset" className="btn-lg btn-secondary grow gap-2 lg:max-w-60">
					Reset
				</Button>
			</div>
		</form>
	);
};
