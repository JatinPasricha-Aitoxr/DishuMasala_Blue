"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-line last:border-b-0", className)}
      {...props}
    />
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="size-4 shrink-0 transition-transform duration-[180ms] group-data-[state=open]:rotate-180"
      aria-hidden="true"
    >
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-4 text-left font-sans font-semibold text-ink",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronIcon />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden text-ink-2 data-[state=open]:animate-[accordion-down_200ms_ease] data-[state=closed]:animate-[accordion-up_200ms_ease]",
        className,
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </AccordionPrimitive.Content>
  );
}
