"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export interface SeparatorProps
  extends ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Renders the 2–4px Lemon Shift divider rule (CLAUDE.md §5.4's "section-divider rules")
   * instead of the plain hairline. Use sparingly — only one gradient surface per viewport. */
  gradient?: boolean;
}

export function Separator({ className, orientation = "horizontal", gradient = false, ...props }: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        orientation === "horizontal" ? "w-full" : "h-full w-px",
        gradient
          ? orientation === "horizontal"
            ? "h-1"
            : "w-1"
          : orientation === "horizontal"
            ? "h-px bg-line"
            : "w-px bg-line",
        className,
      )}
      style={gradient ? { backgroundImage: "var(--gradient-lemon-shift)" } : undefined}
      {...props}
    />
  );
}
