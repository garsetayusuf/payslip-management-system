import { Test, TestingModule } from '@nestjs/testing';
import { PayslipService } from './payslip.service';
import { PayrollService } from '../payroll/payroll.service';
import { AuditService } from '../audit/audit.service';
import { PrismaClient } from '@prisma/client';

// Mock data
const mockEmployee = {
  id: 'emp-123',
  fullName: 'John Doe',
  monthlySalary: 5000,
};

const mockAttendancePeriod = {
  id: 'period-123',
  startDate: new Date('2023-10-01'),
  endDate: new Date('2023-10-31'),
  isActive: true,
  status: 'ACTIVE',
};

const mockAttendance = [
  {
    employeeId: 'emp-123',
    attendancePeriodId: 'period-123',
    status: 'PRESENT',
  },
];

const mockOvertime = [
  {
    employeeId: 'emp-123',
    attendancePeriodId: 'period-123',
    hoursWorked: 5,
    status: 'APPROVED',
  },
];

const mockReimbursement = [
  {
    employeeId: 'emp-123',
    attendancePeriodId: 'period-123',
    amount: 200,
    status: 'APPROVED',
  },
];

const mockPrismaClient = {
  employee: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  attendancePeriod: {
    findFirst: jest.fn(),
  },
  attendance: {
    findMany: jest.fn(),
  },
  overtime: {
    findMany: jest.fn(),
  },
  reimbursement: {
    findMany: jest.fn(),
  },
};

const mockPayrollService = {
  calculateWorkingDays: jest.fn(),
  calculateDeductions: jest.fn(),
};

const mockAuditService = {
  logAudit: jest.fn(),
};

describe('PayslipService', () => {
  let service: PayslipService;
  let prisma: any;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayslipService,
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
        {
          provide: PayrollService,
          useValue: mockPayrollService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<PayslipService>(PayslipService);
    prisma = module.get<PrismaClient>(PrismaClient);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePayslip', () => {
    it('should generate a payslip successfully', async () => {
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.attendancePeriod.findFirst.mockResolvedValue(mockAttendancePeriod);
      prisma.attendance.findMany.mockResolvedValue(mockAttendance);
      prisma.overtime.findMany.mockResolvedValue(mockOvertime);
      prisma.reimbursement.findMany.mockResolvedValue(mockReimbursement);
      mockPayrollService.calculateWorkingDays.mockReturnValue(22);
      mockPayrollService.calculateDeductions.mockReturnValue(535);

      const result = await service.generatePayslip(
        employeeId,
        userId,
        ipAddress,
      );

      const baseSalary = mockEmployee.monthlySalary;
      const workingDays = 22;
      const attendedDays = mockAttendance.length;
      const proratedSalary = (baseSalary / workingDays) * attendedDays;
      const totalOvertimeHours = mockOvertime.reduce(
        (sum, ot) => sum + ot.hoursWorked,
        0,
      );
      const hourlyRate = baseSalary / workingDays / 8;
      const overtimeRate = hourlyRate * 1.5;
      const totalOvertimePay = totalOvertimeHours * overtimeRate;
      const totalReimbursements = mockReimbursement.reduce(
        (sum, reimb) => sum + reimb.amount,
        0,
      );
      const grossPay = proratedSalary + totalOvertimePay + totalReimbursements;
      const deductions = 535;
      const netPay = grossPay - deductions;

      const expectedPayslip = {
        periodId: mockAttendancePeriod.id,
        employeeId: mockEmployee.id,
        employeeName: mockEmployee.fullName,
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

      expect(result).toEqual(expectedPayslip);
      expect(auditService.logAudit).toHaveBeenCalled();
    });

    it('should throw an error if employee or attendance period not found', async () => {
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findUnique.mockResolvedValue(null);
      prisma.attendancePeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.generatePayslip(employeeId, userId, ipAddress),
      ).rejects.toThrow('Employee or attendance period not found');
    });
  });

  describe('generatePayslipSummary', () => {
    it('should generate payslip summary successfully', async () => {
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findMany.mockResolvedValue([mockEmployee]);
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.attendancePeriod.findFirst.mockResolvedValue(mockAttendancePeriod);
      prisma.attendance.findMany.mockResolvedValue(mockAttendance);
      prisma.overtime.findMany.mockResolvedValue(mockOvertime);
      prisma.reimbursement.findMany.mockResolvedValue(mockReimbursement);
      mockPayrollService.calculateWorkingDays.mockReturnValue(22);
      mockPayrollService.calculateDeductions.mockReturnValue(535);

      const result = await service.generatePayslipSummary(userId, ipAddress);

      const baseSalary = mockEmployee.monthlySalary;
      const workingDays = 22;
      const attendedDays = mockAttendance.length;
      const proratedSalary = (baseSalary / workingDays) * attendedDays;
      const totalOvertimeHours = mockOvertime.reduce(
        (sum, ot) => sum + ot.hoursWorked,
        0,
      );
      const hourlyRate = baseSalary / workingDays / 8;
      const overtimeRate = hourlyRate * 1.5;
      const totalOvertimePay = totalOvertimeHours * overtimeRate;
      const totalReimbursements = mockReimbursement.reduce(
        (sum, reimb) => sum + reimb.amount,
        0,
      );
      const grossPay = proratedSalary + totalOvertimePay + totalReimbursements;
      const deductions = 535;
      const netPay = grossPay - deductions;

      expect(result).toEqual({
        totalNetPay: netPay,
        payslips: [
          {
            employeeId: mockEmployee.id,
            employeeName: mockEmployee.fullName,
            netPay: netPay,
            periodId: mockAttendancePeriod.id,
          },
        ],
      });
    });
  });
});
