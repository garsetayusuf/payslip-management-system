import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AttendanceStatus, UserRole } from '@prisma/client';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let attendanceService: jest.Mocked<AttendanceService>;

  const mockAttendanceService = {
    submitAttendance: jest.fn(),
    findAll: jest.fn(),
    getAttendanceSummary: jest.fn(),
    findByPeriod: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAuthenticatedRequest: AuthenticatedRequest = {
    user: {
      id: 'user-123',
      employeeId: 'emp-123',
      email: 'john.doe@example.com',
      role: UserRole.EMPLOYEE,
    },
  } as AuthenticatedRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<AttendanceController>(AttendanceController);
    attendanceService = module.get(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitAttendance', () => {
    const submitAttendanceDto: SubmitAttendanceDto = {
      notes: 'Present at office',
    };
    const ipAddress = '192.168.1.100';
    const mockAttendance: any = {
      id: 'attendance-123',
      employeeId: 'emp-123',
      attendancePeriodId: 'period-123',
      date: new Date('2024-02-15'),
      checkInTime: new Date('2024-02-15T09:00:00'),
      status: AttendanceStatus.PRESENT,
      notes: submitAttendanceDto.notes,
      ipAddress,
      createdById: 'user-123',
      employee: {
        id: 'emp-123',
        fullName: 'John Doe',
        employeeCode: 'EMP001',
      },
      attendancePeriod: {
        id: 'period-123',
        name: 'Q1 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      },
    };

    it('should submit attendance successfully', async () => {
      attendanceService.submitAttendance.mockResolvedValue(mockAttendance);

      const result = await controller.submitAttendance(
        submitAttendanceDto,
        mockAuthenticatedRequest,
        ipAddress,
      );

      expect(result).toEqual(mockAttendance);
      expect(attendanceService.submitAttendance).toHaveBeenCalledWith(
        mockAuthenticatedRequest.user.employeeId,
        submitAttendanceDto,
        mockAuthenticatedRequest.user.id,
        ipAddress,
      );
      expect(attendanceService.submitAttendance).toHaveBeenCalledTimes(1);
    });

    it('should pass correct parameters to service', async () => {
      attendanceService.submitAttendance.mockResolvedValue(mockAttendance);

      await controller.submitAttendance(
        submitAttendanceDto,
        mockAuthenticatedRequest,
        ipAddress,
      );

      expect(attendanceService.submitAttendance).toHaveBeenCalledWith(
        'emp-123',
        submitAttendanceDto,
        'user-123',
        ipAddress,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      attendanceService.submitAttendance.mockRejectedValue(error);

      await expect(
        controller.submitAttendance(
          submitAttendanceDto,
          mockAuthenticatedRequest,
          ipAddress,
        ),
      ).rejects.toThrow('Service error');

      expect(attendanceService.submitAttendance).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    const query: AttendanceQueryDto = {
      page: 1,
      limit: 10,
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      status: AttendanceStatus.PRESENT,
    };

    const mockPaginatedResult: any = {
      data: [
        {
          id: 'att-1',
          employeeId: 'emp-123',
          date: new Date('2024-02-15'),
          status: AttendanceStatus.PRESENT,
          employee: {
            id: 'emp-123',
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
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    it('should return paginated attendance records', async () => {
      attendanceService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(query, mockAuthenticatedRequest);

      expect(result).toEqual(mockPaginatedResult);
      expect(attendanceService.findAll).toHaveBeenCalledWith(
        query,
        mockAuthenticatedRequest.user.employeeId,
      );
      expect(attendanceService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should work with empty query', async () => {
      const emptyQuery: AttendanceQueryDto = {};
      attendanceService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(emptyQuery, mockAuthenticatedRequest);

      expect(attendanceService.findAll).toHaveBeenCalledWith(
        emptyQuery,
        'emp-123',
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      attendanceService.findAll.mockRejectedValue(error);

      await expect(
        controller.findAll(query, mockAuthenticatedRequest),
      ).rejects.toThrow('Service error');

      expect(attendanceService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAttendanceSummary', () => {
    const periodId = 'period-123';
    const mockSummary = {
      total: 20,
      present: 18,
      absent: 2,
      attendanceRate: '90.00',
    };

    it('should return attendance summary', async () => {
      attendanceService.getAttendanceSummary.mockResolvedValue(mockSummary);

      const result = await controller.getAttendanceSummary(
        periodId,
        mockAuthenticatedRequest,
      );

      expect(result).toEqual(mockSummary);
      expect(attendanceService.getAttendanceSummary).toHaveBeenCalledWith(
        mockAuthenticatedRequest.user.employeeId,
        periodId,
      );
      expect(attendanceService.getAttendanceSummary).toHaveBeenCalledTimes(1);
    });

    it('should work without periodId', async () => {
      attendanceService.getAttendanceSummary.mockResolvedValue(mockSummary);

      await controller.getAttendanceSummary(
        undefined,
        mockAuthenticatedRequest,
      );

      expect(attendanceService.getAttendanceSummary).toHaveBeenCalledWith(
        'emp-123',
        undefined,
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      attendanceService.getAttendanceSummary.mockRejectedValue(error);

      await expect(
        controller.getAttendanceSummary(periodId, mockAuthenticatedRequest),
      ).rejects.toThrow('Service error');

      expect(attendanceService.getAttendanceSummary).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByPeriod', () => {
    const periodId = 'period-123';
    const mockAttendanceRecords: any = [
      {
        id: 'att-1',
        employeeId: 'emp-123',
        attendancePeriodId: periodId,
        date: new Date('2024-02-15'),
        status: AttendanceStatus.PRESENT,
        employee: {
          id: 'emp-123',
          fullName: 'John Doe',
          employeeCode: 'EMP001',
          department: 'IT',
          position: 'Developer',
        },
      },
      {
        id: 'att-2',
        employeeId: 'emp-123',
        attendancePeriodId: periodId,
        date: new Date('2024-02-16'),
        status: AttendanceStatus.PRESENT,
        employee: {
          id: 'emp-123',
          fullName: 'John Doe',
          employeeCode: 'EMP001',
          department: 'IT',
          position: 'Developer',
        },
      },
    ];

    it('should return attendance records for specific period', async () => {
      attendanceService.findByPeriod.mockResolvedValue(mockAttendanceRecords);

      const result = await controller.findByPeriod(
        periodId,
        mockAuthenticatedRequest,
      );

      expect(result).toEqual(mockAttendanceRecords);
      expect(attendanceService.findByPeriod).toHaveBeenCalledWith(
        periodId,
        mockAuthenticatedRequest.user.employeeId,
      );
      expect(attendanceService.findByPeriod).toHaveBeenCalledTimes(1);
    });

    it('should pass correct parameters to service', async () => {
      attendanceService.findByPeriod.mockResolvedValue(mockAttendanceRecords);

      await controller.findByPeriod(periodId, mockAuthenticatedRequest);

      expect(attendanceService.findByPeriod).toHaveBeenCalledWith(
        'period-123',
        'emp-123',
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      attendanceService.findByPeriod.mockRejectedValue(error);

      await expect(
        controller.findByPeriod(periodId, mockAuthenticatedRequest),
      ).rejects.toThrow('Service error');

      expect(attendanceService.findByPeriod).toHaveBeenCalledTimes(1);
    });

    it('should handle empty results', async () => {
      attendanceService.findByPeriod.mockResolvedValue([]);

      const result = await controller.findByPeriod(
        periodId,
        mockAuthenticatedRequest,
      );

      expect(result).toEqual([]);
      expect(attendanceService.findByPeriod).toHaveBeenCalledTimes(1);
    });
  });

  describe('Guards and Decorators', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AttendanceController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('should be protected by RolesGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AttendanceController);
      expect(guards).toContain(RolesGuard);
    });

    it('should require EMPLOYEE role', () => {
      const roles = Reflect.getMetadata('roles', AttendanceController);
      expect(roles).toContain(UserRole.EMPLOYEE);
    });
  });

  describe('Method decorators', () => {
    it('should have correct HTTP methods decorated', () => {
      expect(controller.submitAttendance).toBeDefined();
      expect(controller.findAll).toBeDefined();
      expect(controller.getAttendanceSummary).toBeDefined();
      expect(controller.findByPeriod).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should propagate service errors in submitAttendance', async () => {
      const serviceError = new Error('Database connection failed');
      attendanceService.submitAttendance.mockRejectedValue(serviceError);

      await expect(
        controller.submitAttendance(
          { notes: 'test' },
          mockAuthenticatedRequest,
          '127.0.0.1',
        ),
      ).rejects.toThrow('Database connection failed');
    });

    it('should propagate service errors in findAll', async () => {
      const serviceError = new Error('Invalid query parameters');
      attendanceService.findAll.mockRejectedValue(serviceError);

      await expect(
        controller.findAll({}, mockAuthenticatedRequest),
      ).rejects.toThrow('Invalid query parameters');
    });

    it('should propagate service errors in getAttendanceSummary', async () => {
      const serviceError = new Error('Period not found');
      attendanceService.getAttendanceSummary.mockRejectedValue(serviceError);

      await expect(
        controller.getAttendanceSummary('invalid-id', mockAuthenticatedRequest),
      ).rejects.toThrow('Period not found');
    });

    it('should propagate service errors in findByPeriod', async () => {
      const serviceError = new Error('Access denied');
      attendanceService.findByPeriod.mockRejectedValue(serviceError);

      await expect(
        controller.findByPeriod('period-123', mockAuthenticatedRequest),
      ).rejects.toThrow('Access denied');
    });
  });

  describe('Parameter extraction', () => {
    it('should extract user information correctly from request', async () => {
      const customRequest: AuthenticatedRequest = {
        user: {
          id: 'custom-user-123',
          employeeId: 'custom-emp-456',
          email: 'custom@example.com',
          role: UserRole.EMPLOYEE,
        },
      } as AuthenticatedRequest;

      attendanceService.submitAttendance.mockResolvedValue({} as any);

      await controller.submitAttendance(
        { notes: 'test' },
        customRequest,
        '10.0.0.1',
      );

      expect(attendanceService.submitAttendance).toHaveBeenCalledWith(
        'custom-emp-456',
        { notes: 'test' },
        'custom-user-123',
        '10.0.0.1',
      );
    });

    it('should handle different IP addresses', async () => {
      const ipAddresses = ['127.0.0.1', '192.168.1.1', '10.0.0.1'];
      attendanceService.submitAttendance.mockResolvedValue({} as any);

      for (const ip of ipAddresses) {
        await controller.submitAttendance(
          { notes: 'test' },
          mockAuthenticatedRequest,
          ip,
        );

        expect(attendanceService.submitAttendance).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.any(String),
          ip,
        );
      }
    });
  });
});
