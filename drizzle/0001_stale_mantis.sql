ALTER TABLE "authenticator" RENAME COLUMN "credentialID" TO "credentialId";--> statement-breakpoint
ALTER TABLE "authenticator" DROP CONSTRAINT "authenticator_credentialID_unique";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialId");