-- CreateTable
CREATE TABLE "OrderReadReceipt" (
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderReadReceipt_pkey" PRIMARY KEY ("userId","orderId")
);

-- CreateIndex
CREATE INDEX "OrderReadReceipt_userId_idx" ON "OrderReadReceipt"("userId");

-- AddForeignKey
ALTER TABLE "OrderReadReceipt" ADD CONSTRAINT "OrderReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderReadReceipt" ADD CONSTRAINT "OrderReadReceipt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
