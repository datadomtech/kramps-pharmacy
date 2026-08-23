import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { toastManager as toast } from "~selia/toast";
import { Field, Fieldset, Input, Label, Legend, Radio, RadioGroup, RadioIndicator, TextArea } from "~input";
import { Button } from "~primitives/button";

import type { Product } from "~/lib/types";
import { useAddProduct } from "~/hooks/use-products";
import { useDosageForms } from "~/hooks/use-dosage-forms";
import { useSuppliers } from "~/hooks/use-suppliers";
import { OpenLinkIcon } from "~icons/open-link.tsx";

export type ProductFormSchema = Pick<
	Product,
	| "name"
	| "dosageFormId"
	| "brandName"
	| "genericName"
	| "barCodeNumber"
	| "description"
	| "manufacturer"
	| "imageUrl"
	| "expiryDate"
	| "batchNumber"
	| "supplierId"
	| "quantity"
	| "price"
>;

export const productFormDefaultValues: ProductFormSchema = {
	name: "",
	brandName: "",
	barCodeNumber: "",
	description: "",
	genericName: "",
	dosageFormId: "",
	imageUrl: "",
	manufacturer: "",
	expiryDate: "",
	batchNumber: "",
	supplierId: "",
	quantity: 0,
	price: 0,
};

type ProductFormProps = {
	defaultValues: ProductFormSchema;
	submitLabel: string;
	onSubmit: (value: ProductFormSchema) => Promise<void>;
	showReset?: boolean;
};

export const ProductForm = ({ defaultValues, submitLabel, onSubmit, showReset = true }: ProductFormProps) => {
	const { data: dosageForms } = useDosageForms();
	const { data: suppliers } = useSuppliers();

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

					<form.Field name="expiryDate">
						{(field) => (
							<Field className="md:col-span-1">
								<Label>Expiry Date</Label>
								<Input
									type="date"
									className="input-text"
									value={field.state.value ?? ""}
									onValueChange={field.handleChange}
									onBlur={field.handleBlur}
									name={field.name}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="batchNumber">
						{(field) => (
							<Field className="md:col-span-1">
								<Label>Batch Number</Label>
								<Input
									type="text"
									value={field.state.value ?? ""}
									onValueChange={field.handleChange}
									onBlur={field.handleBlur}
									name={field.name}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="quantity">
						{(field) => (
							<Field className="md:col-span-1">
								<Label htmlFor={field.name}>Quantity</Label>
								<input
									id={field.name}
									name={field.name}
									type="number"
									min={0}
									step={1}
									className="input-text"
									value={field.state.value}
									onChange={(event) =>
										field.handleChange(Number.isNaN(event.target.valueAsNumber) ? 0 : Math.max(0, event.target.valueAsNumber))
									}
									onBlur={field.handleBlur}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="price">
						{(field) => (
							<Field className="md:col-span-1">
								<Label htmlFor={field.name}>Price (GHS)</Label>
								<input
									id={field.name}
									name={field.name}
									type="number"
									min={0}
									step="0.01"
									className="input-text"
									value={field.state.value ?? 0}
									onChange={(event) =>
										field.handleChange(Number.isNaN(event.target.valueAsNumber) ? 0 : Math.max(0, event.target.valueAsNumber))
									}
									onBlur={field.handleBlur}
								/>
							</Field>
						)}
					</form.Field>

					<form.Field name="supplierId">
						{(field) => (
							<Field className="md:col-span-1">
								<Label htmlFor={field.name}>Supplier</Label>
								<select
									id={field.name}
									name={field.name}
									className="input-select w-full rounded-lg"
									value={field.state.value ?? ""}
									onChange={(event) => field.handleChange(event.target.value)}
									onBlur={field.handleBlur}
								>
									<option value="">No supplier</option>
									{(suppliers ?? [])
										.filter((supplier) => !supplier.deletedAt)
										.map((supplier) => (
											<option key={supplier.id} value={supplier.id}>
												{supplier.name}
											</option>
										))}
								</select>
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
										.sort((a, b) => (a.name > b.name ? 1 : 0))
										.map((df) => (
											<Radio key={df.id} value={df.id} className="card group relative z-10 flex flex-col">
												<div className="flex items-center">
													<Label className="mb-1 flex items-center gap-2 text-base group-hover:text-green-700 md:text-lg">
														{df.name}
													</Label>
													<Link
														to="/inventory"
														hash={encodeURIComponent(df.id)}
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

export const AddProductForm = () => {
	const addProductMutation = useAddProduct();

	const navigate = useNavigate();

	return (
		<ProductForm
			defaultValues={productFormDefaultValues}
			submitLabel="Add product"
			onSubmit={async (value) => {
				const product = await addProductMutation.mutateAsync(value);

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
			}}
		/>
	);
};
