-- AlterTable
ALTER TABLE "products" ADD COLUMN     "student_discount_percentage" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "event_discounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "percentage" DECIMAL(5,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_discounts_active_start_date_end_date_idx" ON "event_discounts"("active", "start_date", "end_date");
