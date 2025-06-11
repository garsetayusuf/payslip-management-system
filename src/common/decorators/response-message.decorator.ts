import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

export const RESPONSE_MESSAGE_METADATA = 'responseMessage';

export function ResponseMessage(
  message: string,
  statusCode = 200,
  dataExample = undefined,
) {
  const isArray = Array.isArray(dataExample);

  return applyDecorators(
    SetMetadata(RESPONSE_MESSAGE_METADATA, message),
    ApiResponse({
      status: statusCode,
      description: message,
      schema: {
        type: 'object',
        properties: {
          status: { type: 'boolean', example: true },
          statusCode: { type: 'number', example: statusCode },
          message: { type: 'string', example: message },
          data: isArray
            ? {
                type: 'array',
                items: { type: 'object', example: dataExample?.[0] ?? {} },
              }
            : {
                type: 'object',
                example: dataExample,
              },
          path: { type: 'string', example: '/example' },
          timestamp: {
            type: 'string',
            example: '2022-01-01T00:00:00.000Z',
          },
          traceId: {
            type: 'string',
            example: uuidv4(),
          },
          type: { type: 'string', example: 'application/json' },
        },
      },
    }),
  );
}
