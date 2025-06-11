/*
  Warnings:

  - Added the required column `department` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_number` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "department" VARCHAR(50) NOT NULL,
ADD COLUMN     "employee_number" VARCHAR(20) NOT NULL,
ADD COLUMN     "position" VARCHAR(50) NOT NULL;
