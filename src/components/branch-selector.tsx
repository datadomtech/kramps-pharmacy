import { useEffect, useSyncExternalStore } from "react";
import { CheckIcon, StoreIcon } from "icons";
import { Popover } from "~primitives/popover";
import { useActiveBranch } from "~/hooks/use-active-branch";
import { useLocations } from "~/hooks/use-warehouse";

let branchMenuOpen = false;
const branchMenuListeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
	branchMenuListeners.add(listener);

	return () => {
		branchMenuListeners.delete(listener);
	};
};

const getSnapshot = (): boolean => branchMenuOpen;

const setMenuOpen = (next: boolean) => {
	branchMenuOpen = next;

	for (const listener of branchMenuListeners) {
		queueMicrotask(() => listener());
	}
};

const toggleMenu = () => setMenuOpen(!branchMenuOpen);

const branchBoxClasses =
	"inline-flex w-full cursor-pointer items-center justify-between rounded-btn border border-solid border-btn-border bg-white bg-clip-padding px-3 py-2 font-btn whitespace-nowrap inset-shadow-btn-border transition-all duration-200 hover:border-btn-active hover:bg-emerald-50 hover:text-btn-text hover:inset-shadow-btn-active";

const BranchMenu = ({ onPick }: { onPick: () => void }) => {
	const { data: locations, isPending } = useLocations();
	const { branch, setActiveBranch } = useActiveBranch();

	const activeLocations = (locations ?? []).filter((location) => !location.deletedAt);

	return (
		<div className="flex max-h-72 flex-col overflow-y-auto">
			<div className="mb-1 px-3 py-1.5">
				<p className="text-btn font-btn text-gray-500">Branch</p>
				<p className="text-xs text-gray-400">Positions in the warehouse this shift works from</p>
			</div>

			{isPending || locations === undefined ? (
				<p className="px-3 py-2 text-sm text-gray-500">Loading branches…</p>
			) : activeLocations.length === 0 ? (
				<p className="px-3 py-2 text-sm text-gray-500">No branches yet.</p>
			) : (
				<ul className="space-y-0.5">
					{activeLocations.map((location) => {
						const active = branch.id === location.id;

						return (
							<li key={location.id}>
								<button
									type="button"
									onClick={() => {
										setActiveBranch({ id: location.id, name: location.name });
										onPick();
									}}
									className={
										active
											? "flex w-full cursor-pointer items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
											: "flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
									}
								>
									<StoreIcon className="stroke-1.5 size-4 shrink-0 fill-white/60 stroke-emerald-600 text-emerald-800" />
									<span className="truncate">{location.name}</span>
									{active && <CheckIcon className="ml-auto size-4 shrink-0 text-emerald-600" />}
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

export const BranchSelector = ({ compact = false }: { compact?: boolean }) => {
	const open = useSyncExternalStore(subscribe, getSnapshot);
	const { branch } = useActiveBranch();

	useEffect(() => {
		if (compact) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("en-GB") === "k") {
				event.preventDefault();
				toggleMenu();
			}
		};

		window.addEventListener("keydown", onKeyDown);

		return () => window.removeEventListener("keydown", onKeyDown);
	}, [compact]);

	const content = (
		<>
			<div className="inline-flex flex-1 items-center justify-normal gap-2 font-medium">
				<StoreIcon className="size-4.5 fill-logo stroke-brand stroke-[1.5]" />
				<span>{branch.name}</span>
			</div>
			{!compact && (
				<kbd className="inline-flex w-fit items-center rounded-sm bg-emerald-100 px-1.5 py-0.5 font-mono text-sm font-semibold text-emerald-400">
					⌘K
				</kbd>
			)}
		</>
	);

	return (
		<Popover.Root open={open} onOpenChange={setMenuOpen}>
			<Popover.Trigger render={<div className={branchBoxClasses} />}>{content}</Popover.Trigger>
			<Popover.Portal>
				<Popover.Positioner side="bottom" align="start" sideOffset={6}>
					<Popover.Viewport>
						<Popover.Popup className="flex flex-col border border-solid border-gray-500/10 bg-white bg-clip-padding p-1.5 text-sm shadow-md shadow-brand/50">
							<BranchMenu onPick={() => setMenuOpen(false)} />
						</Popover.Popup>
					</Popover.Viewport>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
};
