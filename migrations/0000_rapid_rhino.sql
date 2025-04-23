CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_day_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"time" text,
	"location" text,
	"type" text,
	"booking_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"prompt" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_prompts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" integer,
	"data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"provider" text,
	"price" text,
	"details" json,
	"confirmed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"rating" text,
	"review_count" integer,
	"price_estimate" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"flight_number" text NOT NULL,
	"airline" text NOT NULL,
	"departure_airport" text NOT NULL,
	"departure_code" text NOT NULL,
	"departure_time" timestamp NOT NULL,
	"arrival_airport" text NOT NULL,
	"arrival_code" text NOT NULL,
	"arrival_time" timestamp NOT NULL,
	"trip_type" text NOT NULL,
	"return_flight_number" text,
	"return_airline" text,
	"return_departure_time" timestamp,
	"return_arrival_time" timestamp,
	"booking_reference" text NOT NULL,
	"price" numeric NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"cabin_class" text DEFAULT 'ECONOMY' NOT NULL,
	"passenger_name" text,
	"passenger_email" text,
	"passenger_phone" text,
	"flight_details" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flight_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"origin_location_code" text NOT NULL,
	"destination_location_code" text NOT NULL,
	"departure_date" text NOT NULL,
	"return_date" text,
	"adults" integer DEFAULT 1 NOT NULL,
	"children" integer DEFAULT 0,
	"infants" integer DEFAULT 0,
	"travel_class" text DEFAULT 'ECONOMY',
	"trip_type" text DEFAULT 'ONE_WAY',
	"max_price" integer,
	"currency_code" text DEFAULT 'USD',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"images" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"is_approved" boolean DEFAULT true,
	"helpful_count" integer DEFAULT 0,
	"report_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "trip_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"day_number" integer NOT NULL,
	"date" date,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"destination" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"budget" text,
	"preferences" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme" text DEFAULT 'light',
	"language" text DEFAULT 'en',
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT true,
	"currency" text DEFAULT 'USD',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"profile_image" text,
	"bio" text,
	"phone" text,
	"google_id" text,
	"role" text DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_type" text NOT NULL,
	"item_id" text NOT NULL,
	"item_name" text NOT NULL,
	"item_image" text,
	"additional_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_trip_day_id_trip_days_id_fk" FOREIGN KEY ("trip_day_id") REFERENCES "public"."trip_days"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_bookings" ADD CONSTRAINT "flight_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flight_searches" ADD CONSTRAINT "flight_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;