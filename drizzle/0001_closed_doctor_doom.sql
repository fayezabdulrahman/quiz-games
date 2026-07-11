CREATE TABLE "ai_question_usage" (
	"user_id" uuid NOT NULL,
	"usage_date" date NOT NULL,
	"generation_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_question_usage_user_id_usage_date_pk" PRIMARY KEY("user_id","usage_date")
);
--> statement-breakpoint
ALTER TABLE "ai_question_usage" ADD CONSTRAINT "ai_question_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;