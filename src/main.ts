import { NestFactory, Reflector } from '@nestjs/core';
import {
  VersioningType,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  // Use Pino Logger
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  // Security & Performance
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        scriptSrc: [
          `'self'`,
          `'unsafe-inline'`,
          `cdn.jsdelivr.net`,
          `unpkg.com`,
        ],
        styleSrc: [
          `'self'`,
          `'unsafe-inline'`,
          `cdn.jsdelivr.net`,
          `unpkg.com`,
        ],
        imgSrc: [`'self'`, `data:`, `validator.swagger.io`],
        connectSrc: [`'self'`, `http://localhost:*`, `http://127.0.0.1:*`],
        workerSrc: [`'self'`, `blob:`],
        fontSrc: [`'self'`, `https:`, `data:`],
      },
    },
  });

  await app.register(compression);

  // Enable Graceful Shutdown
  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Configs
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TimeoutInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('School Management System API')
    .setDescription('Comprehensive REST API for managing school operations.') // Shortened for brevity in replacement, original desc is fine but long
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'SMS API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/docs`,
  );
}
void bootstrap();
