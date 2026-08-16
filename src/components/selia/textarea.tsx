import { cn } from "~utils";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

export const textareaVariants = cva(
	["input-text-area w-full transition-[border-color,box-shadow]" + "disabled:cursor-not-allowed disabled:opacity-70"],
	{
		variants: {
			variant: {
				default: "bg-white",
				subtle: "bg-input/60",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export function Textarea({ className, variant, ...props }: ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
	return <textarea data-slot="textarea" className={cn(textareaVariants({ variant, className }))} {...props} />;
}
