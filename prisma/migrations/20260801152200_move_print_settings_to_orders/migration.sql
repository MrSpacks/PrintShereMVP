-- AlterTable: Add print settings to Order
ALTER TABLE "Order" ADD COLUMN "infillPercent" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "Order" ADD COLUMN "wallThicknessMm" DOUBLE PRECISION NOT NULL DEFAULT 1.2;
ALTER TABLE "Order" ADD COLUMN "supportCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 1.15;

-- AlterTable: Remove print settings from Maker
ALTER TABLE "Maker" DROP COLUMN "infillPercent";
ALTER TABLE "Maker" DROP COLUMN "wallThicknessMm";
ALTER TABLE "Maker" DROP COLUMN "supportCoefficient";
