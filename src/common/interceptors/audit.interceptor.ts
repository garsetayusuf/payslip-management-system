import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    request.auditContext = {
      userId: request.user?.id,
      ipAddress: request.ip || request.connection.remoteAddress,
      requestId: request.requestId,
    };

    return next.handle();
  }
}
