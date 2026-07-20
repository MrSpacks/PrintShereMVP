-- AlterTable
ALTER TABLE "Maker" ADD COLUMN "companyId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN "acceptedPrivacyAt" TIMESTAMP(3),
ADD COLUMN "acceptedCustomManufactureAt" TIMESTAMP(3),
ADD COLUMN "legalDocsVersion" TEXT;
