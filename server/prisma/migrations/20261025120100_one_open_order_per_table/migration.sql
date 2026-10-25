-- Bir masada aynı anda yalnızca bir açık adisyon olabilir.
-- Prisma şemasında kısmi unique index yazılamadığı için elle eklendi.
CREATE UNIQUE INDEX "Order_one_open_per_table" ON "Order"("tableId") WHERE "status" = 'OPEN';
