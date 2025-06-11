import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditAction, PrismaClient } from '@prisma/client';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;
  let logger: jest.Mocked<Logger>;

  // Mock audit log data
  const mockAuditLog = {
    id: '1',
    tableName: 'users',
    recordId: 'user-123',
    action: AuditAction.CREATE,
    oldValues: null,
    newValues: { name: 'John Doe', email: 'john@example.com' },
    userId: 'admin-456',
    ipAddress: '192.168.1.100',
    requestId: 'req-789',
    createdAt: new Date(),
  };

  // Mock Prisma client
  const mockPrismaClient = {
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaClient,
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get(PrismaClient);

    logger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    (service as any).logger = logger;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAudit', () => {
    it('should create audit log with all parameters', async () => {
      const tableName = 'users';
      const recordId = 'user-123';
      const action = AuditAction.CREATE;
      const oldValues = { name: 'Jane Doe' };
      const newValues = { name: 'John Doe', email: 'john@example.com' };
      const userId = 'admin-456';
      const ipAddress = '192.168.1.100';
      const requestId = 'req-789';

      prisma.auditLog.create.mockResolvedValue(mockAuditLog);

      await service.logAudit(
        tableName,
        recordId,
        action,
        oldValues,
        newValues,
        userId,
        ipAddress,
        requestId,
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tableName,
          recordId,
          action,
          oldValues,
          newValues,
          userId,
          ipAddress,
          requestId,
        },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    });

    it('should create audit log with only required parameters', async () => {
      const tableName = 'products';
      const recordId = 'product-456';
      const action = AuditAction.DELETE;

      prisma.auditLog.create.mockResolvedValue({
        ...mockAuditLog,
        tableName,
        recordId,
        action,
        oldValues: null,
        newValues: null,
        userId: null,
        ipAddress: null,
        requestId: null,
      });

      await service.logAudit(tableName, recordId, action);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tableName,
          recordId,
          action,
          oldValues: null,
          newValues: null,
          userId: null,
          ipAddress: null,
          requestId: null,
        },
      });
    });

    it('should handle undefined optional parameters correctly', async () => {
      const tableName = 'orders';
      const recordId = 'order-789';
      const action = AuditAction.UPDATE;
      const newValues = { status: 'shipped' };

      await service.logAudit(
        tableName,
        recordId,
        action,
        undefined, // oldValues
        newValues,
        undefined, // userId
        undefined, // ipAddress
        undefined, // requestId
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tableName,
          recordId,
          action,
          oldValues: null,
          newValues,
          userId: null,
          ipAddress: null,
          requestId: null,
        },
      });
    });

    it('should handle null optional parameters correctly', async () => {
      const tableName = 'categories';
      const recordId = 'cat-123';
      const action = AuditAction.CREATE;

      await service.logAudit(
        tableName,
        recordId,
        action,
        null, // oldValues
        null, // newValues
        null, // userId
        null, // ipAddress
        null, // requestId
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tableName,
          recordId,
          action,
          oldValues: null,
          newValues: null,
          userId: null,
          ipAddress: null,
          requestId: null,
        },
      });
    });

    it('should test all AuditAction types', async () => {
      const tableName = 'test_table';
      const recordId = 'test-123';

      // Test CREATE action
      await service.logAudit(tableName, recordId, AuditAction.CREATE);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: AuditAction.CREATE }),
      });

      // Test UPDATE action
      await service.logAudit(tableName, recordId, AuditAction.UPDATE);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: AuditAction.UPDATE }),
      });

      // Test DELETE action
      await service.logAudit(tableName, recordId, AuditAction.DELETE);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: AuditAction.DELETE }),
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(3);
    });

    it('should handle complex objects in oldValues and newValues', async () => {
      const tableName = 'complex_table';
      const recordId = 'complex-456';
      const action = AuditAction.UPDATE;

      const oldValues = {
        user: {
          name: 'John',
          profile: {
            age: 25,
            preferences: ['sports', 'music'],
          },
        },
        metadata: {
          tags: ['important', 'priority'],
          created: new Date('2024-01-01'),
        },
      };

      const newValues = {
        user: {
          name: 'John Doe',
          profile: {
            age: 26,
            preferences: ['sports', 'music', 'reading'],
          },
        },
        metadata: {
          tags: ['important', 'priority', 'updated'],
          created: new Date('2024-01-01'),
          updated: new Date('2024-06-01'),
        },
      };

      await service.logAudit(
        tableName,
        recordId,
        action,
        oldValues,
        newValues,
        'user-789',
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          tableName,
          recordId,
          action,
          oldValues,
          newValues,
          userId: 'user-789',
          ipAddress: null,
          requestId: null,
        },
      });
    });

    describe('Error handling', () => {
      it('should catch and log Prisma errors', async () => {
        const tableName = 'error_table';
        const recordId = 'error-123';
        const action = AuditAction.CREATE;
        const error = new Error('Database connection failed');

        prisma.auditLog.create.mockRejectedValue(error);

        // Method should not throw, but should log the error
        await expect(
          service.logAudit(tableName, recordId, action),
        ).resolves.not.toThrow();

        expect(logger.error).toHaveBeenCalledWith(error);
        expect(logger.error).toHaveBeenCalledTimes(1);
      });

      it('should handle validation errors', async () => {
        const tableName = 'validation_table';
        const recordId = 'validation-123';
        const action = AuditAction.UPDATE;
        const validationError = new Error('Invalid data format');

        prisma.auditLog.create.mockRejectedValue(validationError);

        await service.logAudit(tableName, recordId, action);

        expect(logger.error).toHaveBeenCalledWith(validationError);
        expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      });

      it('should handle database constraint errors', async () => {
        const tableName = 'constraint_table';
        const recordId = 'constraint-123';
        const action = AuditAction.DELETE;
        const constraintError = new Error('Foreign key constraint violation');

        prisma.auditLog.create.mockRejectedValue(constraintError);

        await service.logAudit(tableName, recordId, action);

        expect(logger.error).toHaveBeenCalledWith(constraintError);
      });

      it('should handle timeout errors', async () => {
        const tableName = 'timeout_table';
        const recordId = 'timeout-123';
        const action = AuditAction.CREATE;
        const timeoutError = new Error('Operation timed out');

        prisma.auditLog.create.mockRejectedValue(timeoutError);

        await service.logAudit(tableName, recordId, action);

        expect(logger.error).toHaveBeenCalledWith(timeoutError);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty string parameters', async () => {
        const tableName = '';
        const recordId = '';
        const action = AuditAction.CREATE;

        await service.logAudit(tableName, recordId, action);

        expect(prisma.auditLog.create).toHaveBeenCalledWith({
          data: {
            tableName: '',
            recordId: '',
            action,
            oldValues: null,
            newValues: null,
            userId: null,
            ipAddress: null,
            requestId: null,
          },
        });
      });

      it('should handle very long strings', async () => {
        const longString = 'a'.repeat(1000);
        const tableName = longString;
        const recordId = longString;
        const action = AuditAction.UPDATE;

        await service.logAudit(tableName, recordId, action);

        expect(prisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tableName: longString,
            recordId: longString,
          }),
        });
      });

      it('should handle special characters in parameters', async () => {
        const tableName = 'table_with_$pecial_ch@rs!';
        const recordId = 'record-with-üñíçødé-123';
        const action = AuditAction.CREATE;
        const ipAddress = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'; // IPv6

        await service.logAudit(
          tableName,
          recordId,
          action,
          null,
          null,
          null,
          ipAddress,
        );

        expect(prisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tableName,
            recordId,
            ipAddress,
          }),
        });
      });

      it('should handle empty objects', async () => {
        const tableName = 'empty_objects_table';
        const recordId = 'empty-123';
        const action = AuditAction.UPDATE;
        const emptyObject = {};

        await service.logAudit(
          tableName,
          recordId,
          action,
          emptyObject,
          emptyObject,
        );

        expect(prisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            oldValues: emptyObject,
            newValues: emptyObject,
          }),
        });
      });
    });

    describe('Parameter combinations', () => {
      it('should handle mixed parameter scenarios', async () => {
        const scenarios = [
          {
            tableName: 'scenario1',
            recordId: 'rec1',
            action: AuditAction.CREATE,
            oldValues: null,
            newValues: { field: 'value' },
            userId: 'user1',
            ipAddress: null,
            requestId: 'req1',
          },
          {
            tableName: 'scenario2',
            recordId: 'rec2',
            action: AuditAction.UPDATE,
            oldValues: { field: 'old' },
            newValues: null,
            userId: null,
            ipAddress: '127.0.0.1',
            requestId: null,
          },
          {
            tableName: 'scenario3',
            recordId: 'rec3',
            action: AuditAction.DELETE,
            oldValues: { field: 'deleted' },
            newValues: undefined,
            userId: undefined,
            ipAddress: undefined,
            requestId: 'req3',
          },
        ];

        for (const scenario of scenarios) {
          await service.logAudit(
            scenario.tableName,
            scenario.recordId,
            scenario.action,
            scenario.oldValues,
            scenario.newValues,
            scenario.userId,
            scenario.ipAddress,
            scenario.requestId,
          );
        }

        expect(prisma.auditLog.create).toHaveBeenCalledTimes(scenarios.length);
      });
    });
  });

  describe('Logger integration', () => {
    it('should have logger properly initialized', () => {
      expect((service as any).logger).toBeDefined();
    });

    it('should use service name as logger context', () => {
      // Create a new service instance to test the actual logger initialization
      const testService = new AuditService(prisma);
      expect((testService as any).logger.context).toBe(AuditService.name);
    });
  });

  describe('Prisma integration', () => {
    it('should have Prisma client injected', () => {
      expect((service as any).prisma).toBeDefined();
      expect((service as any).prisma).toBe(prisma);
    });

    it('should call the correct Prisma method', async () => {
      await service.logAudit('test', 'test', AuditAction.CREATE);

      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.any(Object),
      });
    });
  });
});
