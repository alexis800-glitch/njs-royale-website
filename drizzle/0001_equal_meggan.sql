CREATE TABLE "sync_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" text,
	"operation" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"http_status" integer,
	"success" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "sync_status" text DEFAULT 'not_pushed' NOT NULL;