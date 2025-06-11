import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { loadConfig } from 'src/common/config/env.config';
import { JwtPayload } from 'src/common/interfaces/jwt.inteface';
import { AuthService } from '../auth.service';
import { PrismaClient } from '@prisma/client';
import { JwtUserInterface } from 'src/common/interfaces/jwt-response.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private prisma: PrismaClient,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequest) => {
          return request.cookies.access_token;
        },
      ]),
      secretOrKey: loadConfig().jwt.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUserInterface> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      include: { employee: true },
      omit: {
        password: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      employeeId: user.employee?.id || null,
      role: user.role,
    };
  }
}
