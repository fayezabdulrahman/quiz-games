INSERT INTO "product_game_grants" ("product_key", "game_type")
SELECT "product_key", 'quizcraft'::"game_type"
FROM "product_feature_grants"
WHERE "feature_key" = 'custom_questions'
ON CONFLICT ("product_key", "game_type") DO NOTHING;
