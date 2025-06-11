import { Test, TestingModule } from '@nestjs/testing';
import { OvertimeService } from './overtime.service';
import { AuditService } from '../audit/audit.service';
import { PrismaClient, OvertimeStatus } from '@prisma/client';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { UpdateOvertimeDto } from './dto/update-overtime.dto';
import { OvertimeQueryDto } from './dto/overtime-query.dto';
import { UpdateOvertimeStatusDto } from './dto/update-overtime-status.dto';

// Mock data
const mockOvertime = {
  id: 'overtime-123',
  employeeId: 'emp-123',
  attendancePeriodId: 'period-123',
  date: new Date('2023-10-01'),
  startTime: '18:00',
  endTime: '20:00',
  hoursWorked: 2,
  reason: 'Project deadline',
  description: 'Need to finish the project',
  status: OvertimeStatus.PENDING,
  hasAttendance: true,
  submittedAt: new Date(),
  createdById: 'user-123',
  employee: {
    id: 'emp-123',
    fullName: 'John Doe',
    employeeCode: 'EMP001',
    department: 'IT',
    position: 'Developer',
  },
  attendancePeriod: {
    id: 'period-123',
    name: 'October Period',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-10-31'),
  },
};

const mockCreateOvertimeDto: CreateOvertimeDto = {
  date: '2023-10-01',
  startTime: '18:00',
  endTime: '20:00',
  hoursWorked: 2,
  reason: 'Project deadline',
  description: 'Need to finish the project',
};

const mockUpdateOvertimeDto: UpdateOvertimeDto = {
  startTime: '19:00',
  endTime: '21:00',
  hoursWorked: 2,
  reason: 'Updated reason',
  description: 'Updated description',
};

const mockUpdateOvertimeStatusDto: UpdateOvertimeStatusDto = {
  status: OvertimeStatus.APPROVED,
};

const mockPrismaClient = {
  employee: {
    findUnique: jest.fn(),
  },
  attendancePeriod: {
    findFirst: jest.fn(),
  },
  overtime: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  attendance: {
    findUnique: jest.fn(),
  },
};

const mockAuditService = {
  logAudit: jest.fn(),
};

describe('OvertimeService', () => {
  let service: OvertimeService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OvertimeService,
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

    service = module.get<OvertimeService>(OvertimeService);
    prisma = module.get(PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create overtime successfully', async () => {
      const employeeId = 'emp-123';
      const ipAddress = '192.168.1.1';
      const userId = 'user-123';

      prisma.employee.findUnique.mockResolvedValue({
        id: employeeId,
        employeeCode: 'EMP001',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        status: 'ACTIVE',
      });

      prisma.attendancePeriod.findFirst.mockResolvedValue({
        id: 'period-123',
        isActive: true,
        status: 'ACTIVE',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2023-10-31'),
      });

      prisma.overtime.findUnique.mockResolvedValue(null);

      prisma.attendance.findUnique.mockResolvedValue({
        employeeId,
        date: new Date('2023-10-01'),
        status: 'PRESENT',
      });

      prisma.overtime.create.mockResolvedValue(mockOvertime);

      const result = await service.create(
        employeeId,
        mockCreateOvertimeDto,
        ipAddress,
        userId,
      );

      expect(result).toBeDefined();
      expect(prisma.overtime.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if employee not found', async () => {
      const employeeId = 'emp-123';
      const ipAddress = '192.168.1.1';
      const userId = 'user-123';

      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(
        service.create(employeeId, mockCreateOvertimeDto, ipAddress, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if employee is not active', async () => {
      const employeeId = 'emp-123';
      const ipAddress = '192.168.1.1';
      const userId = 'user-123';

      prisma.employee.findUnique.mockResolvedValue({
        id: employeeId,
        employeeCode: 'EMP001',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        status: 'INACTIVE',
      });

      await expect(
        service.create(employeeId, mockCreateOvertimeDto, ipAddress, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no active attendance period', async () => {
      const employeeId = 'emp-123';
      const ipAddress = '192.168.1.1';
      const userId = 'user-123';

      prisma.employee.findUnique.mockResolvedValue({
        id: employeeId,
        employeeCode: 'EMP001',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        status: 'ACTIVE',
      });

      prisma.attendancePeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.create(employeeId, mockCreateOvertimeDto, ipAddress, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByEmployee', () => {
    it('should return a list of overtimes for an employee', async () => {
      const query: OvertimeQueryDto = {
        employeeId: 'emp-123',
        status: OvertimeStatus.PENDING,
        fromDate: '2023-10-01',
        toDate: '2023-10-31',
        page: 1,
        limit: 10,
      };

      prisma.overtime.findMany.mockResolvedValue([mockOvertime]);
      prisma.overtime.count.mockResolvedValue(1);

      const result = await service.findAllByEmployee(query);

      expect(result.data.length).toBe(1);
      expect(prisma.overtime.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single overtime record', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';

      prisma.overtime.findFirst.mockResolvedValue(mockOvertime);

      const result = await service.findOne(id, employeeId);

      expect(result).toBeDefined();
      expect(prisma.overtime.findFirst).toHaveBeenCalledWith({
        where: { id, employeeId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if overtime not found', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';

      prisma.overtime.findFirst.mockResolvedValue(null);

      await expect(service.findOne(id, employeeId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an overtime record', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';
      const ipAddress = '192.168.1.1';
      const userId = 'user-123';

      prisma.overtime.findFirst.mockResolvedValue(mockOvertime);
      prisma.overtime.update.mockResolvedValue({
        ...mockOvertime,
        ...mockUpdateOvertimeDto,
      });

      const result = await service.update(
        id,
        employeeId,
        mockUpdateOvertimeDto,
        ipAddress,
        userId,
      );

      expect(result).toBeDefined();
      expect(prisma.overtime.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if overtime not found', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';
      const ipAddress = '192.168.1.1';
      const userId = 'user-123';

      prisma.overtime.findFirst.mockResolvedValue(null);

      await expect(
        service.update(
          id,
          employeeId,
          mockUpdateOvertimeDto,
          ipAddress,
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if overtime is not pending', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';
      const ipAddress = '192.168.1.1';
      const userId = 'user-123';

      prisma.overtime.findFirst.mockResolvedValue({
        ...mockOvertime,
        status: OvertimeStatus.APPROVED,
      });

      await expect(
        service.update(
          id,
          employeeId,
          mockUpdateOvertimeDto,
          ipAddress,
          userId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete an overtime record', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';

      prisma.overtime.findFirst.mockResolvedValue(mockOvertime);
      prisma.overtime.delete.mockResolvedValue(mockOvertime);

      await expect(service.remove(id, employeeId)).resolves.not.toThrow();
      expect(prisma.overtime.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if overtime not found', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';

      prisma.overtime.findFirst.mockResolvedValue(null);

      await expect(service.remove(id, employeeId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if overtime is not pending', async () => {
      const id = 'overtime-123';
      const employeeId = 'emp-123';

      prisma.overtime.findFirst.mockResolvedValue({
        ...mockOvertime,
        status: OvertimeStatus.APPROVED,
      });

      await expect(service.remove(id, employeeId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update the status of an overtime record', async () => {
      const id = 'overtime-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.overtime.findFirst.mockResolvedValue(mockOvertime);
      prisma.overtime.update.mockResolvedValue({
        ...mockOvertime,
        status: OvertimeStatus.APPROVED,
      });

      const result = await service.updateStatus(
        id,
        mockUpdateOvertimeStatusDto,
        userId,
        ipAddress,
      );

      expect(result).toBeDefined();
      expect(prisma.overtime.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if overtime not found', async () => {
      const id = 'overtime-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.overtime.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(
          id,
          mockUpdateOvertimeStatusDto,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if overtime is already approved', async () => {
      const id = 'overtime-123';
      const userId = 'user-123';
      const ipAddress = '192.168.1.1';

      prisma.overtime.findFirst.mockResolvedValue({
        ...mockOvertime,
        status: OvertimeStatus.APPROVED,
      });

      await expect(
        service.updateStatus(
          id,
          mockUpdateOvertimeStatusDto,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
