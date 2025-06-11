import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { PrismaClient, UserRole, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Mock the config module
jest.mock('src/common/config/env.config', () => ({
  loadConfig: jest.fn(() => ({
    auth: {
      passwordSaltRounds: 12,
    },
    jwt: {
      expires: '1h',
    },
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaClient: any;
  let jwtService: jest.Mocked<JwtService>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    username: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRole.EMPLOYEE,
    createdById: 'creator-id',
    updatedById: 'updater-id',
    employee: {
      id: 'employee-id-123',
    },
  };

  const mockAdminUser = {
    ...mockUser,
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const mockPrismaClient = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockAuditService = {
      logAudit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaClient = module.get(PrismaClient);
    jwtService = module.get(JwtService);
    auditService = module.get(AuditService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      username: 'test1234',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashedPassword';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);

      (prismaClient.user.create as jest.Mock).mockResolvedValue(mockUser);
      (auditService.logAudit as jest.Mock).mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(prismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          username: registerDto.email,
          name: registerDto.name,
          password: hashedPassword,
        },
      });
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'users',
        mockUser.id,
        AuditAction.CREATE,
        null,
        {
          email: registerDto.email,
          username: registerDto.email,
          name: registerDto.name,
          password: hashedPassword,
        },
        mockUser.createdById,
      );
      expect(result).toEqual({ message: 'User created successfully' });
    });

    it('should throw BadRequestException when user already exists', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const duplicateError = { code: 'P2002' };
      (prismaClient.user.create as jest.Mock).mockRejectedValue(duplicateError);

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException('User with that email already exists'),
      );
    });

    it('should throw InternalServerErrorException for other database errors', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const otherError = { code: 'P2001' };
      (prismaClient.user.create as jest.Mock).mockRejectedValue(otherError);

      await expect(service.register(registerDto)).rejects.toThrow(
        new InternalServerErrorException('Something went wrong'),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const token = 'jwt-token';

      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      (jwtService.sign as jest.Mock).mockReturnValue(token);
      (auditService.logAudit as jest.Mock).mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        include: { employee: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          employeeId: mockUser.employee.id,
          role: mockUser.role,
        },
        { expiresIn: '1h' },
      );
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'users',
        mockUser.id,
        AuditAction.READ,
        null,
        {
          email: mockUser.email,
          username: mockUser.username,
          name: mockUser.name,
        },
        mockUser.createdById,
      );
      expect(result).toBe(token);
    });

    it('should throw BadRequestException when user does not exist', async () => {
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException('Invalid credentials'),
      );
    });

    it('should throw BadRequestException when password is invalid', async () => {
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException('Invalid credentials'),
      );
    });

    it('should handle user without employee', async () => {
      const userWithoutEmployee = { ...mockUser, employee: null };
      const token = 'jwt-token';

      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(
        userWithoutEmployee,
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      (jwtService.sign as jest.Mock).mockReturnValue(token);
      (auditService.logAudit as jest.Mock).mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          email: mockUser.email,
          employeeId: null,
          role: mockUser.role,
        },
        { expiresIn: '1h' },
      );
      expect(result).toBe(token);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      userId: 'user-id-123',
      password: 'newPassword123',
    };

    it('should successfully change password for admin user', async () => {
      const hashedPassword = 'hashedNewPassword';

      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(
        mockAdminUser,
      );
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      (auditService.logAudit as jest.Mock).mockResolvedValue(undefined);
      (prismaClient.user.update as jest.Mock).mockResolvedValue({});

      const result = await service.changePassword(
        'user-id-123',
        changePasswordDto,
      );

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: changePasswordDto.userId },
        include: { employee: true },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.password, 12);
      expect(auditService.logAudit).toHaveBeenCalledWith(
        'users',
        'user-id-123',
        AuditAction.UPDATE,
        { password: mockAdminUser.password },
        { password: hashedPassword },
        mockAdminUser.updatedById,
      );
      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { password: hashedPassword },
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.changePassword('user-id-123', changePasswordDto),
      ).rejects.toThrow(new NotFoundException('User not found'));
    });

    it('should throw ForbiddenException when user is not admin', async () => {
      const regularUser = { ...mockUser, role: UserRole.EMPLOYEE };
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(
        regularUser,
      );

      await expect(
        service.changePassword('user-id-123', changePasswordDto),
      ).rejects.toThrow(
        new ForbiddenException('You can only change password for admins'),
      );
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const userWithoutPassword = {
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        name: mockUser.name,
        role: mockUser.role,
        employee: mockUser.employee,
      };

      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(
        userWithoutPassword,
      );

      const result = await service.findById('user-id-123');

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        include: { employee: true },
        omit: { password: true },
      });
      expect(result).toEqual(userWithoutPassword);
    });

    it('should return null when user does not exist', async () => {
      (prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
