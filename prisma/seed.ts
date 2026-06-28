import { PrismaClient, MakerStatus, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_PASSWORD = "test123456";

interface SeedFilament {
  printerType: "fdm" | "resin";
  material: string;
  color: string;
}

interface SeedMaker {
  id: string;
  ownerUserId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  pricePerGramCzk: number;
  minOrderPriceCzk: number;
  printerTypes: string[];
  status: MakerStatus;
  filaments: SeedFilament[];
}

const SEED_MAKERS: SeedMaker[] = [
  {
    id: "maker-elena",
    ownerUserId: "user-elena",
    name: "Elena's Workshop",
    address: "Pařížská 12, 110 00 Prague 1, Czechia",
    latitude: 50.0875,
    longitude: 14.4213,
    rating: 4.7,
    pricePerGramCzk: 5.0,
    minOrderPriceCzk: 150,
    printerTypes: ["fdm"],
    status: MakerStatus.available,
    filaments: [
      { printerType: "fdm", material: "PLA", color: "Black" },
      { printerType: "fdm", material: "PLA", color: "White" },
      { printerType: "fdm", material: "PETG", color: "Gray" },
    ],
  },
  {
    id: "maker-vinohrady",
    ownerUserId: "user-vinohrady",
    name: "Vinohrady Prints",
    address: "Korunní 42, 120 00 Prague 2, Czechia",
    latitude: 50.0755,
    longitude: 14.4378,
    rating: 4.9,
    pricePerGramCzk: 5.8,
    minOrderPriceCzk: 200,
    printerTypes: ["fdm", "resin"],
    status: MakerStatus.available,
    filaments: [
      { printerType: "fdm", material: "PLA", color: "Black" },
      { printerType: "fdm", material: "PETG", color: "Blue" },
      { printerType: "fdm", material: "TPU", color: "White" },
      { printerType: "resin", material: "Standard Resin", color: "Gray" },
      { printerType: "resin", material: "Tough Resin", color: "Black" },
    ],
  },
  {
    id: "maker-smichov",
    ownerUserId: "user-smichov",
    name: "Smíchov FabLab",
    address: "Plzeňská 8, 150 00 Prague 5, Czechia",
    latitude: 50.0736,
    longitude: 14.4185,
    rating: 3.5,
    pricePerGramCzk: 4.8,
    minOrderPriceCzk: 0,
    printerTypes: ["fdm"],
    status: MakerStatus.available,
    filaments: [
      { printerType: "fdm", material: "PLA", color: "Black" },
      { printerType: "fdm", material: "ABS", color: "Red" },
    ],
  },
  {
    id: "maker-karlin",
    ownerUserId: "user-admin",
    name: "Karlín 3D Studio",
    address: "Pernerova 32, 186 00 Prague 8, Czechia",
    latitude: 50.0923,
    longitude: 14.4515,
    rating: 4.1,
    pricePerGramCzk: 5.2,
    minOrderPriceCzk: 180,
    printerTypes: ["fdm", "resin"],
    status: MakerStatus.busy,
    filaments: [
      { printerType: "fdm", material: "PLA", color: "White" },
      { printerType: "fdm", material: "ABS", color: "Orange" },
      { printerType: "resin", material: "Standard Resin", color: "Clear" },
    ],
  },
  {
    id: "maker-dejvice",
    ownerUserId: "user-admin",
    name: "Dejvice Makerspace",
    address: "Thákurova 9, 160 00 Prague 6, Czechia",
    latitude: 50.0998,
    longitude: 14.3956,
    rating: 3.8,
    pricePerGramCzk: 4.5,
    minOrderPriceCzk: 100,
    printerTypes: ["fdm"],
    status: MakerStatus.hidden,
    filaments: [{ printerType: "fdm", material: "PLA", color: "Black" }],
  },
  {
    id: "maker-zizkov",
    ownerUserId: "user-admin",
    name: "Žižkov Rapid Print",
    address: "Seifertova 47, 130 00 Prague 3, Czechia",
    latitude: 50.0833,
    longitude: 14.45,
    rating: 4.8,
    pricePerGramCzk: 5.5,
    minOrderPriceCzk: 120,
    printerTypes: ["fdm"],
    status: MakerStatus.available,
    filaments: [
      { printerType: "fdm", material: "PLA", color: "Green" },
      { printerType: "fdm", material: "PETG", color: "Yellow" },
      { printerType: "fdm", material: "PETG", color: "Black" },
    ],
  },
];

const SEED_USERS = [
  {
    id: "user-anna",
    email: "anna@example.com",
    name: "Anna Novák",
    staffRole: null as StaffRole | null,
    makerId: null,
  },
  {
    id: "user-petr",
    email: "petr@example.com",
    name: "Petr Svoboda",
    staffRole: null,
    makerId: null,
  },
  {
    id: "user-marie",
    email: "marie@example.com",
    name: "Marie Dvořáková",
    staffRole: null,
    makerId: null,
  },
  {
    id: "user-elena",
    email: "elena@workshop.cz",
    name: "Elena Kovářová",
    staffRole: null,
    makerId: "maker-elena",
  },
  {
    id: "user-vinohrady",
    email: "vinohrady@prints.cz",
    name: "Tomáš Horák",
    staffRole: null,
    makerId: "maker-vinohrady",
  },
  {
    id: "user-smichov",
    email: "smichov@fablab.cz",
    name: "Jakub Malý",
    staffRole: null,
    makerId: "maker-smichov",
  },
  {
    id: "user-admin",
    email: "mr.spacks@seznam.cz",
    name: "Admin",
    staffRole: StaffRole.admin,
    makerId: "maker-karlin",
  },
  {
    id: "user-moderator",
    email: "moderator@printlocal.cz",
    name: "Jan Moderátor",
    staffRole: StaffRole.moderator,
    makerId: null,
  },
  {
    id: "user-archive",
    email: "archive@printlocal.internal",
    name: "Archived workshops",
    staffRole: null,
    makerId: null,
  },
];

async function seedMakers() {
  for (const maker of SEED_MAKERS) {
    const { filaments, ...makerData } = maker;

    await prisma.maker.upsert({
      where: { id: maker.id },
      update: makerData,
      create: makerData,
    });

    await prisma.makerFilament.deleteMany({ where: { makerId: maker.id } });
    await prisma.makerPrinter.deleteMany({ where: { makerId: maker.id } });

    if (filaments.length > 0) {
      await prisma.makerFilament.createMany({
        data: filaments.map((filament) => ({
          makerId: maker.id,
          printerType: filament.printerType,
          material: filament.material,
          color: filament.color,
        })),
      });
    }

    for (const technology of maker.printerTypes) {
      await prisma.makerPrinter.create({
        data: {
          makerId: maker.id,
          technology,
          modelKey: technology === "fdm" ? "generic-fdm" : "generic-resin",
          modelLabel: technology === "fdm" ? "FDM printer" : "Resin printer",
          isCustom: false,
        },
      });
    }
  }

  console.log(`Seeded ${SEED_MAKERS.length} makers with filaments`);
}

async function seedUsers(passwordHash: string) {
  for (const user of SEED_USERS) {
    const data = {
      email: user.email,
      name: user.name,
      role: "customer" as const,
      staffRole: user.staffRole,
      makerId: user.makerId,
      passwordHash,
    };

    await prisma.user.upsert({
      where: { id: user.id },
      update: data,
      create: {
        id: user.id,
        ...data,
      },
    });
  }

  console.log(`Seeded ${SEED_USERS.length} users (password: ${TEST_PASSWORD})`);
}

async function main() {
  await seedMakers();

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  await seedUsers(passwordHash);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
