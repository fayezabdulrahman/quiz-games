ALTER TYPE "public"."game_type" ADD VALUE IF NOT EXISTS 'word-wheel';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "word_dictionary_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" varchar(120) NOT NULL,
	"normalized_word" varchar(120) NOT NULL,
	"status" varchar(32) DEFAULT 'approved' NOT NULL,
	"source" varchar(32) DEFAULT 'host_accepted' NOT NULL,
	"accepted_by_user_id" uuid,
	"accepted_by_clerk_user_id" varchar(191),
	"first_seen_game_type" "game_type",
	"times_accepted" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "word_dictionary_entries_status_check" CHECK ("word_dictionary_entries"."status" in ('pending', 'approved', 'rejected')),
	CONSTRAINT "word_dictionary_entries_source_check" CHECK ("word_dictionary_entries"."source" in ('seed', 'host_accepted')),
	CONSTRAINT "word_dictionary_entries_times_accepted_check" CHECK ("word_dictionary_entries"."times_accepted" >= 0)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "word_dictionary_entries" ADD CONSTRAINT "word_dictionary_entries_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "word_dictionary_entries_normalized_word_idx" ON "word_dictionary_entries" USING btree ("normalized_word");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_dictionary_entries_status_idx" ON "word_dictionary_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_dictionary_entries_source_idx" ON "word_dictionary_entries" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_dictionary_entries_first_seen_game_type_idx" ON "word_dictionary_entries" USING btree ("first_seen_game_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "word_dictionary_entries_accepted_by_user_idx" ON "word_dictionary_entries" USING btree ("accepted_by_user_id");
