import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBlacklistStatus, getCustomerBalance, getProductBatches, searchCustomers, searchProducts } from "~/server/pos";
import { createSale } from "~/server/sales";
import type { CreateSaleInput } from "~/server/sales";

const posKeys = {
	all: ["pos"] as const,
	productSearch: (query: string) => [...posKeys.all, "product-search", query] as const,
	customerSearch: (query: string) => [...posKeys.all, "customer-search", query] as const,
	batches: (productId: string) => [...posKeys.all, "batches", productId] as const,
	blacklist: (customerId: string) => [...posKeys.all, "blacklist", customerId] as const,
	balance: (customerId: string) => [...posKeys.all, "balance", customerId] as const,
};

export const useProductSearch = (query: string) => {
	const term = query.trim();

	return useQuery({
		queryKey: posKeys.productSearch(term),
		queryFn: () => searchProducts({ data: { query: term } }),
		enabled: term.length > 0,
	});
};

export const useCustomerSearch = (query: string) => {
	const term = query.trim();

	return useQuery({
		queryKey: posKeys.customerSearch(term),
		queryFn: () => searchCustomers({ data: { query: term } }),
		enabled: term.length >= 2,
	});
};

export const useProductBatches = (productId: string | null) =>
	useQuery({
		queryKey: posKeys.batches(productId ?? ""),
		queryFn: () => getProductBatches({ data: { productId: productId! } }),
		enabled: productId !== null,
	});

export const fetchProductBatches = async (queryClient: ReturnType<typeof useQueryClient>, productId: string) =>
	queryClient.fetchQuery({
		queryKey: posKeys.batches(productId),
		queryFn: () => getProductBatches({ data: { productId } }),
	});

export const useBlacklistStatus = (customerId: string | null) =>
	useQuery({
		queryKey: posKeys.blacklist(customerId ?? ""),
		queryFn: () => getBlacklistStatus({ data: { customerId: customerId! } }),
		enabled: customerId !== null,
	});

export const useCustomerBalance = (customerId: string | null) =>
	useQuery({
		queryKey: posKeys.balance(customerId ?? ""),
		queryFn: () => getCustomerBalance({ data: { customerId: customerId! } }),
		enabled: customerId !== null,
	});

export const useCreateSale = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: Omit<CreateSaleInput, "idempotencyKey"> & { idempotencyKey: string }) => createSale({ data: input }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: posKeys.all });
			void queryClient.invalidateQueries({ queryKey: ["products"] });
			void queryClient.invalidateQueries({ queryKey: ["customers"] });
		},
	});
};
