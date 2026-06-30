CREATE TYPE "public"."content_selection_mode" AS ENUM('official', 'mixed', 'user_only');--> statement-breakpoint
CREATE TYPE "public"."entitlement_source" AS ENUM('manual', 'stripe_subscription', 'stripe_checkout', 'promo');--> statement-breakpoint
CREATE TYPE "public"."entitlement_status" AS ENUM('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."feature_key" AS ENUM('host_games', 'room_size_cap', 'built_in_question_pools', 'custom_questions', 'custom_question_import', 'reusable_custom_packs', 'new_games', 'official_question_packs', 'seasonal_question_packs', 'topical_question_packs', 'early_access');--> statement-breakpoint
CREATE TYPE "public"."game_type" AS ENUM('one-percent', 'majority-rules', 'bluff-battle', 'million-ladder', 'survey-showdown', 'quickfire-30', 'say-what-you-see');--> statement-breakpoint
CREATE TYPE "public"."product_billing_type" AS ENUM('free', 'one_time', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."question_set_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."question_source" AS ENUM('official', 'user');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "product_feature_grants" (
	"product_key" varchar(120) NOT NULL,
	"feature_key" "feature_key" NOT NULL,
	"limit" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_feature_grants_product_key_feature_key_pk" PRIMARY KEY("product_key","feature_key")
);
--> statement-breakpoint
CREATE TABLE "product_game_grants" (
	"product_key" varchar(120) NOT NULL,
	"game_type" "game_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_game_grants_product_key_game_type_pk" PRIMARY KEY("product_key","game_type")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"key" varchar(120) PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"billing_type" "product_billing_type" NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"requires_user" boolean DEFAULT true NOT NULL,
	"requires_entitlement" boolean DEFAULT true NOT NULL,
	"price_cents" integer,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"stripe_product_id" varchar(255),
	"stripe_price_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_checkout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"stripe_checkout_session_id" varchar(255) NOT NULL,
	"stripe_customer_id" varchar(255),
	"mode" varchar(40),
	"payment_status" varchar(80),
	"status" varchar(80),
	"raw_event" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"email" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entitlement_id" uuid,
	"clerk_user_id" varchar(191) NOT NULL,
	"stripe_subscription_id" varchar(255) NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"stripe_price_id" varchar(255),
	"stripe_product_id" varchar(255),
	"status" varchar(80) NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"raw_event" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"product_key" varchar(120) NOT NULL,
	"status" "entitlement_status" DEFAULT 'trialing' NOT NULL,
	"source" "entitlement_source" DEFAULT 'manual' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "question_source" DEFAULT 'user' NOT NULL,
	"owner_user_id" uuid,
	"owner_clerk_user_id" varchar(191),
	"game_type" "game_type" NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"status" "question_set_status" DEFAULT 'draft' NOT NULL,
	"is_default_for_game" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_sets_id_game_type_unique" UNIQUE("id","game_type"),
	CONSTRAINT "question_sets_source_game_slug_unique" UNIQUE("source","game_type","slug"),
	CONSTRAINT "question_sets_user_source_owner_check" CHECK ("question_sets"."source" = 'official' OR "question_sets"."owner_user_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_set_id" uuid NOT NULL,
	"source" "question_source" DEFAULT 'user' NOT NULL,
	"owner_user_id" uuid,
	"owner_clerk_user_id" varchar(191),
	"game_type" "game_type" NOT NULL,
	"external_id" varchar(160),
	"status" "question_status" DEFAULT 'draft' NOT NULL,
	"question_kind" varchar(80) NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"prompt" text,
	"answer" text,
	"explanation" text,
	"difficulty" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_question_set_external_id_unique" UNIQUE("question_set_id","external_id"),
	CONSTRAINT "questions_user_source_owner_check" CHECK ("questions"."source" = 'official' OR "questions"."owner_user_id" IS NOT NULL),
	CONSTRAINT "questions_schema_version_check" CHECK ("questions"."schema_version" >= 1),
	CONSTRAINT "questions_difficulty_check" CHECK ("questions"."difficulty" IS NULL OR "questions"."difficulty" BETWEEN 1 AND 100)
);
--> statement-breakpoint
CREATE TABLE "user_game_content_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"game_type" "game_type" NOT NULL,
	"selection_mode" "content_selection_mode" DEFAULT 'official' NOT NULL,
	"preferred_question_set_id" uuid,
	"preferred_question_set_game_type" "game_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_game_content_preferences_user_game_unique" UNIQUE("user_id","game_type"),
	CONSTRAINT "user_game_content_preferences_set_game_check" CHECK ("user_game_content_preferences"."preferred_question_set_id" IS NULL OR "user_game_content_preferences"."preferred_question_set_game_type" = "user_game_content_preferences"."game_type")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(191) NOT NULL,
	"email" varchar(320),
	"display_name" varchar(160),
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_feature_grants" ADD CONSTRAINT "product_feature_grants_product_key_products_key_fk" FOREIGN KEY ("product_key") REFERENCES "public"."products"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_game_grants" ADD CONSTRAINT "product_game_grants_product_key_products_key_fk" FOREIGN KEY ("product_key") REFERENCES "public"."products"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_checkout_sessions" ADD CONSTRAINT "stripe_checkout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_subscriptions" ADD CONSTRAINT "stripe_subscriptions_entitlement_id_user_entitlements_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."user_entitlements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_product_key_products_key_fk" FOREIGN KEY ("product_key") REFERENCES "public"."products"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_sets" ADD CONSTRAINT "question_sets_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_set_id_question_sets_id_fk" FOREIGN KEY ("question_set_id") REFERENCES "public"."question_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_question_set_game_type_fk" FOREIGN KEY ("question_set_id","game_type") REFERENCES "public"."question_sets"("id","game_type") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_content_preferences" ADD CONSTRAINT "user_game_content_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_content_preferences" ADD CONSTRAINT "user_game_content_preferences_set_game_type_fk" FOREIGN KEY ("preferred_question_set_id","preferred_question_set_game_type") REFERENCES "public"."question_sets"("id","game_type") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_feature_grants_feature_key_idx" ON "product_feature_grants" USING btree ("feature_key");--> statement-breakpoint
CREATE INDEX "product_game_grants_game_type_idx" ON "product_game_grants" USING btree ("game_type");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_billing_type_idx" ON "products" USING btree ("billing_type");--> statement-breakpoint
CREATE UNIQUE INDEX "products_stripe_product_id_idx" ON "products" USING btree ("stripe_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_stripe_price_id_idx" ON "products" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stripe_checkout_sessions_stripe_checkout_session_id_idx" ON "stripe_checkout_sessions" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "stripe_checkout_sessions_user_id_idx" ON "stripe_checkout_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stripe_checkout_sessions_clerk_user_id_idx" ON "stripe_checkout_sessions" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stripe_customers_user_id_idx" ON "stripe_customers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stripe_customers_clerk_user_id_idx" ON "stripe_customers" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stripe_customers_stripe_customer_id_idx" ON "stripe_customers" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stripe_subscriptions_stripe_subscription_id_idx" ON "stripe_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "stripe_subscriptions_user_id_idx" ON "stripe_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stripe_subscriptions_clerk_user_id_idx" ON "stripe_subscriptions" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "stripe_subscriptions_status_idx" ON "stripe_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_entitlements_user_product_idx" ON "user_entitlements" USING btree ("user_id","product_key");--> statement-breakpoint
CREATE INDEX "user_entitlements_product_key_idx" ON "user_entitlements" USING btree ("product_key");--> statement-breakpoint
CREATE INDEX "user_entitlements_clerk_user_id_idx" ON "user_entitlements" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_entitlements_status_idx" ON "user_entitlements" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_entitlements_stripe_subscription_id_idx" ON "user_entitlements" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "question_sets_source_game_idx" ON "question_sets" USING btree ("source","game_type");--> statement-breakpoint
CREATE INDEX "question_sets_owner_game_idx" ON "question_sets" USING btree ("owner_user_id","game_type");--> statement-breakpoint
CREATE INDEX "question_sets_owner_clerk_user_id_idx" ON "question_sets" USING btree ("owner_clerk_user_id");--> statement-breakpoint
CREATE INDEX "question_sets_status_idx" ON "question_sets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_question_set_idx" ON "questions" USING btree ("question_set_id");--> statement-breakpoint
CREATE INDEX "questions_source_game_idx" ON "questions" USING btree ("source","game_type");--> statement-breakpoint
CREATE INDEX "questions_owner_game_idx" ON "questions" USING btree ("owner_user_id","game_type");--> statement-breakpoint
CREATE INDEX "questions_owner_clerk_user_id_idx" ON "questions" USING btree ("owner_clerk_user_id");--> statement-breakpoint
CREATE INDEX "questions_status_idx" ON "questions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "questions_question_kind_idx" ON "questions" USING btree ("question_kind");--> statement-breakpoint
CREATE INDEX "user_game_content_preferences_clerk_user_id_idx" ON "user_game_content_preferences" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "user_game_content_preferences_selection_mode_idx" ON "user_game_content_preferences" USING btree ("selection_mode");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");