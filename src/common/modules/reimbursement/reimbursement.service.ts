import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import {
  AuditAction,
  PeriodStatus,
  PrismaClient,
  Reimbursement,
  ReimbursementStatus,
} from '@prisma/client';
import { ReimbursmentQueryDto } from './dto/reimbursment-query.dto';
import { UpdateReimbursementDto } from './dto/update-reimbursement.dto';

@Injectable()
export class ReimbursementService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditService: AuditService,
  ) {}

  async createReimbursement(
    createReimbursementDto: CreateReimbursementDto,
    employeeId: string,
    userId: string,
    ipAddress: string,
  ): Promise<Reimbursement> {
    const { attendancePeriodId, amount, description, receiptUrl } =
      createReimbursementDto;

    // Validate employee exists and is active
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        status: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException('Employee account is not active');
    }

    // Validate attendance period exists and is active
    const attendancePeriod = await this.prisma.attendancePeriod.findUnique({
      where: { id: attendancePeriodId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
        payrollProcessed: true,
      },
    });

    if (!attendancePeriod) {
      throw new NotFoundException('Attendance period not found');
    }

    if (attendancePeriod.status !== PeriodStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot submit reimbursement for inactive period',
      );
    }

    if (attendancePeriod.payrollProcessed) {
      throw new BadRequestException(
        'Cannot submit reimbursement for processed payroll period',
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      throw new BadRequestException(
        'Reimbursement amount must be greater than zero',
      );
    }

    // Check if current date is within the attendance period
    const currentDate = new Date();
    const periodStart = new Date(attendancePeriod.startDate);
    const periodEnd = new Date(attendancePeriod.endDate);

    if (currentDate < periodStart || currentDate > periodEnd) {
      throw new BadRequestException(
        'Can only submit reimbursements during the active attendance period',
      );
    }

    // Create reimbursement
    const reimbursement = await this.prisma.reimbursement.create({
      data: {
        employeeId,
        attendancePeriodId,
        amount,
        description,
        receiptUrl,
        status: ReimbursementStatus.PENDING,
        ipAddress,
        createdById: userId,
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
        attendancePeriod: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // Log audit for reimbursement creation
    await this.auditService.logAudit(
      'reimbursements',
      reimbursement.id,
      AuditAction.CREATE,
      null,
      {
        employeeId,
        employeeName: employee.fullName,
        employeeCode: employee.employeeCode,
        attendancePeriodId,
        name: attendancePeriod.name,
        amount: amount.toString(),
        description,
        receiptUrl,
        status: ReimbursementStatus.PENDING,
      },
      userId,
      ipAddress,
    );

    return reimbursement;
  }

  async getReimbursementsAll(
    employeeId: string,
    query: ReimbursmentQueryDto,
  ): Promise<{
    data: Reimbursement[];
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  }> {
    const { attendancePeriodId, status, page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      employeeId,
    };

    if (attendancePeriodId) {
      where.attendancePeriodId = attendancePeriodId;
    }

    if (status) {
      where.status = status;
    }

    const [reimbursements, total] = await Promise.all([
      this.prisma.reimbursement.findMany({
        where,
        include: {
          attendancePeriod: {
            select: {
              name: true,
              startDate: true,
              endDate: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.reimbursement.count({ where }),
    ]);

    return {
      data: reimbursements,
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  async getReimbursementById(
    reimbursementId: string,
    employeeId: string,
  ): Promise<Reimbursement> {
    const reimbursement = await this.prisma.reimbursement.findFirst({
      where: {
        id: reimbursementId,
        employeeId,
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
        attendancePeriod: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    if (!reimbursement) {
      throw new NotFoundException('Reimbursement not found');
    }

    return reimbursement;
  }

  async updateReimbursement(
    reimbursementId: string,
    updateReimbursementDto: UpdateReimbursementDto,
    employeeId: string,
    userId: string,
    ipAddress: string,
  ) {
    // Get existing reimbursement
    const existingReimbursement = await this.prisma.reimbursement.findFirst({
      where: {
        id: reimbursementId,
        employeeId,
      },
      include: {
        attendancePeriod: {
          select: {
            status: true,
            payrollProcessed: true,
          },
        },
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });

    if (!existingReimbursement) {
      throw new NotFoundException('Reimbursement not found');
    }

    // Check if reimbursement can be updated
    if (existingReimbursement.status !== ReimbursementStatus.PENDING) {
      throw new BadRequestException('Can only update pending reimbursements');
    }

    if (existingReimbursement.attendancePeriod.status !== PeriodStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot update reimbursement for inactive period',
      );
    }

    if (existingReimbursement.attendancePeriod.payrollProcessed) {
      throw new BadRequestException(
        'Cannot update reimbursement for processed payroll period',
      );
    }

    const { amount, description, receiptUrl } = updateReimbursementDto;

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      throw new BadRequestException(
        'Reimbursement amount must be greater than zero',
      );
    }

    // Update reimbursement
    const updatedReimbursement = await this.prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(receiptUrl !== undefined && { receiptUrl }),
        updatedById: userId,
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
        attendancePeriod: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    // Log audit for reimbursement update
    await this.auditService.logAudit(
      'reimbursements',
      reimbursementId,
      AuditAction.UPDATE,
      {
        amount: existingReimbursement.amount.toString(),
        description: existingReimbursement.description,
        receiptUrl: existingReimbursement.receiptUrl,
      },
      {
        employeeName: existingReimbursement.employee.fullName,
        employeeCode: existingReimbursement.employee.employeeCode,
        amount: updatedReimbursement.amount.toString(),
        description: updatedReimbursement.description,
        receiptUrl: updatedReimbursement.receiptUrl,
      },
      userId,
      ipAddress,
    );

    return {
      message: 'Reimbursement updated successfully',
      reimbursement: updatedReimbursement,
    };
  }

  async deleteReimbursement(
    reimbursementId: string,
    employeeId: string,
    userId: string,
    ipAddress: string,
  ) {
    // Get existing reimbursement
    const existingReimbursement = await this.prisma.reimbursement.findFirst({
      where: {
        id: reimbursementId,
        employeeId,
      },
      include: {
        attendancePeriod: {
          select: {
            status: true,
            payrollProcessed: true,
          },
        },
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });

    if (!existingReimbursement) {
      throw new NotFoundException('Reimbursement not found');
    }

    // Check if reimbursement can be deleted
    if (existingReimbursement.status !== ReimbursementStatus.PENDING) {
      throw new BadRequestException('Can only delete pending reimbursements');
    }

    if (existingReimbursement.attendancePeriod.status !== PeriodStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot delete reimbursement for inactive period',
      );
    }

    if (existingReimbursement.attendancePeriod.payrollProcessed) {
      throw new BadRequestException(
        'Cannot delete reimbursement for processed payroll period',
      );
    }

    // Delete reimbursement
    await this.prisma.reimbursement.delete({
      where: { id: reimbursementId },
    });

    // Log audit for reimbursement deletion
    await this.auditService.logAudit(
      'reimbursements',
      reimbursementId,
      AuditAction.DELETE,
      {
        employeeName: existingReimbursement.employee.fullName,
        employeeCode: existingReimbursement.employee.employeeCode,
        amount: existingReimbursement.amount.toString(),
        description: existingReimbursement.description,
        receiptUrl: existingReimbursement.receiptUrl,
        status: existingReimbursement.status,
      },
      null,
      userId,
      ipAddress,
    );

    return {
      message: 'Reimbursement deleted successfully',
    };
  }

  async updateReimbursementStatus(
    reimbursementId: string,
    status: ReimbursementStatus,
    adminUserId: string,
    ipAddress: string,
  ) {
    const existingReimbursement = await this.prisma.reimbursement.findUnique({
      where: { id: reimbursementId },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });

    if (!existingReimbursement) {
      throw new NotFoundException('Reimbursement not found');
    }

    const updatedReimbursement = await this.prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: {
        status,
        updatedById: adminUserId,
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
        attendancePeriod: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log audit for status update
    await this.auditService.logAudit(
      'reimbursements',
      reimbursementId,
      AuditAction.UPDATE,
      {
        status: existingReimbursement.status,
      },
      {
        employeeName: existingReimbursement.employee.fullName,
        employeeCode: existingReimbursement.employee.employeeCode,
        status,
        updatedByAdmin: true,
      },
      adminUserId,
      ipAddress,
    );

    return {
      message: `Reimbursement status updated to ${status}`,
      reimbursement: updatedReimbursement,
    };
  }

  async getReimbursementSummary(attendancePeriodId?: string) {
    const where: any = {};

    if (attendancePeriodId) {
      where.attendancePeriodId = attendancePeriodId;
    }

    const summary = await this.prisma.reimbursement.groupBy({
      by: ['status'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const totalAmount = await this.prisma.reimbursement.aggregate({
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      summary: summary.map((item) => ({
        status: item.status,
        count: item._count.id,
        totalAmount: item._sum.amount || 0,
      })),
      overall: {
        totalCount: totalAmount._count.id,
        totalAmount: totalAmount._sum.amount || 0,
      },
    };
  }
}
