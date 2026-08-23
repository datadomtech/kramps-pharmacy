import { Button } from "~primitives/button";
import { useState } from "react";
import { cn } from "~utils";
import { toastManager as toast } from "~selia/toast.tsx";
import { useForm } from "@tanstack/react-form";
import { Field, Input, Label, TextArea } from "~input";
import { format, formatDistanceToNow } from "date-fns";
import type { DosageForm } from "~/lib/types";
import { useAddDosageForm, useDeleteDosageForm, useDosageForms, useUpdateDosageForm } from "~/hooks/use-dosage-forms";
import type { DosageFormInput, UpdateDosageFormInput } from "~/hooks/use-dosage-forms";
import { EditIcon, PlusSquareIcon, TrashIcon } from "icons";
import { Image } from "@unpic/react";
import { useLocation } from "@tanstack/react-router";

export const DosageForms = () => {
	const { data: dosageForms } = useDosageForms();

	const [showForm, setShowForm] = useState(false);

	const { hash } = useLocation();

	return (
		<div>
			<div className="card p-0!">
				<div className="flex items-center justify-between border-b border-solid border-gray-200 p-5">
					<h2 className="text-[15px] font-btn text-emerald-900">Dosage Forms</h2>

					<Button type="button" disabled={showForm} onClick={() => setShowForm(true)} className="cursor-pointer">
						<PlusSquareIcon aria-hidden="false" className="fill-transprent size-5 stroke-brand stroke-2" />
					</Button>
				</div>
				{showForm && <DosageForm defaultValues={addDosageDefaultValues} dosageFormId={null} onCloseDosageForm={() => setShowForm(false)} />}
				<div className="">
					{dosageForms === undefined ? (
						<div>Loading...</div>
					) : dosageForms.length === 0 ? (
						<EmptyDosages />
					) : (
						<ul className="space-y-2.5 py-5">
							{dosageForms.map((df) => (
								<DosageFormItem key={df.id} isHighlighted={hash ? hash === decodeURIComponent(df.id) : null} dosageForm={df} />
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
};

const DosageFormItem = ({ dosageForm: df, isHighlighted }: { isHighlighted: boolean | null; dosageForm: DosageForm }) => {
	const [editing, setEditing] = useState(false);

	const deleteDosage = useDeleteDosageForm();

	const audit =
		df.addedBy && df.updatedBy
			? `Last updated ${format(new Date(df.createdAt), "PPPppp")} by ${df.updatedBy.name}`
			: df.addedBy
				? `Added by: ${df.addedBy.name}`
				: undefined;

	if (editing) {
		return (
			<DosageForm
				defaultValues={{
					description: df.description,
					dosageFormId: df.id,
					name: df.name,
				}}
				dosageFormId={df.id}
				onCloseDosageForm={() => setEditing(false)}
			/>
		);
	}

	return (
		<li
			id={encodeURIComponent(df.id)}
			className={cn("group flex flex-col overflow-hidden px-5", isHighlighted && "border-y-2 border-solid" + " border-emerald-400")}
		>
			<div className="flex items-center justify-between">
				<h5 className="cursor-default text-btn font-[325] text-gray-900 capitalize">
					{df.name}&nbsp;
					<span title={audit} className="text-xs font-light text-gray-500 lowercase">
						{formatDistanceToNow(new Date(df.createdAt), {
							addSuffix: true,
							includeSeconds: true,
						})}
					</span>
				</h5>
				<div className="hidden items-center gap-x-1.5 group-hover:flex">
					<Button type="button" onClick={() => setEditing(true)} className="cursor-pointer">
						<EditIcon className="size-4 fill-transparent stroke-brand stroke-2" />
					</Button>
					<Button
						type="button"
						onClick={async () =>
							await deleteDosage.mutateAsync(df.id, {
								onSuccess: () => toast.add({ title: "Dosage form deleted successfully", type: "success" }),
							})
						}
						className="cursor-pointer"
					>
						<TrashIcon className="size-4 fill-transparent stroke-red-500 stroke-2" />
					</Button>
				</div>
			</div>
			<p className="max-w-none truncate text-sm font-light text-gray-500 lg:max-w-70" title={df.description ?? undefined}>
				{df.description ?? null}
			</p>
		</li>
	);
};

const addDosageDefaultValues: DosageFormInput = {
	name: "",
	description: "",
};

type DosageFormProps = {
	onCloseDosageForm: VoidFunction;
	dosageFormId: string | null;
	defaultValues: UpdateDosageFormInput | DosageFormInput;
};

const DosageForm = ({ ...props }: DosageFormProps) => {
	const addDosage = useAddDosageForm();
	const updateDosage = useUpdateDosageForm();

	const form = useForm({
		defaultValues: props.defaultValues,
		onSubmit: async ({ value }) => {
			if (props.dosageFormId !== null) {
				try {
					await updateDosage.mutateAsync({
						...value,
						dosageFormId: props.dosageFormId,
					});
					props.onCloseDosageForm();
					toast.add({ title: "Dosage form updated successfully", type: "success" });
				} catch (err) {
					toast.add({ title: err instanceof Error ? err.name : `Failed to update ${value.name}`, type: "error" });
				}
			} else {
				try {
					await addDosage.mutateAsync(value);
					props.onCloseDosageForm();
					toast.add({ title: "Dosage form added successfully", type: "success" });
				} catch (err) {
					console.error("failed to add dosage form", err);
					toast.add({ title: "Failed to add dosage form", type: "error" });
				}
			}
		},
	});

	return (
		<form
			className={cn("space-y-4 border-y border-solid border-gray-200 px-5 py-4", !props.dosageFormId && "px-2" + " lg:px-4")}
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<form.Field name="name">
				{(field) => (
					<Field className="mb-4">
						<Label htmlFor={field.name}>Name</Label>
						<Input
							id={field.name}
							name={field.name}
							value={field.state.value}
							onValueChange={field.handleChange}
							onBlur={field.handleBlur}
							aria-label="Name"
							placeholder="Eg: injection, syrup, pill"
						/>
					</Field>
				)}
			</form.Field>

			<form.Field name="description">
				{(field) => (
					<Field className="mb-4">
						<Label htmlFor={field.name}>Description</Label>
						<TextArea
							id={field.name}
							rows={3}
							name={field.name}
							value={field.state.value ?? undefined}
							onChange={(event) => field.handleChange(event.currentTarget.value)}
							onBlur={field.handleBlur}
							className={cn("w-full!", !props.dosageFormId ? "field-sizing-fixed" : "field-sizing-content")}
							aria-label="Description"
						/>
					</Field>
				)}
			</form.Field>

			<div className="flex items-center justify-end gap-2">
				<Button onClick={() => props.onCloseDosageForm()} type="button" className="btn btn-secondary">
					Cancel
				</Button>

				<Button type="submit" className="btn btn-primary">
					{!props.dosageFormId ? "Add dosage form" : "Update dosage form"}
				</Button>
			</div>
		</form>
	);
};

const EmptyDosages = () => (
	<div className="flex flex-col items-center justify-center gap-4 pb-6">
		<div className="w-full min-w-0">
			<Image src="/no-dosage-forms.png" alt="Illustration for the empty state" layout="fullWidth" />
		</div>

		<div className="text-center text-sm font-normal text-emerald-900">
			<h4>No Dosage Forms</h4>
			<p className="max-w-80 text-xs font-light text-gray-500">No dosage forms added. Add one using the plus button above</p>
		</div>
	</div>
);
