ALTER TABLE "orders" ADD COLUMN "idempotency_key" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_uniq" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_razorpay_payment_id_uniq" ON "orders" USING btree ("razorpay_payment_id");