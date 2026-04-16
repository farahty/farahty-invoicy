ALTER TABLE "invoices" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_share_token_unique" UNIQUE("share_token");