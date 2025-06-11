import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

const exceptionResponses = {
  InternalServerErrorException: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal Server Error.',
    message: 'Something went wrong. Please try again later.',
    error: 'Internal Server Error',
  },
  NotFoundException: {
    statusCode: HttpStatus.NOT_FOUND,
    description: 'Resource Not Found.',
    message: 'The requested resource could not be found.',
    error: 'Resource Not Found',
  },
  BadRequestException: {
    statusCode: HttpStatus.BAD_REQUEST,
    description: 'Invalid Request.',
    message: 'The request was invalid or cannot be processed.',
    error: 'Bad Request',
  },
  ForbiddenException: {
    statusCode: HttpStatus.FORBIDDEN,
    description: 'Forbidden.',
    message: 'You do not have permission to access this resource.',
    error: 'Forbidden',
  },
  UnauthorizedException: {
    statusCode: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    message: 'You need to be logged in to access this resource.',
    error: 'Unauthorized',
  },
  ConflictException: {
    statusCode: HttpStatus.CONFLICT,
    description: 'Conflict.',
    message: 'There was a conflict with the request.',
    error: 'Conflict',
  },
  UnprocessableEntityException: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'Unprocessable Entity.',
    message:
      'The request was well-formed but was unable to be followed due to semantic errors.',
    error: 'Unprocessable Entity',
  },
  NotAcceptableException: {
    statusCode: HttpStatus.NOT_ACCEPTABLE,
    description: 'Not Acceptable.',
    message:
      'The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.',
    error: 'Not Acceptable',
  },
  MethodNotAllowedException: {
    statusCode: HttpStatus.METHOD_NOT_ALLOWED,
    description: 'Method Not Allowed.',
    message:
      'The method specified in the request is not allowed for the resource identified by the request URI.',
    error: 'Method Not Allowed',
  },
  RequestTimeoutException: {
    statusCode: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request Timeout.',
    message: 'The server timed out waiting for the request.',
    error: 'Request Timeout',
  },
  ServiceUnavailableException: {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Service Unavailable.',
    message:
      'The server is currently unable to handle the request due to temporary overloading or maintenance of the server.',
    error: 'Service Unavailable',
  },
  GatewayTimeoutException: {
    statusCode: HttpStatus.GATEWAY_TIMEOUT,
    description: 'Gateway Timeout.',
    message:
      'The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.',
    error: 'Gateway Timeout',
  },
};

export function DynamicApiExceptions(
  serviceClass: new (...args: unknown[]) => unknown,
  methodName: string,
) {
  const method = (serviceClass.prototype as Record<string, unknown>)[
    methodName
  ];
  if (!method || typeof method !== 'function') {
    throw new Error(`Method ${methodName} not found in ${serviceClass.name}`);
  }

  const methodString = (method as (...args: unknown[]) => unknown).toString();
  const fallback = exceptionResponses.InternalServerErrorException;
  const decorators = [
    ApiResponse({
      status: fallback.statusCode,
      description: fallback.description,
      schema: {
        example: {
          status: false,
          statusCode: fallback.statusCode,
          message: fallback.message,
          data: null,
          path: '/example',
          timestamp: new Date().toISOString(),
          traceId: uuidv4(),
          type: 'string',
        },
      },
    }),
  ];

  for (const [exceptionName, config] of Object.entries(exceptionResponses)) {
    if (methodString.includes(exceptionName)) {
      decorators.push(
        ApiResponse({
          status: config.statusCode,
          description: config.description,
          schema: {
            example: {
              status: false,
              path: '/example',
              message: config.message,
              data: null,
              timestamp: new Date().toISOString(),
              traceId: uuidv4(),
              type: 'string',
            },
          },
        }),
      );
    }
  }
  return applyDecorators(...decorators);
}
