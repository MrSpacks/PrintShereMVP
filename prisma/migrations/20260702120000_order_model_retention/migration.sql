-- Срок хранения STL/OBJ и метка удаления файла (запись заказа сохраняется)
ALTER TABLE "Order" ADD COLUMN "fileDeletedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "modelRetainUntil" TIMESTAMP(3);

CREATE INDEX "Order_modelRetainUntil_idx" ON "Order"("modelRetainUntil");
