-- AlterTable
ALTER TABLE "Category" ADD COLUMN "image" TEXT NOT NULL DEFAULT 'https://picsum.photos/seed/category/800/1000';

-- Existing categories receive a fallback image; new categories must provide their own image.
ALTER TABLE "Category" ALTER COLUMN "image" DROP DEFAULT;
