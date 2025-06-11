import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtUserInterface } from 'src/common/interfaces/jwt-response.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private prisma: PrismaClient,
  ) {
    super({
      usernameField: 'email',
    });
  }
  async validate(email: string, password: string): Promise<JwtUserInterface> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      employeeId: user.employee?.id || null,
      role: user.role,
    };
  }
}
