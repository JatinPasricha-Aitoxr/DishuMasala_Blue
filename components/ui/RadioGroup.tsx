"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export const RadioGroup = RadioGroupPrimitive.Root;

export type RadioGroupItemProps = ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

export function RadioGroupItem({ className, ...props }: RadioGroupItemProps) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "size-5 shrink-0 rounded-full border border-line bg-surface",
        "data-[state=checked]:border-brew-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center transition-colors duration-[180ms]",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-brew-2" />
    </RadioGroupPrimitive.Item>
  );
}
