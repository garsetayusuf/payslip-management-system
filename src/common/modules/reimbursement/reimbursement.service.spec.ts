import { Test, TestingModule } from '@nestjs/testing';
import { ReimbursementService } from './reimbursement.service';
import { AuditService } from '../audit/audit.service';
import {
  PrismaClient,
  ReimbursementStatus,
  PeriodStatus,
} from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { UpdateReimbursementDto } from './dto/update-reimbursement.dto';
import { ReimbursmentQueryDto } from './dto/reimbursment-query.dto';
import { Decimal } from '@prisma/client/runtime/library';

// Mock data
const mockEmployee = {
  id: 'emp-123',
  employeeCode: 'EMP001',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  status: 'ACTIVE',
};

const mockAttendancePeriod = {
  id: 'period-123',
  name: 'October Period',
  startDate: new Date('2023-10-01'),
  endDate: new Date('2023-10-31'),
  status: PeriodStatus.ACTIVE,
  payrollProcessed: false,
};

const mockReimbursement: any = {
  id: 'reimbursement-123',
  employeeId: 'emp-123',
  attendancePeriodId: 'period-123',
  amount: new Decimal(100),
  description: 'Travel expenses',
  receiptUrl: 'http://example.com/receipt',
  status: ReimbursementStatus.PENDING,
  createdById: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  updatedById: 'user-123',
  ipAddress: '192.168.1.1',
  employee: {
    employeeCode: 'EMP001',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
  },
  attendancePeriod: {
    name: 'October Period',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-10-31'),
    status: PeriodStatus.ACTIVE,
  },
};

const mockPrismaClient = {
  employee: {
    findUnique: jest.fn(),
  },
  attendancePeriod: {
    findUnique: jest.fn(),
  },
  reimbursement: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockAuditService = {
  logAudit: jest.fn(),
};

describe('ReimbursementService', () => {
  let service: ReimbursementService;
  let prisma: any;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReimbursementService,
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ReimbursementService>(ReimbursementService);
    prisma = module.get<PrismaClient>(PrismaClient);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReimbursement', () => {
    it('should throw BadRequestException if reimbursement is not pending', async () => {
      const reimbursementId = 'reimbursement-123';
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findFirst.mockResolvedValue({
        ...mockReimbursement,
        status: ReimbursementStatus.APPROVED,
      });

      await expect(
        service.deleteReimbursement(
          reimbursementId,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if employee not found', async () => {
      const createReimbursementDto: CreateReimbursementDto = {
        attendancePeriodId: 'period-123',
        amount: 100,
        description: 'Travel expenses',
        receiptUrl: 'http://example.com/receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.createReimbursement(
          createReimbursementDto,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if employee is not active', async () => {
      const createReimbursementDto: CreateReimbursementDto = {
        attendancePeriodId: 'period-123',
        amount: 100,
        description: 'Travel expenses',
        receiptUrl: 'http://example.com/receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findUnique.mockResolvedValue({
        ...mockEmployee,
        status: 'INACTIVE',
      });

      await expect(
        service.createReimbursement(
          createReimbursementDto,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if attendance period not found', async () => {
      const createReimbursementDto: CreateReimbursementDto = {
        attendancePeriodId: 'period-123',
        amount: 100,
        description: 'Travel expenses',
        receiptUrl: 'http://example.com/receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.attendancePeriod.findUnique.mockResolvedValue(null);

      await expect(
        service.createReimbursement(
          createReimbursementDto,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if attendance period is not active', async () => {
      const createReimbursementDto: CreateReimbursementDto = {
        attendancePeriodId: 'period-123',
        amount: 100,
        description: 'Travel expenses',
        receiptUrl: 'http://example.com/receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.attendancePeriod.findUnique.mockResolvedValue({
        ...mockAttendancePeriod,
        status: PeriodStatus.CLOSED,
      });

      await expect(
        service.createReimbursement(
          createReimbursementDto,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if amount is not positive', async () => {
      const createReimbursementDto: CreateReimbursementDto = {
        attendancePeriodId: 'period-123',
        amount: -100,
        description: 'Travel expenses',
        receiptUrl: 'http://example.com/receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.attendancePeriod.findUnique.mockResolvedValue(
        mockAttendancePeriod,
      );

      await expect(
        service.createReimbursement(
          createReimbursementDto,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getReimbursementsAll', () => {
    it('should return all reimbursements successfully', async () => {
      const employeeId = 'emp-123';
      const query: ReimbursmentQueryDto = {
        attendancePeriodId: 'period-123',
        status: ReimbursementStatus.PENDING,
        page: 1,
        limit: 10,
      };

      prisma.reimbursement.findMany.mockResolvedValue([mockReimbursement]);
      prisma.reimbursement.count.mockResolvedValue(1);

      const result = await service.getReimbursementsAll(employeeId, query);

      expect(result).toEqual({
        data: [mockReimbursement],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
        },
      });
    });
  });

  describe('getReimbursementById', () => {
    it('should return a reimbursement by ID successfully', async () => {
      const reimbursementId = 'reimbursement-123';
      const employeeId = 'emp-123';

      prisma.reimbursement.findFirst.mockResolvedValue(mockReimbursement);

      const result = await service.getReimbursementById(
        reimbursementId,
        employeeId,
      );

      expect(result).toEqual(mockReimbursement);
    });

    it('should throw NotFoundException if reimbursement not found', async () => {
      const reimbursementId = 'reimbursement-123';
      const employeeId = 'emp-123';

      prisma.reimbursement.findFirst.mockResolvedValue(null);

      await expect(
        service.getReimbursementById(reimbursementId, employeeId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateReimbursement', () => {
    it('should update a reimbursement successfully', async () => {
      const reimbursementId = 'reimbursement-123';
      const updateReimbursementDto: UpdateReimbursementDto = {
        amount: 150,
        description: 'Updated travel expenses',
        receiptUrl: 'http://example.com/updated-receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findFirst.mockResolvedValue({
        ...mockReimbursement,
        attendancePeriod: {
          status: PeriodStatus.ACTIVE,
          payrollProcessed: false,
        },
      });
      prisma.reimbursement.update.mockResolvedValue({
        ...mockReimbursement,
        ...updateReimbursementDto,
      });

      const result = await service.updateReimbursement(
        reimbursementId,
        updateReimbursementDto,
        employeeId,
        userId,
        ipAddress,
      );

      expect(result).toEqual({
        message: 'Reimbursement updated successfully',
        reimbursement: {
          ...mockReimbursement,
          ...updateReimbursementDto,
        },
      });
      expect(auditService.logAudit).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reimbursement not found', async () => {
      const reimbursementId = 'reimbursement-123';
      const updateReimbursementDto: UpdateReimbursementDto = {
        amount: 150,
        description: 'Updated travel expenses',
        receiptUrl: 'http://example.com/updated-receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findFirst.mockResolvedValue(null);

      await expect(
        service.updateReimbursement(
          reimbursementId,
          updateReimbursementDto,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if reimbursement is not pending', async () => {
      const reimbursementId = 'reimbursement-123';
      const updateReimbursementDto: UpdateReimbursementDto = {
        amount: 150,
        description: 'Updated travel expenses',
        receiptUrl: 'http://example.com/updated-receipt',
      };
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findFirst.mockResolvedValue({
        ...mockReimbursement,
        status: ReimbursementStatus.APPROVED,
      });

      await expect(
        service.updateReimbursement(
          reimbursementId,
          updateReimbursementDto,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteReimbursement', () => {
    it('should delete a reimbursement successfully', async () => {
      const reimbursementId = 'reimbursement-123';
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findFirst.mockResolvedValue({
        ...mockReimbursement,
        attendancePeriod: {
          status: PeriodStatus.ACTIVE,
          payrollProcessed: false,
        },
      });

      const result = await service.deleteReimbursement(
        reimbursementId,
        employeeId,
        userId,
        ipAddress,
      );

      expect(result).toEqual({
        message: 'Reimbursement deleted successfully',
      });
      expect(auditService.logAudit).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reimbursement not found', async () => {
      const reimbursementId = 'reimbursement-123';
      const employeeId = 'emp-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteReimbursement(
          reimbursementId,
          employeeId,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateReimbursementStatus', () => {
    it('should update reimbursement status successfully', async () => {
      const reimbursementId = 'reimbursement-123';
      const status = ReimbursementStatus.APPROVED;
      const adminUserId = 'admin-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findUnique.mockResolvedValue(mockReimbursement);
      prisma.reimbursement.update.mockResolvedValue({
        ...mockReimbursement,
        status,
      });

      const result = await service.updateReimbursementStatus(
        reimbursementId,
        status,
        adminUserId,
        ipAddress,
      );

      expect(result).toEqual({
        message: `Reimbursement status updated to ${status}`,
        reimbursement: {
          ...mockReimbursement,
          status,
        },
      });
      expect(auditService.logAudit).toHaveBeenCalled();
    });

    it('should throw NotFoundException if reimbursement not found', async () => {
      const reimbursementId = 'reimbursement-123';
      const status = ReimbursementStatus.APPROVED;
      const adminUserId = 'admin-123';
      const ipAddress = '192.168.1.1';

      prisma.reimbursement.findUnique.mockResolvedValue(null);

      await expect(
        service.updateReimbursementStatus(
          reimbursementId,
          status,
          adminUserId,
          ipAddress,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReimbursementSummary', () => {
    it('should return reimbursement summary successfully', async () => {
      const attendancePeriodId = 'period-123';

      prisma.reimbursement.groupBy.mockResolvedValue([
        {
          status: ReimbursementStatus.PENDING,
          _count: { id: 1 },
          _sum: { amount: 100 },
        },
      ]);
      prisma.reimbursement.aggregate.mockResolvedValue({
        _count: { id: 1 },
        _sum: { amount: 100 },
      });

      const result = await service.getReimbursementSummary(attendancePeriodId);

      expect(result).toEqual({
        summary: [
          {
            status: ReimbursementStatus.PENDING,
            count: 1,
            totalAmount: 100,
          },
        ],
        overall: {
          totalCount: 1,
          totalAmount: 100,
        },
      });
    });
  });
});
