import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCustomer, deleteCustomer, listActiveCustomers, listBlacklistedCustomers, updateCustomer } from "~/server/customers";
import type { CustomerType } from "~/lib/types";

export type CustomerInput = {
	name: string;
	phone: string | null;
	address: string | null;
	email: string | null;
	contactName: string | null;
	contactPhone: string | null;
	contactEmail: string | null;
	type: CustomerType;
};

const customerKeys = {
	active: ["customers", "active"] as const,
	blacklisted: ["customers", "blacklisted"] as const,
};

const invalidateCustomers = (queryClient: ReturnType<typeof useQueryClient>) => {
	void queryClient.invalidateQueries({ queryKey: ["customers"] });
};

export const useActiveCustomers = () =>
	useQuery({
		queryKey: customerKeys.active,
		queryFn: () => listActiveCustomers(),
	});

export const useBlacklistedCustomers = () =>
	useQuery({
		queryKey: customerKeys.blacklisted,
		queryFn: () => listBlacklistedCustomers(),
	});

export const useAddCustomer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CustomerInput) => addCustomer({ data: input }),
		onSuccess: () => invalidateCustomers(queryClient),
	});
};

export const useUpdateCustomer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CustomerInput & { customerId: string }) => updateCustomer({ data: input }),
		onSuccess: () => invalidateCustomers(queryClient),
	});
};

export const useDeleteCustomer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteCustomer({ data: { id } }),
		onSuccess: () => invalidateCustomers(queryClient),
	});
};
