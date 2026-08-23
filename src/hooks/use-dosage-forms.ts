import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDosageForm, deleteDosageForm, listDosageForms, updateDosageForm } from "~/server/dosage-forms";

export type DosageFormInput = {
	name: string;
	description: string | null;
};

export type UpdateDosageFormInput = DosageFormInput & { dosageFormId: string };

const dosageFormKeys = {
	all: ["dosage-forms"] as const,
};

export const useDosageForms = () =>
	useQuery({
		queryKey: dosageFormKeys.all,
		queryFn: () => listDosageForms(),
	});

export const useAddDosageForm = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: DosageFormInput) => addDosageForm({ data: input }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: dosageFormKeys.all }),
	});
};

export const useUpdateDosageForm = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateDosageFormInput) => updateDosageForm({ data: input }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: dosageFormKeys.all }),
	});
};

export const useDeleteDosageForm = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteDosageForm({ data: { id } }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: dosageFormKeys.all }),
	});
};
