import { Test, TestingModule } from '@nestjs/testing';
import { ReimbursementController } from './reimbursement.controller';
import { ReimbursementService } from './reimbursement.service';
import { UserRole } from '@prisma/client';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { UpdateReimbursementDto } from './dto/update-reimbursement.dto';
import { ReimbursmentQueryDto } from './dto/reimbursment-query.dto';
import { UpdateReimbursementStatusDto } from './dto/update-reimbursment-status.dto';

const mockUser = {
  user: {
    id: 'user-id',
    employeeId: 'employee-id',
    role: UserRole.EMPLOYEE,
  },
};

const mockAdmin = {
  user: {
    id: 'admin-id',
    employeeId: null,
    role: UserRole.ADMIN,
  },
};

const mockReimbursement = {
  id: 'reimbursement-id',
  amount: 100,
  description: 'Travel expenses',
};

describe('ReimbursementController', () => {
  let controller: ReimbursementController;
  let service: ReimbursementService;

  const mockService = {
    createReimbursement: jest.fn(),
    getReimbursementsAll: jest.fn(),
    getReimbursementById: jest.fn(),
    updateReimbursement: jest.fn(),
    deleteReimbursement: jest.fn(),
    updateReimbursementStatus: jest.fn(),
    getReimbursementSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReimbursementController],
      providers: [{ provide: ReimbursementService, useValue: mockService }],
    }).compile();

    controller = module.get<ReimbursementController>(ReimbursementController);
    service = module.get<ReimbursementService>(ReimbursementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReimbursement', () => {
    it('should create reimbursement', async () => {
      const dto: CreateReimbursementDto = {
        amount: 100,
        description: 'Taxi',
        receiptUrl: 'http://example.com/receipt',
        attendancePeriodId: 'period-123',
      };
      mockService.createReimbursement.mockResolvedValue(mockReimbursement);

      const result = await controller.createReimbursement(
        dto,
        mockUser as any,
        '127.0.0.1',
      );
      expect(result).toEqual(mockReimbursement);
      expect(service.createReimbursement).toHaveBeenCalledWith(
        dto,
        'employee-id',
        'user-id',
        '127.0.0.1',
      );
    });
  });

  describe('getReimbursementsAll', () => {
    it('should return all reimbursements for employee', async () => {
      const query: ReimbursmentQueryDto = {};
      mockService.getReimbursementsAll.mockResolvedValue([mockReimbursement]);

      const result = await controller.getReimbursementsAll(
        query,
        mockUser as any,
      );
      expect(result).toEqual([mockReimbursement]);
      expect(service.getReimbursementsAll).toHaveBeenCalledWith(
        'employee-id',
        query,
      );
    });
  });

  describe('getReimbursementById', () => {
    it('should return reimbursement by ID', async () => {
      mockService.getReimbursementById.mockResolvedValue(mockReimbursement);

      const result = await controller.getReimbursementById(
        'reimbursement-id',
        mockUser as any,
      );
      expect(result).toEqual(mockReimbursement);
      expect(service.getReimbursementById).toHaveBeenCalledWith(
        'reimbursement-id',
        'employee-id',
      );
    });
  });

  describe('updateReimbursement', () => {
    it('should update reimbursement', async () => {
      const dto: UpdateReimbursementDto = { description: 'Updated' };
      mockService.updateReimbursement.mockResolvedValue(mockReimbursement);

      const result = await controller.updateReimbursement(
        'reimbursement-id',
        dto,
        mockUser as any,
        '127.0.0.1',
      );
      expect(result).toEqual(mockReimbursement);
      expect(service.updateReimbursement).toHaveBeenCalledWith(
        'reimbursement-id',
        dto,
        'employee-id',
        'user-id',
        '127.0.0.1',
      );
    });
  });

  describe('deleteReimbursement', () => {
    it('should delete reimbursement', async () => {
      mockService.deleteReimbursement.mockResolvedValue({ message: 'deleted' });

      const result = await controller.deleteReimbursement(
        'reimbursement-id',
        mockUser as any,
        '127.0.0.1',
      );
      expect(result).toEqual({ message: 'deleted' });
      expect(service.deleteReimbursement).toHaveBeenCalledWith(
        'reimbursement-id',
        'employee-id',
        'user-id',
        '127.0.0.1',
      );
    });
  });

  describe('updateReimbursementStatus', () => {
    it('should update reimbursement status', async () => {
      const dto: UpdateReimbursementStatusDto = { status: 'APPROVED' };
      mockService.updateReimbursementStatus.mockResolvedValue(
        mockReimbursement,
      );

      const result = await controller.updateReimbursementStatus(
        'reimbursement-id',
        dto,
        mockAdmin as any,
        '127.0.0.1',
      );
      expect(result).toEqual(mockReimbursement);
      expect(service.updateReimbursementStatus).toHaveBeenCalledWith(
        'reimbursement-id',
        'APPROVED',
        'admin-id',
        '127.0.0.1',
      );
    });
  });

  describe('getReimbursementSummary', () => {
    it('should return reimbursement summary', async () => {
      mockService.getReimbursementSummary.mockResolvedValue({ total: 200 });

      const result = await controller.getReimbursementSummary('period-id');
      expect(result).toEqual({ total: 200 });
      expect(service.getReimbursementSummary).toHaveBeenCalledWith('period-id');
    });
  });
});
