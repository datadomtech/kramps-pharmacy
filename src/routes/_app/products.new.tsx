import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "~convex/_generated/api";
import { Toast } from "@cloudflare/kumo";
import { useForm } from "@tanstack/react-form";
import { Field, Fieldset, Input, Label, Legend, Radio, RadioGroup, RadioIndicator, TextArea } from "~input";
import { Button } from "@cloudflare/kumo/primitives/button";

import type { Doc, Id } from "~convex/_generated/dataModel";
import type { WithoutSystemFields } from "convex/server";
import { useMutation, useQuery } from "convex/react";

export const Route = createFileRoute("/_app/products/new")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="card my-2 max-w-4xl p-0! md:mx-auto md:my-6 lg:my-10">
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
	const toasts = Toast.useToastManager();

	const form = useForm({
		defaultValues: addProductDefaultValues,
		onSubmit: async ({ value }) => {
			console.dir({ formValues: value });
			await addProduct({ ...value });
			toasts.add({ title: "Product added successfully" });
			form.reset();
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
					<section className="grid grid-cols-none gap-x-4 border-t border-solid border-gray-200 p-4 md:grid-cols-6 md:grid-rows-none lg:p-8">
						<header>
							<Label className="mb-2 text-lg text-emerald-600 md:my-0">Name</Label>
						</header>
						<div className="col-span-5 -mt-4 space-y-4">
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
					</section>
				)}
			</form.Field>

			<Fieldset className="grid-cols-0 grid border-t border-solid border-gray-200 p-4 md:grid-cols-6 lg:p-8">
				<header>
					<Legend className="mb-2 text-lg font-btn text-emerald-600 md:my-0">Optional Info</Legend>
				</header>

				<div className="col-span-5 -mt-4 space-y-4 md:grid md:grid-cols-2 md:gap-5">
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
					<section className="grid grid-cols-none gap-x-4 border-t border-solid border-gray-200 p-4 md:grid-cols-6 md:grid-rows-none lg:p-8">
						<header>
							<Label className="mb-2 text-lg text-emerald-600 md:my-0">Manufacturer</Label>
						</header>
						<div className="col-span-5 -mt-4 space-y-4">
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
					</section>
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

						<div className="grid gap-4 sm:grid-cols-2 md:col-span-5 md:grid-cols-3 lg:grid-cols-3">
							{dosageForms === undefined
								? null
								: dosageForms
										?.sort((a, b) => (a.name > b.name ? 1 : 0))
										.map((df) => (
											<Radio key={df._id.toString()} value={df._id as string} className="card relative flex flex-col">
												<div className="flex items-center">
													<Label className="mb-1 flex items-center gap-2 text-base group-hover:text-green-700 md:text-lg">
														{df.name}
													</Label>
													<Link
														to="/inventory"
														hash={encodeURIComponent(df._id)}
														className="-translate-x-4 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
													>
														<svg className="pointer-events-none size-4" viewBox="0 0 20 20" fill="currentColor">
															<g>
																<path
																	d="M13.856 1.787H6.144a4.361 4.361 0 00-4.357 4.357v7.712a4.361 4.361 0 004.357 4.357h7.712a4.361 4.361 0 004.357-4.357V6.144a4.361 4.361 0 00-4.357-4.357z"
																	fillOpacity=".2"
																/>
																<path d="M13.441 5.764H8.963a.793.793 0 00-.796.795c0 .433.363.796.796.796h2.541L5.816 13.06a.794.794 0 000 1.124.81.81 0 00.57.242.813.813 0 00.571-.242l5.688-5.688v2.541c0 .45.364.796.796.796a.793.793 0 00.795-.796V6.559a.783.783 0 00-.795-.795z" />
															</g>
														</svg>
													</Link>
												</div>
												<p className="text-sm/6 font-light text-gray-500">{df.description}</p>
												<RadioIndicator className="absolute inset-0 rounded-[inherit] shadow-inner ring-1 ring-emerald-700 ring-inset" />
											</Radio>
										))}
						</div>
					</Fieldset>
				)}
			</form.Field>

			<div className="col-span-1 flex w-full items-center justify-center border-t border-solid border-gray-200 p-8 md:col-span-6">
				<Button type="submit" className="btn-lg btn-primary gap-2 lg:max-w-60">
					Add product
				</Button>
			</div>
		</form>
	);
};
