import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listLocations, listWarehouseMovements, listWarehouseStock, recordStockMove, removeWarehouseBatch } from "~/server/warehouse";
import type { StockMoveInput } from "~/server/warehouse";

const warehouseKeys = {
	all: ["warehouse"] as const,
	stock: () => [...warehouseKeys.all, "stock"] as const,
	movements: () => [...warehouseKeys.all, "movements"] as const,
	locations: () => [...warehouseKeys.all, "locations"] as const,
};

export const useWarehouseStock = () =>
	useQuery({
		queryKey: warehouseKeys.stock(),
		queryFn: () => listWarehouseStock(),
	});

export const useWarehouseMovements = () =>
	useQuery({
		queryKey: warehouseKeys.movements(),
		queryFn: () => listWarehouseMovements(),
	});

export const useLocations = () =>
	useQuery({
		queryKey: warehouseKeys.locations(),
		queryFn: () => listLocations(),
	});

export const useRecordStockMove = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: StockMoveInput) => recordStockMove({ data: input }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
		},
	});
};

export const useRemoveWarehouseBatch = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (batchId: string) => removeWarehouseBatch({ data: { batchId } }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
			void queryClient.invalidateQueries({ queryKey: ["products"] });
			void queryClient.invalidateQueries({ queryKey: ["pos"] });
			void queryClient.invalidateQueries({ queryKey: ["stock-in"] });
		},
	});
};
