import { Test, TestingModule } from '@nestjs/testing';
import { OvertimeController } from './overtime.controller';
import { OvertimeService } from './overtime.service';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { UpdateOvertimeDto } from './dto/update-overtime.dto';
import { OvertimeQueryDto } from './dto/overtime-query.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { UserRole } from '@prisma/client';
import { UpdateOvertimeStatusDto } from './dto/update-overtime-status.dto';

// Mock data
const mockOvertimeResponse = {
  id: 'overtime-123',
  employeeId: 'emp-123',
  attendancePeriodId: 'period-123',
  date: new Date('2023-10-01'),
  startTime: '18:00',
  endTime: '20:00',
  hoursWorked: 2,
  reason: 'Project deadline',
  description: 'Need to finish the project',
  status: 'PENDING',
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

const mockAuthenticatedRequest: AuthenticatedRequest = {
  user: {
    id: 'user-123',
    email: 'user@example.com',
    role: UserRole.EMPLOYEE,
    employeeId: 'emp-123',
  },
} as AuthenticatedRequest;

const mockOvertimeService = {
  create: jest.fn(),
  findAllByEmployee: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  updateStatus: jest.fn(),
};

describe('OvertimeController', () => {
  let controller: OvertimeController;
  let service: OvertimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OvertimeController],
      providers: [
        {
          provide: OvertimeService,
          useValue: mockOvertimeService,
        },
      ],
    }).compile();

    controller = module.get<OvertimeController>(OvertimeController);
    service = module.get<OvertimeService>(OvertimeService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new overtime request', async () => {
      const createOvertimeDto: CreateOvertimeDto = {
        date: '2023-10-01',
        startTime: '18:00',
        endTime: '20:00',
        hoursWorked: 2,
        reason: 'Project deadline',
        description: 'Need to finish the project',
      };

      const ipAddress = '192.168.1.1';

      mockOvertimeService.create.mockResolvedValue(mockOvertimeResponse);

      const result = await controller.create(
        createOvertimeDto,
        mockAuthenticatedRequest,
        ipAddress,
      );

      expect(service.create).toHaveBeenCalledWith(
        mockAuthenticatedRequest.user.employeeId,
        createOvertimeDto,
        ipAddress,
        mockAuthenticatedRequest.user.id,
      );
      expect(result).toEqual(mockOvertimeResponse);
    });

    it('should handle service errors during creation', async () => {
      const createOvertimeDto: CreateOvertimeDto = {
        date: '2023-10-01',
        startTime: '18:00',
        endTime: '20:00',
        hoursWorked: 2,
        reason: 'Project deadline',
        description: 'Need to finish the project',
      };

      const ipAddress = '192.168.1.1';

      const error = new Error('Database connection failed');
      mockOvertimeService.create.mockRejectedValue(error);

      await expect(
        controller.create(
          createOvertimeDto,
          mockAuthenticatedRequest,
          ipAddress,
        ),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('findAll', () => {
    it('should return all overtime records with default query', async () => {
      const query: OvertimeQueryDto = {
        employeeId: 'emp-123',
      };

      const expectedResult = {
        data: [mockOvertimeResponse],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockOvertimeService.findAllByEmployee.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAllByEmployee).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors during findAll', async () => {
      const query: OvertimeQueryDto = {
        employeeId: 'emp-123',
      };

      const error = new Error('Database query failed');
      mockOvertimeService.findAllByEmployee.mockRejectedValue(error);

      await expect(controller.findAll(query)).rejects.toThrow(
        'Database query failed',
      );
    });
  });

  describe('findOne', () => {
    it('should return a single overtime record by id', async () => {
      const id = 'overtime-123';

      mockOvertimeService.findOne.mockResolvedValue(mockOvertimeResponse);

      const result = await controller.findOne(id, mockAuthenticatedRequest);

      expect(service.findOne).toHaveBeenCalledWith(
        id,
        mockAuthenticatedRequest.user.employeeId,
      );
      expect(result).toEqual(mockOvertimeResponse);
    });

    it('should handle service errors when overtime not found', async () => {
      const id = 'non-existent-id';

      const error = new Error('Overtime not found');
      mockOvertimeService.findOne.mockRejectedValue(error);

      await expect(
        controller.findOne(id, mockAuthenticatedRequest),
      ).rejects.toThrow('Overtime not found');
    });
  });

  describe('update', () => {
    it('should update an overtime request', async () => {
      const id = 'overtime-123';
      const updateOvertimeDto: UpdateOvertimeDto = {
        startTime: '19:00',
        endTime: '21:00',
        hoursWorked: 2,
        reason: 'Updated reason',
        description: 'Updated description',
      };

      const ipAddress = '192.168.1.1';

      const updatedOvertimeResponse = {
        ...mockOvertimeResponse,
        ...updateOvertimeDto,
      };

      mockOvertimeService.update.mockResolvedValue(updatedOvertimeResponse);

      const result = await controller.update(
        id,
        updateOvertimeDto,
        mockAuthenticatedRequest,
        ipAddress,
      );

      expect(service.update).toHaveBeenCalledWith(
        id,
        mockAuthenticatedRequest.user.employeeId,
        updateOvertimeDto,
        ipAddress,
        mockAuthenticatedRequest.user.id,
      );
      expect(result).toEqual(updatedOvertimeResponse);
    });

    it('should handle service errors during update', async () => {
      const id = 'overtime-123';
      const updateOvertimeDto: UpdateOvertimeDto = {
        startTime: '19:00',
        endTime: '21:00',
        hoursWorked: 2,
        reason: 'Updated reason',
        description: 'Updated description',
      };

      const ipAddress = '192.168.1.1';

      const error = new Error('Update failed');
      mockOvertimeService.update.mockRejectedValue(error);

      await expect(
        controller.update(
          id,
          updateOvertimeDto,
          mockAuthenticatedRequest,
          ipAddress,
        ),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('remove', () => {
    it('should delete an overtime request', async () => {
      const id = 'overtime-123';

      mockOvertimeService.remove.mockResolvedValue(undefined);

      await expect(
        controller.remove(id, mockAuthenticatedRequest),
      ).resolves.not.toThrow();

      expect(service.remove).toHaveBeenCalledWith(
        id,
        mockAuthenticatedRequest.user.employeeId,
      );
    });

    it('should handle service errors during deletion', async () => {
      const id = 'overtime-123';

      const error = new Error('Deletion failed');
      mockOvertimeService.remove.mockRejectedValue(error);

      await expect(
        controller.remove(id, mockAuthenticatedRequest),
      ).rejects.toThrow('Deletion failed');
    });
  });

  describe('updateStatus', () => {
    it('should update the status of an overtime request', async () => {
      const id = 'overtime-123';
      const updateOvertimeStatusDto: UpdateOvertimeStatusDto = {
        status: 'APPROVED',
      };

      const ipAddress = '192.168.1.1';

      const updatedOvertimeResponse = {
        ...mockOvertimeResponse,
        status: 'APPROVED',
      };

      mockOvertimeService.updateStatus.mockResolvedValue(
        updatedOvertimeResponse,
      );

      const result = await controller.updateStatus(
        id,
        updateOvertimeStatusDto,
        mockAuthenticatedRequest,
        ipAddress,
      );

      expect(service.updateStatus).toHaveBeenCalledWith(
        id,
        updateOvertimeStatusDto,
        mockAuthenticatedRequest.user.id,
        ipAddress,
      );
      expect(result).toEqual(updatedOvertimeResponse);
    });

    it('should handle service errors during status update', async () => {
      const id = 'overtime-123';
      const updateOvertimeStatusDto: UpdateOvertimeStatusDto = {
        status: 'APPROVED',
      };

      const ipAddress = '192.168.1.1';

      const error = new Error('Update status failed');
      mockOvertimeService.updateStatus.mockRejectedValue(error);

      await expect(
        controller.updateStatus(
          id,
          updateOvertimeStatusDto,
          mockAuthenticatedRequest,
          ipAddress,
        ),
      ).rejects.toThrow('Update status failed');
    });
  });
});
