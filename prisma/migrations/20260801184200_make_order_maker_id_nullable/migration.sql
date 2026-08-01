-- AlterTable: Make Order.makerId nullable and change constraint to SET NULL
ALTER TABLE "Order" ALTER COLUMN "makerId" DROP NOT NULL;

-- Drop existing foreign key constraint
ALTER TABLE "Order" DROP CONSTRAINT "Order_makerId_fkey";

-- Add new foreign key constraint with ON DELETE SET NULL
ALTER TABLE "Order" ADD CONSTRAINT "Order_makerId_fkey" 
  FOREIGN KEY ("makerId") REFERENCES "Maker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
