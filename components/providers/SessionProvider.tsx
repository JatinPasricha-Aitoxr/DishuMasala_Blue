"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/** Thin client wrapper so `app/layout.tsx` (a Server Component) can still provide session context
 * to `useSession()` callers (HeaderClient's account state, components/auth/AccountSync.tsx). */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
