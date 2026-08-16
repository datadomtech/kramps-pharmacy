import { Tooltip as KTooltip } from "~primitives/tooltip";

import { cn } from "~utils";
import { format, formatDistanceToNow } from "date-fns";

export function TooltipProvider({ delay = 0, ...props }: KTooltip.Provider.Props) {
	return <KTooltip.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

export const Tooltip = ({ ...props }: KTooltip.Root.Props) => {
	return <KTooltip.Root data-slot="tooltip" {...props} />;
};

export const TooltipTrigger = ({ ...props }: KTooltip.Trigger.Props) => {
	return <KTooltip.Trigger data-slot="tooltip-trigger" {...props} />;
};

export const TooltipContent = ({
	className,
	side = "top",
	sideOffset = 4,
	align = "center",
	alignOffset = 0,
	children,
	...props
}: KTooltip.Popup.Props & Pick<KTooltip.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) => {
	return (
		<KTooltip.Portal>
			<KTooltip.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="isolate z-50">
				<KTooltip.Popup
					data-slot="tooltip-content"
					className={cn(
						"data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 z-50 inline-flex w-fit max-w-xs bubble! items-center gap-1.5 rounded-xl bg-white px-3 py-3.5 text-xs text-[#191034] has-data-[slot=kbd]:pr-1.5 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg",
						className,
					)}
					{...props}
				>
					{children}
					<KTooltip.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-xl bg-white fill-white data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
				</KTooltip.Popup>
			</KTooltip.Positioner>
		</KTooltip.Portal>
	);
};

export const DateTooltip = ({ date }: { date: Date }) => (
	<Tooltip>
		<TooltipTrigger
			render={
				<time dateTime={date.toISOString()}>
					{formatDistanceToNow(date, {
						addSuffix: true,
						includeSeconds: true,
					})}
				</time>
			}
		/>
		<TooltipContent className="bubble-t! tail max-w-sm text-sm font-btn">{format(date, "PPpp")}</TooltipContent>
	</Tooltip>
);
