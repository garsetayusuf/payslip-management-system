import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  HttpExceptionBody,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE_METADATA } from '../decorators/response-message.decorator';
import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/library';

export type ApiResponse<T> = {
  status: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  path: string;
  timestamp: string;
  traceId: string;
  type: string[] | string;
};

interface ValidationResponse extends HttpExceptionBody {
  message: string | string[];
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError(
        (
          err:
            | HttpException
            | PrismaClientKnownRequestError
            | PrismaClientUnknownRequestError,
        ) => throwError(() => this.errorHandler(err, context)),
      ),
    );
  }

  errorHandler(
    exception:
      | HttpException
      | PrismaClientKnownRequestError
      | PrismaClientUnknownRequestError,
    context: ExecutionContext,
  ) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseBody: ValidationResponse | string = '';
    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      responseBody =
        typeof res === 'string'
          ? (JSON.parse(res) as ValidationResponse)
          : (res as ValidationResponse);
    } else if (
      exception instanceof PrismaClientKnownRequestError ||
      PrismaClientUnknownRequestError
    ) {
      responseBody = 'Internal server error';
    }

    const message =
      typeof responseBody === 'string'
        ? responseBody
        : Array.isArray(responseBody?.message)
          ? responseBody.message.join(', ')
          : (responseBody?.message ?? 'Internal server error');

    const responsePayload: ApiResponse<null> = {
      status: false,
      statusCode: status,
      message,
      data: null,
      path: request.url,
      timestamp: new Date().toISOString(),
      traceId: uuidv4(),
      type: request.headers['content-type'],
    };

    response.status(status).send(responsePayload);
  }

  responseHandler(res: any, context: ExecutionContext): ApiResponse<T> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const statusCode = response.statusCode;

    const message =
      this.reflector.get<string>(
        RESPONSE_MESSAGE_METADATA,
        context.getHandler(),
      ) || 'Success';

    return {
      status: true,
      statusCode,
      message,
      data: res,
      path: request.url,
      timestamp: new Date().toISOString(),
      traceId: uuidv4(),
      type: request.headers['content-type'],
    };
  }
}
