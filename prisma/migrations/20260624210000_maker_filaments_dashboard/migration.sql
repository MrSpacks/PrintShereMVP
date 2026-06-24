-- MakerFilament table + min order price; drop legacy array columns

ALTER TABLE "Maker" ADD COLUMN "minOrderPriceCzk" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "MakerFilament" (
    "id" TEXT NOT NULL,
    "makerId" TEXT NOT NULL,
    "printerType" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "MakerFilament_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MakerFilament_makerId_printerType_material_color_key"
ON "MakerFilament"("makerId", "printerType", "material", "color");

CREATE INDEX "MakerFilament_makerId_idx" ON "MakerFilament"("makerId");

ALTER TABLE "MakerFilament"
ADD CONSTRAINT "MakerFilament_makerId_fkey"
FOREIGN KEY ("makerId") REFERENCES "Maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate FDM: pair materials[i] with colors[i] or first color
INSERT INTO "MakerFilament" ("id", "makerId", "printerType", "material", "color")
SELECT
  'mf-' || md5(m."id" || '-fdm-' || mat || '-' || col),
  m."id",
  'fdm',
  mat,
  col
FROM "Maker" m
CROSS JOIN LATERAL unnest(m."fdmMaterials") WITH ORDINALITY AS fm(mat, idx)
CROSS JOIN LATERAL (
  SELECT COALESCE(m."fdmColors"[fm.idx], m."fdmColors"[1], 'Black') AS col
) colors
WHERE array_length(m."fdmMaterials", 1) > 0;

INSERT INTO "MakerFilament" ("id", "makerId", "printerType", "material", "color")
SELECT
  'mf-' || md5(m."id" || '-resin-' || mat || '-' || col),
  m."id",
  'resin',
  mat,
  col
FROM "Maker" m
CROSS JOIN LATERAL unnest(m."resinMaterials") WITH ORDINALITY AS rm(mat, idx)
CROSS JOIN LATERAL (
  SELECT COALESCE(m."resinColors"[rm.idx], m."resinColors"[1], 'Gray') AS col
) colors
WHERE array_length(m."resinMaterials", 1) > 0;

ALTER TABLE "Maker" DROP COLUMN "fdmMaterials";
ALTER TABLE "Maker" DROP COLUMN "fdmColors";
ALTER TABLE "Maker" DROP COLUMN "resinMaterials";
ALTER TABLE "Maker" DROP COLUMN "resinColors";
