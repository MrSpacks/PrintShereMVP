-- CreateEnum
CREATE TYPE "MakerStatus" AS ENUM ('available', 'busy');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateTable
CREATE TABLE "Maker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "pricePerGramCzk" DOUBLE PRECISION NOT NULL,
    "materials" TEXT[],
    "hasDelivery" BOOLEAN NOT NULL DEFAULT false,
    "deliveryFeeCzk" INTEGER NOT NULL DEFAULT 0,
    "status" "MakerStatus" NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "makerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "weightGrams" DOUBLE PRECISION NOT NULL,
    "widthMm" DOUBLE PRECISION NOT NULL,
    "heightMm" DOUBLE PRECISION NOT NULL,
    "depthMm" DOUBLE PRECISION NOT NULL,
    "printCostCzk" INTEGER NOT NULL,
    "deliveryFeeCzk" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_makerId_idx" ON "Order"("makerId");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "Maker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
