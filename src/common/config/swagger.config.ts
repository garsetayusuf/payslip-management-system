import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Notion Clone API')
    .setDescription('This is the API documentation for Notion Clone API')
    .setVersion('0.0.1')
    .addCookieAuth('access_token')
    .setExternalDoc('Postman Collection', '/swagger-json')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
}
