import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LocalAuthGuard } from 'src/common/guards/local-auth.guard';
import { UserRole } from '@prisma/client';
import { FastifyReply } from 'fastify';

// Mock the helper functions
jest.mock('src/helpers/transform-camel-case', () => ({
  camelCaseToWords: jest.fn(() => 'Auth Controller'),
}));

jest.mock('src/helpers/examples/get-user-example', () => ({
  getUserExample: jest.fn(() => ({
    id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
  })),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let mockResponse: Partial<FastifyReply>;
  let mockRequest: any;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    username: 'test@example.com',
    name: 'Test User',
    role: UserRole.EMPLOYEE,
    employee: {
      id: 'employee-id-123',
    },
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      changePassword: jest.fn(),
      findById: jest.fn(),
    };

    // Mock FastifyReply
    mockResponse = {
      setCookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    // Mock AuthenticatedRequest
    mockRequest = {
      user: {
        id: 'user-id-123',
        email: 'test@example.com',
        role: UserRole.EMPLOYEE,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(LocalAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCookieOptions', () => {
    it('should return development cookie options when not in production', () => {
      // Access private method for testing
      const cookieOptions = (controller as any).getCookieOptions(false);

      expect(cookieOptions).toEqual({
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        domain: 'localhost',
      });
    });

    it('should return production cookie options when in production', () => {
      const cookieOptions = (controller as any).getCookieOptions(true);

      expect(cookieOptions).toEqual({
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
        domain: undefined,
      });
    });

    it('should use NODE_ENV to determine production mode by default', () => {
      const originalEnv = process.env.NODE_ENV;

      // Test production
      process.env.NODE_ENV = 'production';
      const prodOptions = (controller as any).getCookieOptions();
      expect(prodOptions.secure).toBe(true);
      expect(prodOptions.sameSite).toBe('none');

      // Test development
      process.env.NODE_ENV = 'development';
      const devOptions = (controller as any).getCookieOptions();
      expect(devOptions.secure).toBe(false);
      expect(devOptions.sameSite).toBe('lax');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      username: 'test1234',
    };

    it('should successfully register a user', async () => {
      const expectedResult = { message: 'User created successfully' };
      (authService.register as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.create(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Registration failed');
      (authService.register as jest.Mock).mockRejectedValue(error);

      await expect(controller.create(registerDto)).rejects.toThrow(
        'Registration failed',
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login and set cookie', async () => {
      const token = 'jwt-token-123';
      (authService.login as jest.Mock).mockResolvedValue(token);

      const result = await controller.login(
        mockResponse as FastifyReply,
        loginDto,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(mockResponse.setCookie).toHaveBeenCalledWith(
        'access_token',
        token,
        expect.objectContaining({
          path: '/',
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000,
        }),
      );
      expect(result).toEqual({ message: 'Login successful' });
    });

    it('should set cookie with production options in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const token = 'jwt-token-123';
      (authService.login as jest.Mock).mockResolvedValue(token);

      await controller.login(mockResponse as FastifyReply, loginDto);

      expect(mockResponse.setCookie).toHaveBeenCalledWith(
        'access_token',
        token,
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
          domain: undefined,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should propagate service errors', async () => {
      const error = new Error('Login failed');
      (authService.login as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.login(mockResponse as FastifyReply, loginDto),
      ).rejects.toThrow('Login failed');
    });
  });

  describe('logout', () => {
    it('should successfully logout and clear cookie', () => {
      const result = controller.logout(mockResponse as FastifyReply);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          path: '/',
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000,
        }),
      );
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should clear cookie with correct options in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      controller.logout(mockResponse as FastifyReply);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          secure: true,
          sameSite: 'none',
          domain: undefined,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      userId: 'user-id-123',
      password: 'newPassword123',
    };

    it('should successfully change password', async () => {
      const expectedResult = { message: 'Password changed successfully' };
      (authService.changePassword as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await controller.changePassword(
        changePasswordDto,
        mockRequest,
      );

      expect(authService.changePassword).toHaveBeenCalledWith(
        mockRequest.user.id,
        changePasswordDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should use authenticated user id from request', async () => {
      const expectedResult = { message: 'Password changed successfully' };
      (authService.changePassword as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const customRequest: any = {
        user: {
          id: 'different-user-id',
          email: 'test@example.com',
          role: UserRole.ADMIN,
          employeeId: 'employee-id-123',
        },
      };

      await controller.changePassword(changePasswordDto, customRequest);

      expect(authService.changePassword).toHaveBeenCalledWith(
        'different-user-id',
        changePasswordDto,
      );
    });

    it('should propagate service errors', async () => {
      const error = new Error('Password change failed');
      (authService.changePassword as jest.Mock).mockRejectedValue(error);

      await expect(
        controller.changePassword(changePasswordDto, mockRequest),
      ).rejects.toThrow('Password change failed');
    });
  });

  describe('findById', () => {
    it('should successfully get user profile', async () => {
      const userProfile = {
        id: 'user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.EMPLOYEE,
        employee: mockUser.employee,
      };
      (authService.findById as jest.Mock).mockResolvedValue(userProfile);

      const result = await controller.findById(mockRequest);

      expect(authService.findById).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(userProfile);
    });

    it('should use authenticated user id from request', async () => {
      const customRequest: any = {
        user: {
          id: 'different-user-id',
          email: 'test@example.com',
          role: UserRole.ADMIN,
          employeeId: 'employee-id-123',
        },
      };
      const userProfile = {
        id: 'another-user-id',
        email: 'another@example.com',
      };
      (authService.findById as jest.Mock).mockResolvedValue(userProfile);

      const result = await controller.findById(customRequest);

      expect(result).toEqual(userProfile);
    });

    it('should propagate service errors', async () => {
      const error = new Error('User not found');
      (authService.findById as jest.Mock).mockRejectedValue(error);

      await expect(controller.findById(mockRequest)).rejects.toThrow(
        'User not found',
      );
    });

    it('should handle null response from service', async () => {
      (authService.findById as jest.Mock).mockResolvedValue(null);

      const result = await controller.findById(mockRequest);

      expect(result).toBeNull();
    });
  });

  describe('Guards Integration', () => {
    it('should have JwtAuthGuard on protected routes', () => {
      const guardMetadata = Reflect.getMetadata(
        '__guards__',
        controller.logout,
      );
      expect(guardMetadata).toBeDefined();
    });

    it('should have LocalAuthGuard on login route', () => {
      const guardMetadata = Reflect.getMetadata('__guards__', controller.login);
      expect(guardMetadata).toBeDefined();
    });
  });
});
