import { Test, TestingModule } from '@nestjs/testing';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { ProcessPayrollDto } from './dto/process-payroll.dto';
import { UserRole } from '@prisma/client';

// Mock data
const mockProcessPayrollResult = {
  periodId: 'period-123',
  totalEmployees: 1,
  processedSuccessfully: 1,
  failed: 0,
  results: [
    {
      id: 'payslip-123',
      employeeId: 'emp-123',
      attendancePeriodId: 'period-123',
      payslipNumber: 'PAY2023100001',
      baseSalary: 5000,
      workingDays: 22,
      attendedDays: 22,
      proratedSalary: 5000,
      totalOvertimeHours: 5,
      overtimeRate: 30,
      totalOvertimePay: 150,
      totalReimbursements: 200,
      grossPay: 5350,
      deductions: 535,
      netPay: 4815,
    },
  ],
};

const mockPayrollSummary = {
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
};

const mockPayrollStatus = {
  periodId: 'period-123',
  periodName: 'October 2023',
  totalEmployees: 1,
  processedEmployees: 1,
  isProcessed: false,
  processedAt: null,
  canProcess: true,
};

const mockPayrollHistory = {
  data: [
    {
      id: 'period-123',
      name: 'October 2023',
      startDate: new Date('2023-10-01'),
      endDate: new Date('2023-10-31'),
      status: 'ACTIVE',
      payrollProcessed: true,
      processedBy: {
        id: 'user-123',
        username: 'johndoe',
      },
      _count: {
        payslips: 1,
      },
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

const mockAuthenticatedRequest: any = {
  user: {
    id: 'user-123',
    email: 'user@example.com',
    role: UserRole.ADMIN,
    employeeId: 'emp-123',
  },
};

const mockPayrollService = {
  processPayroll: jest.fn(),
  getPayrollSummary: jest.fn(),
  getPayrollStatus: jest.fn(),
  getPayrollHistory: jest.fn(),
};

describe('PayrollController', () => {
  let controller: PayrollController;
  let service: PayrollService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        {
          provide: PayrollService,
          useValue: mockPayrollService,
        },
      ],
    }).compile();

    controller = module.get<PayrollController>(PayrollController);
    service = module.get<PayrollService>(PayrollService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processPayroll', () => {
    it('should process payroll successfully', async () => {
      const processPayrollDto: ProcessPayrollDto = {
        periodId: 'period-123',
        employeeIds: ['emp-123'],
      };

      mockPayrollService.processPayroll.mockResolvedValue(
        mockProcessPayrollResult,
      );

      const result = await controller.processPayroll(
        processPayrollDto,
        mockAuthenticatedRequest,
      );

      expect(service.processPayroll).toHaveBeenCalledWith(
        processPayrollDto,
        mockAuthenticatedRequest.user.id,
      );
      expect(result).toEqual(mockProcessPayrollResult);
    });
  });

  describe('getPayrollSummary', () => {
    it('should return payroll summary successfully', async () => {
      const periodId = 'period-123';

      mockPayrollService.getPayrollSummary.mockResolvedValue(
        mockPayrollSummary,
      );

      const result = await controller.getPayrollSummary(periodId);

      expect(service.getPayrollSummary).toHaveBeenCalledWith(periodId);
      expect(result).toEqual(mockPayrollSummary);
    });
  });

  describe('getPayrollStatus', () => {
    it('should return payroll status successfully', async () => {
      const periodId = 'period-123';

      mockPayrollService.getPayrollStatus.mockResolvedValue(mockPayrollStatus);

      const result = await controller.getPayrollStatus(periodId);

      expect(service.getPayrollStatus).toHaveBeenCalledWith(periodId);
      expect(result).toEqual(mockPayrollStatus);
    });
  });

  describe('getPayrollHistory', () => {
    it('should return payroll history successfully', async () => {
      const page = 1;
      const limit = 10;

      mockPayrollService.getPayrollHistory.mockResolvedValue(
        mockPayrollHistory,
      );

      const result = await controller.getPayrollHistory(page, limit);

      expect(service.getPayrollHistory).toHaveBeenCalledWith(page, limit);
      expect(result).toEqual(mockPayrollHistory);
    });
  });
});
