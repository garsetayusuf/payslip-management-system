import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../shared/prisma/prisma.service';
import { CustomLogger } from 'src/helpers/custom-logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logger = new CustomLogger(LoggingInterceptor.name);
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestId = uuidv4();

    request.requestId = requestId;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTimeInSeconds = (endTime - startTime) / 1000;

        this.prisma.requestLog
          .create({
            data: {
              requestId,
              method: request.method,
              endpoint: request.url,
              userId: request.user?.id || null,
              ipAddress: request.ip || request.connection.remoteAddress,
              userAgent: request.headers['user-agent'] || null,
              requestBody: request.method !== 'GET' ? request.body : null,
              responseStatus: response.statusCode,
              responseTimeMs: responseTimeInSeconds,
            },
          })
          .catch((error) => {
            logger.error(error);
          });
      }),
    );
  }
}
