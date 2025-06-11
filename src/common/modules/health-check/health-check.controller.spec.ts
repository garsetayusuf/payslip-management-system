import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from './health-check.controller';
import {
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../shared/prisma/prisma.service';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;
  let healthCheckService: HealthCheckService;
  let httpHealthIndicator: HttpHealthIndicator;
  let prismaHealthIndicator: PrismaHealthIndicator;
  let prismaService: PrismaService;

  const mockHealthCheckResult: HealthCheckResult = {
    status: 'ok',
    info: {
      google: {
        status: 'up',
      },
      prisma: {
        status: 'up',
      },
    },
    error: {},
    details: {
      google: {
        status: 'up',
      },
      prisma: {
        status: 'up',
      },
    },
  };

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn().mockResolvedValue(mockHealthCheckResult),
    };

    const mockHttpHealthIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ google: { status: 'up' } }),
    };

    const mockPrismaHealthIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ prisma: { status: 'up' } }),
    };

    const mockPrismaService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: HttpHealthIndicator,
          useValue: mockHttpHealthIndicator,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealthIndicator,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthCheckController>(HealthCheckController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    httpHealthIndicator = module.get<HttpHealthIndicator>(HttpHealthIndicator);
    prismaHealthIndicator = module.get<PrismaHealthIndicator>(
      PrismaHealthIndicator,
    );
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealthCheck', () => {
    it('should return health check result', async () => {
      const result = await controller.getHealthCheck();

      expect(result).toEqual(mockHealthCheckResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
        expect.any(Function),
      ]);
    });

    it('should call http ping check for google', async () => {
      await controller.getHealthCheck();

      const checkFunctions = (healthCheckService.check as jest.Mock).mock
        .calls[0][0];

      await checkFunctions[0]();

      expect(httpHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'google',
        'https://google.com',
      );
    });

    it('should call prisma ping check', async () => {
      await controller.getHealthCheck();

      const checkFunctions = (healthCheckService.check as jest.Mock).mock
        .calls[0][0];

      await checkFunctions[1]();

      expect(prismaHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'prisma',
        prismaService,
      );
    });

    it('should handle health check failure', async () => {
      const errorResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          google: {
            status: 'down',
            message: 'Connection failed',
          },
        },
        details: {
          google: {
            status: 'down',
            message: 'Connection failed',
          },
        },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValueOnce(
        errorResult,
      );

      const result = await controller.getHealthCheck();

      expect(result).toEqual(errorResult);
      expect(result.status).toBe('error');
    });
  });
});
