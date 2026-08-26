ALTER TABLE "reviews" ADD COLUMN "ip_hash" text;--> statement-breakpoint
CREATE INDEX "reviews_email_created_at_idx" ON "reviews" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "reviews_ip_hash_created_at_idx" ON "reviews" USING btree ("ip_hash","created_at");