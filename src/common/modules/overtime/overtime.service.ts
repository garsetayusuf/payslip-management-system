import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { UpdateOvertimeDto } from './dto/update-overtime.dto';
import { AuditService } from '../audit/audit.service';
import { OvertimeResponseDto } from './dto/overtime-response.dto';
import { OvertimeQueryDto } from './dto/overtime-query.dto';
import { UpdateOvertimeStatusDto } from './dto/update-overtime-status.dto';
import { AuditAction, OvertimeStatus, PrismaClient } from '@prisma/client';

@Injectable()
export class OvertimeService {
  constructor(
    private prisma: PrismaClient,
    private auditService: AuditService,
  ) {}

  async create(
    employeeId: string,
    createOvertimeDto: CreateOvertimeDto,
    ipAddress: string,
    userId: string,
  ): Promise<OvertimeResponseDto> {
    const { date, startTime, endTime, hoursWorked, reason, description } =
      createOvertimeDto;

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
    // Get current active period
    const overtimeDate = new Date(date);
    const activePeriod = await this.prisma.attendancePeriod.findFirst({
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
    });

    if (!activePeriod) {
      throw new BadRequestException('No active attendance period found');
    }

    // Validate date is within active period
    if (
      overtimeDate < activePeriod.startDate ||
      overtimeDate > activePeriod.endDate
    ) {
      throw new BadRequestException(
        'Overtime date must be within the active attendance period',
      );
    }

    // Validate date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (overtimeDate > today) {
      throw new BadRequestException('Cannot submit overtime for future dates');
    }

    // Check if overtime already exists for this employee and date
    const existingOvertime = await this.prisma.overtime.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: overtimeDate,
        },
      },
    });

    if (existingOvertime) {
      throw new BadRequestException(
        'Overtime record already exists for this date',
      );
    }

    // Validate time format and calculate hours
    const calculatedHours = this.calculateHours(startTime, endTime);
    if (Math.abs(calculatedHours - hoursWorked) > 0.1) {
      throw new BadRequestException(
        'Hours worked does not match the time range provided',
      );
    }

    // Validate business hours (overtime should be after regular hours)
    if (!this.isValidOvertimeTime(startTime, endTime)) {
      throw new BadRequestException(
        'Overtime must be outside regular working hours (08:00-17:00)',
      );
    }

    // Check if employee has attendance record for this date if hasAttendance is true
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: overtimeDate,
        },
      },
    });

    if (!attendance) {
      throw new BadRequestException('No attendance record found for this date');
    }

    if (attendance.status !== 'PRESENT') {
      throw new BadRequestException(
        'Cannot submit overtime when attendance status is not PRESENT',
      );
    }

    const overtime = await this.prisma.overtime.create({
      data: {
        employeeId,
        attendancePeriodId: activePeriod.id,
        date: overtimeDate,
        startTime,
        endTime,
        hoursWorked,
        reason,
        description,
        hasAttendance: attendance.status === 'PRESENT' ? true : false,
        status: 'PENDING',
        submittedAt: new Date(),
        ipAddress,
        createdById: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
            position: true,
          },
        },
        attendancePeriod: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
    await this.auditService.logAudit(
      'overtimes',
      overtime.id,
      AuditAction.CREATE,
      null,
      {
        employeeId,
        attendancePeriodId: activePeriod.id,
        date: overtimeDate,
        startTime,
        endTime,
        hoursWorked,
        reason,
        description,
        status: OvertimeStatus.PENDING,
        hasAttendance: attendance.status === 'PRESENT' ? true : false,
        submittedAt: new Date(),
        ipAddress,
        createdById: userId,
      },
      userId,
      ipAddress,
    );

    return this.mapToResponseDto(overtime);
  }

  async findAllByEmployee(query: OvertimeQueryDto): Promise<{
    data: OvertimeResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, fromDate, toDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { employeeId: query.employeeId };

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const [overtimes, total] = await Promise.all([
      this.prisma.overtime.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              employeeCode: true,
              department: true,
              position: true,
            },
          },
          attendancePeriod: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.overtime.count({ where }),
    ]);

    return {
      data: overtimes.map((overtime) => this.mapToResponseDto(overtime)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, employeeId: string): Promise<OvertimeResponseDto> {
    const overtime = await this.prisma.overtime.findFirst({
      where: { id, employeeId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
            position: true,
          },
        },
        attendancePeriod: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime record not found');
    }

    return this.mapToResponseDto(overtime);
  }

  async update(
    id: string,
    employeeId: string,
    updateOvertimeDto: UpdateOvertimeDto,
    ipAddress: string,
    userId: string,
  ): Promise<OvertimeResponseDto> {
    const overtime = await this.prisma.overtime.findFirst({
      where: { id, employeeId },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime record not found');
    }

    if (overtime.status !== 'PENDING') {
      throw new ForbiddenException(
        'Cannot update overtime that has been processed',
      );
    }

    // Validate update data
    const updateData: any = { ...updateOvertimeDto, updatedById: userId };

    if (
      updateOvertimeDto.startTime &&
      updateOvertimeDto.endTime &&
      updateOvertimeDto.hoursWorked
    ) {
      const calculatedHours = this.calculateHours(
        updateOvertimeDto.startTime,
        updateOvertimeDto.endTime,
      );
      if (Math.abs(calculatedHours - updateOvertimeDto.hoursWorked) > 0.1) {
        throw new BadRequestException(
          'Hours worked does not match the time range provided',
        );
      }

      if (
        !this.isValidOvertimeTime(
          updateOvertimeDto.startTime,
          updateOvertimeDto.endTime,
        )
      ) {
        throw new BadRequestException(
          'Overtime must be outside regular working hours (08:00-17:00)',
        );
      }
    }

    if (ipAddress) {
      updateData.ipAddress = ipAddress;
    }

    const updatedOvertime = await this.prisma.overtime.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
            position: true,
          },
        },
        attendancePeriod: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    await this.auditService.logAudit(
      'overtimes',
      id,
      AuditAction.UPDATE,
      {
        startTime: overtime.startTime,
        endTime: overtime.endTime,
        hoursWorked: overtime.hoursWorked,
        reason: overtime.reason,
        description: overtime.description,
      },
      {
        startTime: updatedOvertime.startTime,
        endTime: updatedOvertime.endTime,
        hoursWorked: updatedOvertime.hoursWorked,
        reason: updatedOvertime.reason,
        description: updatedOvertime.description,
        status: updatedOvertime.status,
        hasAttendance: updatedOvertime.hasAttendance,
        submittedAt: updatedOvertime.submittedAt,
        approvedAt: updatedOvertime.approvedAt,
        approvedById: updatedOvertime.approvedById,
        cancelledAt: updatedOvertime.cancelledAt,
        createdAt: updatedOvertime.createdAt,
        updatedAt: updatedOvertime.updatedAt,
        employee: {
          id: updatedOvertime.employee.id,
          fullName: updatedOvertime.employee.fullName,
          employeeCode: updatedOvertime.employee.employeeCode,
          department: updatedOvertime.employee.department,
          position: updatedOvertime.employee.position,
        },
        attendancePeriod: {
          id: updatedOvertime.attendancePeriod.id,
          name: updatedOvertime.attendancePeriod.name,
          startDate: updatedOvertime.attendancePeriod.startDate,
          endDate: updatedOvertime.attendancePeriod.endDate,
        },
      },
      userId,
      ipAddress,
    );
    return this.mapToResponseDto(updatedOvertime);
  }

  async remove(id: string, employeeId: string): Promise<void> {
    const overtime = await this.prisma.overtime.findFirst({
      where: { id, employeeId },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime record not found');
    }

    if (overtime.status !== 'PENDING') {
      throw new ForbiddenException(
        'Cannot delete overtime that has been processed',
      );
    }

    await this.auditService.logAudit(
      'overtimes',
      id,
      AuditAction.DELETE,
      null,
      null,
      null,
    );

    await this.prisma.overtime.delete({
      where: { id },
    });
  }

  async updateStatus(
    id: string,
    updateOvertimeStatusDto: UpdateOvertimeStatusDto,
    userId: string,
    ipAddress: string,
  ) {
    const overtime = await this.prisma.overtime.findFirst({
      where: { id },
    });

    if (!overtime) {
      throw new NotFoundException('Overtime record not found');
    }

    if (overtime.status == 'APPROVED') {
      throw new ForbiddenException(
        'Overtime request already approved, cannot update',
      );
    }

    const updatedOvertime = await this.prisma.overtime.update({
      where: { id },
      data: {
        status: updateOvertimeStatusDto.status,
        cancelledAt: new Date(),
        updatedById: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
            position: true,
          },
        },
        attendancePeriod: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    await this.auditService.logAudit(
      'overtimes',
      id,
      AuditAction.UPDATE,
      {
        status: overtime.status,
      },
      {
        status: updatedOvertime.status,
        cancelledAt: updatedOvertime.cancelledAt,
        updatedById: userId,
      },
      userId,
      ipAddress,
    );

    return this.mapToResponseDto(updatedOvertime);
  }

  private calculateHours(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // Handle overnight shifts
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    return (endMinutes - startMinutes) / 60;
  }

  private isValidOvertimeTime(startTime: string, endTime: string): boolean {
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    // Regular working hours are 08:00-17:00
    // Overtime should be before 08:00 or after 17:00
    return startHour >= 17 || endHour <= 8 || (startHour < 8 && endHour <= 8);
  }

  private mapToResponseDto(overtime: any): OvertimeResponseDto {
    return {
      id: overtime.id,
      employeeId: overtime.employeeId,
      attendancePeriodId: overtime.attendancePeriodId,
      date: overtime.date,
      startTime: overtime.startTime,
      endTime: overtime.endTime,
      hoursWorked: Number(overtime.hoursWorked),
      reason: overtime.reason,
      description: overtime.description,
      status: overtime.status,
      hasAttendance: overtime.hasAttendance,
      submittedAt: overtime.submittedAt,
      approvedAt: overtime.approvedAt,
      approvedById: overtime.approvedById,
      cancelledAt: overtime.cancelledAt,
      createdAt: overtime.createdAt,
      updatedAt: overtime.updatedAt,
      employee: overtime.employee,
      attendancePeriod: overtime.attendancePeriod,
    };
  }
}
