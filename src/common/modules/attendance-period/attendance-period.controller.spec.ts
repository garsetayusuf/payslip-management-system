import { Test, TestingModule } from '@nestjs/testing';
import { AttendancePeriodController } from './attendance-period.controller';
import { AttendancePeriodService } from './attendance-period.service';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period.dto';
import { UpdateAttendancePeriodDto } from './dto/update-attendance-period.dto';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { PaginationQueryDto } from 'src/helpers/pagination-query.dto';

describe('AttendancePeriodController', () => {
  let controller: AttendancePeriodController;
  let service: AttendancePeriodService;

  // Mock data
  const mockAttendancePeriod = {
    id: '1',
    name: 'Test Period',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-id-1',
    updatedBy: 'user-id-1',
  };

  const mockCurrentPeriod = {
    id: '2',
    name: 'Current Period',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-30'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-id-1',
    updatedBy: 'user-id-1',
  };

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    role: UserRole.ADMIN,
  };

  const mockAuthenticatedRequest: AuthenticatedRequest = {
    user: mockUser,
  } as AuthenticatedRequest;

  // Mock service
  const mockAttendancePeriodService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findCurrent: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendancePeriodController],
      providers: [
        {
          provide: AttendancePeriodService,
          useValue: mockAttendancePeriodService,
        },
      ],
    }).compile();

    controller = module.get<AttendancePeriodController>(
      AttendancePeriodController,
    );
    service = module.get<AttendancePeriodService>(AttendancePeriodService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new attendance period', async () => {
      const createDto: CreateAttendancePeriodDto = {
        name: 'Test Period',
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-01-31').toISOString(),
        isActive: true,
      };

      mockAttendancePeriodService.create.mockResolvedValue(
        mockAttendancePeriod,
      );

      const result = await controller.create(
        createDto,
        mockAuthenticatedRequest,
      );

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result).toEqual(mockAttendancePeriod);
    });

    it('should handle service errors during creation', async () => {
      const createDto: CreateAttendancePeriodDto = {
        name: 'Test Period',
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-01-31').toISOString(),
        isActive: true,
      };

      const error = new Error('Creation failed');
      mockAttendancePeriodService.create.mockRejectedValue(error);

      await expect(
        controller.create(createDto, mockAuthenticatedRequest),
      ).rejects.toThrow('Creation failed');

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return paginated attendance periods', async () => {
      const query: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const paginatedResult = {
        data: [mockAttendancePeriod],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockAttendancePeriodService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query.page, query.limit);
      expect(result).toEqual(paginatedResult);
    });

    it('should use default pagination when no query provided', async () => {
      const query: PaginationQueryDto = {};
      const paginatedResult = {
        data: [mockAttendancePeriod],
        total: 1,
        page: undefined,
        limit: undefined,
        totalPages: 1,
      };

      mockAttendancePeriodService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(paginatedResult);
    });

    it('should handle service errors during findAll', async () => {
      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const error = new Error('Find all failed');
      mockAttendancePeriodService.findAll.mockRejectedValue(error);

      await expect(controller.findAll(query)).rejects.toThrow(
        'Find all failed',
      );

      expect(service.findAll).toHaveBeenCalledWith(query.page, query.limit);
    });
  });

  describe('findCurrent', () => {
    it('should return current attendance period', async () => {
      mockAttendancePeriodService.findCurrent.mockResolvedValue(
        mockCurrentPeriod,
      );

      const result = await controller.findCurrent();

      expect(service.findCurrent).toHaveBeenCalled();
      expect(result).toEqual(mockCurrentPeriod);
    });

    it('should handle when no current period exists', async () => {
      mockAttendancePeriodService.findCurrent.mockResolvedValue(null);

      const result = await controller.findCurrent();

      expect(service.findCurrent).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle service errors during findCurrent', async () => {
      const error = new Error('Find current failed');
      mockAttendancePeriodService.findCurrent.mockRejectedValue(error);

      await expect(controller.findCurrent()).rejects.toThrow(
        'Find current failed',
      );

      expect(service.findCurrent).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a specific attendance period', async () => {
      const id = '1';
      mockAttendancePeriodService.findOne.mockResolvedValue(
        mockAttendancePeriod,
      );

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockAttendancePeriod);
    });

    it('should handle when period not found', async () => {
      const id = 'non-existent-id';
      mockAttendancePeriodService.findOne.mockResolvedValue(null);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });

    it('should handle service errors during findOne', async () => {
      const id = '1';
      const error = new Error('Find one failed');
      mockAttendancePeriodService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(id)).rejects.toThrow('Find one failed');

      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update an attendance period', async () => {
      const id = '1';
      const updateDto: UpdateAttendancePeriodDto = {
        name: 'Updated Period',
        isActive: false,
      };

      const updatedPeriod = {
        ...mockAttendancePeriod,
        ...updateDto,
        updatedBy: mockUser.id,
      };

      mockAttendancePeriodService.update.mockResolvedValue(updatedPeriod);

      const result = await controller.update(
        id,
        updateDto,
        mockAuthenticatedRequest,
      );

      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockUser.id);
      expect(result).toEqual(updatedPeriod);
    });

    it('should handle partial updates', async () => {
      const id = '1';
      const updateDto: UpdateAttendancePeriodDto = {
        name: 'Partially Updated Period',
      };

      const updatedPeriod = {
        ...mockAttendancePeriod,
        name: updateDto.name,
        updatedBy: mockUser.id,
      };

      mockAttendancePeriodService.update.mockResolvedValue(updatedPeriod);

      const result = await controller.update(
        id,
        updateDto,
        mockAuthenticatedRequest,
      );

      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockUser.id);
      expect(result).toEqual(updatedPeriod);
    });

    it('should handle service errors during update', async () => {
      const id = '1';
      const updateDto: UpdateAttendancePeriodDto = {
        name: 'Updated Period',
      };

      const error = new Error('Update failed');
      mockAttendancePeriodService.update.mockRejectedValue(error);

      await expect(
        controller.update(id, updateDto, mockAuthenticatedRequest),
      ).rejects.toThrow('Update failed');

      expect(service.update).toHaveBeenCalledWith(id, updateDto, mockUser.id);
    });
  });

  describe('remove', () => {
    it('should delete an attendance period', async () => {
      const id = '1';
      const deleteResult = { message: 'Period deleted successfully' };

      mockAttendancePeriodService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(deleteResult);
    });

    it('should handle service errors during removal', async () => {
      const id = '1';
      const error = new Error('Remove failed');
      mockAttendancePeriodService.remove.mockRejectedValue(error);

      await expect(controller.remove(id)).rejects.toThrow('Remove failed');

      expect(service.remove).toHaveBeenCalledWith(id);
    });

    it('should handle removal of non-existent period', async () => {
      const id = 'non-existent-id';
      const error = new Error('Period not found');
      mockAttendancePeriodService.remove.mockRejectedValue(error);

      await expect(controller.remove(id)).rejects.toThrow('Period not found');

      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('Controller metadata and decorators', () => {
    it('should have proper controller metadata', () => {
      const controllerMetadata = Reflect.getMetadata(
        'path',
        AttendancePeriodController,
      );
      expect(controllerMetadata).toBeDefined();
    });

    it('should have guards applied', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        AttendancePeriodController,
      );
      expect(guards).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty string ID', async () => {
      const id = '';
      const error = new Error('Invalid ID');
      mockAttendancePeriodService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(id)).rejects.toThrow('Invalid ID');
    });

    it('should handle null/undefined in create DTO', async () => {
      const createDto = null as any;
      const error = new Error('Invalid DTO');
      mockAttendancePeriodService.create.mockRejectedValue(error);

      await expect(
        controller.create(createDto, mockAuthenticatedRequest),
      ).rejects.toThrow('Invalid DTO');
    });

    it('should handle null/undefined in update DTO', async () => {
      const id = '1';
      const updateDto = null as any;
      const error = new Error('Invalid DTO');
      mockAttendancePeriodService.update.mockRejectedValue(error);

      await expect(
        controller.update(id, updateDto, mockAuthenticatedRequest),
      ).rejects.toThrow('Invalid DTO');
    });

    it('should handle missing user in authenticated request', () => {
      const createDto: CreateAttendancePeriodDto = {
        name: 'Test Period',
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-01-31').toISOString(),
        isActive: true,
      };

      const invalidRequest = {} as AuthenticatedRequest;

      // This would typically be caught by guards, but testing the controller behavior
      expect(() => {
        controller.create(createDto, invalidRequest);
      }).toThrow();
    });
  });

  describe('Service integration', () => {
    it('should pass correct parameters to service methods', async () => {
      // Test create
      const createDto: CreateAttendancePeriodDto = {
        name: 'Test Period',
        startDate: new Date('2024-01-01').toISOString(),
        endDate: new Date('2024-01-31').toISOString(),
        isActive: true,
      };

      mockAttendancePeriodService.create.mockResolvedValue(
        mockAttendancePeriod,
      );
      await controller.create(createDto, mockAuthenticatedRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(service.create).toHaveBeenCalledTimes(1);

      // Test findAll with pagination
      const query: PaginationQueryDto = { page: 2, limit: 5 };
      mockAttendancePeriodService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 2,
        limit: 5,
        totalPages: 0,
      });
      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(2, 5);

      // Test update
      const updateDto: UpdateAttendancePeriodDto = { name: 'Updated' };
      mockAttendancePeriodService.update.mockResolvedValue(
        mockAttendancePeriod,
      );
      await controller.update('1', updateDto, mockAuthenticatedRequest);

      expect(service.update).toHaveBeenCalledWith('1', updateDto, mockUser.id);
    });
  });
});
