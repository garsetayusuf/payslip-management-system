import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTimeInSeconds = (endTime - startTime) / 1000;
        const formattedResponseTime = responseTimeInSeconds.toFixed(1);

        if (responseTimeInSeconds > 1) {
          this.logger.warn(
            `Slow request detected: ${request.method} ${request.url} - ${formattedResponseTime}s`,
          );
        }
      }),
    );
  }
}
