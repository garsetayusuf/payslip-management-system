import { Test, TestingModule } from '@nestjs/testing';
import { PayrollService } from './payroll.service';
import { PrismaClient, Payslip } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { Decimal } from '@prisma/client/runtime/library';

// Mock data
const mockAttendancePeriod = {
  id: 'period-123',
  name: 'October 2023',
  startDate: new Date('2023-10-01'),
  endDate: new Date('2023-10-31'),
  status: 'ACTIVE',
  payrollProcessed: false,
};

const mockEmployee = {
  id: 'emp-123',
  fullName: 'John Doe',
  employeeNumber: 'EMP001',
  monthlySalary: 5000,
  status: 'ACTIVE',
  user: {
    id: 'user-123',
    username: 'johndoe',
  },
};

const mockPayslip: Payslip = {
  id: 'payslip-123',
  employeeId: 'emp-123',
  attendancePeriodId: 'period-123',
  payslipNumber: 'PAY2023100001',
  baseSalary: new Decimal(5000.0),
  workingDays: 22,
  attendedDays: 22,
  proratedSalary: new Decimal(5000.0),
  totalOvertimeHours: new Decimal(5.0),
  overtimeRate: new Decimal(30.0),
  totalOvertimePay: new Decimal(150.0),
  totalReimbursements: new Decimal(200.0),
  grossPay: new Decimal(5350.0),
  deductions: new Decimal(535.0),
  netPay: new Decimal(4815.0),
  createdById: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  generatedAt: new Date(),
  ipAddress: '192.168.1.1',
  updatedById: 'user-123',
};

const mockPrismaClient = {
  attendancePeriod: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  employee: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  payslip: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
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
  $transaction: jest.fn(),
};

describe('PayrollService', () => {
  let service: PayrollService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    prisma = module.get(PrismaClient);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processPayroll', () => {
    it('should process payroll successfully', async () => {
      const processPayrollDto: ProcessPayrollDto = {
        periodId: 'period-123',
        employeeIds: ['emp-123'],
      };
      const processedById = 'user-123';

      // Mock the necessary Prisma client methods
      prisma.attendancePeriod.findUnique.mockResolvedValue(
        mockAttendancePeriod,
      );
      prisma.employee.findMany.mockResolvedValue([mockEmployee]);

      // Mock the transaction to return a successful payslip creation
      prisma.$transaction.mockImplementation((callback) => {
        const mockTx = {
          payslip: {
            findUnique: jest.fn().mockResolvedValue(null),
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockPayslip),
          },
          attendance: {
            findMany: jest.fn().mockResolvedValue([{}]),
          },
          overtime: {
            findMany: jest.fn().mockResolvedValue([]),
          },
          reimbursement: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(mockTx);
      });

      const result = await service.processPayroll(
        processPayrollDto,
        processedById,
      );

      expect(result).toEqual({
        periodId: 'period-123',
        totalEmployees: 1,
        processedSuccessfully: 1,
        failed: 0,
        results: [mockPayslip],
      });
    });

    it('should throw NotFoundException if period not found', async () => {
      const processPayrollDto: ProcessPayrollDto = {
        periodId: 'period-123',
        employeeIds: ['emp-123'],
      };
      const processedById = 'user-123';

      prisma.attendancePeriod.findUnique.mockResolvedValue(null);

      await expect(
        service.processPayroll(processPayrollDto, processedById),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payroll already processed', async () => {
      const processPayrollDto: ProcessPayrollDto = {
        periodId: 'period-123',
        employeeIds: ['emp-123'],
      };
      const processedById = 'user-123';

      prisma.attendancePeriod.findUnique.mockResolvedValue({
        ...mockAttendancePeriod,
        payrollProcessed: true,
      });

      await expect(
        service.processPayroll(processPayrollDto, processedById),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if period is closed', async () => {
      const processPayrollDto: ProcessPayrollDto = {
        periodId: 'period-123',
        employeeIds: ['emp-123'],
      };
      const processedById = 'user-123';

      prisma.attendancePeriod.findUnique.mockResolvedValue({
        ...mockAttendancePeriod,
        status: 'CLOSED',
      });

      await expect(
        service.processPayroll(processPayrollDto, processedById),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no active employees found', async () => {
      const processPayrollDto: ProcessPayrollDto = {
        periodId: 'period-123',
        employeeIds: ['emp-123'],
      };
      const processedById = 'user-123';

      prisma.attendancePeriod.findUnique.mockResolvedValue(
        mockAttendancePeriod,
      );
      prisma.employee.findMany.mockResolvedValue([]);

      await expect(
        service.processPayroll(processPayrollDto, processedById),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPayrollSummary', () => {
    it('should return payroll summary successfully', async () => {
      const periodId = 'period-123';

      prisma.attendancePeriod.findUnique.mockResolvedValue({
        ...mockAttendancePeriod,
        processedBy: {
          username: 'johndoe',
        },
        processedAt: null, // Ensure processedAt is null
      });
      prisma.payslip.findMany.mockResolvedValue([mockPayslip]);
      prisma.employee.count.mockResolvedValue(1);

      const result = await service.getPayrollSummary(periodId);

      expect(result).toEqual({
        periodId: 'period-123',
        periodName: 'October 2023',
        totalEmployees: 1,
        processedEmployees: 1,
        totalGrossPay: 5350,
        totalNetPay: 4815,
        totalDeductions: 535,
        totalOvertimePay: 150,
        totalReimbursements: 200,
        processedAt: null,
        processedBy: 'johndoe',
      });
    });

    it('should throw NotFoundException if period not found', async () => {
      const periodId = 'period-123';

      prisma.attendancePeriod.findUnique.mockResolvedValue(null);

      await expect(service.getPayrollSummary(periodId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPayrollHistory', () => {
    it('should return payroll history successfully', async () => {
      const page = 1;
      const limit = 10;

      prisma.attendancePeriod.findMany.mockResolvedValue([
        {
          ...mockAttendancePeriod,
          processedBy: {
            id: 'user-123',
            username: 'johndoe',
          },
          _count: {
            payslips: 1,
          },
          processedAt: null,
        },
      ]);
      prisma.attendancePeriod.count.mockResolvedValue(1);

      const result = await service.getPayrollHistory(page, limit);

      expect(result).toEqual({
        data: [
          {
            ...mockAttendancePeriod,
            processedBy: {
              id: 'user-123',
              username: 'johndoe',
            },
            _count: {
              payslips: 1,
            },
            processedAt: null,
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });

  describe('getPayrollStatus', () => {
    it('should return payroll status successfully', async () => {
      const periodId = 'period-123';

      prisma.attendancePeriod.findUnique.mockResolvedValue({
        ...mockAttendancePeriod,
        _count: {
          payslips: 1,
        },
        processedAt: null,
      });
      prisma.employee.count.mockResolvedValue(1);

      const result = await service.getPayrollStatus(periodId);

      expect(result).toEqual({
        periodId: 'period-123',
        periodName: 'October 2023',
        totalEmployees: 1,
        processedEmployees: 1,
        isProcessed: false,
        processedAt: null,
        canProcess: true,
      });
    });
  });
});
