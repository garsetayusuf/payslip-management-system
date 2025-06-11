import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Payslip Management System')
    .setDescription('This is the API documentation for Payslip Management System API')
    .setVersion('0.0.1')
    .addCookieAuth('access_token')
    .setExternalDoc('Postman Collection', '/swagger-json')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
}
