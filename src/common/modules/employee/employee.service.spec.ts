import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { AuditService } from '../audit/audit.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import {
  AuditAction,
  Employee,
  PrismaClient,
  User,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Decimal } from '@prisma/client/runtime/library';

// Mock bcrypt
jest.mock('bcrypt');

// Mock config
jest.mock('src/common/config/env.config', () => ({
  loadConfig: () => ({
    auth: {
      passwordSaltRounds: 10,
    },
  }),
}));

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prisma: any;
  let auditService: jest.Mocked<AuditService>;

  // Mock data
  const mockUser: User = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    username: 'johndoe',
    password: 'hashed-password',
    role: UserRole.EMPLOYEE,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'admin-123',
    updatedById: 'admin-123',
  };

  const mockEmployee: Employee = {
    id: 'emp-123',
    userId: 'user-123',
    employeeCode: 'EMP24060001',
    fullName: 'John Doe',
    employeeNumber: 'E001',
    department: 'IT',
    position: 'Developer',
    email: 'john@example.com',
    monthlySalary: new Decimal(5000.0),
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: 'admin-123',
    updatedById: 'admin-123',
  };

  const mockEmployeeWithUser = {
    ...mockEmployee,
    user: {
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role,
    },
  };

  const mockCreateEmployeeDto: CreateEmployeeDto = {
    fullName: 'John Doe',
    employeeNumber: 'E001',
    department: 'IT',
    position: 'Developer',
    email: 'john@example.com',
    username: 'johndoe',
    password: 'password123',
    monthlySalary: 5000,
    status: 'ACTIVE',
  };

  // Mock Prisma methods
  const mockPrismaClient = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    employee: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    logAudit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
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

    service = module.get<EmployeeService>(EmployeeService);
    prisma = module.get(PrismaClient);
    auditService = module.get(AuditService);

    // Setup default bcrypt mock
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create employee successfully', async () => {
      const createdById = 'admin-123';

      // Mock no existing user or employee
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.employee.findFirst.mockResolvedValue(null);

      // Mock transaction
      const transactionCallback = jest
        .fn()
        .mockResolvedValue(mockEmployeeWithUser);
      prisma.$transaction.mockImplementation(transactionCallback);

      const result = await service.create(mockCreateEmployeeDto, createdById);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: mockCreateEmployeeDto.username },
            { email: mockCreateEmployeeDto.email },
          ],
        },
      });

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: mockCreateEmployeeDto.email },
            { employeeNumber: mockCreateEmployeeDto.employeeNumber },
          ],
        },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(
        mockCreateEmployeeDto.password,
        10,
      );
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockEmployeeWithUser);
    });

    it('should throw ConflictException if user already exists', async () => {
      const createdById = 'admin-123';

      // Mock existing user
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.create(mockCreateEmployeeDto, createdById),
      ).rejects.toThrow(
        new ConflictException('Username or email already exists'),
      );

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.employee.findFirst).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if employee already exists', async () => {
      const createdById = 'admin-123';

      // Mock no existing user but existing employee
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.employee.findFirst.mockResolvedValue(mockEmployee);

      await expect(
        service.create(mockCreateEmployeeDto, createdById),
      ).rejects.toThrow(
        new ConflictException('Employee email or number already exists'),
      );

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.employee.findFirst).toHaveBeenCalled();
    });

    it('should handle transaction with user and employee creation', async () => {
      const createdById = 'admin-123';

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.employee.findFirst.mockResolvedValue(null);

      // Mock transaction implementation
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
          employee: {
            create: jest.fn().mockResolvedValue(mockEmployeeWithUser),
          },
        };
        return await callback(mockTx);
      });

      await service.create(mockCreateEmployeeDto, createdById);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'employee',
        mockEmployeeWithUser.id,
        AuditAction.CREATE,
        null,
        expect.objectContaining({
          employeeId: mockEmployeeWithUser.id,
          fullName: mockEmployeeWithUser.fullName,
        }),
        createdById,
      );
    });

    it('should generate employee code correctly', async () => {
      const createdById = 'admin-123';
      const currentDate = new Date('2024-06-15');
      jest.spyOn(global, 'Date').mockImplementation(() => currentDate as any);

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.employee.findFirst
        .mockResolvedValueOnce(null) // For conflict check
        .mockResolvedValueOnce(null); // For generateEmployeeCode

      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: { create: jest.fn().mockResolvedValue(mockUser) },
          employee: {
            create: jest.fn().mockResolvedValue(mockEmployeeWithUser),
          },
        };
        return await callback(mockTx);
      });

      await service.create(mockCreateEmployeeDto, createdById);

      // Verify employee code generation was called
      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: {
          employeeCode: {
            startsWith: 'EMP2406',
          },
        },
        orderBy: {
          employeeCode: 'desc',
        },
      });
    });
  });

  describe('findAll', () => {
    const mockQuery: EmployeeQueryDto = {
      page: 1,
      limit: 10,
      search: '',
    };

    it('should return paginated employees without search', async () => {
      const mockEmployees = [mockEmployeeWithUser];
      const mockTotal = 1;

      prisma.employee.findMany.mockResolvedValue(mockEmployees);
      prisma.employee.count.mockResolvedValue(mockTotal);

      const result = await service.findAll(mockQuery);

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual({
        data: mockEmployees,
        pagination: {
          total: mockTotal,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return paginated employees with search', async () => {
      const searchQuery = { ...mockQuery, search: 'John' };
      const mockEmployees = [mockEmployeeWithUser];
      const mockTotal = 1;

      prisma.employee.findMany.mockResolvedValue(mockEmployees);
      prisma.employee.count.mockResolvedValue(mockTotal);

      const result = await service.findAll(searchQuery);

      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              fullName: {
                contains: 'John',
                mode: 'insensitive',
              },
            },
            {
              employeeNumber: {
                contains: 'John',
                mode: 'insensitive',
              },
            },
            { email: { contains: 'John', mode: 'insensitive' } },
            {
              department: {
                contains: 'John',
                mode: 'insensitive',
              },
            },
            {
              position: {
                contains: 'John',
                mode: 'insensitive',
              },
            },
          ],
        },
        include: expect.any(Object),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(result.data).toEqual(mockEmployees);
    });

    it('should handle pagination correctly', async () => {
      const paginatedQuery = { ...mockQuery, page: 2, limit: 5 };

      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(8);

      const result = await service.findAll(paginatedQuery);

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5,
        }),
      );

      expect(result.pagination).toEqual({
        total: 8,
        page: 2,
        limit: 5,
        totalPages: 2, // Math.ceil(8 / 5)
      });
    });
  });

  describe('findOne', () => {
    it('should return employee by id', async () => {
      const id = 'emp-123';
      prisma.employee.findUnique.mockResolvedValue(mockEmployeeWithUser);

      const result = await service.findOne(id);

      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
            },
          },
        },
      });

      expect(result).toEqual(mockEmployeeWithUser);
    });

    it('should throw NotFoundException when employee not found', async () => {
      const id = 'non-existent';
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );

      expect(prisma.employee.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    const mockUpdateDto: UpdateEmployeeDto = {
      fullName: 'John Updated',
      department: 'HR',
      position: 'Manager',
      monthlySalary: 6000,
    };

    it('should update employee successfully without email change', async () => {
      const id = 'emp-123';
      const updatedById = 'admin-123';

      // Mock finding employee
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployeeWithUser);

      // Mock transaction
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          employee: {
            update: jest.fn().mockResolvedValue({
              ...mockEmployeeWithUser,
              ...mockUpdateDto,
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await service.update(id, mockUpdateDto, updatedById);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'employee',
        expect.any(String),
        AuditAction.UPDATE,
        expect.any(Object),
        mockUpdateDto,
        updatedById,
      );
      expect(result).toEqual({ message: 'Employee updated successfully' });
    });

    it('should update employee with email change', async () => {
      const id = 'emp-123';
      const updatedById = 'admin-123';
      const updateDtoWithEmail = {
        ...mockUpdateDto,
        email: 'john.updated@example.com',
      };

      // Mock finding employee
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployeeWithUser);

      // Mock no email conflict
      prisma.employee.findFirst.mockResolvedValue(null);

      // Mock transaction with user update
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            update: jest.fn().mockResolvedValue(mockUser),
          },
          employee: {
            update: jest.fn().mockResolvedValue({
              ...mockEmployeeWithUser,
              ...updateDtoWithEmail,
            }),
          },
        };
        return await callback(mockTx);
      });

      const result = await service.update(id, updateDtoWithEmail, updatedById);

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: {
          email: updateDtoWithEmail.email,
          id: { not: id },
        },
      });

      expect(result).toEqual({ message: 'Employee updated successfully' });
    });

    it('should throw ConflictException when email already exists', async () => {
      const id = 'emp-123';
      const updatedById = 'admin-123';
      const updateDtoWithEmail = {
        ...mockUpdateDto,
        email: 'existing@example.com',
      };

      // Mock finding employee
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployeeWithUser);

      // Mock existing email
      prisma.employee.findFirst.mockResolvedValue({
        ...mockEmployee,
        id: 'different-id',
        email: 'existing@example.com',
      });

      await expect(
        service.update(id, updateDtoWithEmail, updatedById),
      ).rejects.toThrow(new ConflictException('Email already exists'));

      expect(prisma.employee.findFirst).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle employee not found during update', async () => {
      const id = 'non-existent';
      const updatedById = 'admin-123';

      // Mock findOne throwing NotFoundException
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('Employee not found'));

      await expect(
        service.update(id, mockUpdateDto, updatedById),
      ).rejects.toThrow(new NotFoundException('Employee not found'));

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete employee successfully', async () => {
      const id = 'emp-123';

      // Mock finding employee
      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployeeWithUser);

      // Mock delete
      prisma.employee.delete.mockResolvedValue(mockEmployee);

      const result = await service.remove(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(prisma.employee.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'employee',
        id,
        AuditAction.DELETE,
        null,
        null,
        null,
      );
      expect(result).toEqual({ message: 'Employee deleted successfully' });
    });

    it('should throw NotFoundException when employee not found for deletion', async () => {
      const id = 'non-existent';

      // Mock findOne throwing NotFoundException
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException('Employee not found'));

      await expect(service.remove(id)).rejects.toThrow(
        new NotFoundException('Employee not found'),
      );

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(prisma.employee.delete).not.toHaveBeenCalled();
      expect(auditService.logAudit).not.toHaveBeenCalled();
    });
  });

  describe('generateEmployeeCode', () => {
    it('should generate first employee code for the month', async () => {
      const currentDate = new Date('2024-06-15');
      jest.spyOn(global, 'Date').mockImplementation(() => currentDate as any);

      // Mock no existing employee for this month
      prisma.employee.findFirst.mockResolvedValue(null);

      const code = await (service as any).generateEmployeeCode();

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: {
          employeeCode: {
            startsWith: 'EMP2406',
          },
        },
        orderBy: {
          employeeCode: 'desc',
        },
      });

      expect(code).toBe('EMP2406001');
    });

    it('should generate incremental employee code', async () => {
      const currentDate = new Date('2024-06-15');
      jest.spyOn(global, 'Date').mockImplementation(() => currentDate as any);

      // Mock existing employee with code EMP2406005
      prisma.employee.findFirst.mockResolvedValue({
        ...mockEmployee,
        employeeCode: 'EMP2406005',
      });

      const code = await (service as any).generateEmployeeCode();

      expect(code).toBe('EMP2406006');
    });

    it('should handle year change correctly', async () => {
      const currentDate = new Date('2025-01-15');
      jest.spyOn(global, 'Date').mockImplementation(() => currentDate as any);

      prisma.employee.findFirst.mockResolvedValue(null);

      const code = await (service as any).generateEmployeeCode();

      expect(prisma.employee.findFirst).toHaveBeenCalledWith({
        where: {
          employeeCode: {
            startsWith: 'EMP2406',
          },
        },
        orderBy: {
          employeeCode: 'desc',
        },
      });

      expect(code).toBe('EMP2406001');
    });

    it('should pad sequence numbers correctly', async () => {
      const currentDate = new Date('2024-12-15');
      jest.spyOn(global, 'Date').mockImplementation(() => currentDate as any);

      // Mock existing employee with high sequence number
      prisma.employee.findFirst.mockResolvedValue({
        ...mockEmployee,
        employeeCode: 'EMP2412099',
      });

      const code = await (service as any).generateEmployeeCode();

      expect(code).toBe('EMP2406100');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle bcrypt hashing failure', async () => {
      const createdById = 'admin-123';

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.employee.findFirst.mockResolvedValue(null);

      // Mock bcrypt hash failure
      jest
        .spyOn(bcrypt, 'hash')
        .mockRejectedValue(new Error('Hashing failed') as never);

      await expect(
        service.create(mockCreateEmployeeDto, createdById),
      ).rejects.toThrow('Hashing failed');

      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should handle transaction failure during create', async () => {
      const createdById = 'admin-123';

      prisma.user.findFirst.mockResolvedValue(null);
      prisma.employee.findFirst.mockResolvedValue(null);

      // Mock transaction failure
      prisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(
        service.create(mockCreateEmployeeDto, createdById),
      ).rejects.toThrow('Transaction failed');
    });

    it('should handle audit service failure gracefully', async () => {
      const id = 'emp-123';

      jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployeeWithUser);
      prisma.employee.delete.mockResolvedValue(mockEmployee);

      // Mock audit service failure
      auditService.logAudit.mockRejectedValue(new Error('Audit failed'));

      await expect(service.remove(id)).rejects.toThrow('Audit failed');
    });

    it('should handle empty search query', async () => {
      const emptySearchQuery = { ...mockCreateEmployeeDto, search: '' };

      prisma.employee.findMany.mockResolvedValue([]);
      prisma.employee.count.mockResolvedValue(0);

      await service.findAll(emptySearchQuery as any);

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });
});
