-- AlterTable: migrate Maker to address + printer capabilities
ALTER TABLE "Maker" ADD COLUMN "address" TEXT;
ALTER TABLE "Maker" ADD COLUMN "printerTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Maker" ADD COLUMN "fdmMaterials" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Maker" ADD COLUMN "fdmColors" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Maker" ADD COLUMN "resinMaterials" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Maker" ADD COLUMN "resinColors" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill from legacy columns
UPDATE "Maker"
SET
  "address" = COALESCE("address", name || ', Prague, Czechia'),
  "printerTypes" = ARRAY['fdm']::TEXT[],
  "fdmMaterials" = COALESCE("materials", ARRAY[]::TEXT[]),
  "fdmColors" = ARRAY['Black', 'White']::TEXT[]
WHERE "address" IS NULL;

ALTER TABLE "Maker" ALTER COLUMN "address" SET NOT NULL;
ALTER TABLE "Maker" ALTER COLUMN "printerTypes" DROP DEFAULT;

ALTER TABLE "Maker" DROP COLUMN "materials";
ALTER TABLE "Maker" DROP COLUMN "hasDelivery";
ALTER TABLE "Maker" DROP COLUMN "deliveryFeeCzk";

-- AlterTable: Order delivery via Zásilkovna
ALTER TABLE "Order" ADD COLUMN "deliveryMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN "deliveryPriceCzk" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "zasilkovnaPointId" TEXT;

UPDATE "Order"
SET
  "deliveryMethod" = CASE
    WHEN "deliveryFeeCzk" > 0 THEN 'zasilkovna'
    ELSE 'pickup'
  END,
  "deliveryPriceCzk" = COALESCE("deliveryFeeCzk", 0)
WHERE "deliveryMethod" IS NULL;

ALTER TABLE "Order" DROP COLUMN "deliveryFeeCzk";
