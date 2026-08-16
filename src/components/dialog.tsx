import { cn } from "~utils";
import { Dialog as KDialog } from "~primitives/dialog";
import { XIcon } from "./icons/x";

export const Dialog = KDialog.Root;

export const DialogTrigger = KDialog.Trigger;

export const DialogPortal = KDialog.Portal;

export const DialogPopup = ({ className, ...props }: KDialog.Popup.Props) => (
	<KDialog.Portal>
		<KDialog.Backdrop className="fixed inset-0 z-10 min-h-dvh bg-emerald-950/50 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
		<div className="fixed inset-0 z-20 overflow-y-auto">
			<div className="flex min-h-dvh items-center justify-center">
				<div className="w-full max-w-2xl p-4 sm:p-6 lg:py-8">
					<div className="relative block rounded-3xl bg-white/20 shadow-2xl ring-1 shadow-emerald-700/20 ring-white/10 transition ring-inset sm:p-2.5">
						<KDialog.Popup
							className={cn(
								"rounded-2xl bg-white p-5 shadow-lg ring-1 shadow-emerald-700/20 ring-black/5 sm:p-10",
								"transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
								className,
							)}
							{...props}
						/>
					</div>
				</div>
			</div>
		</div>
	</KDialog.Portal>
);

export const DialogTitle = ({ className, ...props }: KDialog.Title.Props) => (
	<KDialog.Title className={cn("mb-5 text-dialog-header font-btn text-emerald-900/80! font-stretch-98%", className)} {...props} />
);

export const DialogDescription = ({ ...props }: KDialog.Description.Props) => (
	<KDialog.Description {...props} className={cn("font-text font-[14.5px] text-emerald-600!", props.className)} />
);

export const DialogX = ({ ...props }: KDialog.Close.Props) => (
	<KDialog.Close
		{...props}
		aria-label="Close"
		className={cn(
			"flex-none cursor-pointer rounded-lg p-2 opacity-50 transition hover:bg-emerald-100 hover:opacity-100 focus:outline-none",
			props.className,
		)}
	>
		<XIcon className="size-5" />
	</KDialog.Close>
);

export const DialogClose = KDialog.Close;
