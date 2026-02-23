-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "stripe_payment_intent_id" TEXT,
ADD COLUMN     "stripe_session_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_customer_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripe_session_id_key" ON "orders"("stripe_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
