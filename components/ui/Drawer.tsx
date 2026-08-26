"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

/**
 * A slide-in panel built on Radix Dialog — same focus-trap / Escape-to-close / focus-return
 * guarantees as Dialog, just docked to an edge instead of centered. Used for the mobile nav drawer
 * and (later) the cart drawer.
 */
export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

export type DrawerSide = "left" | "right";

const SIDE_CLASSES: Record<DrawerSide, string> = {
  left: "left-0 data-[state=open]:animate-[drawer-in-left_220ms_cubic-bezier(.2,.6,.2,1)] data-[state=closed]:animate-[drawer-out-left_180ms_cubic-bezier(.2,.6,.2,1)]",
  right:
    "right-0 data-[state=open]:animate-[drawer-in-right_220ms_cubic-bezier(.2,.6,.2,1)] data-[state=closed]:animate-[drawer-out-right_180ms_cubic-bezier(.2,.6,.2,1)]",
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function DrawerContent({
  className,
  side = "left",
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: DrawerSide }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 data-[state=open]:animate-[fade-in_180ms_ease]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-0 z-50 h-dvh w-[min(20rem,88vw)] overflow-y-auto bg-surface p-5 shadow-lift focus:outline-none",
          SIDE_CLASSES[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-2"
          aria-label="Close menu"
        >
          <CloseIcon />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
