import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'object'
          ? (message as any).message || message
          : message,
      errors: typeof message === 'object' ? (message as any).errors : undefined,
    };

    // Log the error
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - Error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status} - Warning: ${exception.message}`,
      );
    }

    // In production, we might want to hide internal error details
    if (
      process.env.NODE_ENV === 'production' &&
      (status as any) === (HttpStatus.INTERNAL_SERVER_ERROR as any)
    ) {
      errorResponse.message =
        'An unexpected error occurred. Please contact support.';
    }

    response.status(status).send(errorResponse);
  }
}
