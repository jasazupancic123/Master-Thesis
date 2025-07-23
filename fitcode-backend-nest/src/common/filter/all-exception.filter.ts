import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { FirebaseAuthError } from '../enum/firebase-auth-error.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly _httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    this.logger.error(JSON.stringify(exception), exception.stack);

    // log error and send same response
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    if ('code' in exception) {
      if (typeof exception.code === 'string') {
        if (exception.code.includes(FirebaseAuthError.ID_TOKEN_EXPIRED))
          message = 'Please refresh the page or login again';

        if (exception.code.includes(FirebaseAuthError.USER_NOT_FOUND))
          message = 'User not found';

        if (exception.code.includes(FirebaseAuthError.INVALID_EMAIL))
          message = exception.message || 'Invalid email';

        if (exception.code.includes(FirebaseAuthError.INVALID_PASSWORD))
          message = exception.message || 'Invalid password';
      }

      response.status(status).send({ message });
    } else response.status(status).send(message);
  }
}
