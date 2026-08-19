import { Toast as BaseToast } from "~primitives/toast";
import type { ToastObject } from "~primitives/toast";
import { buttonVariants } from "~selia/button";
import { cn } from "~utils";
import type { ReactNode } from "react";

export const toastManager = BaseToast.createToastManager();

export const Toast = ({ children }: { children: ReactNode }) => (
	<BaseToast.Provider toastManager={toastManager}>
		{children}
		<StackedToasts />
	</BaseToast.Provider>
);

function StackedToasts() {
	const { toasts } = BaseToast.useToastManager();

	return (
		<BaseToast.Portal>
			<BaseToast.Viewport className="fixed top-2 right-0 left-0 mx-2 flex md:top-4 md:mx-auto">
				{toasts.map((toast) => (
					<BaseToast.Root
						key={toast.id}
						toast={toast}
						swipeDirection="up"
						className={cn(
							"absolute top-0 right-0 left-0 z-[calc(1000-var(--toast-index))] mx-auto w-sm max-w-full origin-top",
							"h-(--height) rounded border border-toast-border bg-toast p-4 shadow-lg select-none",
							"after:absolute after:bottom-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full",
							"[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
							"[--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)+(var(--toast-index)*var(--gap))+var(--toast-swipe-movement-y))]",
							"[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))]",
							"[transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]",
							"data-[starting-style]:[transform:translateY(-150%)]",
							"data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
							"data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
							"data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
							"data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
							"[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(-150%)]",
							"data-[ending-style]:opacity-0",
							"data-[limited]:opacity-0",
							"data-[expanded]:h-[var(--toast-height)]",
							"data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]",
							"data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
							"data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
							"data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]",
							"data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))]",
						)}
					>
						<ToastContent toast={toast} />
					</BaseToast.Root>
				))}
			</BaseToast.Viewport>
		</BaseToast.Portal>
	);
}

function ToastContent({ toast }: { toast: ToastObject<object> }) {
	return (
		<BaseToast.Content
			data-slot="toast-content"
			className={cn(
				"overflow-hidden transition-opacity data-behind:pointer-events-none data-behind:opacity-0",
				"data-expanded:pointer-events-auto data-expanded:opacity-100",
				"flex items-center gap-x-2.5 gap-y-0.5",
			)}
		>
			{toast.type && <ToastIcon type={toast.type}>{icons[toast.type]}</ToastIcon>}
			<div className="flex w-full flex-col items-start justify-between md:flex-row">
				<div>
					<BaseToast.Title data-slot="toast-title" className="font-medium text-foreground" />
					<BaseToast.Description data-slot="toast-description" className="col-start-1 text-muted" />
				</div>
				<BaseToast.Action
					{...toast.actionProps}
					data-slot="toast-action"
					data-disabled={toast.actionProps?.disabled ? true : undefined}
					className={cn(
						"mt-2 shrink-0 self-center text-sm md:mt-0 md:ml-auto",
						buttonVariants({ variant: "tertiary", size: "xs" }),
						toast.actionProps?.className,
					)}
				/>
			</div>
		</BaseToast.Content>
	);
}

function ToastIcon({ type, children }: { type?: string; children: ReactNode }) {
	return (
		<div
			data-slot="toast-icon"
			className={cn(
				"self-start *:[svg]:w-4.5",
				type === "success" && "*:[svg]:fill-success/20 *:[svg]:stroke-success",
				type === "info" && "*:[svg]:fill-info/20 *:[svg]:stroke-info",
				type === "warning" && "*:[svg]:fill-warning/20 *:[svg]:stroke-warning",
				type === "error" && "*:[svg]:fill-danger/20 *:[svg]:stroke-danger",
			)}
		>
			{children}
		</div>
	);
}

const icons: Record<string, ReactNode> = {
	loading: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="size-4.5 animate-spin"
		>
			<path d="M21 12a9 9 0 1 1-6.219-8.56" />
		</svg>
	),
	success: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="m9 12 2 2 4-4" />
		</svg>
	),
	info: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="M12 16v-4" />
			<path d="M12 8h.01" />
		</svg>
	),
	warning: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</svg>
	),
	error: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<path d="m15 9-6 6" />
			<path d="m9 9 6 6" />
		</svg>
	),
};
