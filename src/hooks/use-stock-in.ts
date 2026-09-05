import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addStockIn, listInventoryBatches, listSupplierProducts } from "~/server/stock-in";
import type { StockInInput } from "~/server/stock-in";

export type { StockInInput };

const stockInKeys = {
	all: ["stock-in"] as const,
	supplierProducts: (supplierId: string) => [...stockInKeys.all, "supplier-products", supplierId] as const,
	batches: () => [...stockInKeys.all, "batches"] as const,
};

export const useInventoryBatches = () =>
	useQuery({
		queryKey: stockInKeys.batches(),
		queryFn: () => listInventoryBatches(),
	});

export const useSupplierProducts = (supplierId: string | null) =>
	useQuery({
		queryKey: stockInKeys.supplierProducts(supplierId ?? ""),
		queryFn: () => listSupplierProducts({ data: { supplierId: supplierId ?? "" } }),
		enabled: supplierId !== null && supplierId !== "",
	});

export const useAddStockIn = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: StockInInput) => addStockIn({ data: input }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["products"] });
			void queryClient.invalidateQueries({ queryKey: ["pos"] });
			void queryClient.invalidateQueries({ queryKey: stockInKeys.all });
		},
	});
};
