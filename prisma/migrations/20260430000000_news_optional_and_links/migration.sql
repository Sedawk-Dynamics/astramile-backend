-- News: relax excerpt/body to optional; add articleImage and newsLink columns
ALTER TABLE "NewsArticle" ALTER COLUMN "excerpt" DROP NOT NULL;
ALTER TABLE "NewsArticle" ALTER COLUMN "body" DROP NOT NULL;
ALTER TABLE "NewsArticle" ADD COLUMN IF NOT EXISTS "articleImage" TEXT;
ALTER TABLE "NewsArticle" ADD COLUMN IF NOT EXISTS "newsLink" TEXT;
