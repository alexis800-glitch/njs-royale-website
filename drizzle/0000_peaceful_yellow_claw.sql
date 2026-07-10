CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"cm_booking_id" text,
	"guest_first_name" text NOT NULL,
	"guest_last_name" text NOT NULL,
	"guest_email" text NOT NULL,
	"guest_phone" text NOT NULL,
	"guest_address_line1" text,
	"guest_city" text,
	"guest_state" text,
	"guest_country" text DEFAULT 'Nigeria' NOT NULL,
	"guest_zip" text,
	"checkin" date NOT NULL,
	"checkout" date NOT NULL,
	"room_id" integer NOT NULL,
	"rate_plan_id" integer NOT NULL,
	"adults" integer NOT NULL,
	"children" integer DEFAULT 0 NOT NULL,
	"amount_before_tax" numeric(12, 2) NOT NULL,
	"tax" numeric(12, 2) NOT NULL,
	"amount_after_tax" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"special_requests" text,
	"status" text NOT NULL,
	"push_status" text DEFAULT 'pending' NOT NULL,
	"push_attempts" integer DEFAULT 0 NOT NULL,
	"last_push_error" text,
	"aiosell_response" jsonb,
	"nightly_prices" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "daily_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"date" date NOT NULL,
	"available" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_inventory_room_date_unique" UNIQUE("room_id","date")
);
--> statement-breakpoint
CREATE TABLE "daily_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"rate_plan_id" integer NOT NULL,
	"date" date NOT NULL,
	"rate" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_rates_rate_plan_date_unique" UNIQUE("rate_plan_id","date")
);
--> statement-breakpoint
CREATE TABLE "rate_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"rateplan_code" text NOT NULL,
	"room_id" integer NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_plans_rateplan_code_unique" UNIQUE("rateplan_code")
);
--> statement-breakpoint
CREATE TABLE "rateplan_restrictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rate_plan_id" integer NOT NULL,
	"date" date NOT NULL,
	"stop_sell" boolean DEFAULT false NOT NULL,
	"minimum_stay" integer,
	"maximum_stay" integer,
	"close_on_arrival" boolean DEFAULT false NOT NULL,
	"close_on_departure" boolean DEFAULT false NOT NULL,
	"minimum_stay_arrival" integer,
	"maximum_stay_arrival" integer,
	"exact_stay_arrival" integer,
	"minimum_advance_reservation" integer,
	"maximum_advance_reservation" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rateplan_restrictions_rate_plan_date_unique" UNIQUE("rate_plan_id","date")
);
--> statement-breakpoint
CREATE TABLE "room_restrictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"date" date NOT NULL,
	"stop_sell" boolean DEFAULT false NOT NULL,
	"minimum_stay" integer,
	"maximum_stay" integer,
	"close_on_arrival" boolean DEFAULT false NOT NULL,
	"close_on_departure" boolean DEFAULT false NOT NULL,
	"minimum_stay_arrival" integer,
	"maximum_stay_arrival" integer,
	"exact_stay_arrival" integer,
	"minimum_advance_reservation" integer,
	"maximum_advance_reservation" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "room_restrictions_room_date_unique" UNIQUE("room_id","date")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"headers" jsonb NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rate_plan_id_rate_plans_id_fk" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_inventory" ADD CONSTRAINT "daily_inventory_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_rates" ADD CONSTRAINT "daily_rates_rate_plan_id_rate_plans_id_fk" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rateplan_restrictions" ADD CONSTRAINT "rateplan_restrictions_rate_plan_id_rate_plans_id_fk" FOREIGN KEY ("rate_plan_id") REFERENCES "public"."rate_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_restrictions" ADD CONSTRAINT "room_restrictions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;