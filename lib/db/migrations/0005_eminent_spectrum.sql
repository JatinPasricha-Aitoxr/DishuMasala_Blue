ALTER TABLE "orders" ADD COLUMN "refund_amount_paise" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "razorpay_refund_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("email");