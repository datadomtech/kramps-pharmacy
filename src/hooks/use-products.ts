import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addProduct, deleteProduct, getProduct, listProducts, restoreProduct, updateProduct } from "~/server/products";
import type { ProductInput } from "~/server/products";

export type { ProductInput };

const productKeys = {
	all: ["products"] as const,
};

export const useProducts = () =>
	useQuery({
		queryKey: productKeys.all,
		queryFn: () => listProducts(),
	});

export const useProduct = (productId: string) =>
	useQuery({
		queryKey: [...productKeys.all, productId],
		queryFn: () => getProduct({ data: { productId } }),
	});

export const useAddProduct = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: ProductInput) => addProduct({ data: input }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: productKeys.all }),
	});
};

export const useUpdateProduct = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: ProductInput & { productId: string }) => updateProduct({ data: input }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: productKeys.all }),
	});
};

export const useDeleteProduct = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteProduct({ data: { id } }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: productKeys.all }),
	});
};

export const useRestoreProduct = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => restoreProduct({ data: { id } }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: productKeys.all }),
	});
};
