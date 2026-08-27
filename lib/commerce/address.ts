import { z } from "zod";

/** The 28 states + 8 union territories of India — a real dropdown, never free text
 * (PROMPTS.md Phase 5 item 5). Shared by the checkout page's <Select> and the server-side Zod
 * schema below so the two can never drift. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

/** A real 10-digit Indian mobile number: starts 6-9, exactly 10 digits — not just "10 digits". */
const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const pincodeSchema = z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode");

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(3, "Enter an address").max(160),
  line2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2, "Enter a city").max(80),
  state: z.enum(INDIAN_STATES, { message: "Choose a state" }),
  pincode: pincodeSchema,
});

export type AddressInput = z.infer<typeof addressSchema>;

export { phoneSchema, pincodeSchema };
