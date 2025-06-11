/*
  Warnings:

  - You are about to drop the column `period_name` on the `attendance_periods` table. All the data in the column will be lost.
  - You are about to drop the column `attendance_date` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `overtime_date` on the `overtimes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id,date]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employee_id,date]` on the table `overtimes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `attendance_periods` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `overtimes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `overtimes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `overtimes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `overtimes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "audit_action" ADD VALUE 'READ';

-- AlterEnum
ALTER TYPE "overtime_status" ADD VALUE 'CANCELLED';

-- DropIndex
DROP INDEX "attendances_attendance_date_idx";

-- DropIndex
DROP INDEX "attendances_employee_id_attendance_date_key";

-- DropIndex
DROP INDEX "overtimes_employee_id_overtime_date_idx";

-- DropIndex
DROP INDEX "overtimes_overtime_date_idx";

-- AlterTable
ALTER TABLE "attendance_periods" DROP COLUMN "period_name",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "attendance_date",
ADD COLUMN     "date" DATE NOT NULL;

-- AlterTable
ALTER TABLE "overtimes" DROP COLUMN "overtime_date",
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "end_time" VARCHAR(5) NOT NULL,
ADD COLUMN     "has_attendance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reason" TEXT NOT NULL,
ADD COLUMN     "start_time" VARCHAR(5) NOT NULL,
ADD COLUMN     "submitted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "attendance_periods_is_active_idx" ON "attendance_periods"("is_active");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employee_id_date_key" ON "attendances"("employee_id", "date");

-- CreateIndex
CREATE INDEX "overtimes_date_idx" ON "overtimes"("date");

-- CreateIndex
CREATE UNIQUE INDEX "overtimes_employee_id_date_key" ON "overtimes"("employee_id", "date");

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
