import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addStaff, listStaff } from "~/server/staff";

export type AddStaffInput = {
	fullName: string;
	email: string;
	phoneNumber: string;
	password: string;
};

const staffKeys = {
	all: ["staff"] as const,
};

export const useStaff = () =>
	useQuery({
		queryKey: staffKeys.all,
		queryFn: () => listStaff(),
	});

export const useAddStaff = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: AddStaffInput) => addStaff({ data: input }),
		onSuccess: () => void queryClient.invalidateQueries({ queryKey: staffKeys.all }),
	});
};
