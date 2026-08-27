"use client";

/**
 * Full address CRUD for app/account/addresses (PROMPTS.md Phase 6 item 3). Every mutation goes
 * through lib/actions/addresses.ts, which independently re-checks `requireUser()` and scopes every
 * write by the session's own userId (never trusting the address id alone) — this component only
 * ever passes an address id it already legitimately has (from the server-rendered initial list or
 * this component's own successful creates), it never authorizes anything itself.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { INDIAN_STATES, addressSchema } from "@/lib/commerce/address";
import { createAddressAction, updateAddressAction, deleteAddressAction, setDefaultAddressAction } from "@/lib/actions/addresses";

export interface AddressItem {
  id: number;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const formSchema = addressSchema.extend({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});
type FormValues = z.infer<typeof formSchema>;

function AddressForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: AddressItem;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initial
      ? {
          label: initial.label ?? "",
          name: initial.name,
          phone: initial.phone,
          line1: initial.line1,
          line2: initial.line2 ?? "",
          city: initial.city,
          state: initial.state as (typeof INDIAN_STATES)[number],
          pincode: initial.pincode,
          isDefault: initial.isDefault,
        }
      : { isDefault: false },
  });

  const stateValue = watch("state");

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    const payload = { ...values, label: values.label || null, isDefault: values.isDefault ?? false };
    const result = initial ? await updateAddressAction(initial.id, payload) : await createAddressAction(payload);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-ink">Label (optional)</label>
        <Input placeholder="Home, Work…" {...register("label")} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Name</label>
        <Input invalid={!!errors.name} {...register("name")} />
        {errors.name && <p className="mt-1 text-sm text-crit">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Phone</label>
        <Input invalid={!!errors.phone} {...register("phone")} />
        {errors.phone && <p className="mt-1 text-sm text-crit">{errors.phone.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-ink">Address line 1</label>
        <Input invalid={!!errors.line1} {...register("line1")} />
        {errors.line1 && <p className="mt-1 text-sm text-crit">{errors.line1.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-ink">Address line 2 (optional)</label>
        <Input {...register("line2")} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">City</label>
        <Input invalid={!!errors.city} {...register("city")} />
        {errors.city && <p className="mt-1 text-sm text-crit">{errors.city.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">State</label>
        <Select value={stateValue} onValueChange={(v) => setValue("state", v as (typeof INDIAN_STATES)[number], { shouldValidate: true })}>
          <SelectTrigger aria-invalid={!!errors.state}>
            <SelectValue placeholder="Choose a state" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.state && <p className="mt-1 text-sm text-crit">{errors.state.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Pincode</label>
        <Input invalid={!!errors.pincode} {...register("pincode")} />
        {errors.pincode && <p className="mt-1 text-sm text-crit">{errors.pincode.message}</p>}
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Checkbox id="isDefault" checked={watch("isDefault")} onCheckedChange={(v) => setValue("isDefault", v === true)} />
        <label htmlFor="isDefault" className="text-sm text-ink">
          Set as default address
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-crit sm:col-span-2">
          {error}
        </p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" size="sm" loading={submitting}>
          {initial ? "Save changes" : "Add address"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function AddressesManager({ initialAddresses }: { initialAddresses: AddressItem[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = () => {
    setAdding(false);
    setEditingId(null);
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    await deleteAddressAction(id);
    setBusyId(null);
    router.refresh();
  };

  const handleSetDefault = async (id: number) => {
    setBusyId(id);
    await setDefaultAddressAction(id);
    setBusyId(null);
    router.refresh();
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      {initialAddresses.length === 0 && !adding && (
        <div className="rounded-lg border border-dashed border-line p-8 text-center">
          <p className="text-sm text-ink-2">You haven&apos;t saved an address yet.</p>
        </div>
      )}

      {initialAddresses.map((address) =>
        editingId === address.id ? (
          <AddressForm key={address.id} initial={address} onDone={refresh} onCancel={() => setEditingId(null)} />
        ) : (
          <div key={address.id} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-sm">
              <p className="font-medium text-ink">
                {address.label ? `${address.label} — ` : ""}
                {address.name}
                {address.isDefault && <span className="ml-2 rounded-sm bg-surface-2 px-1.5 py-0.5 text-xs font-medium text-ink-2">Default</span>}
              </p>
              <p className="mt-1 text-ink-2">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.pincode}
              </p>
              <p className="mt-1 text-ink-2">{address.phone}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {!address.isDefault && (
                <Button variant="outline" size="sm" disabled={busyId === address.id} onClick={() => handleSetDefault(address.id)}>
                  Make default
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditingId(address.id)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" disabled={busyId === address.id} onClick={() => handleDelete(address.id)}>
                Delete
              </Button>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <AddressForm onDone={refresh} onCancel={() => setAdding(false)} />
      ) : (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => setAdding(true)}>
          Add address
        </Button>
      )}
    </div>
  );
}
