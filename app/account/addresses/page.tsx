import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getAddressesForUser } from "@/lib/db/queries/addresses";
import { AddressesManager } from "@/components/account/AddressesManager";

export const metadata = { title: "Your addresses", robots: { index: false, follow: false } };

export default async function AccountAddressesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const addresses = await getAddressesForUser(user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Addresses</h1>
      <AddressesManager
        initialAddresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          name: a.name,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}
