import { Test, TestingModule } from '@nestjs/testing';
import { PayslipController } from './payslip.controller';
import { PayslipService } from './payslip.service';
import { UserRole } from '@prisma/client';
import { PayslipDto, PayslipSummaryResponseDto } from './dto/payslip.dto';

// Mock data
const mockPayslipDto: PayslipDto = {
  periodId: 'period-123',
  employeeId: 'emp-123',
  employeeName: 'John Doe',
  baseSalary: 5000,
  workingDays: 22,
  attendedDays: 22,
  proratedSalary: 5000,
  overtimeHours: 5,
  overtimeRate: 30,
  overtimePay: 150,
  reimbursements: 200,
  grossPay: 5350,
  deductions: 535,
  netPay: 4815,
};

const mockPayslipSummaryResponseDto: PayslipSummaryResponseDto = {
  totalNetPay: 4815,
  payslips: [
    {
      employeeId: 'emp-123',
      employeeName: 'John Doe',
      netPay: 4815,
      periodId: 'period-123',
    },
  ],
};

const mockAuthenticatedRequest: any = {
  user: {
    id: 'user-123',
    email: 'user@example.com',
    role: UserRole.EMPLOYEE,
    employeeId: 'emp-123',
  },
};

const mockPayslipService = {
  generatePayslip: jest.fn(),
  generatePayslipSummary: jest.fn(),
};

describe('PayslipController', () => {
  let controller: PayslipController;
  let service: PayslipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayslipController],
      providers: [
        {
          provide: PayslipService,
          useValue: mockPayslipService,
        },
      ],
    }).compile();

    controller = module.get<PayslipController>(PayslipController);
    service = module.get<PayslipService>(PayslipService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generatePayslip', () => {
    it('should generate a payslip successfully', async () => {
      const ipAddress = '192.168.1.1';

      mockPayslipService.generatePayslip.mockResolvedValue(mockPayslipDto);

      const result = await controller.generatePayslip(
        mockAuthenticatedRequest,
        ipAddress,
      );

      expect(service.generatePayslip).toHaveBeenCalledWith(
        mockAuthenticatedRequest.user.employeeId,
        mockAuthenticatedRequest.user.id,
        ipAddress,
      );
      expect(result).toEqual(mockPayslipDto);
    });
  });

  describe('generatePayslipSummary', () => {
    it('should generate payslip summary successfully', async () => {
      const ipAddress = '192.168.1.1';

      mockPayslipService.generatePayslipSummary.mockResolvedValue(
        mockPayslipSummaryResponseDto,
      );

      const result = await controller.generatePayslipSummary(
        mockAuthenticatedRequest,
        ipAddress,
      );

      expect(service.generatePayslipSummary).toHaveBeenCalledWith(
        mockAuthenticatedRequest.user.id,
        ipAddress,
      );
      expect(result).toEqual(mockPayslipSummaryResponseDto);
    });
  });
});
