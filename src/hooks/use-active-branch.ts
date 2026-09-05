import { useCallback, useEffect, useState } from "react";

const BRANCH_KEY = "kp.active-branch";

export type ActiveBranch = {
	id: string;
	name: string;
};

export const DEFAULT_BRANCH: ActiveBranch = { id: "", name: "Head Office" };

function readStoredBranch(): ActiveBranch {
	try {
		const raw = localStorage.getItem(BRANCH_KEY);

		if (raw === null) {
			return DEFAULT_BRANCH;
		}

		const parsed = JSON.parse(raw) as Partial<ActiveBranch>;

		if (typeof parsed.id !== "string" || typeof parsed.name !== "string") {
			return DEFAULT_BRANCH;
		}

		return { id: parsed.id, name: parsed.name };
	} catch {
		return DEFAULT_BRANCH;
	}
}

export function useActiveBranch() {
	const [branch, setBranch] = useState<ActiveBranch>(() => readStoredBranch());

	useEffect(() => {
		try {
			localStorage.setItem(BRANCH_KEY, JSON.stringify(branch));
		} catch {
			// Storage unavailable; keep in-memory branch.
		}
	}, [branch]);

	const setActiveBranch = useCallback((next: ActiveBranch) => setBranch(next), []);

	return { branch, setActiveBranch };
}
