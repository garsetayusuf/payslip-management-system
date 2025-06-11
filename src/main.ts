import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { loadConfig } from './common/config/env.config';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { setupSwagger } from './common/config/swagger.config';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyMultipart from '@fastify/multipart';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import fastifyCookie from '@fastify/cookie';
import { HttpExceptionFilter } from './common/interceptors/http-exception.filter';
import { CustomLogger } from './helpers/custom-logger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { PrismaService } from './common/shared/prisma/prisma.service';

async function bootstrap() {
  const logger = new CustomLogger('App');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger:
        process.env.NODE_ENV === 'development'
          ? ['log', 'error', 'warn', 'debug', 'verbose']
          : ['log', 'error', 'warn'],
    },
  );

  await app.register(fastifyCookie, {
    secret: 'access_token',
  });

  const config = loadConfig();
  const fastifyInstance = app.getHttpAdapter().getInstance();
  const httpLoggerMiddleware = app.get(HttpLoggerMiddleware);

  app.setGlobalPrefix('/api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(
    new LoggingInterceptor(app.get(PrismaService)),
    new ResponseInterceptor(),
    new PerformanceInterceptor(),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS configuration
  app.enableCors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Middleware hooks for logging
  fastifyInstance.addHook(
    'onRequest',
    httpLoggerMiddleware.onRequest.bind(httpLoggerMiddleware),
  );
  fastifyInstance.addHook(
    'preHandler',
    httpLoggerMiddleware.preHandler.bind(httpLoggerMiddleware),
  );
  fastifyInstance.addHook(
    'onSend',
    httpLoggerMiddleware.onSend.bind(httpLoggerMiddleware),
  );

  // Enable Swagger only when it's not Production
  // if (config.environment !== EnvironmentEnum.Production) {
  setupSwagger(app);
  // }

  // Helmet configuration
  await app.register(fastifyHelmet);

  // Cross-site request forgery (also known as CSRF or XSRF) is a type of malicious exploit of a website
  // where unauthorized commands are transmitted from a user that the web application trusts.
  // await app.register(require('@fastify/csrf-protection'));
  await app.register(fastifyCsrf);

  // Multipart form data parsing
  await app.register(fastifyMultipart);

  // Start listening for shutdown hooks
  // This is recommended for containerised deployments to handle graceful shutdown events like SIGTERM.
  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');
  logger.log('App listening on port ' + config.port);
}
bootstrap();
