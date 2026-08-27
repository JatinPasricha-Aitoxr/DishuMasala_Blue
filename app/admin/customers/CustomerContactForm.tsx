"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateCustomerContactAction } from "./actions";

/**
 * The only edit surface for a customer record — name and phone, nothing else. No password field
 * exists anywhere in this component or its action (PROMPTS.md Phase 8: "never a password-view or
 * impersonation feature").
 */
export function CustomerContactForm({ id, name, phone }: { id: number; name: string; phone: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nameValue, setNameValue] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await updateCustomerContactAction({ id, name: nameValue, phone: phoneValue || null });
      if (!result.ok) setError(result.error);
      else {
        setNotice(result.message);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      {error && <p role="alert" className="mb-3 text-sm text-crit">{error}</p>}
      {notice && <p role="status" className="mb-3 text-sm text-ok">{notice}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="custName" className="mb-1 block text-sm font-medium text-ink">Name</label>
          <Input id="custName" value={nameValue} onChange={(e) => setNameValue(e.target.value)} />
        </div>
        <div>
          <label htmlFor="custPhone" className="mb-1 block text-sm font-medium text-ink">Phone</label>
          <Input id="custPhone" value={phoneValue} onChange={(e) => setPhoneValue(e.target.value)} placeholder="10-digit phone" />
        </div>
      </div>
      <Button type="button" variant="solid-ink" size="sm" className="mt-3" disabled={pending} onClick={handleSave}>
        Save
      </Button>
    </div>
  );
}
