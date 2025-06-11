import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const responsePayload = {
      status: false,
      statusCode: status,
      path: request.url,
      message: exception.message || 'Internal server error',
      data: null,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      traceId: uuidv4(),
      type: request.headers['content-type'],
    };

    response.status(status).send(responsePayload);
  }
}
