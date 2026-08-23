import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addSupplier, deleteSupplier, getSupplier, listAllSuppliers, restoreSupplier, updateSupplier } from "~/server/suppliers";
import type { SupplierInput } from "~/server/suppliers";

export type { SupplierInput };

const supplierKeys = {
	all: ["suppliers"] as const,
	list: () => [...supplierKeys.all, "list"],
	detail: (supplierId: string) => [...supplierKeys.all, supplierId],
};

const invalidateSuppliers = (queryClient: ReturnType<typeof useQueryClient>) => {
	void queryClient.invalidateQueries({ queryKey: supplierKeys.all });
};

export const useSuppliers = () =>
	useQuery({
		queryKey: supplierKeys.list(),
		queryFn: () => listAllSuppliers(),
	});

export const useSupplier = (supplierId: string) =>
	useQuery({
		queryKey: supplierKeys.detail(supplierId),
		queryFn: () => getSupplier({ data: { supplierId } }),
	});

export const useAddSupplier = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SupplierInput) => addSupplier({ data: input }),
		onSuccess: () => invalidateSuppliers(queryClient),
	});
};

export const useUpdateSupplier = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: SupplierInput & { supplierId: string }) => updateSupplier({ data: input }),
		onSuccess: () => invalidateSuppliers(queryClient),
	});
};

export const useDeleteSupplier = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteSupplier({ data: { id } }),
		onSuccess: () => invalidateSuppliers(queryClient),
	});
};

export const useRestoreSupplier = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => restoreSupplier({ data: { id } }),
		onSuccess: () => invalidateSuppliers(queryClient),
	});
};
