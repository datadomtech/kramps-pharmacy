import { cn } from "~utils";
import { Field } from "~primitives/field";

export function Label({ className, ...props }: Field.Label.Props) {
	return (
		<Field.Label
			data-slot="label"
			className={cn(
				"flex items-center gap-3 text-foreground",
				"cursor-pointer has-[>[disabled],>[data-disabled]]:cursor-not-allowed",
				className,
			)}
			{...props}
		/>
	);
}
