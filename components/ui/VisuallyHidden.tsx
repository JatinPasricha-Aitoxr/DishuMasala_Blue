"use client";

import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";

/** Screen-reader-only content — e.g. a Dialog's required accessible title when the visual design
 * doesn't call for a visible heading (Radix requires every Dialog.Content to have a DialogTitle). */
export const VisuallyHidden = VisuallyHiddenPrimitive.Root;
