-- Drop stats column from AboutContent (feature removed from public and admin UIs)
ALTER TABLE "AboutContent" DROP COLUMN IF EXISTS "stats";
