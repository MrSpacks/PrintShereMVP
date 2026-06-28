-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('moderator', 'admin');

-- AlterEnum
ALTER TYPE "MakerStatus" ADD VALUE 'hidden';

-- Staff roles from legacy single role field
ALTER TABLE "User" ADD COLUMN "staffRole" "StaffRole";

UPDATE "User" SET "staffRole" = 'admin'::"StaffRole" WHERE role = 'admin';
UPDATE "User" SET "staffRole" = 'moderator'::"StaffRole" WHERE role = 'moderator';

-- AlterTable
ALTER TABLE "Maker" ADD COLUMN "ownerUserId" TEXT;

-- Backfill workshop owners from legacy user.makerId
UPDATE "Maker" m
SET "ownerUserId" = u.id
FROM "User" u
WHERE u."makerId" = m.id;

-- Orphan workshops (map-only seed makers) — attach to admin until seed reassigned
UPDATE "Maker" m
SET "ownerUserId" = (SELECT id FROM "User" WHERE role = 'admin' LIMIT 1)
WHERE m."ownerUserId" IS NULL;

UPDATE "Maker" m
SET "ownerUserId" = (SELECT id FROM "User" LIMIT 1)
WHERE m."ownerUserId" IS NULL;

DELETE FROM "Maker" WHERE "ownerUserId" IS NULL;

ALTER TABLE "Maker" ALTER COLUMN "ownerUserId" SET NOT NULL;

-- Everyone is a customer; maker capability comes from owned workshops
UPDATE "User" SET role = 'customer' WHERE role IN ('admin', 'moderator', 'maker');

-- CreateTable
CREATE TABLE "MakerPrinter" (
    "id" TEXT NOT NULL,
    "makerId" TEXT NOT NULL,
    "technology" TEXT NOT NULL,
    "modelKey" TEXT,
    "modelLabel" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MakerPrinter_pkey" PRIMARY KEY ("id")
);

-- Seed printers from legacy printerTypes arrays
INSERT INTO "MakerPrinter" ("id", "makerId", "technology", "modelKey", "modelLabel", "isCustom")
SELECT
  'printer-' || m.id || '-' || tech,
  m.id,
  tech,
  CASE WHEN tech = 'fdm' THEN 'generic-fdm' ELSE 'generic-resin' END,
  CASE WHEN tech = 'fdm' THEN 'FDM printer' ELSE 'Resin printer' END,
  false
FROM "Maker" m
CROSS JOIN LATERAL unnest(m."printerTypes") AS tech;

-- CreateIndex
CREATE INDEX "Maker_ownerUserId_idx" ON "Maker"("ownerUserId");

CREATE INDEX "MakerPrinter_makerId_idx" ON "MakerPrinter"("makerId");

CREATE INDEX "User_staffRole_idx" ON "User"("staffRole");

-- AddForeignKey
ALTER TABLE "Maker" ADD CONSTRAINT "Maker_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MakerPrinter" ADD CONSTRAINT "MakerPrinter_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "Maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
