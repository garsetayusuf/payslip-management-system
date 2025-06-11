import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import {
  AttendanceStatus,
  AuditAction,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaClient,
    private auditService: AuditService,
  ) {}

  async submitAttendance(
    employeeId: string,
    submitAttendanceDto: SubmitAttendanceDto,
    userId: string,
    ipAddress: string,
  ) {
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Check if today is weekend (Saturday = 6, Sunday = 0)
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new BadRequestException('Cannot submit attendance on weekends');
    }

    // Get active attendance period
    const activePeriod = await this.prisma.attendancePeriod.findFirst({
      where: {
        isActive: true,
        startDate: { lte: todayDate },
        endDate: { gte: todayDate },
      },
    });

    if (!activePeriod) {
      throw new BadRequestException(
        'No active attendance period found for today',
      );
    }

    // Check if attendance already exists for today
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: todayDate,
        },
      },
    });

    if (existingAttendance) {
      // If attendance exists, just return it with a message indicating it was already submitted
      return existingAttendance;
    }

    // Create new attendance record
    const attendance = await this.prisma.attendance.create({
      data: {
        employeeId,
        attendancePeriodId: activePeriod.id,
        date: todayDate,
        checkInTime: today,
        status: AttendanceStatus.PRESENT,
        notes: submitAttendanceDto.notes,
        ipAddress: ipAddress,
        createdById: userId,
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
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
      'attendances',
      attendance.id,
      AuditAction.CREATE,
      null,
      {
        employeeId,
        attendancePeriodId: activePeriod.id,
        date: todayDate,
        checkInTime: today,
        status: AttendanceStatus.PRESENT,
        notes: submitAttendanceDto.notes,
        ipAddress: ipAddress,
        createdById: userId,
      },
      userId,
      ipAddress,
    );

    return attendance;
  }

  async findAll(query: AttendanceQueryDto, employeeId?: string) {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      status,
      ...filters
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {
      ...filters,
      ...(startDate && { date: { gte: new Date(startDate) } }),
      ...(endDate && { date: { lte: new Date(endDate) } }),
      ...(status && { status }),
      ...(employeeId && { employeeId }),
    };

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
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
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: attendances,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAttendanceSummary(employeeId: string, periodId?: string) {
    const where: Prisma.AttendanceWhereInput = {
      employeeId,
      ...(periodId && { attendancePeriodId: periodId }),
    };

    const [total, present, absent] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.count({
        where: { ...where, status: AttendanceStatus.PRESENT },
      }),
      this.prisma.attendance.count({
        where: { ...where, status: AttendanceStatus.ABSENT },
      }),
    ]);

    return {
      total,
      present,
      absent,
      attendanceRate: total > 0 ? ((present / total) * 100).toFixed(2) : '0.00',
    };
  }

  async findOne(id: string, employeeId?: string) {
    const where: Prisma.AttendanceWhereInput = {
      id,
      ...(employeeId && { employeeId }),
    };

    const attendance = await this.prisma.attendance.findFirst({
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
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    return attendance;
  }

  findByPeriod(periodId: string, employeeId?: string) {
    const where: Prisma.AttendanceWhereInput = {
      attendancePeriodId: periodId,
      ...(employeeId && { employeeId }),
    };

    return this.prisma.attendance.findMany({
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
      },
      orderBy: { date: 'desc' },
    });
  }
}
