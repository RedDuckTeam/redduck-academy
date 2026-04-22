ALTER TABLE "user" DROP CONSTRAINT "user_wallet_address_unique";--> statement-breakpoint
ALTER TABLE "user_certificates" ADD COLUMN "wallet_address" text;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "wallet_address";