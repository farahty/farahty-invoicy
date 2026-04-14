ALTER TABLE "invoices" ADD COLUMN "discount_type" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "discount_value" numeric(12, 2) DEFAULT '0' NOT NULL;