import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { UserRole } from '@prisma/client';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  // Mock data
  const mockEmployee = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    position: 'Software Engineer',
    department: 'IT',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin-id',
    updatedBy: 'admin-id',
  };

  const mockEmployees = [mockEmployee];

  const mockAuthenticatedRequest: AuthenticatedRequest = {
    user: {
      id: 'admin-id',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    },
  } as AuthenticatedRequest;

  const mockEmployeeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new employee', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        position: 'Software Engineer',
        department: 'IT',
        employeeNumber: 'E001',
        monthlySalary: 5000,
        status: 'ACTIVE',
        username: 'test123',
        password: 'password123',
      };

      mockEmployeeService.create.mockResolvedValue(mockEmployee);

      const result = await controller.create(
        createEmployeeDto,
        mockAuthenticatedRequest,
      );

      expect(service.create).toHaveBeenCalledWith(
        createEmployeeDto,
        mockAuthenticatedRequest.user.id,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEmployee);
    });

    it('should handle service errors during creation', async () => {
      const createEmployeeDto: CreateEmployeeDto = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        position: 'Software Engineer',
        department: 'IT',
        employeeNumber: 'E001',
        monthlySalary: 5000,
        status: 'ACTIVE',
        username: 'test123',
        password: 'password123',
      };

      const error = new Error('Database connection failed');
      mockEmployeeService.create.mockRejectedValue(error);

      await expect(
        controller.create(createEmployeeDto, mockAuthenticatedRequest),
      ).rejects.toThrow('Database connection failed');

      expect(service.create).toHaveBeenCalledWith(
        createEmployeeDto,
        mockAuthenticatedRequest.user.id,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all employees with default query', async () => {
      const query: EmployeeQueryDto = {};
      const expectedResult = {
        data: mockEmployees,
        total: 1,
        page: 1,
        limit: 10,
      };

      mockEmployeeService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should return filtered employees with query parameters', async () => {
      const query: EmployeeQueryDto = {
        page: 1,
        limit: 5,
        search: 'John',
      };
      const expectedResult = {
        data: mockEmployees,
        total: 1,
        page: 1,
        limit: 5,
      };

      mockEmployeeService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors during findAll', async () => {
      const query: EmployeeQueryDto = {};
      const error = new Error('Database query failed');
      mockEmployeeService.findAll.mockRejectedValue(error);

      await expect(controller.findAll(query)).rejects.toThrow(
        'Database query failed',
      );

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single employee by id', async () => {
      const employeeId = '1';
      mockEmployeeService.findOne.mockResolvedValue(mockEmployee);

      const result = await controller.findOne(employeeId);

      expect(service.findOne).toHaveBeenCalledWith(employeeId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEmployee);
    });

    it('should handle service errors when employee not found', async () => {
      const employeeId = 'non-existent-id';
      const error = new Error('Employee not found');
      mockEmployeeService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(employeeId)).rejects.toThrow(
        'Employee not found',
      );

      expect(service.findOne).toHaveBeenCalledWith(employeeId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update an employee', async () => {
      const employeeId = '1';
      const updateEmployeeDto: UpdateEmployeeDto = {
        fullName: 'John Updated',
        position: 'Senior Software Engineer',
      };
      const updatedEmployee = { ...mockEmployee, ...updateEmployeeDto };

      mockEmployeeService.update.mockResolvedValue(updatedEmployee);

      const result = await controller.update(
        employeeId,
        updateEmployeeDto,
        mockAuthenticatedRequest,
      );

      expect(service.update).toHaveBeenCalledWith(
        employeeId,
        updateEmployeeDto,
        mockAuthenticatedRequest.user.id,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedEmployee);
    });

    it('should handle partial updates', async () => {
      const employeeId = '1';
      const updateEmployeeDto: UpdateEmployeeDto = {
        fullName: 'John Partially Updated',
      };
      const updatedEmployee = {
        ...mockEmployee,
        name: updateEmployeeDto.fullName,
      };

      mockEmployeeService.update.mockResolvedValue(updatedEmployee);

      const result = await controller.update(
        employeeId,
        updateEmployeeDto,
        mockAuthenticatedRequest,
      );

      expect(service.update).toHaveBeenCalledWith(
        employeeId,
        updateEmployeeDto,
        mockAuthenticatedRequest.user.id,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedEmployee);
    });

    it('should handle service errors during update', async () => {
      const employeeId = '1';
      const updateEmployeeDto: UpdateEmployeeDto = {
        fullName: 'John Updated',
      };
      const error = new Error('Update failed');
      mockEmployeeService.update.mockRejectedValue(error);

      await expect(
        controller.update(
          employeeId,
          updateEmployeeDto,
          mockAuthenticatedRequest,
        ),
      ).rejects.toThrow('Update failed');

      expect(service.update).toHaveBeenCalledWith(
        employeeId,
        updateEmployeeDto,
        mockAuthenticatedRequest.user.id,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should delete an employee', async () => {
      const employeeId = '1';
      const deleteResult = {
        success: true,
        message: 'Employee deleted successfully',
      };

      mockEmployeeService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove(employeeId);

      expect(service.remove).toHaveBeenCalledWith(employeeId);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(result).toEqual(deleteResult);
    });

    it('should handle service errors during deletion', async () => {
      const employeeId = '1';
      const error = new Error('Deletion failed');
      mockEmployeeService.remove.mockRejectedValue(error);

      await expect(controller.remove(employeeId)).rejects.toThrow(
        'Deletion failed',
      );

      expect(service.remove).toHaveBeenCalledWith(employeeId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion of non-existent employee', async () => {
      const employeeId = 'non-existent-id';
      const error = new Error('Employee not found');
      mockEmployeeService.remove.mockRejectedValue(error);

      await expect(controller.remove(employeeId)).rejects.toThrow(
        'Employee not found',
      );

      expect(service.remove).toHaveBeenCalledWith(employeeId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Service Integration', () => {
    it('should properly inject EmployeeService', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(Object);
    });

    it('should call service methods with correct parameters', async () => {
      // Test that all service methods are properly connected
      const createDto: CreateEmployeeDto = {
        fullName: 'Test ',
        email: 'test@example.com',
        position: 'Tester',
        department: 'QA',
        employeeNumber: 'E001',
        monthlySalary: 5000,
        status: 'ACTIVE',
        username: 'test123',
        password: 'password123',
      };
      const updateDto: UpdateEmployeeDto = { fullName: 'Updated Test' };
      const query: EmployeeQueryDto = { page: 1, limit: 10 };

      mockEmployeeService.create.mockResolvedValue(mockEmployee);
      mockEmployeeService.findAll.mockResolvedValue({
        data: mockEmployees,
        total: 1,
      });
      mockEmployeeService.findOne.mockResolvedValue(mockEmployee);
      mockEmployeeService.update.mockResolvedValue(mockEmployee);
      mockEmployeeService.remove.mockResolvedValue({ success: true });

      // Execute all controller methods
      await controller.create(createDto, mockAuthenticatedRequest);
      await controller.findAll(query);
      await controller.findOne('1');
      await controller.update('1', updateDto, mockAuthenticatedRequest);
      await controller.remove('1');

      // Verify all service methods were called
      expect(service.create).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalled();
      expect(service.findOne).toHaveBeenCalled();
      expect(service.update).toHaveBeenCalled();
      expect(service.remove).toHaveBeenCalled();
    });
  });
});
