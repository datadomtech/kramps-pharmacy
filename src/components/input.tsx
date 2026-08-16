import { Textarea as KTextarea } from "~selia/textarea";
import type { ComponentProps } from "react";
import { Input as KInput } from "~primitives/input";
import type { InputProps } from "~primitives/input";
import { Radio as BaseRadio } from "~primitives/radio";
import { RadioGroup as BaseRadioGroup } from "~primitives/radio-group";
import { Field as BaseField } from "~primitives/field";
import { Fieldset as BaseFieldset } from "~primitives/fieldset";
import { cn } from "~utils";

export const Input = ({ className, ...props }: InputProps) => <KInput className={cn("input-text mt-1! w-full" + " p-2.5!", className)} {...props} />;

export const Label = ({ className, ...props }: BaseField.Label.Props) => (
	<BaseField.Label className={cn("mb-1 block font-btn text-emerald-950/50", className)} {...props} />
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
