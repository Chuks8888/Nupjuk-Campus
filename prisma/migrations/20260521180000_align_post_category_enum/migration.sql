DO $$
BEGIN
  CREATE TYPE "PostCategory" AS ENUM ('GENERAL', 'QUESTION', 'ASSIGNMENT', 'EXAM', 'PROJECT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

UPDATE "Post"
SET "category" = 'GENERAL'
WHERE "category" IS NULL;

ALTER TABLE "Post"
  ALTER COLUMN "category" TYPE "PostCategory"
  USING "category"::"PostCategory";

ALTER TABLE "Post"
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "category" SET DEFAULT 'GENERAL';
