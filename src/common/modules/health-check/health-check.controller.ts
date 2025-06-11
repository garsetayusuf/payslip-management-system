import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { camelCaseToWords } from 'src/helpers/transform-camel-case';
import { PrismaService } from '../../shared/prisma/prisma.service';

@ApiTags(camelCaseToWords(HealthCheckController.name))
@Controller()
export class HealthCheckController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  getHealthCheck() {
    return this.health.check([
      () => this.http.pingCheck('google', 'https://google.com'),
      () => this.db.pingCheck('prisma', this.prisma),
    ]);
  }
}
