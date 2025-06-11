import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { PayrollCalculationDto } from './dto/payroll-calculation.dto';
import { Payslip, PrismaClient } from '@prisma/client';
import { PayrollSummaryDto } from './dto/payroll-summary.dto';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(private prisma: PrismaClient) {}

  async processPayroll(
    processPayrollDto: ProcessPayrollDto,
    processedById: string,
  ) {
    const { periodId, employeeIds } = processPayrollDto;

    // Validate period
    const period = await this.prisma.attendancePeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Attendance period not found');
    }

    if (period.payrollProcessed) {
      throw new BadRequestException(
        'Payroll already processed for this period',
      );
    }

    if (period.status === 'CLOSED') {
      throw new BadRequestException('Cannot process payroll for closed period');
    }

    // Get employees to process
    const whereClause = employeeIds ? { id: { in: employeeIds } } : {};
    const employees = await this.prisma.employee.findMany({
      where: {
        ...whereClause,
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
    });

    if (employees.length === 0) {
      throw new BadRequestException('No active employees found for processing');
    }

    const results = [];
    let totalProcessed = 0;

    // Process each employee in transaction
    for (const employee of employees) {
      try {
        const payslip = await this.processEmployeePayroll(
          employee,
          period,
          processedById,
        );
        results.push(payslip);
        totalProcessed++;

        this.logger.log(`Processed payroll for employee: ${employee.fullName}`);
      } catch (error) {
        this.logger.error(
          `Failed to process payroll for employee ${employee.fullName}: ${error.message}`,
        );
        results.push({
          employeeId: employee.id,
          error: error.message,
        });
      }
    }

    // Update period as processed if all employees were processed
    if (totalProcessed === employees.length && !employeeIds) {
      await this.prisma.attendancePeriod.update({
        where: { id: periodId },
        data: {
          payrollProcessed: true,
          processedAt: new Date(),
          processedById,
        },
      });
    }

    return {
      periodId,
      totalEmployees: employees.length,
      processedSuccessfully: totalProcessed,
      failed: employees.length - totalProcessed,
      results,
    };
  }

  private async processEmployeePayroll(
    employee: any,
    period: any,
    processedById: string,
  ): Promise<Payslip> {
    return await this.prisma.$transaction(async (tx) => {
      // Check if payslip already exists
      const existingPayslip = await tx.payslip.findUnique({
        where: {
          employeeId_attendancePeriodId: {
            employeeId: employee.id,
            attendancePeriodId: period.id,
          },
        },
      });

      if (existingPayslip) {
        throw new Error('Payslip already exists for this period');
      }

      // Calculate payroll components
      const calculation = await this.calculateEmployeePayroll(
        employee,
        period,
        tx,
      );

      // Generate payslip number
      const payslipNumber = await this.generatePayslipNumber(period, tx);

      // Create payslip
      const payslip = await tx.payslip.create({
        data: {
          employeeId: employee.id,
          attendancePeriodId: period.id,
          payslipNumber,
          baseSalary: calculation.baseSalary,
          workingDays: calculation.workingDays,
          attendedDays: calculation.attendedDays,
          proratedSalary: calculation.proratedSalary,
          totalOvertimeHours: calculation.overtimeHours,
          overtimeRate: calculation.overtimeRate,
          totalOvertimePay: calculation.overtimePay,
          totalReimbursements: calculation.reimbursements,
          grossPay: calculation.grossPay,
          deductions: calculation.deductions,
          netPay: calculation.netPay,
          createdById: processedById,
        },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeNumber: true,
              position: true,
              department: true,
            },
          },
        },
      });

      return payslip;
    });
  }

  private async calculateEmployeePayroll(
    employee: any,
    period: any,
    tx: any,
  ): Promise<PayrollCalculationDto> {
    const baseSalary = parseFloat(employee.monthlySalary.toString());

    // Calculate working days in period
    const workingDays = this.calculateWorkingDays(
      period.startDate,
      period.endDate,
    );

    // Get attendance records
    const attendances = await tx.attendance.findMany({
      where: {
        employeeId: employee.id,
        attendancePeriodId: period.id,
        status: 'PRESENT',
      },
    });

    const attendedDays = attendances.length;

    // Calculate prorated salary based on attendance
    const proratedSalary = (baseSalary / workingDays) * attendedDays;

    // Get approved overtime
    const overtimes = await tx.overtime.findMany({
      where: {
        employeeId: employee.id,
        attendancePeriodId: period.id,
        status: 'APPROVED',
      },
    });

    const totalOvertimeHours = overtimes.reduce(
      (sum, ot) => sum + parseFloat(ot.hoursWorked.toString()),
      0,
    );

    // Calculate overtime rate (1.5x hourly rate)
    const hourlyRate = baseSalary / workingDays / 8; // Assuming 8 hours per day
    const overtimeRate = hourlyRate * 1.5;
    const totalOvertimePay = totalOvertimeHours * overtimeRate;

    // Get approved reimbursements
    const reimbursements = await tx.reimbursement.findMany({
      where: {
        employeeId: employee.id,
        attendancePeriodId: period.id,
        status: 'APPROVED',
      },
    });

    const totalReimbursements = reimbursements.reduce(
      (sum, reimb) => sum + parseFloat(reimb.amount.toString()),
      0,
    );

    // Calculate gross pay
    const grossPay = proratedSalary + totalOvertimePay + totalReimbursements;

    // Calculate deductions (you can customize this based on your requirements)
    const deductions = this.calculateDeductions(grossPay);

    // Calculate net pay
    const netPay = grossPay - deductions;

    return {
      employeeId: employee.id,
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

  public calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  public calculateDeductions(grossPay: number): number {
    // Example deduction calculation - customize based on your requirements
    // This could include taxes, insurance, etc.
    let deductions = 0;

    // Example: 10% tax if gross pay > 5000
    if (grossPay > 5000) {
      deductions += grossPay * 0.1;
    }

    return deductions;
  }

  async getPayrollSummary(periodId: string): Promise<PayrollSummaryDto> {
    const period = await this.prisma.attendancePeriod.findUnique({
      where: { id: periodId },
      include: {
        processedBy: {
          select: { username: true },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    const payslips = await this.prisma.payslip.findMany({
      where: { attendancePeriodId: periodId },
    });

    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    const summary = payslips.reduce(
      (acc, payslip) => ({
        totalGrossPay:
          acc.totalGrossPay + parseFloat(payslip.grossPay.toString()),
        totalNetPay: acc.totalNetPay + parseFloat(payslip.netPay.toString()),
        totalDeductions:
          acc.totalDeductions + parseFloat(payslip.deductions.toString()),
        totalOvertimePay:
          acc.totalOvertimePay +
          parseFloat(payslip.totalOvertimePay.toString()),
        totalReimbursements:
          acc.totalReimbursements +
          parseFloat(payslip.totalReimbursements.toString()),
      }),
      {
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDeductions: 0,
        totalOvertimePay: 0,
        totalReimbursements: 0,
      },
    );

    return {
      periodId,
      periodName: period.name,
      totalEmployees,
      processedEmployees: payslips.length,
      ...summary,
      processedAt: period.processedAt,
      processedBy: period.processedBy?.username,
    };
  }

  async getPayrollHistory(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [periods, total] = await Promise.all([
      this.prisma.attendancePeriod.findMany({
        where: { payrollProcessed: true },
        include: {
          processedBy: {
            select: { id: true, username: true },
          },
          _count: {
            select: { payslips: true },
          },
        },
        skip,
        take: limit,
        orderBy: { processedAt: 'desc' },
      }),
      this.prisma.attendancePeriod.count({
        where: { payrollProcessed: true },
      }),
    ]);

    return {
      data: periods,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPayrollStatus(periodId: string) {
    const period = await this.prisma.attendancePeriod.findUnique({
      where: { id: periodId },
      include: {
        _count: {
          select: { payslips: true },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Period not found');
    }

    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    return {
      periodId,
      periodName: period.name,
      totalEmployees,
      processedEmployees: period._count.payslips,
      isProcessed: period.payrollProcessed,
      processedAt: period.processedAt,
      canProcess: !period.payrollProcessed && period.status === 'ACTIVE',
    };
  }

  private async generatePayslipNumber(period: any, tx: any): Promise<string> {
    const year = period.startDate.getFullYear();
    const month = (period.startDate.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `PAY${year}${month}`;

    // Get the latest payslip number for this period
    const latestPayslip = await tx.payslip.findFirst({
      where: {
        payslipNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        payslipNumber: 'desc',
      },
    });

    let sequence = 1;
    if (latestPayslip) {
      const lastSequence = parseInt(latestPayslip.payslipNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }
}
