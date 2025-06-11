import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuditService } from '../audit/audit.service';
import {
  AuditAction,
  Employee,
  PrismaClient,
  User,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { loadConfig } from 'src/common/config/env.config';
import { EmployeeQueryDto } from './dto/employee-query.dto';

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaClient,
    private auditService: AuditService,
  ) {}

  async create(
    createEmployeeDto: CreateEmployeeDto,
    createdById: string,
  ): Promise<Employee> {
    // Check if user with username or email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createEmployeeDto.username },
          { email: createEmployeeDto.email },
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Check if employee with email already exists
    const existingEmployee = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { email: createEmployeeDto.email },
          { employeeNumber: createEmployeeDto.employeeNumber },
        ],
      },
    });

    if (existingEmployee) {
      throw new ConflictException('Employee email or number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      createEmployeeDto.password,
      loadConfig().auth.passwordSaltRounds,
    );

    // Generate employee code
    const employeeCode = await this.generateEmployeeCode();

    // Create user and employee in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user: User = await tx.user.create({
        data: {
          name: createEmployeeDto.fullName,
          email: createEmployeeDto.email,
          username: createEmployeeDto.username,
          password: hashedPassword,
          role: UserRole.EMPLOYEE,
          createdById,
        },
      });

      // Create employee
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode,
          fullName: createEmployeeDto.fullName,
          employeeNumber: createEmployeeDto.employeeNumber,
          department: createEmployeeDto.department,
          position: createEmployeeDto.position,
          email: createEmployeeDto.email,
          monthlySalary: createEmployeeDto.monthlySalary,
          status: createEmployeeDto.status || 'ACTIVE',
          createdById,
        },
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

      await this.auditService.logAudit(
        'employee',
        employee.id,
        AuditAction.CREATE,
        null,
        {
          employeeId: employee.id,
          fullName: employee.fullName,
          employeeNumber: employee.employeeNumber,
          department: employee.department,
          position: employee.position,
          email: employee.email,
          monthlySalary: employee.monthlySalary,
          status: employee.status,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
          createdById: createdById,
          updatedById: createdById,
        },
        createdById,
      );

      return employee;
    });

    return user;
  }

  async findAll(query: EmployeeQueryDto) {
    const skip = (query.page - 1) * query.limit;

    const where = query.search
      ? {
          OR: [
            {
              fullName: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
            {
              employeeNumber: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
            { email: { contains: query.search, mode: 'insensitive' as const } },
            {
              department: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
            {
              position: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
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
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
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

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    updatedById: string,
  ) {
    const findEmployee = await this.findOne(id);

    // Check for conflicts if email is being updated
    if (
      updateEmployeeDto.email &&
      updateEmployeeDto.email !== findEmployee.email
    ) {
      const existing = await this.prisma.employee.findFirst({
        where: {
          email: updateEmployeeDto.email,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update employee and user in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update user if email changed
      if (
        updateEmployeeDto.email &&
        updateEmployeeDto.email !== findEmployee.email
      ) {
        await tx.user.update({
          where: { id: findEmployee.userId },
          data: {
            email: updateEmployeeDto.email,
            name: updateEmployeeDto.fullName || findEmployee.fullName,
            updatedById,
          },
        });
      }

      // Update employee
      const employee = await tx.employee.update({
        where: { id },
        data: {
          ...updateEmployeeDto,
          updatedById,
        },
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

      await this.auditService.logAudit(
        'employee',
        employee.id,
        AuditAction.UPDATE,
        {
          fullName: employee.fullName,
          employeeNumber: employee.employeeNumber,
          department: employee.department,
          position: employee.position,
          email: employee.email,
          monthlySalary: employee.monthlySalary,
          status: employee.status,
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
        },
        updateEmployeeDto,
        updatedById,
      );
    });

    return { message: 'Employee updated successfully' };
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    // Delete employee (user will be cascade deleted)
    await this.prisma.employee.delete({
      where: { id },
    });

    await this.auditService.logAudit(
      'employee',
      id,
      AuditAction.DELETE,
      null,
      null,
      null,
    );

    return { message: 'Employee deleted successfully' };
  }

  private async generateEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

    // Get the latest employee code for this month
    const prefix = `EMP${year}${month}`;
    const latestEmployee = await this.prisma.employee.findFirst({
      where: {
        employeeCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        employeeCode: 'desc',
      },
    });

    let sequence = 1;
    if (latestEmployee) {
      const lastSequence = parseInt(latestEmployee.employeeCode.slice(-3));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(3, '0')}`;
  }
}
