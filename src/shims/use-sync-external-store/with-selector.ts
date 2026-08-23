import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
	subscribe: () => () => void,
	getSnapshot: () => Snapshot,
	getServerSnapshot: null | (() => Snapshot),
	selector: (snapshot: Snapshot) => Selection,
	isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
	const instRef = useRef<{ hasValue: boolean; value: Selection | null } | null>(null);
	let inst: { hasValue: boolean; value: Selection | null };
	if (instRef.current === null) {
		inst = { hasValue: false, value: null };
		instRef.current = inst;
	} else {
		inst = instRef.current;
	}

	const [getSelection, getServerSelection] = useMemo(() => {
		let hasMemo = false;
		let memoizedSnapshot: Snapshot;
		let memoizedSelection!: Selection;

		const memoizedSelector = (nextSnapshot: Snapshot): Selection => {
			if (!hasMemo) {
				hasMemo = true;
				memoizedSnapshot = nextSnapshot;
				const nextSelection = selector(nextSnapshot);
				if (isEqual !== undefined && inst.hasValue) {
					const currentSelection = inst.value as Selection;
					if (isEqual(currentSelection, nextSelection)) {
						memoizedSelection = currentSelection;
						return currentSelection;
					}
				}
				memoizedSelection = nextSelection;
				return nextSelection;
			}
			const currentSelection = memoizedSelection;
			if (Object.is(memoizedSnapshot, nextSnapshot)) {
				return currentSelection;
			}
			const nextSelection = selector(nextSnapshot);
			if (isEqual !== undefined && isEqual(currentSelection, nextSelection)) {
				memoizedSnapshot = nextSnapshot;
				return currentSelection;
			}
			memoizedSnapshot = nextSnapshot;
			memoizedSelection = nextSelection;
			return nextSelection;
		};

		const maybeGetServerSnapshot = getServerSnapshot === null ? null : getServerSnapshot;

		return [
			() => memoizedSelector(getSnapshot()),
			maybeGetServerSnapshot === null ? undefined : () => memoizedSelector(maybeGetServerSnapshot()),
		] as const;
	}, [getSnapshot, getServerSnapshot, selector, isEqual]);

	const value = useSyncExternalStore(subscribe, getSelection, getServerSelection);

	useEffect(() => {
		inst.hasValue = true;
		inst.value = value;
	}, [value]);

	return value;
}
