import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AttendancePeriodService } from './attendance-period.service';
import { AuditService } from '../audit/audit.service';
import { PrismaClient, AuditAction, PeriodStatus } from '@prisma/client';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period.dto';
import { UpdateAttendancePeriodDto } from './dto/update-attendance-period.dto';

describe('AttendancePeriodService', () => {
  let service: AttendancePeriodService;
  let prismaClient: any;
  let auditService: jest.Mocked<AuditService>;

  const mockPrismaClient = {
    attendancePeriod: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
    overtime: {
      findMany: jest.fn(),
    },
  };

  const mockAuditService = {
    logAudit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendancePeriodService,
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

    service = module.get<AttendancePeriodService>(AttendancePeriodService);
    prismaClient = module.get(PrismaClient);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createdById = 'user-123';
    const createPeriodDto: CreateAttendancePeriodDto = {
      name: 'Q1 2024',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      isActive: true,
    };

    const mockCreatedPeriod = {
      id: 'period-123',
      name: 'Q1 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      isActive: true,
      status: PeriodStatus.ACTIVE,
      payrollProcessed: false,
      createdById,
      updatedById: null,
      processedById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      processedAt: null,
    };

    it('should create attendance period successfully', async () => {
      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);
      prismaClient.attendancePeriod.updateMany.mockResolvedValue({ count: 0 });
      prismaClient.attendancePeriod.create.mockResolvedValue(mockCreatedPeriod);
      auditService.logAudit.mockResolvedValue(undefined);

      const result = await service.create(createPeriodDto, createdById);

      expect(result).toEqual(mockCreatedPeriod);
      expect(prismaClient.attendancePeriod.create).toHaveBeenCalledWith({
        data: {
          name: 'Q1 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          isActive: true,
          createdById,
        },
      });
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'attendance-periods',
        mockCreatedPeriod.id,
        AuditAction.CREATE,
        null,
        expect.any(Object),
        createdById,
      );
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const invalidDto: CreateAttendancePeriodDto = {
        name: 'Invalid Period',
        startDate: '2024-03-31',
        endDate: '2024-01-01',
        isActive: true,
      };

      await expect(service.create(invalidDto, createdById)).rejects.toThrow(
        new BadRequestException('Start date must be before end date'),
      );

      expect(prismaClient.attendancePeriod.findFirst).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start date equals end date', async () => {
      const invalidDto: CreateAttendancePeriodDto = {
        name: 'Invalid Period',
        startDate: '2024-01-01',
        endDate: '2024-01-01',
        isActive: true,
      };

      await expect(service.create(invalidDto, createdById)).rejects.toThrow(
        new BadRequestException('Start date must be before end date'),
      );
    });

    it('should throw ConflictException when period overlaps with existing active period', async () => {
      const overlappingPeriod = {
        id: 'existing-period',
        name: 'Existing Period',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2024-02-28'),
        status: PeriodStatus.ACTIVE,
      };

      prismaClient.attendancePeriod.findFirst.mockResolvedValue(
        overlappingPeriod,
      );

      await expect(
        service.create(createPeriodDto, createdById),
      ).rejects.toThrow(
        new ConflictException('Period overlaps with existing active period'),
      );

      expect(prismaClient.attendancePeriod.create).not.toHaveBeenCalled();
    });

    it('should deactivate other periods when creating active period', async () => {
      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);
      prismaClient.attendancePeriod.updateMany.mockResolvedValue({ count: 2 });
      prismaClient.attendancePeriod.create.mockResolvedValue(mockCreatedPeriod);
      auditService.logAudit.mockResolvedValue(undefined);

      await service.create(createPeriodDto, createdById);

      expect(prismaClient.attendancePeriod.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
    });

    it('should not deactivate other periods when creating inactive period', async () => {
      const inactiveDto = { ...createPeriodDto, isActive: false };
      const inactivePeriod = { ...mockCreatedPeriod, isActive: false };

      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);
      prismaClient.attendancePeriod.create.mockResolvedValue(inactivePeriod);
      auditService.logAudit.mockResolvedValue(undefined);

      await service.create(inactiveDto, createdById);

      expect(prismaClient.attendancePeriod.updateMany).not.toHaveBeenCalled();
    });

    it('should default isActive to true when not provided', async () => {
      const dtoWithoutIsActive: CreateAttendancePeriodDto = {
        name: 'Q1 2024',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);
      prismaClient.attendancePeriod.updateMany.mockResolvedValue({ count: 0 });
      prismaClient.attendancePeriod.create.mockResolvedValue(mockCreatedPeriod);
      auditService.logAudit.mockResolvedValue(undefined);

      await service.create(dtoWithoutIsActive, createdById);

      expect(prismaClient.attendancePeriod.create).toHaveBeenCalledWith({
        data: {
          name: 'Q1 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
          isActive: true,
          createdById,
        },
      });
    });
  });

  describe('findAll', () => {
    const mockPeriods = [
      {
        id: 'period-1',
        name: 'Q1 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        createdBy: { id: 'user-1', username: 'admin' },
        processedBy: null,
      },
      {
        id: 'period-2',
        name: 'Q4 2023',
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-12-31'),
        createdBy: { id: 'user-2', username: 'manager' },
        processedBy: { id: 'user-3', username: 'processor' },
      },
    ];

    it('should return paginated periods with default pagination', async () => {
      const totalCount = 2;

      prismaClient.attendancePeriod.findMany.mockResolvedValue(mockPeriods);
      prismaClient.attendancePeriod.count.mockResolvedValue(totalCount);

      const result = await service.findAll();

      expect(result).toEqual({
        data: mockPeriods,
        pagination: {
          total: totalCount,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      expect(prismaClient.attendancePeriod.findMany).toHaveBeenCalledWith({
        include: {
          createdBy: { select: { id: true, username: true } },
          processedBy: { select: { id: true, username: true } },
        },
        skip: 0,
        take: 10,
        orderBy: { startDate: 'desc' },
      });
    });

    it('should apply custom pagination correctly', async () => {
      const page = 2;
      const limit = 5;
      const totalCount = 12;

      prismaClient.attendancePeriod.findMany.mockResolvedValue(mockPeriods);
      prismaClient.attendancePeriod.count.mockResolvedValue(totalCount);

      const result = await service.findAll(page, limit);

      expect(result.pagination).toEqual({
        total: totalCount,
        page: 2,
        limit: 5,
        totalPages: 3,
      });

      expect(prismaClient.attendancePeriod.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        skip: 5, // (page 2 - 1) * limit 5
        take: 5,
        orderBy: { startDate: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    const periodId = 'period-123';
    const mockPeriod = {
      id: periodId,
      name: 'Q1 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      createdBy: { id: 'user-1', username: 'admin' },
      processedBy: null,
      _count: {
        attendances: 100,
        overtimes: 25,
        reimbursements: 10,
        payslips: 50,
      },
    };

    it('should return period with counts when found', async () => {
      prismaClient.attendancePeriod.findUnique.mockResolvedValue(mockPeriod);

      const result = await service.findOne(periodId);

      expect(result).toEqual(mockPeriod);
      expect(prismaClient.attendancePeriod.findUnique).toHaveBeenCalledWith({
        where: { id: periodId },
        include: {
          createdBy: { select: { id: true, username: true } },
          processedBy: { select: { id: true, username: true } },
          _count: {
            select: {
              attendances: true,
              overtimes: true,
              reimbursements: true,
              payslips: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when period not found', async () => {
      prismaClient.attendancePeriod.findUnique.mockResolvedValue(null);

      await expect(service.findOne(periodId)).rejects.toThrow(
        new NotFoundException('Attendance period not found'),
      );
    });
  });

  describe('findCurrent', () => {
    const mockCurrentPeriod = {
      id: 'current-period',
      name: 'Current Period',
      isActive: true,
      createdBy: { id: 'user-1', username: 'admin' },
    };

    it('should return current active period', async () => {
      prismaClient.attendancePeriod.findFirst.mockResolvedValue(
        mockCurrentPeriod,
      );

      const result = await service.findCurrent();

      expect(result).toEqual(mockCurrentPeriod);
      expect(prismaClient.attendancePeriod.findFirst).toHaveBeenCalledWith({
        where: { isActive: true },
        include: {
          createdBy: { select: { id: true, username: true } },
        },
      });
    });

    it('should throw NotFoundException when no active period found', async () => {
      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);

      await expect(service.findCurrent()).rejects.toThrow(
        new NotFoundException('No active period found'),
      );
    });
  });

  describe('update', () => {
    const periodId = 'period-123';
    const updatedById = 'user-456';
    const existingPeriod = {
      id: periodId,
      name: 'Old Name',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      isActive: false,
      payrollProcessed: false,
    };

    const updateDto: UpdateAttendancePeriodDto = {
      name: 'Updated Q1 2024',
      startDate: '2024-01-15',
      endDate: '2024-03-15',
      isActive: true,
    };

    const mockUpdatedPeriod = {
      ...existingPeriod,
      name: 'Updated Q1 2024',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      isActive: true,
      updatedById,
      createdBy: { id: 'user-1', username: 'admin' },
      updatedBy: { id: updatedById, username: 'updater' },
    };

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue(existingPeriod as any);
    });

    it('should update attendance period successfully', async () => {
      prismaClient.attendancePeriod.updateMany.mockResolvedValue({ count: 1 });
      prismaClient.attendancePeriod.update.mockResolvedValue(mockUpdatedPeriod);
      auditService.logAudit.mockResolvedValue(undefined);

      const result = await service.update(periodId, updateDto, updatedById);

      expect(result).toEqual(mockUpdatedPeriod);
      expect(prismaClient.attendancePeriod.update).toHaveBeenCalledWith({
        where: { id: periodId },
        data: {
          name: 'Updated Q1 2024',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-03-15'),
          isActive: true,
          updatedById,
        },
        include: {
          createdBy: { select: { id: true, username: true } },
          updatedBy: { select: { id: true, username: true } },
        },
      });
    });

    it('should throw BadRequestException when trying to update processed period', async () => {
      const processedPeriod = { ...existingPeriod, payrollProcessed: true };
      jest.spyOn(service, 'findOne').mockResolvedValue(processedPeriod as any);

      await expect(
        service.update(periodId, updateDto, updatedById),
      ).rejects.toThrow(
        new BadRequestException('Cannot update period that has been processed'),
      );

      expect(prismaClient.attendancePeriod.update).not.toHaveBeenCalled();
    });

    it('should validate date range when updating dates', async () => {
      const invalidUpdateDto: UpdateAttendancePeriodDto = {
        startDate: '2024-03-31',
        endDate: '2024-01-01',
      };

      await expect(
        service.update(periodId, invalidUpdateDto, updatedById),
      ).rejects.toThrow(
        new BadRequestException('Start date must be before end date'),
      );
    });

    it('should deactivate other periods when setting as active', async () => {
      prismaClient.attendancePeriod.updateMany.mockResolvedValue({ count: 2 });
      prismaClient.attendancePeriod.update.mockResolvedValue(mockUpdatedPeriod);
      auditService.logAudit.mockResolvedValue(undefined);

      await service.update(periodId, { isActive: true }, updatedById);

      expect(prismaClient.attendancePeriod.updateMany).toHaveBeenCalledWith({
        where: { id: { not: periodId }, isActive: true },
        data: { isActive: false },
      });
    });

    it('should not deactivate other periods when not setting as active', async () => {
      prismaClient.attendancePeriod.update.mockResolvedValue(mockUpdatedPeriod);
      auditService.logAudit.mockResolvedValue(undefined);

      await service.update(periodId, { name: 'New Name' }, updatedById);

      expect(prismaClient.attendancePeriod.updateMany).not.toHaveBeenCalled();
    });

    it('should handle partial updates correctly', async () => {
      const partialUpdate: UpdateAttendancePeriodDto = {
        name: 'Partially Updated',
      };

      const partiallyUpdatedPeriod = {
        ...existingPeriod,
        name: 'Partially Updated',
        updatedById,
      };

      prismaClient.attendancePeriod.update.mockResolvedValue(
        partiallyUpdatedPeriod as any,
      );
      auditService.logAudit.mockResolvedValue(undefined);

      await service.update(periodId, partialUpdate, updatedById);

      expect(prismaClient.attendancePeriod.update).toHaveBeenCalledWith({
        where: { id: periodId },
        data: {
          name: 'Partially Updated',
          startDate: undefined,
          endDate: undefined,
          isActive: undefined,
          updatedById,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    const periodId = 'period-123';
    const existingPeriod = {
      id: periodId,
      name: 'Q1 2024',
      payrollProcessed: false,
    };

    beforeEach(() => {
      jest.spyOn(service, 'findOne').mockResolvedValue(existingPeriod as any);
    });

    it('should delete attendance period successfully when no related records exist', async () => {
      prismaClient.attendance.findMany.mockResolvedValue([]);
      prismaClient.overtime.findMany.mockResolvedValue([]);
      auditService.logAudit.mockResolvedValue(undefined);

      const result = await service.remove(periodId);

      expect(result).toEqual({ message: 'Period deleted successfully' });
      expect(prismaClient.attendancePeriod.delete).toHaveBeenCalledWith({
        where: { id: periodId },
      });
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'attendance-periods',
        periodId,
        AuditAction.DELETE,
        null,
        null,
        null,
      );
    });

    it('should throw BadRequestException when trying to delete processed period', async () => {
      const processedPeriod = { ...existingPeriod, payrollProcessed: true };
      jest.spyOn(service, 'findOne').mockResolvedValue(processedPeriod as any);

      await expect(service.remove(periodId)).rejects.toThrow(
        new BadRequestException('Cannot delete processed period'),
      );

      expect(prismaClient.attendance.findMany).not.toHaveBeenCalled();
      expect(prismaClient.attendancePeriod.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when attendance records exist', async () => {
      const mockAttendances = [{ id: 'att-1', attendancePeriodId: periodId }];

      prismaClient.attendance.findMany.mockResolvedValue(mockAttendances);
      prismaClient.overtime.findMany.mockResolvedValue([]);

      await expect(service.remove(periodId)).rejects.toThrow(
        new BadRequestException('Cannot delete period with existing records'),
      );

      expect(prismaClient.attendancePeriod.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when overtime records exist', async () => {
      const mockOvertimes = [{ id: 'ot-1', attendancePeriodId: periodId }];

      prismaClient.attendance.findMany.mockResolvedValue([]);
      prismaClient.overtime.findMany.mockResolvedValue(mockOvertimes);

      await expect(service.remove(periodId)).rejects.toThrow(
        new BadRequestException('Cannot delete period with existing records'),
      );

      expect(prismaClient.attendancePeriod.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when both attendance and overtime records exist', async () => {
      const mockAttendances = [{ id: 'att-1', attendancePeriodId: periodId }];
      const mockOvertimes = [{ id: 'ot-1', attendancePeriodId: periodId }];

      prismaClient.attendance.findMany.mockResolvedValue(mockAttendances);
      prismaClient.overtime.findMany.mockResolvedValue(mockOvertimes);

      await expect(service.remove(periodId)).rejects.toThrow(
        new BadRequestException('Cannot delete period with existing records'),
      );

      expect(prismaClient.attendancePeriod.delete).not.toHaveBeenCalled();
    });
  });

  describe('Error propagation', () => {
    it('should propagate database errors during creation', async () => {
      const createDto: CreateAttendancePeriodDto = {
        name: 'Test Period',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);
      prismaClient.attendancePeriod.updateMany.mockResolvedValue({ count: 0 });
      prismaClient.attendancePeriod.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should propagate database errors during findAll', async () => {
      prismaClient.attendancePeriod.findMany.mockRejectedValue(
        new Error('Connection error'),
      );

      await expect(service.findAll()).rejects.toThrow('Connection error');
    });

    it('should propagate audit service errors', async () => {
      const createDto: CreateAttendancePeriodDto = {
        name: 'Test Period',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
      };

      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);
      prismaClient.attendancePeriod.updateMany.mockResolvedValue({ count: 0 });
      prismaClient.attendancePeriod.create.mockResolvedValue({} as any);
      auditService.logAudit.mockRejectedValue(new Error('Audit service error'));

      await expect(service.create(createDto, 'user-123')).rejects.toThrow(
        'Audit service error',
      );
    });
  });
});
