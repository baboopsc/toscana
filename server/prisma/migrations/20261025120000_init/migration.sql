-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'CASHIER', 'WAITER', 'KITCHEN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('ACTIVE', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "pinHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 4,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "areaId" INTEGER NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isNew" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "vatRate" INTEGER NOT NULL DEFAULT 10,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modifier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Modifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductModifier" (
    "productId" INTEGER NOT NULL,
    "modifierId" INTEGER NOT NULL,

    CONSTRAINT "ProductModifier_pkey" PRIMARY KEY ("productId","modifierId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "tableId" INTEGER NOT NULL,
    "openedById" INTEGER NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitchenTicket" (
    "id" SERIAL NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "orderId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "KitchenTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "vatRate" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "paidQuantity" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "voidReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" INTEGER NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "voidedById" INTEGER,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemModifier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "modifierId" INTEGER NOT NULL,

    CONSTRAINT "OrderItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" INTEGER NOT NULL,
    "receivedById" INTEGER NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentItem" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "orderItemId" INTEGER NOT NULL,

    CONSTRAINT "PaymentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_name_key" ON "Area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Table_name_key" ON "Table"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Modifier_name_key" ON "Modifier"("name");

-- CreateIndex
CREATE INDEX "Order_tableId_status_idx" ON "Order"("tableId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenTicket_clientRequestId_key" ON "KitchenTicket"("clientRequestId");

-- CreateIndex
CREATE INDEX "KitchenTicket_completedAt_idx" ON "KitchenTicket"("completedAt");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModifier" ADD CONSTRAINT "ProductModifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductModifier" ADD CONSTRAINT "ProductModifier_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "Modifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenTicket" ADD CONSTRAINT "KitchenTicket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "KitchenTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemModifier" ADD CONSTRAINT "OrderItemModifier_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "Modifier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentItem" ADD CONSTRAINT "PaymentItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
