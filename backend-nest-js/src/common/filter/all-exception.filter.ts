import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { FirebaseAuthError } from '../enum/firebase-auth-error.enum';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {
  }

  catch(exception: any, host: ArgumentsHost): void {
    this.logger.error(JSON.stringify(exception), exception.stack);

    // log error and send same response
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception instanceof HttpException ? exception.getResponse() : 'Internal Server Error';

    if (typeof message === 'string') {
      if (message.includes(FirebaseAuthError.ID_TOKEN_EXPIRED))
        message = 'Please login again';

      if (message.includes(FirebaseAuthError.USER_NOT_FOUND))
        message = 'User not found';

      response.status(status).send({ message });
    } else
      response.status(status).send(message);
  }
}