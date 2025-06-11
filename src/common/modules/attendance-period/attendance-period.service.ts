import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period.dto';
import { UpdateAttendancePeriodDto } from './dto/update-attendance-period.dto';
import {
  AttendancePeriod,
  AuditAction,
  PeriodStatus,
  PrismaClient,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AttendancePeriodService {
  constructor(
    private prisma: PrismaClient,
    private auditService: AuditService,
  ) {}

  async create(
    createPeriodDto: CreateAttendancePeriodDto,
    createdById: string,
  ): Promise<AttendancePeriod> {
    const { name, startDate, endDate, isActive = true } = createPeriodDto;

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for overlapping periods
    const overlappingPeriod = await this.prisma.attendancePeriod.findFirst({
      where: {
        OR: [
          {
            AND: [{ startDate: { lte: start } }, { endDate: { gte: start } }],
          },
          {
            AND: [{ startDate: { lte: end } }, { endDate: { gte: end } }],
          },
          {
            AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }],
          },
        ],
        status: { not: PeriodStatus.CLOSED },
      },
    });

    if (overlappingPeriod) {
      throw new ConflictException(
        'Period overlaps with existing active period',
      );
    }

    // If this period is set as active, deactivate others
    if (isActive) {
      await this.prisma.attendancePeriod.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const attendancePeriod = await this.prisma.attendancePeriod.create({
      data: {
        name,
        startDate: start,
        endDate: end,
        isActive,
        createdById,
      },
    });

    await this.auditService.logAudit(
      'attendance-periods',
      attendancePeriod.id,
      AuditAction.CREATE,
      null,
      {
        name,
        startDate: start,
        endDate: end,
        isActive,
        createdById,
      },
      createdById,
    );

    return attendancePeriod;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [periods, total] = await Promise.all([
      this.prisma.attendancePeriod.findMany({
        include: {
          createdBy: {
            select: { id: true, username: true },
          },
          processedBy: {
            select: { id: true, username: true },
          },
        },
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.attendancePeriod.count(),
    ]);

    return {
      data: periods,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<AttendancePeriod> {
    const period = await this.prisma.attendancePeriod.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, username: true },
        },
        processedBy: {
          select: { id: true, username: true },
        },
        _count: {
          select: {
            attendances: true,
            overtimes: true,
            reimbursements: true,
            payslips: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException('Attendance period not found');
    }

    return period;
  }

  async findCurrent(): Promise<AttendancePeriod> {
    const currentPeriod = await this.prisma.attendancePeriod.findFirst({
      where: { isActive: true },
      include: {
        createdBy: {
          select: { id: true, username: true },
        },
      },
    });

    if (!currentPeriod) {
      throw new NotFoundException('No active period found');
    }

    return currentPeriod;
  }

  async update(
    id: string,
    updatePeriodDto: UpdateAttendancePeriodDto,
    updatedById: string,
  ): Promise<AttendancePeriod> {
    const period = await this.findOne(id);

    if (period.payrollProcessed) {
      throw new BadRequestException(
        'Cannot update period that has been processed',
      );
    }

    const { startDate, endDate, isActive, ...otherData } = updatePeriodDto;

    // Validate date range if provided
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : period.startDate;
      const end = endDate ? new Date(endDate) : period.endDate;

      if (start >= end) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    // If setting as active, deactivate others
    if (isActive === true) {
      await this.prisma.attendancePeriod.updateMany({
        where: {
          id: { not: id },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    const attendancePeriod = await this.prisma.attendancePeriod.update({
      where: { id },
      data: {
        ...otherData,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        updatedById,
      },
      include: {
        createdBy: {
          select: { id: true, username: true },
        },
        updatedBy: {
          select: { id: true, username: true },
        },
      },
    });

    await this.auditService.logAudit(
      'attendance-periods',
      id,
      AuditAction.UPDATE,
      {
        name: attendancePeriod.name,
        startDate: attendancePeriod.startDate,
        endDate: attendancePeriod.endDate,
        isActive: attendancePeriod.isActive,
      },
      {
        name: otherData.name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        updatedById,
      },
      updatedById,
    );

    return attendancePeriod;
  }

  async remove(id: string): Promise<{ message: string }> {
    const period = await this.findOne(id);

    if (period.payrollProcessed) {
      throw new BadRequestException('Cannot delete processed period');
    }

    const attendances = await this.prisma.attendance.findMany({
      where: {
        attendancePeriodId: id,
      },
    });

    const overtimes = await this.prisma.overtime.findMany({
      where: {
        attendancePeriodId: id,
      },
    });

    if (attendances.length > 0 || overtimes.length > 0) {
      throw new BadRequestException(
        'Cannot delete period with existing records',
      );
    }

    await this.auditService.logAudit(
      'attendance-periods',
      id,
      AuditAction.DELETE,
      null,
      null,
      null,
    );

    await this.prisma.attendancePeriod.delete({
      where: { id },
    });

    return { message: 'Period deleted successfully' };
  }
}
