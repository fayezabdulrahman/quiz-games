UPDATE "products"
SET
  "name" = 'Lifetime Access',
  "billing_type" = 'one_time',
  "status" = 'active',
  "price_cents" = 1999,
  "currency" = 'EUR',
  "metadata" = "metadata" || '{"publicLabel":"Lifetime Access","includesFutureGames":true,"includesCustomQuestions":true}'::jsonb,
  "updated_at" = now()
WHERE "key" = 'game_night_pack_v1';
--> statement-breakpoint
UPDATE "products"
SET
  "status" = 'archived',
  "metadata" = "metadata" || '{"archivedReason":"Replaced by Lifetime Access","successorProductKey":"game_night_pack_v1"}'::jsonb,
  "updated_at" = now()
WHERE "key" = 'club_pass_monthly';
--> statement-breakpoint
INSERT INTO "product_feature_grants" ("product_key", "feature_key")
VALUES
  ('game_night_pack_v1', 'new_games'),
  ('game_night_pack_v1', 'official_question_packs'),
  ('game_night_pack_v1', 'seasonal_question_packs'),
  ('game_night_pack_v1', 'topical_question_packs'),
  ('game_night_pack_v1', 'early_access')
ON CONFLICT ("product_key", "feature_key") DO NOTHING;
