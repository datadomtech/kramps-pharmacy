import type { LabelProps as KLabelProps } from "@cloudflare/kumo";
import { cn, Label as KLabel, Textarea as KTextarea } from "@cloudflare/kumo";
import type { ComponentProps } from "react";
import { Input as KInput } from "@cloudflare/kumo/primitives/input";
import type { InputProps } from "@cloudflare/kumo/primitives/input";
import { Radio as BaseRadio } from "@cloudflare/kumo/primitives/radio";
import { RadioGroup as BaseRadioGroup } from "@cloudflare/kumo/primitives/radio-group";
import { Field as BaseField } from "@cloudflare/kumo/primitives/field";
import { Fieldset as BaseFieldset } from "@cloudflare/kumo/primitives/fieldset";

export const Input = ({ className, ...props }: InputProps) => <KInput className={cn("input-text mt-1! w-full" + " p-2.5!", className)} {...props} />;

export const Label = ({ className, ...props }: KLabelProps) => (
	<KLabel className={cn("mb-1 block font-btn text-emerald-950/50", className)} {...props} />
);

export const TextArea = ({ className, ...props }: ComponentProps<"textarea">) => (
	<KTextarea className={cn("input-text-area mt-1! w-full rounded-lg p-2.5!", className)} {...props} />
);
export const RadioGroup = BaseRadioGroup;

export const Radio = BaseRadio.Root;

export const RadioIndicator = BaseRadio.Indicator;

export const Field = BaseField.Root;

export const FieldItem = BaseField.Item;

export const Legend = BaseFieldset.Legend;

export const Fieldset = BaseFieldset.Root;
