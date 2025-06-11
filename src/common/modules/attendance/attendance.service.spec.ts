import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuditService } from '../audit/audit.service';
import { AttendanceStatus, AuditAction, PrismaClient } from '@prisma/client';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prismaClient: any;
  let auditService: jest.Mocked<AuditService>;

  const mockPrismaClient = {
    attendancePeriod: {
      findFirst: jest.fn(),
    },
    attendance: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockAuditService = {
    logAudit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
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

    service = module.get<AttendanceService>(AttendanceService);
    prismaClient = module.get(PrismaClient);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAttendance', () => {
    const employeeId = 'emp-123';
    const userId = 'user-123';
    const ipAddress = '127.0.0.1';
    const submitAttendanceDto: SubmitAttendanceDto = {
      notes: 'Test attendance',
    };

    const mockActivePeriod = {
      id: 'period-123',
      name: 'Q1 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      isActive: true,
    };

    const mockAttendance = {
      id: 'attendance-123',
      employeeId,
      attendancePeriodId: mockActivePeriod.id,
      date: new Date('2024-02-15'),
      checkInTime: new Date('2024-02-15T09:00:00'),
      status: AttendanceStatus.PRESENT,
      notes: submitAttendanceDto.notes,
      ipAddress,
      createdById: userId,
      employee: {
        id: employeeId,
        fullName: 'John Doe',
        employeeCode: 'EMP001',
      },
      attendancePeriod: mockActivePeriod,
    };

    beforeEach(() => {
      // Mock current date to be a weekday (Thursday)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-02-15T09:00:00')); // Thursday
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should successfully submit attendance for a valid weekday', async () => {
      prismaClient.attendancePeriod.findFirst.mockResolvedValue(
        mockActivePeriod,
      );
      prismaClient.attendance.findUnique.mockResolvedValue(null);
      prismaClient.attendance.create.mockResolvedValue(mockAttendance);
      auditService.logAudit.mockResolvedValue(undefined);

      const result = await service.submitAttendance(
        employeeId,
        submitAttendanceDto,
        userId,
        ipAddress,
      );

      expect(result).toEqual(mockAttendance);
      expect(prismaClient.attendancePeriod.findFirst).toHaveBeenCalledWith({
        where: {
          isActive: true,
          startDate: { lte: new Date('2024-02-15T00:00:00') },
          endDate: { gte: new Date('2024-02-15T00:00:00') },
        },
      });
      expect(prismaClient.attendance.create).toHaveBeenCalledWith({
        data: {
          employeeId,
          attendancePeriodId: mockActivePeriod.id,
          date: new Date('2024-02-15T00:00:00'),
          checkInTime: new Date('2024-02-15T09:00:00'),
          status: AttendanceStatus.PRESENT,
          notes: submitAttendanceDto.notes,
          ipAddress,
          createdById: userId,
        },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
            },
          },
          attendancePeriod: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'attendances',
        mockAttendance.id,
        AuditAction.CREATE,
        null,
        expect.any(Object),
        userId,
        ipAddress,
      );
    });

    it('should throw BadRequestException when trying to submit attendance on weekend (Saturday)', async () => {
      jest.setSystemTime(new Date('2024-02-17T09:00:00')); // Saturday

      await expect(
        service.submitAttendance(
          employeeId,
          submitAttendanceDto,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(
        new BadRequestException('Cannot submit attendance on weekends'),
      );

      expect(prismaClient.attendancePeriod.findFirst).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to submit attendance on weekend (Sunday)', async () => {
      jest.setSystemTime(new Date('2024-02-18T09:00:00')); // Sunday

      await expect(
        service.submitAttendance(
          employeeId,
          submitAttendanceDto,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(
        new BadRequestException('Cannot submit attendance on weekends'),
      );

      expect(prismaClient.attendancePeriod.findFirst).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no active attendance period found', async () => {
      prismaClient.attendancePeriod.findFirst.mockResolvedValue(null);

      await expect(
        service.submitAttendance(
          employeeId,
          submitAttendanceDto,
          userId,
          ipAddress,
        ),
      ).rejects.toThrow(
        new BadRequestException('No active attendance period found for today'),
      );

      expect(prismaClient.attendance.findUnique).not.toHaveBeenCalled();
    });

    it('should return existing attendance when already submitted for today', async () => {
      const existingAttendance = { ...mockAttendance, id: 'existing-123' };

      prismaClient.attendancePeriod.findFirst.mockResolvedValue(
        mockActivePeriod,
      );
      prismaClient.attendance.findUnique.mockResolvedValue(existingAttendance);

      const result = await service.submitAttendance(
        employeeId,
        submitAttendanceDto,
        userId,
        ipAddress,
      );

      expect(result).toEqual(existingAttendance);
      expect(prismaClient.attendance.create).not.toHaveBeenCalled();
      expect(auditService.logAudit).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockAttendances = [
      {
        id: 'att-1',
        employeeId: 'emp-1',
        date: new Date('2024-02-15'),
        status: AttendanceStatus.PRESENT,
        employee: {
          id: 'emp-1',
          fullName: 'John Doe',
          employeeCode: 'EMP001',
          department: 'IT',
          position: 'Developer',
        },
        attendancePeriod: {
          id: 'period-1',
          name: 'Q1 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
        },
      },
    ];

    it('should return paginated attendance records with default pagination', async () => {
      const query: AttendanceQueryDto = {};
      const totalCount = 1;

      prismaClient.attendance.findMany.mockResolvedValue(mockAttendances);
      prismaClient.attendance.count.mockResolvedValue(totalCount);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: mockAttendances,
        pagination: {
          total: totalCount,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });

      expect(prismaClient.attendance.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              department: true,
              position: true,
            },
          },
          attendancePeriod: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should apply filters correctly', async () => {
      const query: AttendanceQueryDto = {
        page: 2,
        limit: 5,
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        status: AttendanceStatus.PRESENT,
      };
      const employeeId = 'emp-123';

      prismaClient.attendance.findMany.mockResolvedValue(mockAttendances);
      prismaClient.attendance.count.mockResolvedValue(1);

      await service.findAll(query, employeeId);

      expect(prismaClient.attendance.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            lte: new Date('2024-02-28'),
          },
          status: AttendanceStatus.PRESENT,
          employeeId,
        },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              department: true,
              position: true,
            },
          },
          attendancePeriod: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: 5, // (page 2 - 1) * limit 5
        take: 5,
      });
    });
  });

  describe('getAttendanceSummary', () => {
    const employeeId = 'emp-123';
    const periodId = 'period-123';

    it('should return attendance summary with attendance rate', async () => {
      const totalCount = 20;
      const presentCount = 18;
      const absentCount = 2;

      prismaClient.attendance.count
        .mockResolvedValueOnce(totalCount)
        .mockResolvedValueOnce(presentCount)
        .mockResolvedValueOnce(absentCount);

      const result = await service.getAttendanceSummary(employeeId, periodId);

      expect(result).toEqual({
        total: totalCount,
        present: presentCount,
        absent: absentCount,
        attendanceRate: '90.00',
      });

      expect(prismaClient.attendance.count).toHaveBeenCalledTimes(3);
      expect(prismaClient.attendance.count).toHaveBeenNthCalledWith(1, {
        where: { employeeId, attendancePeriodId: periodId },
      });
      expect(prismaClient.attendance.count).toHaveBeenNthCalledWith(2, {
        where: {
          employeeId,
          attendancePeriodId: periodId,
          status: AttendanceStatus.PRESENT,
        },
      });
      expect(prismaClient.attendance.count).toHaveBeenNthCalledWith(3, {
        where: {
          employeeId,
          attendancePeriodId: periodId,
          status: AttendanceStatus.ABSENT,
        },
      });
    });

    it('should return 0.00 attendance rate when total is 0', async () => {
      prismaClient.attendance.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getAttendanceSummary(employeeId);

      expect(result.attendanceRate).toBe('0.00');
    });
  });

  describe('findOne', () => {
    const attendanceId = 'att-123';
    const employeeId = 'emp-123';
    const mockAttendance = {
      id: attendanceId,
      employeeId,
      date: new Date('2024-02-15'),
      status: AttendanceStatus.PRESENT,
      employee: {
        id: employeeId,
        fullName: 'John Doe',
        employeeCode: 'EMP001',
        department: 'IT',
        position: 'Developer',
      },
      attendancePeriod: {
        id: 'period-1',
        name: 'Q1 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      },
    };

    it('should return attendance record when found', async () => {
      prismaClient.attendance.findFirst.mockResolvedValue(mockAttendance);

      const result = await service.findOne(attendanceId, employeeId);

      expect(result).toEqual(mockAttendance);
      expect(prismaClient.attendance.findFirst).toHaveBeenCalledWith({
        where: { id: attendanceId, employeeId },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              department: true,
              position: true,
            },
          },
          attendancePeriod: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when attendance not found', async () => {
      prismaClient.attendance.findFirst.mockResolvedValue(null);

      await expect(service.findOne(attendanceId, employeeId)).rejects.toThrow(
        new NotFoundException('Attendance record not found'),
      );
    });

    it('should work without employeeId filter', async () => {
      prismaClient.attendance.findFirst.mockResolvedValue(mockAttendance);

      await service.findOne(attendanceId);

      expect(prismaClient.attendance.findFirst).toHaveBeenCalledWith({
        where: { id: attendanceId },
        include: expect.any(Object),
      });
    });
  });

  describe('findByPeriod', () => {
    const periodId = 'period-123';
    const employeeId = 'emp-123';
    const mockAttendances = [
      {
        id: 'att-1',
        employeeId,
        attendancePeriodId: periodId,
        date: new Date('2024-02-15'),
        employee: {
          id: employeeId,
          fullName: 'John Doe',
          employeeCode: 'EMP001',
          department: 'IT',
          position: 'Developer',
        },
      },
    ];

    it('should return attendance records for a specific period and employee', async () => {
      prismaClient.attendance.findMany.mockResolvedValue(mockAttendances);

      const result = await service.findByPeriod(periodId, employeeId);

      expect(result).toEqual(mockAttendances);
      expect(prismaClient.attendance.findMany).toHaveBeenCalledWith({
        where: { attendancePeriodId: periodId, employeeId },
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      });
    });

    it('should work without employeeId filter', async () => {
      prismaClient.attendance.findMany.mockResolvedValue(mockAttendances);

      await service.findByPeriod(periodId);

      expect(prismaClient.attendance.findMany).toHaveBeenCalledWith({
        where: { attendancePeriodId: periodId },
        include: expect.any(Object),
        orderBy: { date: 'desc' },
      });
    });
  });
});
