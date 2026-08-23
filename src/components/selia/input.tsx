

import * as React from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "~utils";
import { cva, type VariantProps } from "class-variance-authority";

export const inputVariants = cva(
	[
		"h-9.5 w-full rounded px-3.5 text-foreground shadow-input transition-[color,box-shadow] placeholder:text-dimmed",
		"ring ring-input-border hover:not-[[data-disabled]]:not-[:focus]:ring-input-accent-border focus:ring-2 focus:ring-primary focus:outline-0",
		'file:-ml-1.5 [&[type="file"]]:py-2 [&[type="file"]]:text-dimmed',
		"file:mr-2 file:h-5.5 file:rounded-sm file:bg-secondary file:px-1.5 file:text-sm file:text-secondary-foreground file:ring file:ring-input-accent-border",
		"data-disabled:cursor-not-allowed data-disabled:opacity-70",
	],
	{
		variants: {
			variant: {
				default: "bg-input",
				subtle: "bg-input/60",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export function Input({ className, variant, ...props }: React.ComponentProps<typeof BaseInput> & VariantProps<typeof inputVariants>) {
	return <BaseInput data-slot="input" className={cn(inputVariants({ variant, className }))} {...props} />;
}
