-- CreateEnum replacement for OrderStatus
CREATE TYPE "OrderStatus_new" AS ENUM (
  'pending',
  'awaiting_customer',
  'awaiting_payment',
  'paid',
  'printing',
  'shipped',
  'completed',
  'cancelled'
);

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'confirmed' THEN 'paid'::"OrderStatus_new"
    WHEN 'pending' THEN 'pending'::"OrderStatus_new"
    WHEN 'cancelled' THEN 'cancelled'::"OrderStatus_new"
    ELSE 'pending'::"OrderStatus_new"
  END
);

DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "platformFeeCzk" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "customerTotalCzk" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "fileUrl" TEXT;
ALTER TABLE "Order" ADD COLUMN "zasilkovnaPointLabel" TEXT;

UPDATE "Order"
SET
  "platformFeeCzk" = GREATEST(30, ROUND("printCostCzk" * 0.12)),
  "customerTotalCzk" = "printCostCzk" + GREATEST(30, ROUND("printCostCzk" * 0.12)) + "deliveryPriceCzk"
WHERE "customerTotalCzk" = 0;
