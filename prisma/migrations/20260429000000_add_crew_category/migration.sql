-- Add TeamCategory enum and category column on CrewMember to split team into Promoters and Our Team
DO $$ BEGIN
  CREATE TYPE "TeamCategory" AS ENUM ('PROMOTER', 'TEAM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CrewMember"
  ADD COLUMN IF NOT EXISTS "category" "TeamCategory" NOT NULL DEFAULT 'TEAM';
