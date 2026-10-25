-- Offer lifecycle and immutable order-item pricing snapshots.
CREATE TYPE "OfferStatus" AS ENUM ('PAUSED', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PAUSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfferProduct" (
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "OfferProduct_pkey" PRIMARY KEY ("offerId", "productId")
);

CREATE TABLE "OfferCategory" (
    "offerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "OfferCategory_pkey" PRIMARY KEY ("offerId", "categoryId")
);

ALTER TABLE "OrderItem"
    ADD COLUMN "originalUnitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN "offerId" TEXT,
    ADD COLUMN "offerTitleAr" TEXT,
    ADD COLUMN "offerTitleEn" TEXT;

UPDATE "OrderItem" SET "originalUnitPrice" = "unitPrice";

ALTER TABLE "Order" ADD COLUMN "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX "Offer_status_startsAt_endsAt_idx" ON "Offer"("status", "startsAt", "endsAt");
CREATE INDEX "OfferProduct_productId_idx" ON "OfferProduct"("productId");
CREATE INDEX "OfferCategory_categoryId_idx" ON "OfferCategory"("categoryId");

ALTER TABLE "OfferProduct" ADD CONSTRAINT "OfferProduct_offerId_fkey"
    FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferProduct" ADD CONSTRAINT "OfferProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferCategory" ADD CONSTRAINT "OfferCategory_offerId_fkey"
    FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferCategory" ADD CONSTRAINT "OfferCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
