import { Injectable } from '@nestjs/common';
import { PayrollService } from '../payroll/payroll.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PayslipService {
  constructor(
    private prisma: PrismaClient,
    private payrollService: PayrollService,
    private readonly auditService: AuditService,
  ) {}

  async generatePayslip(employeeId: string, userId: string, ipAddress: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    const attandePeriod = await this.prisma.attendancePeriod.findFirst({
      where: { isActive: true, status: 'ACTIVE' },
    });

    if (!employee || !attandePeriod) {
      throw new Error('Employee or attendance period not found');
    }

    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        attendancePeriodId: attandePeriod.id,
        status: 'PRESENT',
      },
    });

    const overtimes = await this.prisma.overtime.findMany({
      where: {
        employeeId,
        attendancePeriodId: attandePeriod.id,
        status: 'APPROVED',
      },
    });

    const reimbursements = await this.prisma.reimbursement.findMany({
      where: {
        employeeId,
        attendancePeriodId: attandePeriod.id,
        status: 'APPROVED',
      },
    });

    // Calculate working days
    const workingDays = this.payrollService.calculateWorkingDays(
      attandePeriod.startDate,
      attandePeriod.endDate,
    );
    const attendedDays = attendances.length;
    const baseSalary = parseFloat(employee.monthlySalary.toString());
    const proratedSalary = (baseSalary / workingDays) * attendedDays;

    const totalOvertimeHours = overtimes.reduce(
      (sum, ot) => sum + parseFloat(ot.hoursWorked.toString()),
      0,
    );

    const hourlyRate = baseSalary / workingDays / 8;
    const overtimeRate = hourlyRate * 1.5;
    const totalOvertimePay = totalOvertimeHours * overtimeRate;

    const totalReimbursements = reimbursements.reduce(
      (sum, reimb) => sum + parseFloat(reimb.amount.toString()),
      0,
    );

    const grossPay = proratedSalary + totalOvertimePay + totalReimbursements;
    const deductions = this.payrollService.calculateDeductions(grossPay);
    const netPay = grossPay - deductions;

    await this.auditService.logAudit(
      'payslips',
      uuidv4(),
      AuditAction.CREATE,
      null,
      {
        employeeId,
        employeeName: employee.fullName,
        baseSalary,
        workingDays,
        attendedDays,
        proratedSalary,
        overtimeHours: totalOvertimeHours,
        overtimeRate,
        overtimePay: totalOvertimePay,
        reimbursements: totalReimbursements,
        grossPay,
        deductions,
        netPay,
        createdById: userId,
        updatedById: userId,
      },
      userId,
      ipAddress,
    );

    return {
      periodId: attandePeriod.id,
      employeeId,
      employeeName: employee.fullName,
      baseSalary,
      workingDays,
      attendedDays,
      proratedSalary,
      overtimeHours: totalOvertimeHours,
      overtimeRate,
      overtimePay: totalOvertimePay,
      reimbursements: totalReimbursements,
      grossPay,
      deductions,
      netPay,
    };
  }

  async generatePayslipSummary(userId: string, ipAddress: string) {
    const employees = await this.prisma.employee.findMany();

    const payslips = await Promise.all(
      employees.map(async (employee) => {
        const payslip = await this.generatePayslip(
          employee.id,
          userId,
          ipAddress,
        );
        return {
          employeeId: employee.id,
          employeeName: employee.fullName,
          netPay: payslip.netPay,
          periodId: payslip.periodId,
        };
      }),
    );

    const totalNetPay = payslips.reduce(
      (sum, payslip) => sum + payslip.netPay,
      0,
    );

    return {
      totalNetPay,
      payslips,
    };
  }
}
