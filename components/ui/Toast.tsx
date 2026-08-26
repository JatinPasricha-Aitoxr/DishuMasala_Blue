"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToastTone = "neutral" | "ok" | "warn" | "crit";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_CLASSES: Record<ToastTone, string> = {
  neutral: "border-line",
  ok: "border-ok",
  warn: "border-warn",
  crit: "border-crit",
};

let nextId = 1;

/** App-wide toast host. Mount once near the root (app/layout.tsx) and call `useToast().show(...)`
 * from anywhere below it — e.g. "Added to cart", a coupon error, a form submit failure. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className={cn(
              "flex w-80 items-start gap-3 rounded-md border-l-4 bg-surface p-4 shadow-lift",
              "data-[state=open]:animate-[toast-in_200ms_cubic-bezier(.2,.6,.2,1)]",
              TONE_CLASSES[t.tone],
            )}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-semibold text-ink">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="mt-1 text-sm text-ink-2">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close aria-label="Dismiss" className="text-ink-3 hover:text-ink">
              ✕
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

/** Imperative toast trigger — `const { show } = useToast(); show({ title: "Added to cart", tone: "ok" })`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
