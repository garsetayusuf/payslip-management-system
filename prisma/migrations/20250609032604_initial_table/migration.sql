-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "employee_status" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "period_status" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('PRESENT', 'ABSENT');

-- CreateEnum
CREATE TYPE "overtime_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "reimbursement_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'EMPLOYEE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_code" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "monthly_salary" DECIMAL(12,2) NOT NULL,
    "status" "employee_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_periods" (
    "id" TEXT NOT NULL,
    "period_name" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "period_status" NOT NULL DEFAULT 'ACTIVE',
    "payroll_processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "attendance_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_period_id" TEXT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "status" "attendance_status" NOT NULL DEFAULT 'PRESENT',
    "ip_address" INET,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtimes" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_period_id" TEXT NOT NULL,
    "overtime_date" DATE NOT NULL,
    "hours_worked" DECIMAL(4,2) NOT NULL,
    "description" TEXT,
    "status" "overtime_status" NOT NULL DEFAULT 'PENDING',
    "ip_address" INET,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "overtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursements" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_period_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "receipt_url" VARCHAR(500),
    "status" "reimbursement_status" NOT NULL DEFAULT 'PENDING',
    "ip_address" INET,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "reimbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "attendance_period_id" TEXT NOT NULL,
    "payslip_number" VARCHAR(50) NOT NULL,
    "base_salary" DECIMAL(12,2) NOT NULL,
    "working_days" INTEGER NOT NULL,
    "attended_days" INTEGER NOT NULL,
    "prorated_salary" DECIMAL(12,2) NOT NULL,
    "total_overtime_hours" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "overtime_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_overtime_pay" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_reimbursements" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gross_pay" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_pay" DECIMAL(12,2) NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "table_name" VARCHAR(50) NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" "audit_action" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" TEXT,
    "ip_address" INET,
    "request_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_logs" (
    "id" TEXT NOT NULL,
    "request_id" VARCHAR(100) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "user_id" TEXT,
    "ip_address" INET NOT NULL,
    "user_agent" TEXT,
    "request_body" JSONB,
    "response_status" INTEGER,
    "response_time_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_employee_code_idx" ON "employees"("employee_code");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_monthly_salary_idx" ON "employees"("monthly_salary");

-- CreateIndex
CREATE INDEX "employees_created_at_idx" ON "employees"("created_at");

-- CreateIndex
CREATE INDEX "attendance_periods_start_date_idx" ON "attendance_periods"("start_date");

-- CreateIndex
CREATE INDEX "attendance_periods_end_date_idx" ON "attendance_periods"("end_date");

-- CreateIndex
CREATE INDEX "attendance_periods_status_idx" ON "attendance_periods"("status");

-- CreateIndex
CREATE INDEX "attendance_periods_payroll_processed_idx" ON "attendance_periods"("payroll_processed");

-- CreateIndex
CREATE INDEX "attendance_periods_created_at_idx" ON "attendance_periods"("created_at");

-- CreateIndex
CREATE INDEX "attendances_employee_id_attendance_period_id_idx" ON "attendances"("employee_id", "attendance_period_id");

-- CreateIndex
CREATE INDEX "attendances_attendance_date_idx" ON "attendances"("attendance_date");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_created_at_idx" ON "attendances"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employee_id_attendance_date_key" ON "attendances"("employee_id", "attendance_date");

-- CreateIndex
CREATE INDEX "overtimes_employee_id_overtime_date_idx" ON "overtimes"("employee_id", "overtime_date");

-- CreateIndex
CREATE INDEX "overtimes_employee_id_attendance_period_id_idx" ON "overtimes"("employee_id", "attendance_period_id");

-- CreateIndex
CREATE INDEX "overtimes_overtime_date_idx" ON "overtimes"("overtime_date");

-- CreateIndex
CREATE INDEX "overtimes_status_idx" ON "overtimes"("status");

-- CreateIndex
CREATE INDEX "overtimes_created_at_idx" ON "overtimes"("created_at");

-- CreateIndex
CREATE INDEX "reimbursements_employee_id_attendance_period_id_idx" ON "reimbursements"("employee_id", "attendance_period_id");

-- CreateIndex
CREATE INDEX "reimbursements_employee_id_idx" ON "reimbursements"("employee_id");

-- CreateIndex
CREATE INDEX "reimbursements_status_idx" ON "reimbursements"("status");

-- CreateIndex
CREATE INDEX "reimbursements_amount_idx" ON "reimbursements"("amount");

-- CreateIndex
CREATE INDEX "reimbursements_created_at_idx" ON "reimbursements"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payslip_number_key" ON "payslips"("payslip_number");

-- CreateIndex
CREATE INDEX "payslips_payslip_number_idx" ON "payslips"("payslip_number");

-- CreateIndex
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");

-- CreateIndex
CREATE INDEX "payslips_attendance_period_id_idx" ON "payslips"("attendance_period_id");

-- CreateIndex
CREATE INDEX "payslips_generated_at_idx" ON "payslips"("generated_at");

-- CreateIndex
CREATE INDEX "payslips_net_pay_idx" ON "payslips"("net_pay");

-- CreateIndex
CREATE INDEX "payslips_created_at_idx" ON "payslips"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employee_id_attendance_period_id_key" ON "payslips"("employee_id", "attendance_period_id");

-- CreateIndex
CREATE INDEX "audit_logs_table_name_idx" ON "audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "audit_logs_record_id_idx" ON "audit_logs"("record_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_request_id_idx" ON "audit_logs"("request_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "request_logs_request_id_key" ON "request_logs"("request_id");

-- CreateIndex
CREATE INDEX "request_logs_request_id_idx" ON "request_logs"("request_id");

-- CreateIndex
CREATE INDEX "request_logs_user_id_idx" ON "request_logs"("user_id");

-- CreateIndex
CREATE INDEX "request_logs_endpoint_idx" ON "request_logs"("endpoint");

-- CreateIndex
CREATE INDEX "request_logs_response_status_idx" ON "request_logs"("response_status");

-- CreateIndex
CREATE INDEX "request_logs_created_at_idx" ON "request_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_periods" ADD CONSTRAINT "attendance_periods_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_periods" ADD CONSTRAINT "attendance_periods_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_periods" ADD CONSTRAINT "attendance_periods_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_attendance_period_id_fkey" FOREIGN KEY ("attendance_period_id") REFERENCES "attendance_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_attendance_period_id_fkey" FOREIGN KEY ("attendance_period_id") REFERENCES "attendance_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtimes" ADD CONSTRAINT "overtimes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_attendance_period_id_fkey" FOREIGN KEY ("attendance_period_id") REFERENCES "attendance_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_attendance_period_id_fkey" FOREIGN KEY ("attendance_period_id") REFERENCES "attendance_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_logs" ADD CONSTRAINT "request_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
