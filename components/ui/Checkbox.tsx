"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type CheckboxProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-3.5" aria-hidden="true">
      <path
        d="M3 8.5 6.2 11.5 13 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "size-5 shrink-0 rounded-[4px] border border-line bg-surface text-surface",
        "data-[state=checked]:border-ink data-[state=checked]:bg-ink",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center transition-colors duration-[180ms]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
