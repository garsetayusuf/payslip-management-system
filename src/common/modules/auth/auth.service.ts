import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { loadConfig } from 'src/common/config/env.config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, PrismaClient, User, UserRole } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaClient,
    private auditService: AuditService,
  ) {}

  async register(createAuthDto: RegisterDto): Promise<{ message: string }> {
    // Hash password
    const hashedPassword = await bcrypt.hash(
      createAuthDto.password,
      loadConfig().auth.passwordSaltRounds,
    );

    try {
      const user = await this.prisma.user.create({
        data: {
          email: createAuthDto.email,
          username: createAuthDto.email,
          name: createAuthDto.name,
          password: hashedPassword,
        },
      });
      await this.auditService.logAudit(
        'users',
        user.id,
        AuditAction.CREATE,
        null,
        {
          email: createAuthDto.email,
          username: createAuthDto.email,
          name: createAuthDto.name,
          password: hashedPassword,
        },
        user.createdById,
      );

      return { message: 'User created successfully' };
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('User with that email already exists');
      }
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  async login(loginDto: LoginDto): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { employee: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    await this.auditService.logAudit(
      'users',
      user.id,
      AuditAction.READ,
      null,
      {
        email: user.email,
        username: user.username,
        name: user.name,
      },
      user.createdById,
    );

    const token = this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        employeeId: user.employee?.id || null,
        role: user.role,
      },
      { expiresIn: loadConfig().jwt.expires },
    );

    return token;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: changePasswordDto.userId },
      include: { employee: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only change password for admins');
    }

    const hashedPassword = await bcrypt.hash(
      changePasswordDto.password,
      loadConfig().auth.passwordSaltRounds,
    );

    await this.auditService.logAudit(
      'users',
      id,
      AuditAction.UPDATE,
      {
        password: user.password,
      },
      {
        password: hashedPassword,
      },
      user.updatedById,
    );

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Password changed successfully' };
  }

  async findById(id: string): Promise<Partial<User>> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { employee: true },
      omit: {
        password: true,
      },
    });
  }
}
