-- Per-technology pricing on workshops
ALTER TABLE "Maker" ADD COLUMN "pricePerGramFdmCzk" DOUBLE PRECISION;
ALTER TABLE "Maker" ADD COLUMN "pricePerGramResinCzk" DOUBLE PRECISION;

UPDATE "Maker"
SET
  "pricePerGramFdmCzk" = "pricePerGramCzk",
  "pricePerGramResinCzk" = "pricePerGramCzk" * 2.5;

ALTER TABLE "Maker" ALTER COLUMN "pricePerGramFdmCzk" SET NOT NULL;
ALTER TABLE "Maker" ALTER COLUMN "pricePerGramResinCzk" SET NOT NULL;
ALTER TABLE "Maker" DROP COLUMN "pricePerGramCzk";

ALTER TABLE "Order" ADD COLUMN "printerType" TEXT NOT NULL DEFAULT 'fdm';
