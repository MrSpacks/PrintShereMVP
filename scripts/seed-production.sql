-- Quick seed script for production database
-- Copy-paste this into Neon SQL Editor

-- Create test users first
INSERT INTO "User" (id, name, email, "passwordHash", role, "makerId", "createdAt", "updatedAt")
VALUES
  ('user-elena', 'Elena Nováková', 'elena@workshop.cz', '$2a$10$YourHashHere', 'customer', 'maker-elena', NOW(), NOW()),
  ('user-petr', 'Petr Dvořák', 'petr@3dprint.cz', '$2a$10$YourHashHere', 'customer', 'maker-petr', NOW(), NOW()),
  ('user-jana', 'Jana Svobodová', 'jana@makers.cz', '$2a$10$YourHashHere', 'customer', 'maker-jana', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create makers
INSERT INTO "Maker" (
  id, "ownerUserId", name, address, latitude, longitude, rating,
  "pricePerGramFdmCzk", "pricePerGramResinCzk", "minOrderPriceCzk",
  "offersDelivery", "deliveryPriceCzk",
  "infillPercent", "wallThicknessMm", "supportCoefficient",
  "printerTypes", status, "createdAt", "updatedAt"
)
VALUES
  (
    'maker-elena', 'user-elena', 'Elena''s Workshop',
    'Pařížská 12, 110 00 Prague 1, Czechia',
    50.0875, 14.4213, 4.7,
    5.0, 12.0, 150,
    true, 89,
    20, 1.2, 1.15,
    ARRAY['fdm', 'resin']::text[], 'available',
    NOW(), NOW()
  ),
  (
    'maker-petr', 'user-petr', 'Petr''s 3D Print',
    'Wenceslas Square 25, 110 00 Prague 1, Czechia',
    50.0833, 14.4264, 4.9,
    4.5, 11.0, 100,
    true, 79,
    15, 1.0, 1.2,
    ARRAY['fdm']::text[], 'available',
    NOW(), NOW()
  ),
  (
    'maker-jana', 'user-jana', 'Jana''s Makerspace',
    'Karlova 8, 110 00 Prague 1, Czechia',
    50.0866, 14.4157, 4.8,
    5.5, 13.0, 200,
    false, 0,
    20, 1.2, 1.1,
    ARRAY['fdm', 'resin']::text[], 'available',
    NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Update user.makerId
UPDATE "User" SET "makerId" = 'maker-elena' WHERE id = 'user-elena';
UPDATE "User" SET "makerId" = 'maker-petr' WHERE id = 'user-petr';
UPDATE "User" SET "makerId" = 'maker-jana' WHERE id = 'user-jana';

-- Add printers
INSERT INTO "MakerPrinter" (id, "makerId", technology, "modelKey", "modelLabel", "isCustom", "createdAt")
VALUES
  ('printer-elena-1', 'maker-elena', 'fdm', 'prusa-mk4', 'Original Prusa MK4', false, NOW()),
  ('printer-elena-2', 'maker-elena', 'resin', 'anycubic-photon-m3', 'Anycubic Photon M3', false, NOW()),
  ('printer-petr-1', 'maker-petr', 'fdm', 'prusa-xl', 'Prusa XL', false, NOW()),
  ('printer-petr-2', 'maker-petr', 'fdm', 'creality-ender3-v3', 'Creality Ender-3 V3', false, NOW()),
  ('printer-jana-1', 'maker-jana', 'fdm', 'bambu-x1-carbon', 'Bambu Lab X1-Carbon', false, NOW()),
  ('printer-jana-2', 'maker-jana', 'resin', 'elegoo-saturn-3', 'Elegoo Saturn 3', false, NOW())
ON CONFLICT (id) DO NOTHING;

-- Add filaments
INSERT INTO "MakerFilament" (id, "makerId", "printerType", material, color, "createdAt")
VALUES
  ('fil-elena-1', 'maker-elena', 'fdm', 'pla', 'black', NOW()),
  ('fil-elena-2', 'maker-elena', 'fdm', 'pla', 'white', NOW()),
  ('fil-elena-3', 'maker-elena', 'fdm', 'petg', 'transparent', NOW()),
  ('fil-elena-4', 'maker-elena', 'resin', 'standard', 'gray', NOW()),
  ('fil-petr-1', 'maker-petr', 'fdm', 'pla', 'black', NOW()),
  ('fil-petr-2', 'maker-petr', 'fdm', 'pla', 'white', NOW()),
  ('fil-petr-3', 'maker-petr', 'fdm', 'abs', 'black', NOW()),
  ('fil-jana-1', 'maker-jana', 'fdm', 'pla', 'white', NOW()),
  ('fil-jana-2', 'maker-jana', 'fdm', 'petg', 'black', NOW()),
  ('fil-jana-3', 'maker-jana', 'resin', 'standard', 'gray', NOW()),
  ('fil-jana-4', 'maker-jana', 'resin', 'tough', 'black', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT id, name, address, latitude, longitude FROM "Maker";
